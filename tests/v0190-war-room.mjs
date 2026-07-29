import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const runtime = read('src/v0190-war-room.js');
const styles = read('styles/v0190-war-room.css');
const buildInfo = read('src/build-info.js');

assert.equal(read('VERSION').trim(), '0.19.0-test.1');
assert.match(html, /Koryto 0\.19\.0 TEST\.1/);
assert.match(html, /styles\/v0190-war-room\.css/);
assert.match(html, /src\/v0190-war-room\.js/);
assert.match(buildInfo, /displayVersion:\s*"0\.19\.0 TEST\.1"/);
assert.match(buildInfo, /saveVersion:\s*"0\.14\.3-test\.2"/);
assert.match(runtime, /const TOTAL_DELEGATES = 15/);
assert.match(runtime, /const MAX_ROUNDS = 6/);
assert.match(runtime, /window\.KorytoWarRoom/);
assert.match(runtime, /resolveIntent\(\)/);
assert.match(runtime, /resolvePressure\(\)/);
assert.match(runtime, /data-card=/);
assert.match(runtime, /data-staff=/);
assert.match(runtime, /Momentum/);
assert.match(runtime, /Kompromat/);
assert.match(runtime, /Opoziční rešerše/);

const cardSection = runtime.match(/const CARDS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
const intentSection = runtime.match(/const INTENTS = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
assert.equal((cardSection.match(/\{ id: '[a-z_]+', title:/g) || []).length, 15, 'contains exactly 15 tactical cards');
assert.equal((intentSection.match(/\{ id: '[a-z_]+', front: '[a-z]+', title:/g) || []).length, 6, 'contains exactly 6 rival intents');

assert.match(styles, /\.k190-hand/);
assert.match(styles, /\.k190-delegates/);
assert.match(styles, /@media \(max-width: 600px\)/);
assert.doesNotMatch(`${html}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i);

console.log('v0.19.0 war room contract passed');
