import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const index = read("index.html");
const buildInfo = read("src/build-info.js");
const visual = read("src/v0170-visual-foundation.js");
const styles = read("styles/v0170-visual-foundation.css");

assert.equal(read("VERSION").trim(), "0.17.0-test.1", "VERSION identifies TEST.1");
assert.match(index, /Koryto 0\.17\.0 TEST\.1/, "HTML contains the visible build identity");
assert.match(index, /styles\/v0170-visual-foundation\.css/, "visual foundation CSS is loaded");
assert.match(index, /src\/v0170-visual-foundation\.js/, "visual foundation JS is loaded");
assert.match(buildInfo, /buildVersion:\s*"0\.17\.0-test\.1"/, "build-info is current");
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/, "save version stays compatible");
assert.match(buildInfo, /saveSchema:\s*1/, "save schema stays compatible");
assert.match(visual, /KorytoUI170/, "visual audit API is exported");
assert.match(visual, /normalizeIcons/, "unsupported emoji are normalized to offline-safe symbols");
assert.doesNotMatch(visual, /MutationObserver|setInterval/, "visual layer does not poll or observe the full DOM");
assert.match(styles, /html\.k170-foundation/, "styles are scoped to the v0.17 root class");
assert.match(styles, /@media\s*\(max-width:\s*620px\)/, "mobile breakpoint is present");
assert.doesNotMatch(`${index}\n${visual}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i, "no remote runtime dependency");

console.log("v0.17.0 TEST.1 visual foundation contract passed");
