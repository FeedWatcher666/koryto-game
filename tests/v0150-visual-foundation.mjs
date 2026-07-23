import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const core = read("src/v0150-visual-core.js");
const shell = read("src/v0150-visual-shell.js");
const content = read("src/v0150-visual-content.js");
const foundation = read("src/v0150-visual-foundation.js");
const js = [core, shell, content, foundation].join("\n");
const cssEntry = read("styles/v0150.css");
const css = ["core","layout","screens","responsive"].map(name => read(`styles/v0150-${name}.css`)).join("\n");
for (const name of ["core","layout","screens","responsive"]) assert.ok(cssEntry.includes(`v0150-${name}.css`), `missing CSS import ${name}`);
const map = read("assets/v0150/dolni-vejprnice.svg");

assert.equal(read("VERSION").trim(), "0.15.0-test.1");
assert.match(html, /Koryto 0\.15\.0 TEST\.1/);
assert.match(html, /styles\/v0150\.css/);
for (const path of ["src/v0150-visual-core.js","src/v0150-visual-shell.js","src/v0150-visual-content.js","src/v0150-visual-foundation.js"]) assert.ok(html.includes(path), `missing ${path}`);
assert.ok(html.indexOf("styles/v0150.css") > html.indexOf("styles/v0149.css"), "v0.15 CSS must load after v0.14.9");
const order = ["src/v0149-pixel-assets.js","src/v0150-visual-core.js","src/v0150-visual-shell.js","src/v0150-visual-content.js","src/v0150-visual-foundation.js"].map(path => html.indexOf(path));
assert.ok(order.every((value, index) => value >= 0 && (index === 0 || value > order[index - 1])), "v0.15 runtime order invalid");

for (const token of [
  "0.15.0 TEST.1",
  "0.15.0-test.1",
  'SAVE_VERSION = "0.14.3-test.2"',
  "KorytoVisual150",
  "v0150Topbar",
  "v0150BottomNav",
  "v0150LeftPanel",
  "v0150RightPanel",
  "v0150MapTitle",
  "visualAudit"
]) assert.ok(js.includes(token), `missing JS token ${token}`);
assert.doesNotMatch(js, /MutationObserver/);
assert.doesNotMatch(js, /setInterval\s*\(/);

for (const token of [
  "--koryto-wood-950",
  "--koryto-parchment",
  ".v0150-topbar",
  ".v0150-side-panel",
  ".v0150-title-banner",
  ".v0150-map",
  ".v0150-bottom-nav",
  ".v0150-system-menu",
  ".v0150-visualqa",
  ":focus-visible",
  "prefers-reduced-motion",
  "@media (max-width:700px)"
]) assert.ok(css.includes(token), `missing CSS token ${token}`);
assert.match(css, /min-height:48px/);
assert.match(css, /assets\/v0150\/dolni-vejprnice\.svg/);

assert.match(map, /<svg[^>]+viewBox="0 0 1280 720"/);
assert.match(map, /shape-rendering="crispEdges"/);
assert.doesNotMatch(map, /<(?:image|script|use)[^>]+(?:href|src)=["']https?:\/\//i);
assert.doesNotMatch(map, /url\(\s*["']?https?:\/\//i);
for (const place of ["U KORYTA", "VEJPRNICKÝ", "ZPRAVODAJ", "JZD", "LOUKA NENÍ", "VILADOMY", "VOLTE"]) {
  assert.ok(map.includes(place), `map is missing ${place}`);
}
for (const location of ["pub", "townhall", "school", "paper", "jzd", "meadow", "hq", "pitch"]) {
  assert.ok(js.includes(`${location}: [`), `runtime is missing map position ${location}`);
}

const makeClassList = () => {
  const values = new Set();
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
    toggle: (name, force) => {
      const enabled = force === undefined ? !values.has(name) : Boolean(force);
      if (enabled) values.add(name); else values.delete(name);
      return enabled;
    }
  };
};
const documentElement = { classList: makeClassList(), dataset: {} };
const document = {
  documentElement,
  body: { firstElementChild: null, insertAdjacentHTML() {} },
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};
const sandbox = {
  console,
  document,
  location: { search: "" },
  localStorage: { getItem() { return null; }, setItem() {} },
  setTimeout(callback) { callback(); return 1; },
  clearTimeout() {}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const [filename, source] of [["src/v0150-visual-core.js",core],["src/v0150-visual-shell.js",shell],["src/v0150-visual-content.js",content],["src/v0150-visual-foundation.js",foundation]]) vm.runInContext(source, sandbox, { filename });

assert.equal(sandbox.KorytoVisual150.VERSION, "0.15.0 TEST.1");
assert.equal(sandbox.KorytoVisual150.BUILD_VERSION, "0.15.0-test.1");
assert.equal(sandbox.KorytoVisual150.SAVE_VERSION, "0.14.3-test.2");
assert.equal(sandbox.KorytoVisual150.SAVE_SCHEMA, 1);
assert.equal(documentElement.classList.contains("v0150-identity"), true);
const audit = sandbox.KorytoVisual150.visualAudit();
assert.equal(audit.version, "0.15.0 TEST.1");
assert.equal(audit.saveVersion, "0.14.3-test.2");
assert.equal(audit.mapLocations, 0);

console.log("v0.15.0 TEST.1 visual foundation contract passed");
