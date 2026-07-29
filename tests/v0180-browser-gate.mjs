import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const target = path.resolve(process.argv[2] || 'dist/koryto-v0.18.0-test.1');
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
    await page.goto(pathToFileURL(path.join(target, 'index.html')).href);
    await page.waitForSelector('#k180Root .k180-start');
    assert.equal(await page.locator('#k180Root').count(), 1);
    assert.equal(await page.locator('#app:visible').count(), 0);
    await page.screenshot({ path: path.join(out, `${viewport.name}-start.png`), fullPage: true });
    await page.getByRole('button', { name: 'Vstoupit do kampaně' }).click();
    await page.getByRole('button', { name: /Idealista/ }).click();
    await page.waitForSelector('[data-choice="priority_party"]');
    assert.equal(await page.locator('.k180-choice:not(:disabled)').count(), 3);
    await page.locator('[data-choice="priority_party"]').click();
    await page.waitForSelector('.k180-result-card');
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.waitForSelector('[data-choice="accept_offer"]');
    assert.ok(await page.locator('.k180-choice:not(:disabled)').count() >= 3);
    await page.screenshot({ path: path.join(out, `${viewport.name}-decision.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `Horizontal overflow ${overflow}px at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('v0.18.0 packaged browser gate passed');
