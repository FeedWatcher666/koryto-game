import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const buildInfo = read('src/build-info.js');
const legacy = read('src/v0149-pixel-assets.js');
const guard = read('src/v0161-interaction-guard.js');
const release = read('src/v0169-release-polish.js');
const mapRuntime = read('src/v0169-map-stability.js');
const navCss = read('styles/v0169-creation-flow-fix.css');
const workflow = read('.github/workflows/v0142-stability.yml');

assert.equal(read('VERSION').trim(), '0.16.9-test.2');
for (const token of ['0.16.9 TEST.2','0.16.9-test.2','0.14.3-test.2']) assert.match(buildInfo, new RegExp(token.replaceAll('.', '\\.')));
assert.match(buildInfo, /globalThis\.KorytoBuildInfo/);
assert.match(buildInfo, /applyLabels/);
assert.match(html, /<title>Koryto 0\.16\.9 TEST\.2/);
assert.match(html, /data-koryto-build|src\/build-info\.js/);
assert.match(html, /Dolní Vejprnice 0\.16\.9 TEST\.2/);

const productionStyles = [
  'styles/v0168-onboarding-ui.css','styles/v0169-release-polish.css','styles/v0169-map-stability.css',
  'styles/v0169-viewport-lock.css','styles/v0169-creation-flow-fix.css'
];
const productionScripts = [
  'src/v0168-onboarding-ui.js','src/v0169-release-polish.js','src/v0169-map-stability.js','src/v0169-viewport-lock.js'
];
for (const file of [...productionStyles, ...productionScripts]) assert.match(html, new RegExp(file.replaceAll('/', '\\/').replaceAll('.', '\\.')));

assert.doesNotMatch(legacy, /lockCanonicalValue|__v0149Locked_|Object\.defineProperty\(target, property/);
assert.doesNotMatch(legacy, /addEventListener\?\.\("click", canonicalLabels\)|addEventListener\?\.\("change", canonicalLabels\)/);
assert.match(legacy, /globalThis\.KorytoBuildInfo/);
assert.match(release, /globalThis\.KorytoBuildInfo/);

assert.match(guard, /URLSearchParams/);
assert.match(guard, /get\("playtest"\) === "1"/);
assert.doesNotMatch(guard, /loadOnboardingLayer|loadReleasePolishLayer|loadMapStabilityLayer|loadViewportLayer|loadCreationFlowFix/);
assert.match(mapRuntime, /syncLegacyNavigation/);
assert.match(mapRuntime, /\.inert = Boolean\(active\)/);
assert.match(navCss, /html\.k16-active #v0148Nav/);
assert.match(navCss, /html\.k16-active \.k165-bottom/);

assert.match(workflow, /Browser gate on packaged artifact/);
assert.match(workflow, /v0169-browser-gate\.mjs/);
assert.match(workflow, /playwright/);
assert.doesNotMatch(html + buildInfo + guard + release + mapRuntime + navCss, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/);

console.log('v0.16.9 TEST.2 release integrity contract passed');
