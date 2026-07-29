import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const dist = path.resolve(process.argv[2] || 'dist/koryto-v0.20.0-test.1');
const index = path.join(dist, 'index.html');
assert.ok(fs.existsSync(index), `Missing packaged index: ${index}`);
fs.mkdirSync('browser-artifacts', {recursive: true});

const targets = [
  {name: '1024x550', width: 1024, height: 550},
  {name: '390x844', width: 390, height: 844},
];

const browser = await chromium.launch({headless: true});
try {
  for (const target of targets) {
    const context = await browser.newContext({viewport: {width: target.width, height: target.height}});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

    await page.goto(`${pathToFileURL(index).href}?v0200gate=1`, {waitUntil: 'load'});
    await page.waitForFunction(() => globalThis.KorytoDndReset?.BUILD_VERSION === '0.20.0-test.1');
    await page.click('#startBtn');
    await page.waitForSelector('#v0200AttributePreview', {state: 'visible'});
    assert.equal(await page.locator('#v0200AttributeGrid .v0200-attribute').count(), 6, `${target.name}: six visible attributes`);
    assert.equal(await page.locator('[data-class]').count(), 6, `${target.name}: old classes remain available`);

    await page.click('#confirmBtn');
    await page.waitForSelector('#v0200Tutorial:not([hidden])', {state: 'visible'});
    await page.locator('#v0200TutorialBody button').first().click();
    await page.waitForSelector('.v0200-tutorial-choices button', {state: 'visible'});
    await page.locator('.v0200-tutorial-choices button').first().click();
    await page.waitForSelector('.v0200-die', {state: 'visible'});

    const reroll = page.getByRole('button', {name: /Přehodit propiskou/});
    if (await reroll.count()) await reroll.click();
    await page.getByRole('button', {name: /Přijmout následek/}).click();
    await page.waitForSelector('.v0200-companions button', {state: 'visible'});
    await page.locator('.v0200-companions button').first().click();

    await page.waitForFunction(() => globalThis.KorytoApp?.getState?.().flags?.v0200TutorialDone === true);
    await page.waitForSelector('#v0200Objective', {state: 'visible'});
    await page.waitForSelector('#v0165Root [data-k165-choice]:not([disabled])', {state: 'visible'});

    const state = await page.evaluate(() => globalThis.KorytoApp.getState());
    assert.equal(state.actions, 3, `${target.name}: three actions per day`);
    assert.equal(Object.keys(state.hero.rpgAttrs || {}).length, 6, `${target.name}: six RPG attributes saved`);
    assert.equal(Boolean(state.party.marie), true, `${target.name}: tutorial recruits a companion`);
    assert.equal(state.items.includes('chainedPen'), true, `${target.name}: tutorial item persists`);

    const focus = await page.evaluate(() => ({
      objective: Boolean(document.getElementById('v0200Objective')),
      advancedHidden: [...document.querySelectorAll('[data-v0200-panel="advanced"]')].some(element => getComputedStyle(element).display === 'none'),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    assert.equal(focus.objective, true, `${target.name}: objective visible`);
    assert.equal(focus.advancedHidden, true, `${target.name}: dashboard panels collapsed`);
    assert.equal(focus.overflow, false, `${target.name}: no horizontal overflow`);

    await page.click('#v0200DetailsToggle');
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('v0200-details-open')), true, `${target.name}: detail systems can be opened`);

    await page.screenshot({path: `browser-artifacts/${target.name}-tutorial-complete.png`, fullPage: false});
    assert.deepEqual(errors, [], `${target.name}: browser errors`);
    await context.close();
  }

  const context = await browser.newContext({viewport: {width: 1024, height: 550}});
  const legacy = await context.newPage();
  await legacy.goto(`${pathToFileURL(index).href}?legacy=1`, {waitUntil: 'load'});
  await legacy.waitForSelector('#startBtn', {state: 'visible'});
  assert.equal(await legacy.evaluate(() => Boolean(globalThis.KorytoDndReset)), false, 'legacy mode skips v0.20 layer');
  assert.equal(await legacy.evaluate(() => Boolean(globalThis.KorytoApp?.startDebate && globalThis.KorytoApp?.finalizeElection)), true, 'legacy campaign remains complete');
  await context.close();
} finally {
  await browser.close();
}
console.log('Koryto v0.20.0 browser gate passed.');
