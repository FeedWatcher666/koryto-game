import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const html = read("index.html");
const buildInfo = read("src/build-info.js");
const runtime = read("src/v0174-style-stabilization.js");
const styles = read("styles/v0174-style-stabilization.css");

assert.equal(read("VERSION").trim(), "0.17.4-test.1", "VERSION identifies v0.17.4");
assert.match(html, /document\.documentElement\.classList\.add\("k174-style-stabilization"\)/, "style root class is installed before first paint");
assert.match(html, /styles\/v0174-style-stabilization\.css/, "style stabilization CSS is loaded last");
assert.match(html, /src\/v0174-style-stabilization\.js/, "style stabilization runtime is loaded last");
assert.match(buildInfo, /displayVersion:\s*"0\.17\.4 TEST\.1"/, "display version is current");
assert.match(buildInfo, /buildVersion:\s*"0\.17\.4-test\.1"/, "build version is current");
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/, "save version stays compatible");
assert.match(buildInfo, /saveSchema:\s*1/, "save schema stays compatible");
assert.match(runtime, /KorytoUI174/, "style audit API is exported");
assert.match(runtime, /MutationObserver\(queueSync\)/, "legacy rerenders are reconciled in a microtask observer");
assert.match(runtime, /queueMicrotask/, "style reconciliation does not wait for a visible timeout");
assert.match(runtime, /dataset\.k174Surface/, "active surface is marked centrally");
assert.match(runtime, /k-ui-panel/, "shared panel semantics are applied");
assert.match(runtime, /k-ui-button/, "shared button semantics are applied");
assert.match(runtime, /horizontalOverflow/, "runtime audits horizontal overflow");
assert.match(runtime, /topbar:\s*box/, "runtime audits shared HUD geometry");
assert.match(runtime, /navigation:\s*box/, "runtime audits shared navigation geometry");
assert.match(styles, /--k-bg-page:/, "shared design tokens are defined");
assert.match(styles, /--k-success:/, "shared action colors are defined");
assert.match(styles, /\.k-ui-panel/, "shared panel component is styled");
assert.match(styles, /\.k-ui-button--primary/, "shared primary action is styled");
assert.match(styles, /\.k163-title[\s\S]*background:\s*linear-gradient/, "staff title uses the shared wood hierarchy");
assert.match(styles, /\.k165-detail-copy[\s\S]*background:/, "case detail is migrated to the shared material system");
assert.match(styles, /\.k169-panel[\s\S]*background:\s*linear-gradient/, "quick controls use the game material system");
assert.match(styles, /transition:\s*none/, "layout-critical surfaces cannot tween between legacy shapes");
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i, "no remote runtime dependency");

console.log("v0.17.4 TEST.1 style stabilization contract passed");
