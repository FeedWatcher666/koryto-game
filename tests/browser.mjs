import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {chromium} from "playwright";

const dist = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.6");
const index = path.join(dist, "index.html");
assert.ok(fs.existsSync(index), `Missing offline index: ${index}`);
fs.mkdirSync("browser-artifacts", {recursive: true});

async function openGame(browser, {rolls, viewport, classId = "bard", originId = "idealist"}) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(`${pathToFileURL(index).href}?rolls=${rolls.join(",")}`, {waitUntil: "load"});
  await page.waitForFunction(() => globalThis.KorytoClean?.version === "0.20.0-clean-test.6");
  if (classId !== "bard") await page.click(`[data-class="${classId}"]`);
  if (originId !== "idealist") await page.click(`[data-origin="${originId}"]`);
  await page.fill("#heroName", `Tester ${classId}`);
  await page.click('button[type="submit"]');
  await page.click('[data-action="take-pen"]');
  return {context, page, errors};
}

async function expectText(locator, pattern) {
  assert.match(await locator.innerText(), pattern);
}

async function performCheck(page, selector) {
  await page.click(selector);
  await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible", timeout: 2500});
  const canvases = await page.locator('.dice-canvas[data-d20-renderer="icosahedron"]').count();
  assert.ok(canvases >= 1, "physical d20 is rendered");
  await page.click("[data-dice-skip]");
  await page.waitForSelector(".result-card", {state: "visible", timeout: 4000});
}

async function reachChapter(page, firstChoice, companion, registrationChoice) {
  await performCheck(page, `[data-check="${firstChoice}"]`);
  await page.click('[data-action="accept-first"]');
  await page.click(`[data-companion="${companion}"]`);
  await performCheck(page, `[data-check="${registrationChoice}"]`);
  await page.click('[data-action="accept-registration"]');
  await page.waitForSelector('[data-action="start-jzd"]', {state: "visible"});
  await page.click('[data-action="start-jzd"]');
  await page.click('[data-action="jzd-briefing-next"]');
}

