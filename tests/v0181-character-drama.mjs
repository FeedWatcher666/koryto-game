import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const version = read('VERSION').trim();
const loader = read('src/v0180-vertical-slice.js');
const runtime = read('src/v0181-character-drama.js');
const styles = read('styles/v0181-character-drama.css');
const buildInfo = read('src/build-info.js');

assert.equal(version, '0.18.1-test.1');
assert.match(buildInfo, /displayVersion:\s*"0\.18\.1 TEST\.1"/);
assert.match(loader, /v0181-character-drama\.css/);
assert.match(loader, /v0181-character-drama\.js/);
assert.match(runtime, /const META_KEY = 'koryto:v0181:meta'/);
assert.match(runtime, /donor_visit/);
assert.match(runtime, /press_storm/);
assert.match(runtime, /night_recording/);
assert.match(runtime, /veteran_warning/);
assert.match(runtime, /CHOICE_REACTIONS/);
assert.match(runtime, /state\.memories/);
assert.match(runtime, /personEpilogue/);
assert.match(runtime, /completedRuns/);
assert.match(runtime, /unlockAfter:\s*1/);
assert.match(runtime, /Objeveno \$\{meta\.endings\.length\}\/4 konců/);
assert.match(runtime, /KorytoV0181/);
assert.match(styles, /\.k181-dialogue/);
assert.match(styles, /\.k181-ending-screen/);
assert.match(styles, /\.k181-epilogue/);
assert.doesNotMatch(`${loader}\n${runtime}\n${styles}`, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/i);

console.log('v0.18.1 TEST.1 character drama contract passed');
