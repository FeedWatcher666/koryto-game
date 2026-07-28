import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const buildInfo = read("src/build-info.js");
const runtime = read("src/v0171-decision-hud.js");
const styles = read("styles/v0171-decision-hud.css");

assert.equal(read("VERSION").trim(), "0.17.2-test.1", "VERSION identifies v0.17.1");
assert.match(html, /styles\/v0171-decision-hud\.css/, "decision HUD CSS is loaded");
assert.match(html, /src\/v0171-decision-hud\.js/, "decision HUD runtime is loaded");
assert.match(buildInfo, /displayVersion:\s*"0\.17\.2 TEST\.1"/, "display version is current");
assert.match(buildInfo, /buildVersion:\s*"0\.17\.2-test\.1"/, "build version is current");
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/, "save version stays compatible");
assert.match(buildInfo, /saveSchema:\s*1/, "save schema stays compatible");
assert.match(runtime, /KorytoUI171/, "decision HUD audit API is exported");
assert.match(runtime, /data-k171-choice|dataset\.k171Choice/, "choices receive stable visual numbering");
assert.match(runtime, /aria-label/, "choices receive accessible decision labels");
assert.match(runtime, /data-k171-outcome|dataset\.k171Outcome/, "results receive a consequence tone");
assert.match(runtime, /normalizeOfflineBadges/, "offline navigation and resource badges are normalized");
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/, "runtime does not poll or observe the full DOM");
assert.match(styles, /html\.k171-decision-hud/, "styles are scoped to the v0.17.1 root class");
assert.match(styles, /@media \(min-width: 761px\)/, "desktop decision visibility breakpoint exists");
assert.match(styles, /@media \(max-width: 620px\)/, "mobile decision compaction exists");
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i, "no remote runtime dependency");

console.log("v0.17.2 TEST.1 decision HUD contract passed");
