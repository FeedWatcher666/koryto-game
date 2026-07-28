import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const dist = path.resolve(process.argv[2] || 'dist/koryto-v0.17.1-test.1');
const index = path.join(dist, 'index.html');
assert.ok(fs.existsSync(index), `Missing packaged index: ${index}`);
fs.mkdirSync('browser-artifacts', {recursive: true});
const progressPath = 'browser-artifacts/browser-gate-progress.txt';
const note = line => fs.appendFileSync(progressPath, `${new Date().toISOString()} ${line}\n`);

const targets = [
  {name: '1366x768', width: 1366, height: 768},
  {name: '1280x720', width: 1280, height: 720},
  {name: '390x844', width: 390, height: 844}
];

const snapshot = state => {
  const copy = JSON.parse(JSON.stringify(state ?? null));
  if (!copy || typeof copy !== 'object' || Array.isArray(copy)) return copy;

  // loadGame() intentionally clears transient, in-progress interaction state.
  copy.currentLocation = null;
  copy.currentEvent = null;
  copy.partyAssignment = null;
  copy.partyUsedDay = 0;
  return copy;
};

const assertSaveContract = (state, label) => {
  assert.equal(state?.version, '0.14.3-test.2', `${label}: save version`);
  assert.equal(state?.saveFormat, 'koryto', `${label}: save format`);
  assert.equal(state?.saveSchema, 1, `${label}: save schema`);
};

