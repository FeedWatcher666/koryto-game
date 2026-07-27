import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const guard = read('src/v0161-interaction-guard.js');
const runtime = read('src/v0169-map-stability.js');
const css = read('styles/v0169-map-stability.css');

assert.equal(read('VERSION').trim(), '0.16.9-test.1');
assert.match(guard, /styles\/v0169-map-stability\.css/);
assert.match(guard, /src\/v0169-map-stability\.js/);
assert.match(guard, /loadMapStabilityLayer/);

assert.match(runtime, /VERSION = "0\.16\.9 MAP STABILITY"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.match(runtime, /target\.ui\.pixelMap = true/);
assert.match(runtime, /removeAttribute\("title"\)/);
assert.match(runtime, /data-k16-settings/);
assert.match(runtime, /data-k163-settings/);
assert.match(runtime, /#pixelToggle/);
assert.match(runtime, /KorytoMapStability169/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

assert.match(css, /aspect-ratio:\s*3 \/ 2/);
assert.match(css, /background-size:\s*100% 100%/);
assert.match(css, /\.k16-map-banner\s*\{[^}]*display:\s*none/s);
assert.match(css, /background:\s*transparent\s*!important/);
assert.match(css, /min-width:\s*44px/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /#pixelToggle\s*\{[^}]*display:\s*none/s);

for (const id of ['pub', 'townhall', 'school', 'paper', 'pitch', 'jzd', 'meadow', 'hq']) {
  assert.match(css, new RegExp(`data-k16-location="${id}"`));
}

console.log('v0.16.9 canonical map geometry and hotspot stability contract passed');
