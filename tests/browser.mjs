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
      rolls: [16, 18, 17, 16, 18, 19],
      viewport: {width: 1200, height: 800}
    });
    assert.equal(await page.locator(".t8-location").count(), 3);
    assert.equal(await page.locator("[data-campaign-action]").count(), 3);

    await performAction(page, "jzd-logbook");
    await page.reload({waitUntil: "load"});
    await page.waitForFunction(() => globalThis.KorytoTest8?.getState().campaign.actionsLeft === 1);
    assert.equal(await page.locator('[data-campaign-action="jzd-logbook"]').count(), 0);
    await performAction(page, "pub-workers");

    await page.waitForSelector("[data-staff]");
    await page.click('[data-staff="marie"]');
    await page.waitForSelector("[data-strategy]");
    await page.click('[data-strategy="legal"]');
    await page.waitForSelector('[data-campaign-action="respond-archive-sealed"]');
    assert.equal(await page.locator(".t8-location.is-blocked").count(), 1, "Věčný blocks the office on day 2");
    await page.screenshot({path: "browser-artifacts/test8-day2-mutation-desktop.png", fullPage: true});

    await performAction(page, "respond-archive-sealed", {automatic: true});
    await performAction(page, "legal-audit");
    await page.waitForSelector('[data-campaign-action="respond-sale-accelerated"]');
    assert.equal(await page.locator(".t8-location.is-blocked").count(), 1, "day 2 sacrifice mutates day 3 board");
    await page.screenshot({path: "browser-artifacts/test8-day3-mutation-desktop.png", fullPage: true});

    await performAction(page, "respond-sale-accelerated", {automatic: true});
    await performAction(page, "legal-affidavit");
    await page.waitForSelector("[data-final-tactic]");
    assert.equal(await page.locator("[data-final-tactic]").count(), 2);
    await page.click('[data-final-tactic="injunction"]');
    await page.waitForSelector("[data-final-roll]");
    assert.match(await page.locator(".t8-gate").innerText(), /DOKTRÍNA JE PŘIPRAVENA/);
    await page.click("[data-final-roll]");
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible", timeout: 2500});
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".t8-ending");

    const completed = await page.evaluate(() => globalThis.KorytoTest8.getState());
    assert.equal(completed.campaign.outcome.won, true);
    assert.equal(completed.campaign.sacrificeLog.length, 3);
    assert.equal(completed.campaign.rivalLog.length, 3);
    assert.equal(completed.campaign.finalStrategy, "legal");
    assert.equal(completed.campaign.finalTactic, "injunction");
    assert.equal(completed.campaign.cases.jzd.status, "resolved");
    assert.notEqual(completed.campaign.cases.road.status, "active");
    assert.equal(completed.playtests.length, 1);
    assert.equal(await page.locator('[data-system="export"]').count(), 1);
    await page.click('[data-system="export"]');
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-system="export"]');
      return /zkopírován|označen/.test(button?.textContent || "");
    });
    await page.screenshot({path: "browser-artifacts/test8-doctrine-win-desktop.png", fullPage: true});
    await noOverflow(page, "doctrine win desktop");
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [1, 1, 1, 1, 1],
      viewport: {width: 390, height: 844},
      classId: "paladin"
    });
    await performAction(page, "pub-workers");
    await performAction(page, "office-contract");
    await page.click('[data-staff="radek"]');
    await page.click('[data-strategy="workers"]');
    await performAction(page, "respond-logbook-burned", {automatic: true});
    await performAction(page, "workers-organize");
    await page.waitForSelector(".t8-village-map");
    await performAction(page, "road-last-chance");
    await page.waitForSelector(".t8-ending.is-loss");
    const defeated = await page.evaluate(() => globalThis.KorytoTest8.getState());
    assert.equal(defeated.campaign.outcome.id, "pressure-defeat");
    assert.equal(defeated.resources.pressure, 10);
    await page.screenshot({path: "browser-artifacts/test8-pressure-defeat-mobile.png", fullPage: true});
    await noOverflow(page, "pressure defeat mobile");
    assert.deepEqual(errors, []);
    await context.close();
  }

  console.log("TEST.8 sacrifice, mutation, doctrine, tactic, save/reload, export, desktop, and mobile passed.");
} finally {
  await browser.close();
}
