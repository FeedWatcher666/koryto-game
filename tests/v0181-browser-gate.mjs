import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const target = path.resolve(process.argv[2] || 'dist/koryto-v0.18.1-test.1');
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
    assert.equal(await page.locator('#app:visible').count(), 0);
    await page.getByRole('button', { name: 'Vstoupit do kampaně' }).click();
    await page.getByRole('button', { name: /Idealista/ }).click();
    await page.locator('[data-choice="priority_party"]').click();
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.locator('[data-choice="accept_offer"]').click();
    await page.waitForSelector('.k181-reaction');
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.waitForSelector('[data-choice="promise_school"]');
    assert.equal(await page.locator('.k181-route-badge').count(), 1);
    await page.locator('[data-choice="promise_school"]').click();
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.getByRole('button', { name: 'Otevřít druhý den' }).click();
    await page.locator('[data-choice="tell_truth"]').click();
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.locator('[data-choice="confess_staff"]').click();
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.locator('[data-choice="clean_speech"]').click();
    await page.getByRole('button', { name: 'Pokračovat' }).click();
    await page.waitForSelector('.k181-ending-screen');
    assert.equal(await page.locator('.k181-epilogue').count(), 5);
    assert.match(await page.locator('.k181-replay-panel').innerText(), /Objeveno 1\/4 konců a 1\/4 cest/);
    await page.screenshot({ path: path.join(out, `${viewport.name}-ending.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `Horizontal overflow ${overflow}px at ${viewport.width}x${viewport.height}`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('v0.18.1 packaged browser gate passed');
