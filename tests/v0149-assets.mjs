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

const atlasParts = chunkSpecs.filter(([, kind]) => kind === "atlas").map(([path, kind]) => chunkPayload(path, kind));
const villageParts = chunkSpecs.filter(([, kind]) => kind === "village").map(([path, kind]) => chunkPayload(path, kind));
const atlasBase64 = atlasParts.join("");
const villageBase64 = villageParts.join("");
const atlasBytes = Buffer.from(atlasBase64, "base64");

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
assert.ok(positions.every((value, index) => value >= 0 && (index === 0 || value > positions[index - 1])), "chunks must load before the v0.14.9 runtime");

for (const token of [
  ".v0149-assets-fallback",
  "#11100d",
  "#211e18",
  "#2c281f",
  "#d8aa38",
  "#e9dfc7",
  "#f4ecd9",
  "#514936",
  "v0149-village-map",
  "v0149-location-node",
  "prefers-reduced-motion",
  "focus-visible"
]) assert.ok(css.includes(token), `missing CSS contract token ${token}`);

assert.match(runtime, /validatePngBase64/);
assert.match(runtime, /crc32/);
assert.match(runtime, /IHDR/);
assert.match(runtime, /IDAT/);
assert.match(runtime, /IEND/);
assert.match(runtime, /KorytoCanonicalBuild149/);
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
  const brand = { textContent: "" };
  const meta = { content: "", setAttribute(name, value) { if (name === "content") this.attributeContent = value; } };
  const titleNode = { textContent: "" };
  const root = {
    style: {
      setProperty(name, value) { styleValues.set(name, value); },
      getPropertyValue(name) { return styleValues.get(name) || ""; }
    },
    dataset: {},
    classList: rootClassList
  };
  const document = {
    title: "",
    documentElement: root,
    body: { appendChild() {} },
    head: { appendChild() {} },
    querySelector(selector) {
      if (selector === "title") return titleNode;
      if (selector === ".brand h1 span") return brand;
      if (selector === 'meta[name="description"]') return meta;
      return null;
    },
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
  return { document, root, brand, meta, titleNode, styleValues, rootClassList };
}

function runRuntime(chunks) {
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
  context.KorytoAssetChunks149 = chunks;
  vm.runInContext(runtime, context, { filename: "src/v0149-pixel-assets.js" });
  return { context, dom, api: context.KorytoPixelAssets149 };
}

const current = runRuntime({ atlas: atlasParts, village: villageParts, scenes: [], logo: [] });
assert.ok(current.api, "v0.14.9 API must be installed even in fallback mode");
assert.equal(current.api.VERSION, "0.14.9 TEST.10");
assert.equal(current.api.BUILD_VERSION, "0.14.9-test.10");
assert.equal(current.api.SAVE_VERSION, "0.14.3-test.2");
assert.equal(current.api.SAVE_SCHEMA, 1);
assert.equal(current.api.preload(), false);

const currentAudit = current.api.visualAudit();
assert.equal(currentAudit.validation.atlas.ok, true, currentAudit.validation.atlas.reason);
assert.equal(currentAudit.validation.atlas.width, 1024);
assert.equal(currentAudit.validation.atlas.height, 1024);
assert.equal(currentAudit.validation.village.ok, false, "the bundled village payload is intentionally quarantined until replaced");
assert.match(currentAudit.validation.village.reason, /^truncated-/);
assert.equal(currentAudit.assetsReady, false);
assert.equal(current.dom.rootClassList.contains("v0149-assets-fallback"), true);
assert.equal(current.dom.rootClassList.contains("v0149-production-art"), false);
assert.equal(current.dom.styleValues.get("--v0149-atlas"), "none");
assert.equal(current.dom.document.title, "Koryto 0.14.9 TEST.10 – komunální politické RPG");
assert.equal(current.dom.titleNode.textContent, "Koryto 0.14.9 TEST.10 – komunální politické RPG");
assert.equal(current.dom.brand.textContent, "Dolní Vejprnice 0.14.9 TEST.10");
assert.match(current.dom.meta.content, /0\.14\.9 TEST\.10/);
current.dom.document.title = "Koryto 0.14.2 TEST.10 – legacy";
current.dom.brand.textContent = "Dolní Vejprnice 0.14.2 TEST.10";
current.dom.meta.content = "legacy metadata";
assert.equal(current.dom.document.title, "Koryto 0.14.9 TEST.10 – komunální politické RPG");
assert.equal(current.dom.brand.textContent, "Dolní Vejprnice 0.14.9 TEST.10");
assert.match(current.dom.meta.content, /0\.14\.9 TEST\.10/);

const valid = runRuntime({ atlas: [atlasBase64], village: [atlasBase64], scenes: [], logo: [] });
assert.equal(valid.api.validatePngBase64(atlasBase64).ok, true);
assert.equal(valid.api.preload(), false, "valid PNGs remain quarantined until the art direction is approved");
assert.equal(valid.api.ART_DIRECTION_APPROVED, false);
assert.equal(valid.api.visualAudit().fallbackReason, "art-direction-not-approved");
assert.equal(valid.dom.rootClassList.contains("v0149-production-art"), false);
assert.equal(valid.dom.rootClassList.contains("v0149-assets-fallback"), true);
assert.equal(valid.api.atlas, "");
assert.equal(valid.dom.styleValues.get("--v0149-atlas"), "none");

const prefixAndZeros = Buffer.concat([atlasBytes.subarray(0, 8), Buffer.alloc(64)]).toString("base64");
assert.equal(valid.api.validatePngBase64(prefixAndZeros).ok, false, "PNG prefix alone must not enable art");

const truncatedIdat = atlasBytes.subarray(0, atlasBytes.length - 20).toString("base64");
assert.equal(valid.api.validatePngBase64(truncatedIdat).ok, false, "truncated IDAT/IEND must fail");

const badCrcBytes = Buffer.from(atlasBytes);
badCrcBytes[64] ^= 1;
const badCrc = valid.api.validatePngBase64(badCrcBytes.toString("base64"));
assert.equal(badCrc.ok, false);
assert.match(badCrc.reason, /^crc-/);

const missingIend = atlasBytes.subarray(0, atlasBytes.length - 12).toString("base64");
assert.equal(valid.api.validatePngBase64(missingIend).reason, "missing-iend");

function pngChunks(bytes) {
  const chunks = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    chunks.push({ type: bytes.subarray(offset + 4, offset + 8).toString("ascii"), bytes: bytes.subarray(offset, end) });
    offset = end;
  }
  return chunks;
}
const chunks = pngChunks(atlasBytes);
const reordered = Buffer.concat([
  atlasBytes.subarray(0, 8),
  chunks.find(chunk => chunk.type === "IDAT").bytes,
  chunks.find(chunk => chunk.type === "IHDR").bytes,
  chunks.find(chunk => chunk.type === "IEND").bytes
]).toString("base64");
assert.equal(valid.api.validatePngBase64(reordered).reason, "ihdr-not-first");

const incomplete = runRuntime({ atlas: atlasParts.slice(0, 2), village: [atlasBase64], scenes: [], logo: [] });
assert.equal(incomplete.api.preload(), false);
assert.equal(incomplete.dom.rootClassList.contains("v0149-assets-fallback"), true);
assert.equal(incomplete.dom.rootClassList.contains("v0149-production-art"), false);

console.log(`v0.14.9 safe fallback ok: atlas ${atlasBytes.length} B valid, village quarantined (${currentAudit.validation.village.reason})`);
