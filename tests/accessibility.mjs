import assert from "node:assert/strict";
import {createReadStream, existsSync, statSync} from "node:fs";
import http from "node:http";
import path from "node:path";
import {chromium} from "playwright";

const target = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.6");
assert(existsSync(path.join(target, "index.html")), `Missing packaged build at ${target}`);

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"]
]);

const server = http.createServer((request, response) => {
  const raw = new URL(request.url, "http://localhost").pathname;
  const requested = raw === "/" ? "/index.html" : raw;
  const file = path.resolve(target, `.${decodeURIComponent(requested)}`);
  if (!file.startsWith(target) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {"content-type": types.get(path.extname(file)) || "application/octet-stream"});
  createReadStream(file).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const {port} = server.address();
const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 390, height: 844}});
const browserErrors = [];
let expectedDiceFailure = false;
page.on("pageerror", error => browserErrors.push(error.message));
page.on("console", message => {
  if (message.type() !== "error") return;
  const text = message.text();
  if (expectedDiceFailure && text.includes("D20 animation failed; resolving check without animation.")) return;
  browserErrors.push(text);
});

async function audit(label) {
  const report = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
    const duplicateIds = ids.filter((id, index) => id && ids.indexOf(id) !== index);
    const unnamedControls = [...document.querySelectorAll("button, input, select, textarea, a[href], [role='button']")]
      .filter(node => {
        if (node instanceof HTMLInputElement && node.type === "hidden") return false;
        const labelledBy = node.getAttribute("aria-labelledby");
        const labelledText = labelledBy
          ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" ")
          : "";
        const explicitLabel = node.id ? document.querySelector(`label[for='${CSS.escape(node.id)}']`)?.textContent : "";
        const wrappingLabel = node.closest("label")?.textContent || "";
        const name = node.getAttribute("aria-label") || labelledText || explicitLabel || wrappingLabel || node.textContent || node.getAttribute("title") || node.getAttribute("placeholder") || "";
        return !name.trim();
      })
      .map(node => node.outerHTML.slice(0, 180));
    return {
      duplicateIds: [...new Set(duplicateIds)],
      unnamedControls,
      missingAlt: [...document.querySelectorAll("img:not([alt])")].map(node => node.outerHTML.slice(0, 180)),
      h1Count: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  assert.deepEqual(report.duplicateIds, [], `${label}: duplicate ids`);
  assert.deepEqual(report.unnamedControls, [], `${label}: unnamed controls`);
  assert.deepEqual(report.missingAlt, [], `${label}: images without alt`);
  assert(report.h1Count >= 1, `${label}: missing h1`);
  assert(report.overflow <= 1, `${label}: horizontal overflow ${report.overflow}px`);
}

