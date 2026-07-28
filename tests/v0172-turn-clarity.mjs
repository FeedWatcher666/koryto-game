import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const buildInfo = read("src/build-info.js");
const runtime = read("src/v0172-turn-clarity.js");
const styles = read("styles/v0172-turn-clarity.css");

assert.equal(read("VERSION").trim(), "0.17.3-test.1", "VERSION identifies v0.17.2");
assert.match(html, /styles\/v0172-turn-clarity\.css/, "turn clarity CSS is loaded");
assert.match(html, /src\/v0172-turn-clarity\.js/, "turn clarity runtime is loaded");
assert.match(buildInfo, /displayVersion:\s*"0\.17\.3 TEST\.1"/, "display version is current");
assert.match(buildInfo, /buildVersion:\s*"0\.17\.3-test\.1"/, "build version is current");
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/, "save version stays compatible");
assert.match(buildInfo, /saveSchema:\s*1/, "save schema stays compatible");
assert.match(runtime, /KorytoUI172/, "turn clarity audit API is exported");
assert.match(runtime, /decorateDaySummary/, "existing day confirmation receives the exact early-end penalty");
assert.match(runtime, /data-k172-availability|dataset\.k172Availability/, "choice availability is explicit");
assert.match(runtime, /data-k172-impact|dataset\.k172Impact/, "result impacts are classified");
assert.match(runtime, /SPOTŘEBOVAT 1 AKCI/, "result continuation states its action cost");
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/, "runtime does not poll or observe the full DOM");
assert.match(styles, /html\.k172-turn-clarity/, "styles are scoped to the v0.17.2 root class");
assert.match(styles, /@media \(max-width: 620px\)/, "mobile turn clarity breakpoint exists");
assert.match(styles, /\.k172-day-warning/, "day confirmation warning is styled");
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i, "no remote runtime dependency");

console.log("v0.17.3 TEST.1 turn clarity contract passed");
