import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const dist = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.2");
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
  await page.waitForFunction(() => globalThis.KorytoClean?.version === "0.20.0-clean-test.2");
  await page.fill("#heroName", `Tester ${roll}`);
  await page.click('button[type="submit"]');
  await page.click('[data-action="take-pen"]');
  return {context, page, errors};
}

const browser = await chromium.launch({headless: true});
try {
  {
    const {context, page, errors} = await openGame(browser, 20, {width: 390, height: 844});
    await page.locator("[data-check]").first().click();
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible"});
    assert.equal(await page.locator(".dice-polyhedron").count(), 1, "critical: rotating d20 exists");
    assert.ok(await page.locator(".dice-modifiers span").count() >= 1, "critical: known modifiers are visible");
    await page.waitForSelector(".dice-overlay.is-landed.is-critical", {state: "visible", timeout: 4000});
    assert.equal(await page.locator(".dice-number").textContent(), "20");
    assert.match(await page.locator(".dice-status").innerText(), /Obec nečekaně spolupracuje/);
    await page.screenshot({path: "browser-artifacts/d20-critical-mobile.png", fullPage: false});
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
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".dice-overlay.is-landed.is-fumble", {state: "visible", timeout: 2000});
    assert.equal(await page.locator(".dice-number").textContent(), "1");
    assert.match(await page.locator(".dice-status").innerText(), /Tohle už někdo nahlásil/);
    await page.screenshot({path: "browser-artifacts/d20-fumble-desktop.png", fullPage: false});
    await page.waitForSelector(".result-card", {state: "visible", timeout: 3000});
    assert.match(await page.locator(".result-impact").textContent(), /Tohle už někdo nahlásil/);
    assert.deepEqual(errors, [], "fumble desktop: no browser errors");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Koryto CLEAN TEST.2 animated d20 browser gate passed.");
