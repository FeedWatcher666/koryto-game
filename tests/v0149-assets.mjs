import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const css = read("styles/v0149.css");
const runtime = read("src/v0149-pixel-assets.js");
const workflow = read(".github/workflows/v0142-stability.yml");
const packageJson = JSON.parse(read("package.json"));

assert.equal(read("VERSION").trim(), "0.14.9-test.10");
assert.match(html, /0\.14\.9 TEST\.10/);
assert.match(html, /styles\/v0149\.css/);
assert.match(html, /src\/v0149-pixel-assets\.js/);
assert.match(workflow, /Koryto v0\.14\.9 TEST\.10/);
assert.match(workflow, /koryto-v0\.14\.9-test\.10/);
assert.match(packageJson.scripts.test, /tests\/v0149-assets\.mjs/);
assert.match(runtime, /KorytoAssetChunks149/);
assert.match(runtime, /data:image\/png;base64/);
assert.match(runtime, /--v0149-atlas/);
assert.match(runtime, /--v0149-village/);
assert.doesNotMatch(runtime, /MutationObserver/);
assert.doesNotMatch(runtime, /setInterval\s*\(/);
assert.match(css, /var\(--v0149-atlas\)/);
assert.match(css, /var\(--v0149-village\)/);
assert.match(css, /image-rendering:\s*pixelated/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(`${runtime}\n${css}`, /https?:\/\//);

const expectedScripts = [
  "src/v0149-assets/atlas-1.js",
  "src/v0149-assets/atlas-2.js",
  "src/v0149-assets/atlas-3.js",
  "src/v0149-assets/village-1.js",
  "src/v0149-assets/village-2.js"
];
const scriptOrder = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
const runtimeIndex = scriptOrder.indexOf("src/v0149-pixel-assets.js");
assert.ok(runtimeIndex > -1, "v0.14.9 runtime must be loaded");
for (const script of expectedScripts) {
  const index = scriptOrder.indexOf(script);
  assert.ok(index > -1, `missing ${script}`);
  assert.ok(index < runtimeIndex, `${script} must load before the runtime`);
}

const payloads = { atlas: [], village: [] };
for (const script of expectedScripts) {
  const source = read(script);
  const match = source.match(/KorytoAssetChunks149\.(atlas|village)\.push\("([A-Za-z0-9+/=]+)"\);/);
  assert.ok(match, `${script} must append one base64 asset chunk`);
  payloads[match[1]].push(match[2]);
}
assert.equal(payloads.atlas.length, 3);
assert.equal(payloads.village.length, 2);

const inspectPng = (parts, width, height, label) => {
  const encoded = parts.join("");
  assert.ok(encoded.startsWith("iVBORw0KGgo"), `${label} must start with a PNG signature`);
  const bytes = Buffer.from(encoded, "base64");
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
  assert.ok(bytes.length > 10000, `${label} must contain real image data`);
};
inspectPng(payloads.atlas, 1024, 1024, "atlas");
inspectPng(payloads.village, 1280, 720, "village");

const styleValues = new Map();
const classes = new Set();
const root = {
  dataset: {},
  style: { setProperty(name, value) { styleValues.set(name, value); } },
  classList: {
    add(...names) { names.forEach(name => classes.add(name)); },
    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
  }
};
const document = {
  documentElement: root,
  body: { append() {} },
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return null; },
  createElement() { return null; }
};
const context = vm.createContext({
  console,
  document,
  location: { search: "" },
  setTimeout(callback) { callback(); return 1; },
  clearTimeout() {},
  KorytoAssetChunks149: {
    atlas: ["iVBORw0K", "GgoAAAAA", "AAAA"],
    village: ["iVBORw0K", "GgoAAAAA"]
  }
});
vm.runInContext(runtime, context, { filename: "src/v0149-pixel-assets.js" });
const api = context.KorytoPixelAssets149;
assert.ok(api);
assert.equal(api.VERSION, "0.14.9 TEST.10");
assert.equal(api.BUILD_VERSION, "0.14.9-test.10");
assert.equal(api.SAVE_VERSION, "0.14.3-test.2");
assert.equal(api.SAVE_SCHEMA, 1);
assert.equal(api.preload(), true);
assert.match(styleValues.get("--v0149-atlas"), /^url\("data:image\/png;base64,/);
assert.match(styleValues.get("--v0149-village"), /^url\("data:image\/png;base64,/);
assert.ok(classes.has("v0149-production-art"));
assert.equal(root.dataset.korytoAssets, "ready");
const audit = api.visualAudit();
assert.equal(audit.ready, true);
assert.equal(audit.assets.atlas.parts, 3);
assert.equal(audit.assets.village.parts, 2);
assert.equal(audit.assets.atlas.source, "embedded-png");
assert.equal(audit.assets.scenes.source, "village-crops");
assert.equal(audit.assets.logo.source, "css-pixel-shield");

console.log("v0.14.9 production assets are wired, assembled and offline-safe");
