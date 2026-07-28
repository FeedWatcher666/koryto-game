import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const dist = path.resolve(process.argv[2] || 'dist/koryto-v0.17.3-test.1');
const index = path.join(dist, 'index.html');
assert.ok(fs.existsSync(index), `Missing packaged index: ${index}`);
fs.mkdirSync('browser-artifacts', {recursive: true});
const progressPath = 'browser-artifacts/browser-gate-progress.txt';
const note = line => fs.appendFileSync(progressPath, `${new Date().toISOString()} ${line}\n`);

const targets = [
  {name: '1366x768', width: 1366, height: 768},
  {name: '1280x720', width: 1280, height: 720},
  {name: '1024x550', width: 1024, height: 550},
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

const browser = await chromium.launch({
  headless: true,
  ...(process.env.KORYTO_CHROMIUM_PATH
    ? {executablePath: process.env.KORYTO_CHROMIUM_PATH}
    : {})
});
try {
  for (const target of targets) {
    const context = await browser.newContext({viewport: {width: target.width, height: target.height}});
    const page = await context.newPage();
    const errors = [];
    const failed = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', request => failed.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

    const assertReachable = async (locator, label) => {
      await locator.evaluate(element => element.scrollIntoView({block: 'center', inline: 'nearest'}));
      await page.waitForTimeout(50);
      const reachability = await locator.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const root = document.documentElement;
        const pregame = document.querySelector('#startScreen.active,#creationScreen.active');
        const nav = pregame
          ? null
          : root.classList.contains('k165-active')
            ? document.querySelector('#v0165Root .k165-bottom')
            : root.classList.contains('k16-active')
              ? document.querySelector('#v0160Root .k16-bottom')
              : null;
        const candidateNavRect = nav?.getBoundingClientRect();
        const navRect = nav &&
          getComputedStyle(nav).display !== 'none' &&
          candidateNavRect.width > 0 &&
          candidateNavRect.height > 0
            ? candidateNavRect
            : null;
        const overlapWidth = navRect
          ? Math.max(0, Math.min(rect.right, navRect.right) - Math.max(rect.left, navRect.left))
          : 0;
        const overlapHeight = navRect
          ? Math.max(0, Math.min(rect.bottom, navRect.bottom) - Math.max(rect.top, navRect.top))
          : 0;
        return {
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          viewportHeight: innerHeight,
          navigationTop: navRect?.top ?? innerHeight,
          overlap: Math.round(overlapWidth * overlapHeight),
          scrollY,
          documentScrollHeight: document.documentElement.scrollHeight,
          bodyScrollHeight: document.body.scrollHeight,
          htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
          activeOverflowY: getComputedStyle(document.querySelector('.screen.active')).overflowY
        };
      });
      assert.ok(reachability.width > 0 && reachability.height > 0, `${target.name} ${label}: action has dimensions`);
      assert.ok(reachability.top >= -1, `${target.name} ${label}: action top is reachable ${JSON.stringify(reachability)}`);
      assert.ok(reachability.bottom <= reachability.navigationTop + 1, `${target.name} ${label}: action is above fixed navigation ${JSON.stringify(reachability)}`);
      assert.equal(reachability.overlap, 0, `${target.name} ${label}: action is not covered by navigation`);
      return reachability;
    };

    const auditSurface = async (label, {requireReachablePrimary = true} = {}) => {
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
          footerVersionCount: (footer.match(/0\.17\.3 TEST\.1/g) || []).length,
          title: document.title,
          meta: document.querySelector('meta[name="description"]')?.content || '',
          build: document.documentElement.dataset.korytoBuild || null,
          visual: document.documentElement.dataset.korytoVisual || null,
          foundationActive: document.documentElement.classList.contains('k170-foundation'),
          markedSurfaces: document.querySelectorAll('[data-k170-surface]').length,
          playability: globalThis.KorytoUI173?.audit?.() || null
        };
      });
      note(`${target.name} ${label} ${JSON.stringify(audit)}`);
      assert.equal(audit.usableNavigationCount, 1, `${target.name} ${label}: one usable navigation`);
      assert.equal(audit.usableNavigationButtons, target.width <= 760 ? 5 : 8, `${target.name} ${label}: one set of focusable navigation buttons`);
      assert.equal(audit.disabledLegacyNavigationCount, audit.legacyNavigationCount, `${target.name} ${label}: legacy navigation hidden, inert and aria-hidden`);
      assert.equal(audit.horizontalOverflow, false, `${target.name} ${label}: no horizontal overflow`);
      assert.equal(audit.footerVersionCount, 1, `${target.name} ${label}: footer version exactly once`);
      assert.match(audit.title, /0\.17\.3 TEST\.1/, `${target.name} ${label}: title`);
      assert.match(audit.meta, /0\.17\.3 TEST\.1/, `${target.name} ${label}: meta`);
      assert.equal(audit.build, '0.17.3-test.1', `${target.name} ${label}: data build`);
      assert.equal(audit.visual, '0.17.3-test.1', `${target.name} ${label}: visual marker`);
      assert.equal(audit.foundationActive, true, `${target.name} ${label}: visual foundation active`);
      assert.ok(audit.markedSurfaces >= 2, `${target.name} ${label}: live surfaces are marked`);
      assert.equal(audit.playability?.buildVersion, '0.17.3-test.1', `${target.name} ${label}: playability build`);
      assert.equal(audit.playability?.active, true, `${target.name} ${label}: playability reset active`);
      if (target.width > 820) {
        assert.equal(audit.playability?.desktopFrame, true, `${target.name} ${label}: fixed desktop game frame`);
      }
      if (requireReachablePrimary) {
        assert.equal(audit.playability?.coveredPrimaryActions, 0, `${target.name} ${label}: primary actions are not covered`);
      }
      return audit;
    };

    try {
      note(`${target.name} start`);
      const url = `${pathToFileURL(index).href}?browsergate=1`;
      await page.goto(url, {waitUntil: 'load'});
      await page.waitForSelector('#startBtn', {state: 'visible'});
      await page.waitForFunction(() => globalThis.KorytoBuildInfo?.buildVersion === '0.17.3-test.1' && globalThis.KorytoUI170?.visualAudit?.().active && globalThis.KorytoUI171?.audit?.().active && globalThis.KorytoUI172?.audit?.().active && globalThis.KorytoUI173?.audit?.().active);

      const identity = await page.evaluate(() => {
        const footer = document.querySelector('.footer-note')?.textContent || '';
        return {
          title: document.title,
          meta: document.querySelector('meta[name="description"]')?.content || '',
          build: document.documentElement.dataset.korytoBuild,
          brand: document.querySelector('.brand h1 span')?.textContent || '',
          footerVersionCount: (footer.match(/0\.17\.3 TEST\.1/g) || []).length,
          visual: document.documentElement.dataset.korytoVisual,
          visualAudit: globalThis.KorytoUI170?.visualAudit?.()
        };
      });
      assert.match(identity.title, /0\.17\.3 TEST\.1/, `${target.name}: title`);
      assert.match(identity.meta, /0\.17\.3 TEST\.1/, `${target.name}: meta`);
      assert.equal(identity.build, '0.17.3-test.1', `${target.name}: data build`);
      assert.equal(identity.visual, '0.17.3-test.1', `${target.name}: visual data build`);
      assert.match(identity.brand, /0\.17\.3 TEST\.1/, `${target.name}: brand`);
      assert.equal(identity.footerVersionCount, 1, `${target.name}: footer version once`);
      assert.equal(identity.visualAudit?.remoteAssets, 0, `${target.name}: offline visual assets`);

      await page.click('#startBtn');
      await page.waitForSelector('#creationScreen.active');
      await page.fill('#heroName', `Gate ${target.name}`);
      await page.evaluate(() => globalThis.KorytoUI173?.sync?.());
      const creationAudit = await page.evaluate(() => globalThis.KorytoUI173?.audit?.());
      if (target.width > 820) {
        assert.equal(creationAudit?.fullyVisibleClassCards, 6, `${target.name}: all professions share the first viewport`);
        assert.equal(creationAudit?.confirmVisible, true, `${target.name}: candidate confirmation is visible without scrolling`);
      }
      const firstClass = page.locator('#classGrid [data-class]').first();
      await assertReachable(firstClass, 'first candidate class');
      await firstClass.click();
      await assertReachable(page.locator('#confirmBtn'), 'candidate confirmation');
      if (target.name === '1024x550') {
        await page.screenshot({path: `browser-artifacts/${target.name}-creation.png`, fullPage: false});
      }
      await page.click('#confirmBtn');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'event');
      await page.waitForSelector('#v0165Root [data-k165-choice]:not([disabled])', {state: 'visible'});
      await page.evaluate(() => globalThis.KorytoUI169?.syncStatus?.());
      await page.evaluate(() => {
        globalThis.KorytoUI171?.decorate?.();
        globalThis.KorytoUI172?.decorate?.();
      });
      const decisionAudit = await page.evaluate(() => globalThis.KorytoUI171?.audit?.());
      const turnDecisionAudit = await page.evaluate(() => globalThis.KorytoUI172?.audit?.());
      assert.equal(decisionAudit?.buildVersion, '0.17.3-test.1', `${target.name}: decision HUD build`);
      assert.ok(decisionAudit?.numberedChoices >= 2, `${target.name}: numbered decision cards`);
      assert.equal(decisionAudit?.accessibleChoices, decisionAudit?.numberedChoices, `${target.name}: accessible decision labels`);
      assert.equal(turnDecisionAudit?.buildVersion, '0.17.3-test.1', `${target.name}: turn clarity build`);
      assert.ok(turnDecisionAudit?.availableChoices >= 2, `${target.name}: explicit available choices`);
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), true, `${target.name}: save disabled in event`);
      const eventAudit = await auditSurface('event', {requireReachablePrimary: false});
      if (target.width > 820) {
        assert.equal(eventAudit.playability?.fullyVisibleChoices, decisionAudit?.numberedChoices, `${target.name}: every decision is visible before scrolling`);
      }
      await page.screenshot({path: `browser-artifacts/${target.name}-event.png`, fullPage: false});
      await assertReachable(page.locator('#v0165Root [data-k165-choice]:not([disabled])').first(), 'event choice');
      await auditSurface('event-decision');
      if (target.width <= 760 || target.name === '1024x550') {
        await page.screenshot({path: `browser-artifacts/${target.name}-decision.png`, fullPage: false});
      }

      await page.locator('#v0165Root [data-k165-choice]:not([disabled])').first().click();
      await page.waitForSelector('#diceClose:not(.hidden)', {timeout: 5000});
      await page.click('#diceClose');
      await page.waitForSelector('#v0165Root [data-k165-continue]', {state: 'visible'});
      await page.evaluate(() => globalThis.KorytoUI172?.decorate?.());
      const resultAudit = await page.evaluate(() => globalThis.KorytoUI172?.audit?.());
      assert.ok(resultAudit?.impactChips >= 1, `${target.name}: result impact chips`);
      assert.match(await page.locator('#v0165Root [data-k165-continue]').textContent(), /1 AKCI/, `${target.name}: result action cost`);
      await assertReachable(page.locator('#v0165Root [data-k165-continue]'), 'result continuation');
      await auditSurface('result');
      await page.screenshot({path: `browser-artifacts/${target.name}-result.png`, fullPage: false});

      await page.click('#v0165Root [data-k165-continue]');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'map');
      await page.waitForFunction(() => document.documentElement.classList.contains('k169-map-stable'));
      await page.evaluate(() => {
        globalThis.KorytoMapStability169?.forceCanonicalMap?.();
        globalThis.KorytoUI169?.syncStatus?.();
        globalThis.KorytoUI172?.decorate?.();
        globalThis.KorytoBuildInfo?.applyLabels?.();
      });
      const coach = page.locator('#v0145CoachOverlay:not(.hidden)');
      if (await coach.isVisible().catch(() => false)) {
        await page.click('#v0145CoachClose');
        await page.waitForSelector('#v0145CoachOverlay', {state: 'hidden'});
      }
      await page.evaluate(() => {
        globalThis.KorytoUI172?.decorate?.();
        globalThis.KorytoUI173?.sync?.();
      });
      await assertReachable(page.locator('#v0160Root [data-k173-primary]'), 'dominant map objective');
      await assertReachable(page.locator('#v0160Root [data-k16-end]'), 'end day');
      const mapAudit = await auditSurface('map');
      assert.equal(mapAudit.phase, 'map', `${target.name}: map phase`);
      const turnMapAudit = await page.evaluate(() => globalThis.KorytoUI172?.audit?.());
      assert.ok(turnMapAudit?.turnIndicators >= 1, `${target.name}: turn indicator`);
      assert.equal(turnMapAudit?.endDayWarnings, 1, `${target.name}: early end warning`);
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), false, `${target.name}: save enabled on map`);
      assert.equal(await page.locator('#v0160Root .k16-hotspot').count(), 8, `${target.name}: hotspots`);
      assert.equal(await page.locator('#v0160Root .k16-hotspot[title]').count(), 0, `${target.name}: native tooltips`);
      assert.equal(mapAudit.playability?.visibleHotspots, 8, `${target.name}: all map locations are visible`);
      assert.equal(mapAudit.playability?.primaryObjective, true, `${target.name}: map exposes one dominant objective action`);
      const beforeEarlyEnd = await page.evaluate(() => {
        const state = globalThis.KorytoApp.getState();
        return {day: state.day, actions: state.actions, momentum: state.opponent.momentum};
      });
      await page.click('[data-k16-end]');
      const afterEarlyEnd = await page.evaluate(() => {
        const state = globalThis.KorytoApp.getState();
        return {
          day: state.day,
          actions: state.actions,
          momentum: state.opponent.momentum,
          daySummaryOpen: document.documentElement.classList.contains('k166-day-open')
        };
      });
      assert.deepEqual(
        {day: afterEarlyEnd.day, actions: afterEarlyEnd.actions, momentum: afterEarlyEnd.momentum},
        beforeEarlyEnd,
        `${target.name}: first early-end click is non-destructive`
      );
      assert.equal(afterEarlyEnd.daySummaryOpen, true, `${target.name}: early end opens confirmation`);
      await page.waitForSelector('.k172-day-warning', {state: 'visible'});
      assert.match(await page.locator('.k172-day-warning').textContent(), /Věčný.*\+\d+.*tlaku/is, `${target.name}: exact early-end penalty`);
      await page.screenshot({path: `browser-artifacts/${target.name}-day-confirm.png`, fullPage: false});
      await page.click('[data-k166-cancel-day]');
      await page.waitForSelector('#v0166Root', {state: 'hidden'});

      await page.locator('#v0160Root .k16-hotspot').first().click();
      await page.waitForFunction(() => globalThis.KorytoUI165?.visualAudit?.().activeView === 'location');
      await page.waitForSelector('#v0165Root [data-k165-map]', {state: 'visible'});
      await assertReachable(page.locator('#v0165Root [data-k165-map]'), 'return from location');
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
      await page.waitForFunction(() => globalThis.KorytoBuildInfo?.buildVersion === '0.17.3-test.1' && globalThis.KorytoUI170?.visualAudit?.().active && globalThis.KorytoUI171?.audit?.().active && globalThis.KorytoUI172?.audit?.().active && globalThis.KorytoUI173?.audit?.().active);
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
      await page.evaluate(() => {
        globalThis.KorytoUI169?.syncStatus?.();
        globalThis.KorytoUI173?.sync?.();
      });
      await assertReachable(page.locator('#v0160Root [data-k16-end]'), 'roundtrip end day');
      await page.evaluate(() => globalThis.KorytoUI173?.sync?.());
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

console.log('v0.17.3 TEST.1 packaged Chromium game-frame playability and complete save/load gate passed');
