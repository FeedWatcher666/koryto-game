import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0169-map-stability.js');
const css = read('styles/v0169-map-stability.css');
const creationCss = read('styles/v0169-creation-flow-fix.css');
const campaignRuntime = read('src/v0165-campaign-ui.js');
const campaignCss = read('styles/v0165-campaign-ui.css');

assert.equal(read('VERSION').trim(), '0.16.9-test.3');
assert.match(html, /styles\/v0169-map-stability\.css/);
assert.match(html, /src\/v0169-map-stability\.js/);
assert.match(runtime, /globalThis\.KorytoBuildInfo/);
assert.match(runtime, /target\.ui\.pixelMap = true/);
assert.match(runtime, /removeAttribute\("title"\)/);
assert.match(runtime, /syncLegacyNavigation/);
assert.match(runtime, /setNavigationDisabled/);
assert.match(runtime, /k165Active/);
assert.match(runtime, /data-k169-disabled-nav/);
assert.match(runtime, /data-k16-settings/);
assert.match(runtime, /data-k163-settings/);
assert.match(runtime, /#pixelToggle/);
assert.match(runtime, /KorytoMapStability169/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

assert.match(campaignRuntime, /suppressLegacyNavigation/);
assert.match(campaignRuntime, /data-k165-disabled-nav/);
assert.match(campaignCss, /html\.k165-active #v0148Nav/);
assert.match(css, /aspect-ratio:\s*3 \/ 2/);
assert.match(css, /background-size:\s*100% 100%/);
assert.match(css, /\.k16-map-banner\s*\{[^}]*display:\s*none/s);
assert.match(css, /background:\s*transparent\s*!important/);
assert.match(css, /min-width:\s*44px/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /#pixelToggle\s*\{[^}]*display:\s*none/s);
assert.match(creationCss, /html\.k16-active #v0148Nav/);
assert.match(creationCss, /html\.k16-active \.k165-bottom/);

for (const id of ['pub', 'townhall', 'school', 'paper', 'pitch', 'jzd', 'meadow', 'hq']) {
  assert.match(css, new RegExp(`data-k16-location="${id}"`));
}

console.log('v0.16.9 TEST.3 canonical map and cross-surface navigation contract passed');
