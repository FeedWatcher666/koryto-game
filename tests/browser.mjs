import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const dist = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.3");
const index = path.join(dist, "index.html");
assert.ok(fs.existsSync(index), `Missing offline index: ${index}`);
fs.mkdirSync("browser-artifacts", {recursive: true});

async function openGame(browser, roll, viewport) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(`${pathToFileURL(index).href}?roll=${roll}`, {waitUntil: "load"});
  await page.waitForFunction(() => globalThis.KorytoClean?.version === "0.20.0-clean-test.3");
  await page.fill("#heroName", `Tester ${roll}`);
  await page.click('button[type="submit"]');
  await page.click('[data-action="take-pen"]');
  return {context, page, errors};
}

async function canvasSignature(page) {
  return page.locator('.dice-canvas[data-d20-renderer="icosahedron"]').evaluate(canvas => {
    const context = canvas.getContext("2d");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0;
    let variation = 0;
    let previous = -1;
    for (let index = 0; index < pixels.length; index += 64) {
      const alpha = pixels[index + 3];
      if (alpha > 10) opaque += 1;
      const luminance = pixels[index] + pixels[index + 1] + pixels[index + 2];
      if (previous >= 0 && Math.abs(luminance - previous) > 30) variation += 1;
      previous = luminance;
    }
    return {data: canvas.toDataURL(), opaque, variation};
  });
}

const browser = await chromium.launch({headless: true});
try {
  {
    const {context, page, errors} = await openGame(browser, 20, {width: 390, height: 844});
    await page.locator("[data-check]").first().click();
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible"});
    assert.equal(await page.locator('.dice-canvas[data-d20-renderer="icosahedron"]').count(), 1, "critical: true 3D canvas exists");
    assert.ok(await page.locator(".dice-modifiers span").count() >= 1, "critical: known modifiers are visible");
    const firstFrame = await canvasSignature(page);
    await page.waitForTimeout(150);
    const secondFrame = await canvasSignature(page);
    assert.ok(firstFrame.opaque > 100, "critical: icosahedron has rendered faces");
    assert.ok(firstFrame.variation > 20, "critical: faces have varied lighting");
    assert.notEqual(firstFrame.data, secondFrame.data, "critical: icosahedron rotates between frames");
    await page.waitForSelector(".dice-overlay.is-landed.is-critical", {state: "visible", timeout: 5000});
    assert.equal(await page.locator(".dice-number").textContent(), "20");
    assert.match(await page.locator(".dice-status").innerText(), /Obec nečekaně spolupracuje/);
    await page.screenshot({path: "browser-artifacts/d20-3d-critical-mobile.png", fullPage: false});
    await page.waitForSelector(".dice-overlay", {state: "detached", timeout: 4000});
    await page.waitForSelector(".result-card", {state: "visible"});
    assert.equal(await page.locator(".result-card .d20").textContent(), "20");
    assert.match(await page.locator(".result-impact").textContent(), /Obec nečekaně spolupracuje/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, "critical mobile: no horizontal overflow");
    assert.deepEqual(errors, [], "critical mobile: no browser errors");
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, 1, {width: 1024, height: 650});
    await page.locator("[data-check]").first().click();
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible"});
    const rollingFrame = await canvasSignature(page);
    assert.ok(rollingFrame.opaque > 100, "fumble: volumetric die is visible");
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".dice-overlay.is-landed.is-fumble", {state: "visible", timeout: 2500});
    assert.equal(await page.locator(".dice-number").textContent(), "1");
    assert.match(await page.locator(".dice-status").innerText(), /Tohle už někdo nahlásil/);
    await page.screenshot({path: "browser-artifacts/d20-3d-fumble-desktop.png", fullPage: false});
    await page.waitForSelector(".result-card", {state: "visible", timeout: 3000});
    assert.match(await page.locator(".result-impact").textContent(), /Tohle už někdo nahlásil/);
    assert.deepEqual(errors, [], "fumble desktop: no browser errors");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Koryto CLEAN TEST.3 volumetric d20 browser gate passed.");
