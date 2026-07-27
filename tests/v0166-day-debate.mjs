import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0166-day-debate-ui.js');
const css = read('styles/v0166-day-debate-ui.css');
const browserPolish = read('styles/v0166-browser-polish.css');

assert.equal(read('VERSION').trim(), '0.16.9-test.1');
assert.match(html, /0\.16\.7 TEST\.1/);
assert.match(html, /styles\/v0166-day-debate-ui\.css/);
assert.match(html, /styles\/v0166-browser-polish\.css/);
assert.match(html, /src\/v0166-day-debate-ui\.js/);
assert.ok(html.indexOf('styles/v0166-day-debate-ui.css') > html.indexOf('styles/v0165-campaign-ui.css'));
assert.ok(html.indexOf('styles/v0166-browser-polish.css') > html.indexOf('styles/v0166-day-debate-ui.css'));
assert.ok(html.indexOf('src/v0166-day-debate-ui.js') > html.indexOf('src/v0165-campaign-ui.js'));

assert.match(runtime, /VERSION = "0\.16\.6 TEST\.1"/);
assert.match(runtime, /BUILD_VERSION = "0\.16\.6-test\.1"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.match(runtime, /#endDayBtn,\[data-k16-end\]/);
assert.match(runtime, /stopImmediatePropagation/);
assert.match(runtime, /data-k166-confirm-day/);
assert.match(runtime, /debateScreen/);
assert.match(runtime, /#debateCards button/);
assert.match(runtime, /showEvent/);
assert.match(runtime, /KorytoUI166/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css + browserPolish, /https?:\/\//);

assert.match(css, /\.k166-day-overlay/);
assert.match(css, /html\.k166-debate-active/);
assert.match(css, /#debateCards \.k166-debate-card/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(browserPolish, /Dolní Vejprnice 0\.16\.9 TEST\.1/);

console.log('v0.16.6 day summary, debate and browser-smoke polish contract passed inside v0.16.9');
