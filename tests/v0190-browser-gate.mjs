import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const target = path.resolve(process.argv[2] || 'dist/koryto-v0.19.0-test.1');
assert.ok(fs.existsSync(path.join(target, 'index.html')), `Missing packaged index: ${target}`);
const out = path.resolve('browser-artifacts');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ name: 'notebook', width: 1024, height: 550 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${pathToFileURL(path.join(target, 'index.html')).href}?seed=190`);
    await page.waitForSelector('#k190Root .k190-start');
    assert.equal(await page.locator('#app:visible').count(), 0);
    await page.getByRole('button', { name: 'Otevřít válečnou místnost' }).click();
    await page.waitForSelector('.k190-game');
    assert.equal(await page.locator('.k190-delegate').count(), 15);
    assert.equal(await page.locator('.k190-card').count(), 5);

    await page.locator('[data-staff="miloslav"]').click();
    await page.locator('[data-card="whip_caucus"]').click();
    let state = await page.evaluate(() => window.KorytoWarRoom.getState());
    assert.ok(state.delegates.player >= 6, 'Miloslav combo gains delegates');
    assert.equal(state.debt, 1, 'Miloslav creates debt');

    await page.locator('[data-card="opposition_research"]').click();
    state = await page.evaluate(() => window.KorytoWarRoom.getState());
    assert.equal(state.evidence, 1);
    assert.equal(state.intel, true);

    await page.locator('[data-staff="klara"]').click();
    await page.locator('[data-card="fact_check"]').click();
    state = await page.evaluate(() => window.KorytoWarRoom.getState());
    assert.equal(state.defenses.media, true);
    await page.screenshot({ path: path.join(out, `${viewport.name}-round1.png`), fullPage: true });

    for (let round = 1; round <= 6; round += 1) {
      const phase = await page.evaluate(() => window.KorytoWarRoom.getState().phase);
      if (phase === 'ending') break;
      await page.locator('[data-action="end-round"]').click();
      await page.waitForTimeout(30);
      let current = await page.evaluate(() => window.KorytoWarRoom.getState());
      if (current.phase === 'ending') break;
      while (current.ap > 0) {
        const playable = page.locator('.k190-card:not(:disabled)').first();
        if (await playable.count() === 0) break;
        await playable.click();
        await page.waitForTimeout(10);
        current = await page.evaluate(() => window.KorytoWarRoom.getState());
      }
    }

    await page.waitForSelector('.k190-ending');
    state = await page.evaluate(() => window.KorytoWarRoom.getState());
    assert.equal(state.phase, 'ending');
    assert.equal(state.delegates.player + state.delegates.rival + state.delegates.undecided, 15);
    await page.screenshot({ path: path.join(out, `${viewport.name}-ending.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `Horizontal overflow ${overflow}px at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log('v0.19.0 packaged browser gate passed');
