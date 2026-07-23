import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read = path => fs.readFileSync(path, "utf8");
const runtime = read("src/v0149-pixel-assets.js");
const css = read("styles/v0149.css");
const html = read("index.html");
const workflow = read(".github/workflows/v0142-stability.yml");

const chunkSpecs = [
  ["src/v0149-assets/atlas-1.js", "atlas"],
  ["src/v0149-assets/atlas-2.js", "atlas"],
  ["src/v0149-assets/atlas-3.js", "atlas"],
  ["src/v0149-assets/village-1.js", "village"],
  ["src/v0149-assets/village-2.js", "village"]
];

function chunkPayload(path, kind) {
  const source = read(path);
  assert.doesNotMatch(source, /https?:\/\//, `${path} must remain offline`);
  const match = source.match(new RegExp(`KorytoAssetChunks149\\.${kind}\\.push\\("([A-Za-z0-9+/=]+)"\\)`));
  assert.ok(match, `${path} must append a ${kind} base64 chunk`);
  return match[1];
}

const atlasBase64 = chunkSpecs.filter(([, kind]) => kind === "atlas").map(([path, kind]) => chunkPayload(path, kind)).join("");
const villageBase64 = chunkSpecs.filter(([, kind]) => kind === "village").map(([path, kind]) => chunkPayload(path, kind)).join("");

function assertPng(base64, label) {
  assert.equal(base64.length % 4, 0, `${label} base64 must be complete`);
  const bytes = Buffer.from(base64, "base64");
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${label} must be a PNG`);
  assert.ok(bytes.readUInt32BE(16) > 0, `${label} width must be positive`);
  assert.ok(bytes.readUInt32BE(20) > 0, `${label} height must be positive`);
}

assertPng(atlasBase64, "atlas");
assertPng(villageBase64, "village");

assert.equal(read("VERSION").trim(), "0.14.9-test.10");
assert.match(html, /0\.14\.9 TEST\.10/);
assert.match(html, /styles\/v0149\.css/);
assert.match(workflow, /Koryto v0\.14\.9 TEST\.10/);
assert.match(workflow, /koryto-v0\.14\.9-test\.10/);

const orderedAssets = [
  "src/v0148-visual-system.js",
  "src/v0149-assets/atlas-1.js",
  "src/v0149-assets/atlas-2.js",
  "src/v0149-assets/atlas-3.js",
  "src/v0149-assets/village-1.js",
  "src/v0149-assets/village-2.js",
  "src/v0149-pixel-assets.js"
];
const positions = orderedAssets.map(file => html.indexOf(file));
assert.ok(positions.every((value, index) => value >= 0 && (index === 0 || value > positions[index - 1])), "v0.14.9 scripts must load after v0.14.8 and chunks must load before the runtime");

for (const token of [
  "v0149-village-map",
  "v0149-location-node",
  "v0149-sprite",
  "--v0149-atlas",
  "--v0149-village",
  "prefers-reduced-motion",
  "focus-visible"
]) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `missing CSS token ${token}`);

assert.match(runtime, /KorytoAssetChunks149/);
assert.match(runtime, /data:image\/png;base64,/);
assert.match(runtime, /--v0149-atlas/);
assert.match(runtime, /--v0149-village/);
assert.doesNotMatch(runtime, /embedded-css:/);
assert.doesNotMatch(runtime, /MutationObserver/);
assert.doesNotMatch(runtime, /setInterval\s*\(/);
assert.doesNotMatch(runtime, /https?:\/\//);

function makeClassList() {
  const values = new Set();
  return {
    add(...names) { names.forEach(name => values.add(name)); },
    remove(...names) { names.forEach(name => values.delete(name)); },
    contains(name) { return values.has(name); },
    values
  };
}

function makeDocument() {
  const styleValues = new Map();
  const rootClassList = makeClassList();
  const root = {
    style: {
      setProperty(name, value) { styleValues.set(name, value); },
      getPropertyValue(name) { return styleValues.get(name) || ""; }
    },
    dataset: {},
    classList: rootClassList
  };
  const document = {
    documentElement: root,
    body: { appendChild() {} },
    head: { appendChild() {} },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return {
        className: "",
        classList: makeClassList(),
        dataset: {},
        style: { setProperty() {} },
        children: [],
        prepend() {},
        appendChild() {},
        querySelector() { return null; },
        querySelectorAll() { return []; }
      };
    },
    addEventListener() {}
  };
  return { document, root, styleValues, rootClassList };
}

const dom = makeDocument();
const context = vm.createContext({
  console,
  document: dom.document,
  location: { search: "" },
  setTimeout(fn) { if (typeof fn === "function") fn(); return 0; },
  clearTimeout() {}
});
context.globalThis = context;
context.window = context;
for (const [path] of chunkSpecs) vm.runInContext(read(path), context, { filename: path });
vm.runInContext(runtime, context, { filename: "src/v0149-pixel-assets.js" });

const api = context.KorytoPixelAssets149;
assert.ok(api, "v0.14.9 API must be installed");
assert.equal(api.VERSION, "0.14.9 TEST.10");
assert.equal(api.BUILD_VERSION, "0.14.9-test.10");
assert.equal(api.SAVE_VERSION, "0.14.3-test.2");
assert.equal(api.SAVE_SCHEMA, 1);
assert.equal(api.preload(), true);
assert.match(api.atlas, /^data:image\/png;base64,/);
assert.match(api.village, /^data:image\/png;base64,/);
assert.match(dom.styleValues.get("--v0149-atlas"), /^url\("data:image\/png;base64,/);
assert.match(dom.styleValues.get("--v0149-village"), /^url\("data:image\/png;base64,/);
assert.equal(dom.root.dataset.korytoAssets, "v0149-production-pass-1");
assert.equal(dom.rootClassList.contains("v0149-production-art"), true);

const audit = api.visualAudit();
assert.equal(audit.assetsReady, true);
assert.equal(audit.chunkCounts.atlas, 3);
assert.equal(audit.chunkCounts.village, 2);
assert.equal(audit.classSprites, 6);
assert.equal(audit.companionSprites, 5);
assert.equal(audit.locationSprites, 8);
assert.equal(audit.navigationSprites, 8);

const fallbackDom = makeDocument();
const fallbackContext = vm.createContext({
  console,
  document: fallbackDom.document,
  location: { search: "" },
  setTimeout(fn) { if (typeof fn === "function") fn(); return 0; },
  clearTimeout() {}
});
fallbackContext.globalThis = fallbackContext;
fallbackContext.window = fallbackContext;
vm.runInContext(runtime, fallbackContext, { filename: "src/v0149-pixel-assets.js" });
assert.equal(fallbackContext.KorytoPixelAssets149.visualAudit().assetsReady, false);
assert.equal(fallbackDom.rootClassList.contains("v0149-assets-fallback"), true);
assert.equal(fallbackDom.rootClassList.contains("v0149-production-art"), false);

console.log(`v0.14.9 asset wiring ok: atlas ${Buffer.from(atlasBase64, "base64").length} B, village ${Buffer.from(villageBase64, "base64").length} B`);
