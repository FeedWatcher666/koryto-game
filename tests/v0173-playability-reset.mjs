import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const buildInfo = read("src/build-info.js");
const runtime = read("src/v0173-playability-reset.js");
const styles = read("styles/v0173-playability-reset.css");
const viewportRuntime = read("src/v0169-viewport-lock.js");

assert.equal(read("VERSION").trim(), "0.17.3-test.1", "VERSION identifies v0.17.3");
assert.match(html, /styles\/v0173-playability-reset\.css/, "playability reset CSS is loaded last");
assert.match(html, /src\/v0173-playability-reset\.js/, "playability reset runtime is loaded last");
assert.match(buildInfo, /displayVersion:\s*"0\.17\.3 TEST\.1"/, "display version is current");
assert.match(buildInfo, /buildVersion:\s*"0\.17\.3-test\.1"/, "build version is current");
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/, "save version stays compatible");
assert.match(buildInfo, /saveSchema:\s*1/, "save schema stays compatible");
assert.match(runtime, /KorytoUI173/, "playability audit API is exported");
assert.match(runtime, /coveredPrimaryActions/, "runtime audits navigation overlap");
assert.match(runtime, /nestedScrollers/, "runtime audits accidental nested scrolling");
assert.match(runtime, /nextSurface !== lastSurface/, "only real surface changes return the player to the top");
assert.match(runtime, /KorytoUI172\?\.decorate/, "turn-cost feedback survives map rerenders");
assert.match(runtime, /removeNativeMapTooltips/, "native hotspot tooltips cannot return after map rerenders");
assert.match(styles, /max-width:\s*1180px/, "real notebook width has an explicit layout");
assert.match(styles, /max-height:\s*650px/, "short notebook height has an explicit event layout");
assert.match(styles, /overflow-y:\s*auto\s*!important/, "document scrolling is restored");
assert.match(styles, /\.k168-class-grid[\s\S]*overflow:\s*visible\s*!important/, "candidate cards are not internally clipped");
assert.match(styles, /\.k16-layout[\s\S]*grid-template-columns:\s*220px minmax\(0,\s*1fr\)\s*!important/, "1024px notebook uses a readable two-column map");
assert.match(viewportRuntime, /!html\.classList\.contains\("k173-playability-reset"\)/, "legacy viewport runtime no longer resets the player's scroll");
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i, "no remote runtime dependency");

console.log("v0.17.3 TEST.1 playability reset contract passed");
