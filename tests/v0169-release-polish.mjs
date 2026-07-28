import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const buildInfo = read('src/build-info.js');
const runtime = read('src/v0169-release-polish.js');
const css = read('styles/v0169-release-polish.css');
const browserPolish = read('styles/v0166-browser-polish.css');

assert.equal(read('VERSION').trim(), '0.17.3-test.1');
assert.match(html, /src\/build-info\.js/);
assert.match(html, /styles\/v0169-release-polish\.css/);
assert.match(html, /src\/v0169-release-polish\.js/);
assert.match(buildInfo, /displayVersion:\s*"0\.17\.3 TEST\.1"/);
assert.match(buildInfo, /buildVersion:\s*"0\.17\.3-test\.1"/);
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/);
assert.match(buildInfo, /saveSchema:\s*1/);
assert.match(runtime, /globalThis\.KorytoBuildInfo/);
assert.match(runtime, /data-k169-action="save"/);
assert.match(runtime, /data-k169-action="load"/);
assert.match(runtime, /data-k169-pref="largeText"/);
assert.match(runtime, /data-k169-pref="highContrast"/);
assert.match(runtime, /data-k169-pref="reducedMotion"/);
assert.match(runtime, /Alt \+ S/);
assert.match(runtime, /focusActiveSurface/);
assert.match(runtime, /KorytoUI169/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

assert.match(css, /\.k169-skip/);
assert.match(css, /\.k169-utility/);
assert.match(css, /html\.k169-large-text/);
assert.match(css, /html\.k169-high-contrast/);
assert.match(css, /html\.k169-reduced-motion/);
assert.match(css, /:focus-visible/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /@media \(max-width: 390px\)/);
assert.match(css, /safe-area-inset-bottom/);
assert.doesNotMatch(browserPolish, /0\.16\.9 TEST\.1|0\.14\.9 TEST\.10/);

console.log('v0.17.3 TEST.1 release polish uses the canonical build contract');
