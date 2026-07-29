import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const target = path.resolve(process.argv[2] || 'dist/koryto-v0.20.0-test.1');
assert.ok(fs.existsSync(path.join(target, 'index.html')), `Missing packaged index: ${target}`);
const out = path.resolve('browser-artifacts');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const route = [
  [1, 6], [1, 5], [1, 4], [1, 3], [2, 3], [2, 2], [2, 1], [1, 1]
];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ name: 'notebook', width: 1024, height: 550 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    const url = `${pathToFileURL(path.join(target, 'index.html')).href}?seed=2020`;
    await page.goto(url);
    await page.waitForSelector('#k200Root .k200-start');
    await page.screenshot({ path: path.join(out, `${viewport.name}-start.png`), fullPage: true });
    await page.getByRole('button', { name: /Soused odvedle/ }).click();
    await page.waitForSelector('.k200-board');
    assert.equal(await page.locator('.k200-tile').count(), 63);
    assert.equal(await page.locator('.k200-voter').count(), 10);

    for (const [x, y] of route) {
      await page.locator(`[data-x="${x}"][data-y="${y}"]`).click();
      if (await page.locator('.k200-pitches').count()) {
        await page.locator('[data-pitch]').first().click();
      }
      if (await page.locator('.k200-breaking').count()) {
        await page.getByRole('button', { name: /Pokračovat do dne/ }).click();
      }
    }

    await page.waitForSelector('.k200-location-card');
    await page.getByRole('button', { name: 'Hrát minihru' }).click();
    await page.waitForSelector('.k200-timing');
    await page.getByRole('button', { name: 'PRONÉST POINTU' }).click();
    await page.waitForSelector('.k200-mini-result');
    await page.screenshot({ path: path.join(out, `${viewport.name}-minigame.png`), fullPage: true });
    await page.getByRole('button', { name: 'Zpátky do ulic' }).click();
    await page.waitForSelector('.k200-board');

    const total = await page.evaluate(() => {
      const state = window.KorytoReboot.getState();
      return state.votes.player + state.votes.rival + state.votes.undecided;
    });
    assert.equal(total, 15);

    await page.evaluate(() => window.KorytoReboot.forceFinish());
    await page.waitForSelector('.k200-newspaper');
    await page.screenshot({ path: path.join(out, `${viewport.name}-ending.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `Horizontal overflow ${overflow}px at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('v0.20.0 packaged browser gate passed');
