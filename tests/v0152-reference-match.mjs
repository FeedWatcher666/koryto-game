import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const runtime151 = read("src/v0151-graphics.js");
const runtime152 = read("src/v0152-reference-match.js");
const css151 = read("styles/v0151.css");
const css152 = read("styles/v0152.css");
const readme = read("README.md");
const workflow = read(".github/workflows/v0142-stability.yml");

assert.equal(read("VERSION").trim(), "0.15.2-test.1");
assert.match(html, /Koryto 0\.15\.2 TEST\.1/);
assert.match(html, /styles\/v0151\.css/);
assert.match(html, /styles\/v0152\.css/);
assert.match(html, /src\/v0151-graphics\.js/);
assert.match(html, /src\/v0152-reference-match\.js/);
assert.ok(html.indexOf("styles/v0152.css") > html.indexOf("styles/v0151.css"), "v0.15.2 CSS must follow v0.15.1");
assert.ok(html.indexOf("src/v0152-reference-match.js") > html.indexOf("src/v0151-graphics.js"), "v0.15.2 runtime must follow v0.15.1");
assert.match(runtime152, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime152, /SAVE_SCHEMA = 1/);
assert.doesNotMatch(runtime151 + runtime152, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime151 + runtime152 + css151 + css152, /https?:\/\//);

for (const token of [
  "--v152-map", "--v152-event", "--v152-debate", "--v152-coalition",
  "v0152-map-hotspot", "v0152-staff-reference", "v0152-event-reference",
  "v0152-debate-reference", "v0152-coalition-reference"
]) assert.ok(css152.includes(token) || runtime152.includes(token), `missing ${token}`);

const assetFiles = [
  "assets/v0152/map.webp", "assets/v0152/staff.webp", "assets/v0152/event.webp",
  "assets/v0152/debate.webp", "assets/v0152/coalition.webp",
  "assets/v0151/portrait-brazda.webp", "assets/v0151/portrait-candidate.webp",
  "assets/v0151/portrait-daniela.webp", "assets/v0151/portrait-bohumil.webp",
  "assets/v0151/portrait-holub.webp"
];
for (const file of assetFiles) {
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.length > 1000, `${file} is unexpectedly small`);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${file} is not WebP/RIFF`);
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${file} is not WebP`);
  const leaf = file.replace("assets/v0151/", "");
  assert.ok(runtime151.includes(leaf) || runtime152.includes(file), `${file} is not referenced`);
}

for (const location of ["pub", "townhall", "school", "paper", "pitch", "jzd", "meadow", "hq"]) {
  assert.match(runtime152, new RegExp(`${location}\\s*:\\s*\\[\\d+\\s*,\\s*\\d+\\]`), `missing hotspot ${location}`);
}
assert.match(readme, /Reference Match Pass/);
assert.match(readme, /Rollback/);
assert.match(workflow, /Koryto v0\.15\.2 TEST\.1/);
assert.match(workflow, /koryto-v0\.15\.2-test\.1/);

const classList = () => {
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
const root = { classList: classList(), dataset: {}, style: { setProperty() {} } };
const document = {
  title: "",
  documentElement: root,
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};
const sandbox = { console, document, location: { search: "" }, setTimeout(fn) { fn(); return 1; }, clearTimeout() {} };
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(runtime152, sandbox, { filename: "src/v0152-reference-match.js" });
assert.equal(sandbox.KorytoReferenceMatch152.VERSION, "0.15.2 TEST.1");
assert.equal(sandbox.KorytoReferenceMatch152.BUILD_VERSION, "0.15.2-test.1");
assert.equal(sandbox.KorytoReferenceMatch152.SAVE_VERSION, "0.14.3-test.2");
assert.equal(sandbox.KorytoReferenceMatch152.SAVE_SCHEMA, 1);
assert.equal(root.classList.contains("v0152-reference-match"), true);
assert.equal(sandbox.KorytoReferenceMatch152.visualAudit().assets, 11);

console.log("v0.15.2 reference match contract passed: live DOM controls, local WebP scenes, safe save contract");
