import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const dist = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.8");
const index = path.join(dist, "index.html");
assert.ok(fs.existsSync(index), `Missing offline index: ${index}`);
fs.mkdirSync("browser-artifacts", {recursive: true});

async function openGame(browser, {rolls, viewport, classId = "bard", originId = "idealist"}) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(`${pathToFileURL(index).href}?rolls=${rolls.join(",")}`, {waitUntil: "load"});
  await page.waitForFunction(() => globalThis.KorytoTest8?.version === "0.20.0-clean-test.8");
  if (classId !== "bard") await page.click(`[data-class="${classId}"]`);
  if (originId !== "idealist") await page.click(`[data-origin="${originId}"]`);
  await page.fill("#heroName", `Tester ${classId}`);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".t8-village-map");
  return {context, page, errors};
}

async function performAction(page, actionId, {automatic = false} = {}) {
  await page.click(`[data-campaign-action="${actionId}"]`);
  if (automatic) return;
  await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible", timeout: 2500});
  assert.ok(await page.locator('.dice-canvas[data-d20-renderer="icosahedron"]').count() >= 1);
  await page.click("[data-dice-skip]");
  await page.waitForSelector(".dice-overlay", {state: "detached", timeout: 4000});
}

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px`);
}

const browser = await chromium.launch({headless: true});
try {
  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [16, 18, 17, 16, 14, 18, 16, 15, 19],
      viewport: {width: 1200, height: 800}
    });
    assert.equal(await page.locator(".t8-location").count(), 3, "day 1 exposes three locations");
    assert.equal(await page.locator(".t8-case.is-active").count(), 1, "day 1 exposes one active case");
    assert.match(await page.locator(".t8-rival").innerText(), /VĚČNÉHO DNEŠNÍ PLÁN/);

    await performAction(page, "pub-workers");
    await page.reload({waitUntil: "load"});
    await page.waitForFunction(() => globalThis.KorytoTest8?.getState().campaign.actionsLeft === 1);
    assert.equal(await page.locator('[data-campaign-action="pub-workers"]').count(), 0, "used action stays unavailable after reload");
    await performAction(page, "office-contract");

    await page.waitForSelector("[data-staff]");
    assert.equal(await page.locator("[data-staff]").count(), 3);
    await page.click('[data-staff="marie"]');
    await page.waitForSelector('[data-campaign-action="staff-marie-annex"]');
    assert.equal(await page.locator(".t8-case.is-active").count(), 2, "day 2 exposes two simultaneous cases");
    await performAction(page, "staff-marie-annex", {automatic: true});
    await performAction(page, "pub-road");

    await page.waitForSelector("[data-strategy]");
    await page.click('[data-strategy="legal"]');
    await performAction(page, "office-final-prep");
    await performAction(page, "pub-final-prep");

    await page.waitForSelector("[data-final-roll]");
    assert.match(await page.locator(".t8-final-card").innerText(), /šest předchozích akcí/i);
    await page.click("[data-final-roll]");
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible", timeout: 2500});
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".t8-ending");

    const completed = await page.evaluate(() => globalThis.KorytoTest8.getState());
    assert.equal(completed.campaign.outcome.won, true);
    assert.equal(completed.campaign.actionLog.length, 6);
    assert.equal(completed.campaign.rivalLog.length, 3);
    assert.equal(completed.campaign.staffId, "marie");
    assert.equal(completed.campaign.finalStrategy, "legal");
    assert.equal(completed.playtests.length, 1);
    assert.equal(await page.locator('[data-system="export"]').count(), 1);
    await page.click('[data-system="export"]');
    await page.waitForFunction(() => /Playtest zkopírován|Export je označen níže/.test(document.querySelector('[data-system="export"]')?.textContent || ""));
    await page.screenshot({path: "browser-artifacts/test8-strategic-win-desktop.png", fullPage: true});
    await noOverflow(page, "strategic win desktop");
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [1, 1, 1, 1, 1],
      viewport: {width: 390, height: 844}
    });
    await performAction(page, "jzd-logbook");
    await performAction(page, "office-contract");
    await page.click('[data-staff="marie"]');
    await performAction(page, "jzd-witness");
    await performAction(page, "office-invoices");
    await page.waitForSelector(".t8-ending.is-loss");
    const defeated = await page.evaluate(() => globalThis.KorytoTest8.getState());
    assert.equal(defeated.campaign.outcome.id, "pressure-defeat");
    assert.equal(defeated.resources.pressure, 10);
    await page.screenshot({path: "browser-artifacts/test8-pressure-defeat-mobile.png", fullPage: true});
    await noOverflow(page, "pressure defeat mobile");
    assert.deepEqual(errors, []);
    await context.close();
  }

  console.log("TEST.8 packaged campaign win, defeat, save/reload, export, desktop, and mobile passed.");
} finally {
  await browser.close();
}
