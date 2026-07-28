import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0168-onboarding-ui.js');
const css = read('styles/v0168-onboarding-ui.css');
const core = read('src/core-data.js');

assert.equal(read('VERSION').trim(), '0.17.2-test.1');
assert.match(html, /0\.17\.2 TEST\.1/);
assert.match(html, /styles\/v0168-onboarding-ui\.css/);
assert.match(html, /src\/v0168-onboarding-ui\.js/);

assert.match(runtime, /VERSION = "0\.16\.8 TEST\.1"/);
assert.match(runtime, /BUILD_VERSION = "0\.16\.8-test\.1"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.match(runtime, /startScreen/);
assert.match(runtime, /creationScreen/);
assert.match(runtime, /data-k168-origin/);
assert.match(runtime, /#classGrid \[data-class\]/);
assert.match(runtime, /heroName/);
assert.match(runtime, /confirmBtn/);
assert.match(runtime, /KorytoUI168/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

for (const id of ['startScreen','startBtn','creationScreen','heroName','origin','classGrid','confirmBtn']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
for (const id of ['bard','rogue','paladin','mage','technocrat','necro']) {
  assert.match(core, new RegExp(`${id}:\\{name:`));
}

assert.match(css, /\.k168-start-shell/);
assert.match(css, /\.k168-creation-shell/);
assert.match(css, /\.k168-candidate-preview/);
assert.match(css, /\.k168-class-card/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(max-width: 820px\)/);
assert.match(css, /safe-area-inset-bottom/);

console.log('v0.16.8 onboarding remains deterministic inside v0.17.2 TEST.1');