const browser = await chromium.launch({headless: true});
try {
  for (const target of targets) {
    const context = await browser.newContext({viewport: {width: target.width, height: target.height}});
    const page = await context.newPage();
    const errors = [];
    const failed = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', request => failed.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

    const auditSurface = async label => {
      const audit = await page.evaluate(() => {
        const visible = element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return !element.hidden && !element.inert && element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const navigation = [...document.querySelectorAll('#v0148Nav,.v0148-nav,.k165-bottom,.k16-bottom')];
        const legacy = [...document.querySelectorAll('#v0148Nav,.v0148-nav')];
        const usableNavigation = navigation.filter(visible);
        const usableButtons = usableNavigation.flatMap(nav => [...nav.querySelectorAll('button')].filter(visible));
        const footer = document.querySelector('.footer-note')?.textContent || '';
        return {
          phase: globalThis.KorytoApp?.getState?.().phase || null,
          activeView: globalThis.KorytoUI165?.visualAudit?.().activeView || null,
          usableNavigationCount: usableNavigation.length,
          usableNavigationButtons: usableButtons.length,
          legacyNavigationCount: legacy.length,
          disabledLegacyNavigationCount: legacy.filter(nav => nav.hidden && nav.inert && nav.getAttribute('aria-hidden') === 'true').length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
          footerVersionCount: (footer.match(/0\.17\.1 TEST\.1/g) || []).length,
          title: document.title,
          meta: document.querySelector('meta[name="description"]')?.content || '',
          build: document.documentElement.dataset.korytoBuild || null,
          visual: document.documentElement.dataset.korytoVisual || null,
          foundationActive: document.documentElement.classList.contains('k170-foundation'),
          markedSurfaces: document.querySelectorAll('[data-k170-surface]').length
        };
      });
      note(`${target.name} ${label} ${JSON.stringify(audit)}`);
      assert.equal(audit.usableNavigationCount, 1, `${target.name} ${label}: one usable navigation`);
      assert.equal(audit.usableNavigationButtons, target.width <= 760 ? 5 : 8, `${target.name} ${label}: one set of focusable navigation buttons`);
      assert.equal(audit.disabledLegacyNavigationCount, audit.legacyNavigationCount, `${target.name} ${label}: legacy navigation hidden, inert and aria-hidden`);
      assert.equal(audit.horizontalOverflow, false, `${target.name} ${label}: no horizontal overflow`);
      assert.equal(audit.footerVersionCount, 1, `${target.name} ${label}: footer version exactly once`);
      assert.match(audit.title, /0\.17\.1 TEST\.1/, `${target.name} ${label}: title`);
      assert.match(audit.meta, /0\.17\.1 TEST\.1/, `${target.name} ${label}: meta`);
      assert.equal(audit.build, '0.17.1-test.1', `${target.name} ${label}: data build`);
      assert.equal(audit.visual, '0.17.1-test.1', `${target.name} ${label}: visual marker`);
      assert.equal(audit.foundationActive, true, `${target.name} ${label}: visual foundation active`);
      assert.ok(audit.markedSurfaces >= 2, `${target.name} ${label}: live surfaces are marked`);
      return audit;
    };

    try {
      note(`${target.name} start`);
      const url = `${pathToFileURL(index).href}?browsergate=1`;
      await page.goto(url, {waitUntil: 'load'});
      await page.waitForSelector('#startBtn', {state: 'visible'});
      await page.waitForFunction(() => globalThis.KorytoBuildInfo?.buildVersion === '0.17.1-test.1' && globalThis.KorytoUI170?.visualAudit?.().active && globalThis.KorytoUI171?.audit?.().active);

      const identity = await page.evaluate(() => {
        const footer = document.querySelector('.footer-note')?.textContent || '';
        return {
          title: document.title,
          meta: document.querySelector('meta[name="description"]')?.content || '',
          build: document.documentElement.dataset.korytoBuild,
          brand: document.querySelector('.brand h1 span')?.textContent || '',
          footerVersionCount: (footer.match(/0\.17\.1 TEST\.1/g) || []).length,
          visual: document.documentElement.dataset.korytoVisual,
          visualAudit: globalThis.KorytoUI170?.visualAudit?.()
        };
      });
      assert.match(identity.title, /0\.17\.1 TEST\.1/, `${target.name}: title`);
      assert.match(identity.meta, /0\.17\.1 TEST\.1/, `${target.name}: meta`);
      assert.equal(identity.build, '0.17.1-test.1', `${target.name}: data build`);
      assert.equal(identity.visual, '0.17.1-test.1', `${target.name}: visual data build`);
      assert.match(identity.brand, /0\.17\.1 TEST\.1/, `${target.name}: brand`);
      assert.equal(identity.footerVersionCount, 1, `${target.name}: footer version once`);
      assert.equal(identity.visualAudit?.remoteAssets, 0, `${target.name}: offline visual assets`);

      await page.click('#startBtn');
      await page.waitForSelector('#creationScreen.active');
      await page.fill('#heroName', `Gate ${target.name}`);
      await page.locator('#classGrid [data-class]').first().click();
      await page.locator('#confirmBtn').scrollIntoViewIfNeeded();
      await page.click('#confirmBtn');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'event');
      await page.waitForSelector('#v0165Root [data-k165-choice]:not([disabled])', {state: 'visible'});
      await page.evaluate(() => globalThis.KorytoUI169?.syncStatus?.());
      await page.evaluate(() => globalThis.KorytoUI171?.decorate?.());
      const decisionAudit = await page.evaluate(() => globalThis.KorytoUI171?.audit?.());
      assert.equal(decisionAudit?.buildVersion, '0.17.1-test.1', `${target.name}: decision HUD build`);
      assert.ok(decisionAudit?.numberedChoices >= 2, `${target.name}: numbered decision cards`);
      assert.equal(decisionAudit?.accessibleChoices, decisionAudit?.numberedChoices, `${target.name}: accessible decision labels`);
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), true, `${target.name}: save disabled in event`);
      await auditSurface('event');
      await page.screenshot({path: `browser-artifacts/${target.name}-event.png`, fullPage: false});
      if (target.width <= 760) {
        await page.locator('#v0165Root [data-k165-choice]:not([disabled])').first().scrollIntoViewIfNeeded();
        await page.screenshot({path: `browser-artifacts/${target.name}-decision.png`, fullPage: false});
      }

      await page.locator('#v0165Root [data-k165-choice]:not([disabled])').first().click();
      await page.waitForSelector('#diceClose:not(.hidden)', {timeout: 5000});
      await page.click('#diceClose');
      await page.waitForSelector('#v0165Root [data-k165-continue]', {state: 'visible'});
      await auditSurface('result');
      await page.screenshot({path: `browser-artifacts/${target.name}-result.png`, fullPage: false});

      await page.click('#v0165Root [data-k165-continue]');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'map');
      await page.waitForFunction(() => document.documentElement.classList.contains('k169-map-stable'));
      await page.evaluate(() => {
        globalThis.KorytoMapStability169?.forceCanonicalMap?.();
        globalThis.KorytoUI169?.syncStatus?.();
        globalThis.KorytoBuildInfo?.applyLabels?.();
      });
      const mapAudit = await auditSurface('map');
      assert.equal(mapAudit.phase, 'map', `${target.name}: map phase`);
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), false, `${target.name}: save enabled on map`);
      assert.equal(await page.locator('#v0160Root .k16-hotspot').count(), 8, `${target.name}: hotspots`);
      assert.equal(await page.locator('#v0160Root .k16-hotspot[title]').count(), 0, `${target.name}: native tooltips`);

      const coach = page.locator('#v0145CoachOverlay:not(.hidden)');
      if (await coach.isVisible().catch(() => false)) {
        await page.click('#v0145CoachClose');
        await page.waitForSelector('#v0145CoachOverlay', {state: 'hidden'});
      }

      await page.locator('#v0160Root .k16-hotspot').first().click();
      await page.waitForFunction(() => globalThis.KorytoUI165?.visualAudit?.().activeView === 'location');
      await page.waitForSelector('#v0165Root [data-k165-map]', {state: 'visible'});
      const locationAudit = await auditSurface('location');
      assert.equal(locationAudit.activeView, 'location', `${target.name}: location view`);
      await page.screenshot({path: `browser-artifacts/${target.name}-location.png`, fullPage: false});

      await page.click('#v0165Root [data-k165-map]');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'map');
      await page.waitForFunction(() => document.documentElement.classList.contains('k169-map-stable'));
      await page.evaluate(() => globalThis.KorytoUI169?.syncStatus?.());

      await page.click('[data-k169-open]');
      await page.click('[data-k169-action="save"]');
      await page.waitForFunction(() => Boolean(localStorage.getItem('koryto_v014')));
      const savedSnapshot = await page.evaluate(snapshotSource => {
        const state = JSON.parse(localStorage.getItem('koryto_v014'));
        const make = new Function('state', `return (${snapshotSource})(state)`);
        return make(state);
      }, snapshot.toString());
      assert.equal(savedSnapshot.phase, 'map', `${target.name}: persisted phase`);
      assertSaveContract(savedSnapshot, `${target.name}: persisted state`);

      await page.reload({waitUntil: 'load'});
      await page.waitForSelector('#startBtn', {state: 'visible'});
      await page.waitForFunction(() => globalThis.KorytoBuildInfo?.buildVersion === '0.17.1-test.1' && globalThis.KorytoUI170?.visualAudit?.().active && globalThis.KorytoUI171?.audit?.().active);
      await page.click('[data-k169-open]');
      await page.click('[data-k169-action="load"]');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'map');
      await page.waitForFunction(() => document.documentElement.classList.contains('k169-map-stable'));
      const loadedSnapshot = await page.evaluate(snapshotSource => {
        const make = new Function('state', `return (${snapshotSource})(state)`);
        return make(globalThis.KorytoApp.getState());
      }, snapshot.toString());
      assertSaveContract(loadedSnapshot, `${target.name}: loaded state`);
      assert.deepEqual(loadedSnapshot, savedSnapshot, `${target.name}: complete save/load roundtrip state`);
      await page.evaluate(() => globalThis.KorytoUI169?.syncStatus?.());
      await auditSurface('roundtrip-map');
      await page.screenshot({path: `browser-artifacts/${target.name}-map.png`, fullPage: false});

      assert.deepEqual(failed, [], `${target.name}: failed requests\n${failed.join('\n')}`);
      assert.deepEqual(errors, [], `${target.name}: browser errors\n${errors.join('\n')}`);
      note(`${target.name} passed`);
    } catch (error) {
      note(`${target.name} FAILURE ${error?.stack || error}`);
      try { await page.screenshot({path: `browser-artifacts/${target.name}-failure.png`, fullPage: false}); } catch (_) {}
      try {
        const state = await page.evaluate(() => ({
          title: document.title,
          build: document.documentElement.dataset.korytoBuild,
          active: document.querySelector('.screen.active')?.id,
          phase: globalThis.KorytoApp?.getState?.().phase,
          htmlClasses: document.documentElement.className,
          visibleSurface: !document.getElementById('v0165Root')?.hidden ? 'v0165Root' : !document.getElementById('v0160Root')?.hidden ? 'v0160Root' : 'legacy'
        }));
        fs.writeFileSync(`browser-artifacts/${target.name}-failure-state.json`, JSON.stringify({state, failed, errors}, null, 2));
      } catch (_) {}
      throw error;
    } finally {
      await context.close();
    }
  }

  const retiredContext = await browser.newContext({viewport: {width: 1366, height: 768}});
  const retiredPage = await retiredContext.newPage();
  const retiredErrors = [];
  const retiredFailed = [];
  retiredPage.on('pageerror', error => retiredErrors.push(error.message));
  retiredPage.on('console', message => { if (message.type() === 'error') retiredErrors.push(message.text()); });
  retiredPage.on('requestfailed', request => retiredFailed.push(request.url()));
  await retiredPage.goto(`${pathToFileURL(index).href}?playtest=1`, {waitUntil: 'load'});
  await retiredPage.waitForSelector('#startBtn', {state: 'visible'});
  assert.equal(await retiredPage.evaluate(() => 'loadPlaytestLayer' in (globalThis.KorytoInteractionGuard161 || {})), false, 'retired playtest loader is not exposed');
  assert.deepEqual(retiredFailed, [], 'retired ?playtest=1 query causes no failed requests');
  assert.deepEqual(retiredErrors, [], 'retired ?playtest=1 query causes no browser errors');
  await retiredContext.close();
} finally {
  await browser.close();
}

console.log('v0.17.1 TEST.1 packaged Chromium decision HUD and complete save/load gate passed');