try {
  await page.goto(`http://127.0.0.1:${port}/`, {waitUntil: "networkidle"});
  await audit("creation screen");
  assert.equal(await page.locator("[data-origin][aria-pressed]").count(), 3);
  assert.equal(await page.locator("[data-class][aria-pressed]").count(), 3);
  assert.equal(await page.locator("[data-origin][aria-pressed='true']").getAttribute("data-origin"), "idealist");
  assert.equal(await page.locator("[data-class][aria-pressed='true']").getAttribute("data-class"), "bard");
  await page.locator("[data-origin='ambitious']").click();
  assert.equal(await page.locator("[data-origin][aria-pressed='true']").getAttribute("data-origin"), "ambitious");
  assert.equal(await page.locator("[data-origin][aria-pressed='true']").count(), 1);
  await page.locator("[data-origin='idealist']").click();
  await page.locator("[data-class='paladin']").click();
  assert.equal(await page.locator("[data-class][aria-pressed='true']").getAttribute("data-class"), "paladin");
  assert.equal(await page.locator("[data-class][aria-pressed='true']").count(), 1);
  await page.locator("[data-class='bard']").click();

  await page.keyboard.press("Tab");
  const focusVisible = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return false;
    const style = getComputedStyle(active);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
  assert(focusVisible, "keyboard focus is not visibly indicated");

  await page.locator("#heroName").fill("Přístupný tester");
  await page.locator("#creationForm button[type='submit']").click();
  await page.locator(".game-hud").waitFor();
  await audit("game screen");

  await page.emulateMedia({reducedMotion: "reduce"});
  await page.locator("[data-action='take-pen']").click();
  await page.locator("[data-check]").first().waitFor();
  await audit("first check screen with reduced motion");

  await page.locator("[data-check]").first().click();
  await page.locator(".dice-overlay").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-dice-skip]")), true, "focus must move into the dice dialog");
  assert.equal(await page.evaluate(() => document.getElementById("app")?.inert), true, "background app must be inert while the dice dialog is open");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.querySelector(".dice-overlay")?.contains(document.activeElement)), true, "Tab must remain inside the dice dialog");
  await page.locator("[data-dice-skip]").click();
  await page.locator(".dice-overlay").waitFor({state: "detached"});
  await page.locator(".result-card").waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("dice-lock")), false);
  assert.equal(await page.evaluate(() => document.getElementById("app")?.inert), false, "background inert state must be restored");

  await page.locator("[data-action='accept-first']").click();
  await page.locator("[data-companion]").first().click();
  await page.locator("[data-check]").first().waitFor();
  await page.evaluate(() => {
    globalThis.__korytoOriginalCanvasContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function forcedDiceRendererFailure() {
      throw new Error("forced dice renderer failure");
    };
  });
  expectedDiceFailure = true;
  await page.locator("[data-check]").first().click();
  await page.locator(".result-card").waitFor();
  await page.locator(".dice-overlay").waitFor({state: "detached"});
  expectedDiceFailure = false;
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.getContext = globalThis.__korytoOriginalCanvasContext;
    delete globalThis.__korytoOriginalCanvasContext;
  });
  assert.equal(await page.locator(".dice-overlay").count(), 0, "failed presentation must remove the modal");
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("dice-lock")), false, "failed presentation must release dice-lock");
  assert.equal(await page.evaluate(() => document.getElementById("app")?.inert), false, "failed presentation must restore background interaction");

  await page.locator("[data-action='accept-registration']").click();
  await page.locator("[data-action='start-jzd']").click();
  await page.locator("[data-action='jzd-briefing-next']").click();
  await page.locator("[data-quest-companion]").first().waitFor();
  assert.equal(await page.locator("[data-quest-companion][aria-pressed]").count(), 3, "every companion choice must expose selected state");
  assert.equal(await page.locator("[data-quest-companion][aria-pressed='true']").count(), 1, "the recruited companion starts selected");
  await page.locator("[data-quest-companion='bohumil']").click();
  assert.equal(await page.locator("[data-quest-companion][aria-pressed='true']").count(), 2, "two selected companions must be programmatically visible");
  assert.equal(await page.locator("[data-quest-item][aria-pressed]").count(), 3, "every item choice must expose selected state");
  assert.equal(await page.locator("[data-quest-item][aria-pressed='true']").count(), 0, "no item starts selected");
  await page.locator("[data-quest-item='recorder']").click();
  assert.equal(await page.locator("[data-quest-item][aria-pressed='true']").getAttribute("data-quest-item"), "recorder");
  await page.locator("[data-quest-item='archiveKey']").click();
  assert.equal(await page.locator("[data-quest-item][aria-pressed='true']").count(), 1, "item selection remains exclusive");
  assert.equal(await page.locator("[data-quest-item][aria-pressed='true']").getAttribute("data-quest-item"), "archiveKey");
  await audit("JZD preparation selected states");

  assert.deepEqual(browserErrors, [], `browser errors: ${browserErrors.join(" | ")}`);
  console.log("Accessibility, selected-state semantics, focus containment, and dice-failure cleanup passed in the packaged build.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
