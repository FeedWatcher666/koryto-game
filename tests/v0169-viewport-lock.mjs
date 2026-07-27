import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const guard = read('src/v0161-interaction-guard.js');
const runtime = read('src/v0169-viewport-lock.js');
const css = read('styles/v0169-viewport-lock.css');

assert.equal(read('VERSION').trim(), '0.16.9-test.1');
assert.match(guard, /styles\/v0169-viewport-lock\.css/);
assert.match(guard, /src\/v0169-viewport-lock\.js/);
assert.match(guard, /loadViewportLayer/);

assert.match(runtime, /VERSION = "0\.16\.9 VIEWPORT LOCK"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.match(runtime, /k169-viewport-lock/);
assert.match(runtime, /k169-pregame/);
assert.match(runtime, /dataset\.k169ActiveScreen/);
assert.match(runtime, /KorytoViewportLock169/);
assert.doesNotMatch(runtime, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + css, /https?:\/\//);

assert.match(css, /max-height:\s*100dvh/);
assert.match(css, /overflow:\s*hidden\s*!important/);
assert.match(css, /\.screen\.active/);
assert.match(css, /overscroll-behavior:\s*contain/);
assert.match(css, /\.v0148-shell #v0148Content/);
assert.match(css, /\.k16-shell/);
assert.match(css, /grid-template-rows:\s*auto minmax\(0, 1fr\)/);
assert.match(css, /@media \(min-width: 821px\) and \(max-height: 800px\)/);
assert.match(css, /\.k168-class-card/);
assert.match(css, /\.k166-debate-card/);
assert.match(css, /@media \(max-width: 820px\)/);
assert.match(css, /safe-area-inset-bottom/);

console.log('v0.16.9 fixed-screen viewport and short-display compact mode contract passed');
