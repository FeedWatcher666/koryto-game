import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0200-village-rpg.js');
const styles = read('styles/v0200-village-rpg.css');
const buildInfo = read('src/build-info.js');

assert.equal(read('VERSION').trim(), '0.20.0-test.1');
assert.match(html, /viewport-fit=cover/);
assert.match(buildInfo, /styles\/v0200-village-rpg\.css/);
assert.match(buildInfo, /src\/v0200-village-rpg\.js/);
assert.match(buildInfo, /displayVersion:\s*"0\.20\.0 TEST\.1"/);
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/);
assert.match(runtime, /const TOTAL_VOTERS = 15/);
assert.match(runtime, /const DAYS = 3/);
assert.match(runtime, /function movePlayer/);
assert.match(runtime, /function moveRival/);
assert.match(runtime, /function startTiming/);
assert.match(runtime, /function startMemory/);
assert.match(runtime, /function startPoster/);
assert.match(runtime, /function answerVoter/);
assert.match(runtime, /window\.KorytoReboot/);
assert.match(runtime, /Věčný odchytil/);
assert.equal((runtime.match(/game: '(?:timing|memory|poster)'/g) || []).length, 3, 'three different minigames');
assert.equal((runtime.match(/answer: '(?:order|change|calm)'/g) || []).length, 10, 'ten voter personas');
assert.match(styles, /\.k200-board/);
assert.match(styles, /\.k200-player/);
assert.match(styles, /\.k200-poster-wall/);
assert.match(styles, /@media \(max-width: 760px\)/);
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i);

console.log('v0.20.0 village RPG reboot contract passed');
