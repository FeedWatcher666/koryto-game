import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const buildInfo = read('src/build-info.js');
const legacy = read('src/v0149-pixel-assets.js');
const guard = read('src/v0161-interaction-guard.js');
const release = read('src/v0169-release-polish.js');
const mapRuntime = read('src/v0169-map-stability.js');
const campaignRuntime = read('src/v0165-campaign-ui.js');
const campaignCss = read('styles/v0165-campaign-ui.css');
const navCss = read('styles/v0169-creation-flow-fix.css');
const playtestDoc = read('docs/v0.16/v0162-playtest.md');
const workflow = read('.github/workflows/v0142-stability.yml');
const visual = read('src/v0170-visual-foundation.js');
const visualCss = read('styles/v0170-visual-foundation.css');
const browserGate = read('tests/v0170-browser-gate.mjs');

assert.equal(read('VERSION').trim(), '0.17.0-test.1');
for (const token of ['0.17.0 TEST.1','0.17.0-test.1','0.14.3-test.2']) assert.match(buildInfo, new RegExp(token.replaceAll('.', '\\.')));
assert.match(buildInfo, /globalThis\.KorytoBuildInfo/);
assert.match(buildInfo, /applyLabels/);
assert.match(buildInfo, /\(\?:\\s\*·\\s\*0/);
assert.match(html, /<title>Koryto 0\.17\.0 TEST\.1/);
assert.match(html, /src\/build-info\.js/);
assert.match(html, /Dolní Vejprnice 0\.17\.0 TEST\.1/);
const staticFooter = html.match(/<div class="footer-note">([^<]*)<\/div>/)?.[1] || '';
assert.doesNotMatch(staticFooter, /0\.17\.0 TEST\.1/);

const productionStyles = [
  'styles/v0168-onboarding-ui.css','styles/v0169-release-polish.css','styles/v0169-map-stability.css',
  'styles/v0169-viewport-lock.css','styles/v0169-creation-flow-fix.css','styles/v0170-visual-foundation.css'
];
const productionScripts = [
  'src/v0168-onboarding-ui.js','src/v0169-release-polish.js','src/v0169-map-stability.js','src/v0169-viewport-lock.js','src/v0170-visual-foundation.js'
];
for (const file of [...productionStyles, ...productionScripts]) assert.match(html, new RegExp(file.replaceAll('/', '\\/').replaceAll('.', '\\.')));

assert.doesNotMatch(legacy, /lockCanonicalValue|__v0149Locked_|Object\.defineProperty\(target, property/);
assert.match(legacy, /globalThis\.KorytoBuildInfo/);
assert.match(release, /globalThis\.KorytoBuildInfo/);
assert.doesNotMatch(guard, /URLSearchParams|playtestRequested|loadPlaytestLayer|v0162-playtest/);
assert.match(playtestDoc, /byl z distribuovaného releasu odstraněn/);

assert.match(campaignRuntime, /suppressLegacyNavigation/);
assert.match(campaignRuntime, /data-k165-disabled-nav/);
assert.match(campaignRuntime, /nav\.inert = true/);
assert.match(campaignRuntime, /aria-hidden/);
assert.match(campaignCss, /html\.k165-active #v0148Nav/);
assert.match(mapRuntime, /k165Active/);
assert.match(mapRuntime, /setNavigationDisabled/);
assert.match(navCss, /html\.k16-active #v0148Nav/);

assert.match(workflow, /Browser gate on packaged artifact/);
assert.match(workflow, /v0170-browser-gate\.mjs/);
assert.match(workflow, /0\.17\.0-test\.1/);
assert.match(browserGate, /complete save\/load roundtrip state/);
assert.match(visual, /KorytoUI170/);
assert.match(visual, /data-k170-surface|dataset\.k170Surface/);
assert.match(visualCss, /html\.k170-foundation/);
assert.doesNotMatch(visual, /MutationObserver|setInterval\s*\(/);
assert.match(browserGate, /auditSurface\('event'\)/);
assert.match(browserGate, /auditSurface\('result'\)/);
assert.match(browserGate, /auditSurface\('location'\)/);
assert.match(browserGate, /auditSurface\('map'\)/);
assert.match(browserGate, /footer version exactly once/);
assert.match(browserGate, /\?playtest=1/);
assert.doesNotMatch(html + buildInfo + guard + release + mapRuntime + campaignRuntime + campaignCss + navCss + visual + visualCss, /https?:\/\/(?:fonts|cdn|unpkg|jsdelivr)/);

console.log('v0.17.0 TEST.1 release integrity closure contract passed');

