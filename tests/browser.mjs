import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const dist = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.4");
const index = path.join(dist, "index.html");
assert.ok(fs.existsSync(index), `Missing offline index: ${index}`);
fs.mkdirSync("browser-artifacts", {recursive: true});

async function openGame(browser, rolls, viewport) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(`${pathToFileURL(index).href}?rolls=${rolls.join(",")}`, {waitUntil: "load"});
  await page.waitForFunction(() => globalThis.KorytoClean?.version === "0.20.0-clean-test.4");
  await page.fill("#heroName", `Tester ${rolls.join("-")}`);
  await page.click('button[type="submit"]');
  await page.click('[data-action="take-pen"]');
  return {context, page, errors};
}

async function expectText(locator, pattern) {
  assert.match(await locator.innerText(), pattern);
}

const browser = await chromium.launch({headless: true});
try {
  {
    const {context, page, errors} = await openGame(browser, [4, 17], {width: 390, height: 844});
    const advantageChoice = page.locator('[data-check="ask-local"]');
    await expectText(advantageChoice, /VÝHODA/);
    await advantageChoice.click();
    await page.waitForSelector(".dice-overlay.is-rolling.mode-advantage", {state: "visible"});
    assert.equal(await page.locator('.dice-canvas[data-d20-renderer="icosahedron"]').count(), 2, "advantage: two physical d20 canvases");
    const firstCanvas = page.locator(".dice-canvas").first();
    await page.waitForFunction(() => document.querySelector(".dice-canvas")?.dataset.frameSignature);
    const signatureA = await firstCanvas.getAttribute("data-frame-signature");
    await page.waitForTimeout(150);
    const signatureB = await firstCanvas.getAttribute("data-frame-signature");
    assert.notEqual(signatureA, signatureB, "advantage: geometry changes between frames");
    assert.equal(await firstCanvas.getAttribute("data-face-labels"), "20");
    assert.ok(Number(await firstCanvas.getAttribute("data-lighting-range")) > 0.15, "advantage: faces use varied lighting");
    await page.waitForSelector(".dice-overlay.is-landed", {state: "visible", timeout: 5000});
    assert.equal(await page.locator(".dice-unit.is-kept .dice-readout").textContent(), "17");
    assert.equal(await page.locator(".dice-unit.is-discarded .dice-readout").textContent(), "4");
    assert.match(await page.locator(".dice-status").innerText(), /vyšší výsledek 17/);
    await page.screenshot({path: "browser-artifacts/d20-advantage-mobile.png", fullPage: false});
    await page.waitForSelector(".result-card", {state: "visible", timeout: 5000});
    assert.match(await page.locator(".formula").textContent(), /2d20kh1/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, "advantage mobile: no horizontal overflow");
    assert.deepEqual(errors, [], "advantage mobile: no browser errors");
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, [18, 3], {width: 1024, height: 650});
    const disadvantageChoice = page.locator('[data-check="follow-folders"]');
    await expectText(disadvantageChoice, /NEVÝHODA/);
    await disadvantageChoice.click();
    await page.waitForSelector(".dice-overlay.is-rolling.mode-disadvantage", {state: "visible"});
    assert.equal(await page.locator(".dice-canvas").count(), 2, "disadvantage: two physical d20 canvases");
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".dice-overlay.is-landed", {state: "visible", timeout: 2500});
    assert.equal(await page.locator(".dice-unit.is-kept .dice-readout").textContent(), "3");
    assert.equal(await page.locator(".dice-unit.is-discarded .dice-readout").textContent(), "18");
    assert.match(await page.locator(".dice-status").innerText(), /nižší výsledek 3/);
    await page.screenshot({path: "browser-artifacts/d20-disadvantage-desktop.png", fullPage: false});
    await page.waitForSelector(".result-card", {state: "visible", timeout: 3500});
    assert.match(await page.locator(".formula").textContent(), /2d20kl1/);
    assert.deepEqual(errors, [], "disadvantage desktop: no browser errors");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Koryto CLEAN TEST.4 polished D20 advantage/disadvantage browser gate passed.");
