import assert from "node:assert/strict";
import {createReadStream, existsSync, statSync} from "node:fs";
import http from "node:http";
import path from "node:path";
import {chromium} from "playwright";

const target = path.resolve(process.argv[2] || "dist/koryto-v0.20.0-clean-test.8");
assert(existsSync(path.join(target, "index.html")), `Missing packaged build at ${target}`);

const types = new Map([[".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"]]);
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
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });

async function audit(label) {
  const report = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
    const duplicateIds = ids.filter((id, index) => id && ids.indexOf(id) !== index);
    const unnamedControls = [...document.querySelectorAll("button, input, select, textarea, a[href]")]
      .filter(node => {
        const labelledBy = node.getAttribute("aria-labelledby");
        const labelledText = labelledBy ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || "").join(" ") : "";
        const explicitLabel = node.id ? document.querySelector(`label[for='${CSS.escape(node.id)}']`)?.textContent : "";
        const wrappingLabel = node.closest("label")?.textContent || "";
        const name = node.getAttribute("aria-label") || labelledText || explicitLabel || wrappingLabel || node.textContent || node.getAttribute("placeholder") || "";
        return !name.trim();
      }).map(node => node.outerHTML.slice(0, 160));
    return {
      duplicateIds: [...new Set(duplicateIds)],
      unnamedControls,
      missingAlt: [...document.querySelectorAll("img:not([alt])")].map(node => node.outerHTML.slice(0, 160)),
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
  await page.goto(`http://127.0.0.1:${port}/?rolls=18,18,18`, {waitUntil: "networkidle"});
  await page.waitForFunction(() => globalThis.KorytoTest8?.version === "0.20.0-clean-test.8");
  await audit("creation");
  assert.equal(await page.locator("[data-origin][aria-pressed]").count(), 3);
  assert.equal(await page.locator("[data-class][aria-pressed]").count(), 3);

  await page.fill("#heroName", "Přístupný kandidát");
  await page.locator('[data-origin="ambitious"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#heroName").inputValue(), "Přístupný kandidát");
  assert.equal(await page.locator('[data-origin][aria-pressed="true"]').getAttribute("data-origin"), "ambitious");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-origin")), "ambitious");

  await page.locator('[data-class="paladin"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#heroName").inputValue(), "Přístupný kandidát");
  assert.equal(await page.locator('[data-class][aria-pressed="true"]').getAttribute("data-class"), "paladin");

  await page.keyboard.press("Tab");
  const focusVisible = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return false;
    const style = getComputedStyle(active);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
  assert(focusVisible, "keyboard focus must be visible");

  await page.click('button[type="submit"]');
  await page.waitForSelector(".t8-village-map");
  assert.equal(await page.evaluate(() => globalThis.KorytoTest8.getState().hero.name), "Přístupný kandidát");
  await audit("campaign map");
  assert.equal(await page.locator(".t8-location").count(), 3);
  assert.equal(await page.locator("[data-campaign-action]").count(), 3);

  await page.emulateMedia({reducedMotion: "reduce"});
  await page.locator('[data-campaign-action="office-contract"]').click();
  await page.waitForSelector(".dice-overlay");
  assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-dice-skip]")), true, "focus enters dice dialog");
  assert.equal(await page.evaluate(() => document.getElementById("app")?.inert), true, "background is inert during roll");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.querySelector(".dice-overlay")?.contains(document.activeElement)), true, "focus stays inside dice dialog");
  await page.click("[data-dice-skip]");
  await page.waitForSelector(".dice-overlay", {state: "detached"});
  assert.equal(await page.evaluate(() => document.getElementById("app")?.inert), false, "background interaction returns");
  await audit("campaign after roll");

  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
  console.log("TEST.8 accessibility, focus, reduced motion, and mobile overflow passed.");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