const browser = await chromium.launch({headless: true});
try {
  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [4, 17, 5, 16, 6, 18, 7, 17, 8, 16],
      viewport: {width: 390, height: 844}
    });
    await reachChapter(page, "ask-local", "marie", "find-paragraph");

    assert.equal(await page.locator(".quest-companion-card").count(), 3, "prep offers three companions");
    await expectText(page.locator(".selection-counter"), /1\/2/);
    await page.click('[data-quest-companion="radek"]');
    await page.click('[data-quest-item="archiveKey"]');
    await expectText(page.locator(".selection-counter"), /2\/2/);
    assert.equal(await page.locator('[data-action="confirm-jzd-prep"]').isEnabled(), true);
    await page.click('[data-action="confirm-jzd-prep"]');

    await expectText(page.locator('[data-check="archive-door"]'), /Klíč od archivu|Marie|Radek/);
    await performCheck(page, '[data-check="archive-door"]');
    await page.click('[data-action="accept-jzd-approach"]');
    await performCheck(page, '[data-check="ledger-trail"]');
    await page.click('[data-action="accept-jzd-search"]');

    await page.waitForSelector(".rival-choice-grid", {state: "visible"});
    await expectText(page.locator(".rival-scene"), /rozhodnutí nemá hod kostkou/i);
    await page.click('[data-rival-choice="protect-workers"]');
    const councilChoice = page.locator('[data-check="council-ambush"]');
    await expectText(councilChoice, /HODÍTE 2 KOSTKY/);
    await performCheck(page, '[data-check="council-ambush"]');
    await page.click('[data-action="accept-jzd-final"]');

    await page.waitForSelector(".quest-complete", {state: "visible"});
    await expectText(page.locator(".quest-complete h1"), /Pracovníci|Zastupitelstvo/);
    await expectText(page.locator(".consequence-list"), /vrátí později|očekávají ochranu/i);
    const completed = await page.evaluate(() => globalThis.KorytoClean.getState());
    assert.equal(completed.quest.status, "completed");
    assert.equal(completed.quest.ending, "council-ambush");
    assert.deepEqual(completed.quest.party, ["marie", "radek"]);
    assert.deepEqual(completed.party.members, ["marie", "radek"]);
    assert.ok(completed.quest.evidence >= 4);
    assert.ok(completed.quest.workerTrust >= 4);
    await page.screenshot({path: "browser-artifacts/jzd-public-ending-mobile.png", fullPage: true});
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, "full quest mobile: no horizontal overflow");
    assert.deepEqual(errors, [], "full quest mobile: no browser errors");
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [3, 15, 4, 16, 5, 17, 6, 18, 19],
      viewport: {width: 1100, height: 720},
      classId: "rogue",
      originId: "ambitious"
    });
    await reachChapter(page, "follow-folders", "bohumil", "back-door");
    await page.click('[data-quest-companion="bohumil"]');
    await page.click('[data-quest-companion="marie"]');
    await page.click('[data-quest-companion="radek"]');
    await page.click('[data-quest-item="recorder"]');
    await page.click('[data-action="confirm-jzd-prep"]');

    await performCheck(page, '[data-check="canteen-route"]');
    await page.click('[data-action="accept-jzd-approach"]');
    await performCheck(page, '[data-check="truck-footage"]');
    await page.click('[data-action="accept-jzd-search"]');
    await page.click('[data-rival-choice="play-along"]');

    const tradeChoice = page.locator('[data-check="trade-evidence"]');
    await expectText(tradeChoice, /VÝHODA A NEVÝHODA SE ZRUŠILY/);
    await performCheck(page, '[data-check="trade-evidence"]');
    await page.click('[data-action="accept-jzd-final"]');

    const completed = await page.evaluate(() => globalThis.KorytoClean.getState());
    assert.equal(completed.quest.status, "completed");
    assert.equal(completed.quest.ending, "trade-evidence");
    assert.deepEqual(completed.quest.party, ["marie", "radek"]);
    assert.deepEqual(completed.party.members, ["marie", "radek"]);
    assert.equal(completed.party.members.includes("bohumil"), false, "deselected companion does not return after quest");
    assert.ok(completed.resources.leverage >= 2);
    assert.ok(completed.resources.debt >= 1);
    assert.ok(completed.relationships.radek < 0);
    await expectText(page.locator(".consequence-list"), /Vladimír Věčný má důkaz/);
    await page.screenshot({path: "browser-artifacts/jzd-dirty-ending-desktop.png", fullPage: true});
    assert.deepEqual(errors, [], "dirty quest desktop: no browser errors");
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      viewport: {width: 1000, height: 720}
    });
    await reachChapter(page, "ask-local", "bohumil", "public-speech");
    await page.click('[data-quest-companion="marie"]');
    await page.click('[data-quest-item="recorder"]');
    await page.click('[data-action="confirm-jzd-prep"]');

    await performCheck(page, '[data-check="official-gate"]');
    await expectText(page.locator(".result-card"), /Komplikace/);
    await page.click('[data-action="accept-jzd-approach"]');
    await performCheck(page, '[data-check="truck-footage"]');
    await expectText(page.locator(".result-card"), /Komplikace/);
    await page.click('[data-action="accept-jzd-search"]');
    await page.click('[data-rival-choice="call-bluff"]');
    await performCheck(page, '[data-check="publish-dossier"]');
    await expectText(page.locator(".result-card"), /Komplikace/);
    await page.click('[data-action="accept-jzd-final"]');

    const completed = await page.evaluate(() => globalThis.KorytoClean.getState());
    assert.equal(completed.quest.status, "completed", "complication-only path still completes");
    assert.equal(completed.quest.ending, "publish-dossier");
    assert.equal(completed.actions, 0);
    await expectText(page.locator(".quest-complete h1"), /Kauza venku|důkazy napůl/i);
    await expectText(page.locator(".consequence-list"), /Krajský audit/i);
    await page.screenshot({path: "browser-artifacts/jzd-publish-complication-ending.png", fullPage: true});
    assert.deepEqual(errors, [], "publish complication path: no browser errors");
    await context.close();
  }

  {
    const {context, page, errors} = await openGame(browser, {
      rolls: [1, 1],
      viewport: {width: 900, height: 680}
    });
    await performCheck(page, '[data-check="ask-local"]');
    await expectText(page.locator(".result-card"), /Komplikace/);
    await page.click('.hud-actions [data-action="save"]');
    await page.reload({waitUntil: "load"});
    await page.waitForFunction(() => globalThis.KorytoClean?.version === "0.20.0-clean-test.6");
    await page.waitForSelector('[data-action="reroll-first"]', {state: "visible"});
    await page.click('[data-action="reroll-first"]');
    await page.waitForSelector(".dice-overlay.is-rolling", {state: "visible", timeout: 2500});
    await page.click("[data-dice-skip]");
    await page.waitForSelector(".dice-overlay", {state: "detached", timeout: 4000});
    await page.waitForFunction(() => globalThis.KorytoClean.getState().flags.chainedPenSpent === true);
    const reloaded = await page.evaluate(() => globalThis.KorytoClean.getState());
    assert.equal(reloaded.flags.chainedPenSpent, true, "saved first-check choice is restored for reroll");
    assert.ok(reloaded.resources.heat >= 6);
    assert.deepEqual(errors, [], "saved reroll reload: no browser errors");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Koryto CLEAN TEST.6 full JZD quest and save reload browser gate passed.");
