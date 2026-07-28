import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0167-election-coalition-ui.js');
const css = read('styles/v0167-election-coalition-ui.css');
const app = read('src/app.js');

assert.equal(read('VERSION').trim(), '0.17.1-test.1');
assert.match(html, /0\.17\.1 TEST\.1/);
assert.match(html, /styles\/v0167-election-coalition-ui\.css/);
assert.match(html, /src\/v0167-election-coalition-ui\.js/);
assert.ok(html.indexOf('styles/v0167-election-coalition-ui.css') > html.indexOf('styles/v0166-browser-polish.css'));
assert.ok(html.indexOf('src/v0167-election-coalition-ui.js') > html.indexOf('src/v0166-day-debate-ui.js'));

assert.match(runtime, /VERSION = "0\.16\.7 TEST\.1"/);
assert.match(runtime, /BUILD_VERSION = "0\.16\.7-test\.1"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.match(runtime, /showCoalitionScreen/);
assert.match(runtime, /renderCoalition/);
assert.match(runtime, /showEnding/);
assert.match(runtime, /k167-seat-strip/);
assert.match(runtime, /coalitionContracts/);
assert.match(runtime, /KorytoUI167/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

for (const id of ['coalitionScreen','coalitionPartners','coalitionOfferPanel','coalitionLog','endingScreen','endingTitle','endingStory','finalStats']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(app, /function finishCoalition\(/);
assert.match(app, /function finalizeElection\(/);
assert.match(app, /function showEnding\(/);

assert.match(css, /html\.k167-coalition-active/);
assert.match(css, /html\.k167-ending-active/);
assert.match(css, /\.k167-partner-card/);
assert.match(css, /\.k167-offer/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /safe-area-inset-bottom/);

console.log('v0.16.7 election night and coalition contract passed inside v0.17.1 TEST.1');

