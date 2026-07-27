import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const dist = path.resolve(process.argv[2] || 'dist/koryto-v0.16.9-test.2');
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

    try {
      note(`${target.name} start`);
      const url = `${pathToFileURL(index).href}?browsergate=1`;
      await page.goto(url, {waitUntil: 'load'});
      note(`${target.name} loaded`);
      await page.waitForSelector('#startBtn', {state: 'visible'});
      await page.waitForFunction(() => globalThis.KorytoBuildInfo?.buildVersion === '0.16.9-test.2');

      const identity = await page.evaluate(() => ({
        title: document.title,
        meta: document.querySelector('meta[name="description"]')?.content || '',
        build: document.documentElement.dataset.korytoBuild,
        brand: document.querySelector('.brand h1 span')?.textContent || ''
      }));
      note(`${target.name} identity ${JSON.stringify(identity)}`);
      assert.match(identity.title, /0\.16\.9 TEST\.2/, `${target.name}: title`);
      assert.match(identity.meta, /0\.16\.9 TEST\.2/, `${target.name}: meta`);
      assert.equal(identity.build, '0.16.9-test.2', `${target.name}: data build`);
      assert.match(identity.brand, /0\.16\.9 TEST\.2/, `${target.name}: brand`);

      await page.click('#startBtn');
      await page.waitForSelector('#creationScreen.active');
      note(`${target.name} creation`);
      await page.locator('#classGrid [data-class]').first().click();
      await page.locator('#confirmBtn').scrollIntoViewIfNeeded();
      await page.click('#confirmBtn');
      await page.waitForSelector('#gameScreen.active');
      await page.waitForSelector('#eventView:not(.hidden)');
      note(`${target.name} event`);
      await page.evaluate(() => globalThis.KorytoUI169?.syncStatus?.());
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), true, `${target.name}: save disabled in event`);

      await page.locator('#choiceBox .choice:not([disabled])').first().click();
      await page.waitForSelector('#diceClose:not(.hidden)', {timeout: 5000});
      await page.click('#diceClose');
      await page.waitForSelector('#continueAfter', {state: 'visible'});
      await page.click('#continueAfter');
      await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().phase === 'map');
      await page.waitForFunction(() => document.documentElement.classList.contains('k169-map-stable'));
      await page.evaluate(() => {
        globalThis.KorytoMapStability169?.forceCanonicalMap?.();
        globalThis.KorytoUI169?.syncStatus?.();
      });
      note(`${target.name} map`);

      const audit = await page.evaluate(() => {
        const visible = element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return !element.hidden && !element.inert && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        return {
          title: document.title,
          meta: document.querySelector('meta[name="description"]')?.content || '',
          build: document.documentElement.dataset.korytoBuild,
          hotspots: document.querySelectorAll('#v0160Root .k16-hotspot').length,
          nativeTooltips: document.querySelectorAll('#v0160Root .k16-hotspot[title]').length,
          visibleNavigations: [...document.querySelectorAll('#v0148Nav,.v0148-nav,.k165-bottom,.k16-bottom')].filter(visible).length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
          phase: globalThis.KorytoApp?.getState?.().phase
        };
      });
      note(`${target.name} audit ${JSON.stringify(audit)} failed=${JSON.stringify(failed)} errors=${JSON.stringify(errors)}`);

      assert.match(audit.title, /0\.16\.9 TEST\.2/, `${target.name}: final title`);
      assert.match(audit.meta, /0\.16\.9 TEST\.2/, `${target.name}: final meta`);
      assert.equal(audit.build, '0.16.9-test.2', `${target.name}: final build`);
      assert.equal(audit.phase, 'map', `${target.name}: map phase`);
      assert.equal(audit.hotspots, 8, `${target.name}: hotspots`);
      assert.equal(audit.nativeTooltips, 0, `${target.name}: native tooltips`);
      assert.equal(audit.visibleNavigations, 1, `${target.name}: one usable navigation`);
      assert.equal(audit.horizontalOverflow, false, `${target.name}: no horizontal overflow`);
      assert.equal(await page.locator('[data-k169-action="save"]').isDisabled(), false, `${target.name}: save enabled on map`);
      assert.deepEqual(failed, [], `${target.name}: failed requests\n${failed.join('\n')}`);
      assert.deepEqual(errors, [], `${target.name}: browser errors\n${errors.join('\n')}`);

      await page.screenshot({path: `browser-artifacts/${target.name}-map.png`, fullPage: false});
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
          errors: []
        }));
        fs.writeFileSync(`browser-artifacts/${target.name}-failure-state.json`, JSON.stringify({state, failed, errors}, null, 2));
      } catch (_) {}
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log('v0.16.9 TEST.2 packaged Chromium browser gate passed');
