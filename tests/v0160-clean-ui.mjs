import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const html = read('index.html');
const css = read('styles/v0160.css');
const responsive = read('styles/v0160-responsive.css');
const runtime = read('src/v0160-ui.js');
const guard = read('src/v0161-interaction-guard.js');
const svg = read('assets/v0160/dolni-vejprnice-map.svg');

assert.equal(read('VERSION').trim(), '0.17.2-test.1');
assert.match(html, /0\.17\.2 TEST\.1/);
assert.match(html, /viewport-fit=cover/);
assert.match(html, /styles\/v0160\.css/);
assert.match(html, /styles\/v0160-responsive\.css/);
assert.match(html, /src\/v0160-ui\.js/);
assert.match(html, /src\/v0161-interaction-guard\.js/);
assert.ok(html.indexOf('styles/v0160.css') > html.indexOf('styles/v0149.css'));
assert.ok(html.indexOf('styles/v0160-responsive.css') > html.indexOf('styles/v0160.css'));
assert.ok(html.indexOf('src/v0160-ui.js') > html.indexOf('src/v0149-pixel-assets.js'));
assert.ok(html.indexOf('src/v0161-interaction-guard.js') > html.indexOf('src/v0160-ui.js'));

assert.match(runtime, /VERSION = "0\.16\.5 TEST\.1"/);
assert.match(runtime, /BUILD_VERSION = "0\.16\.5-test\.1"/);
assert.match(runtime, /SAVE_VERSION = "0\.14\.3-test\.2"/);
assert.match(runtime, /SAVE_SCHEMA = 1/);
assert.doesNotMatch(runtime + guard, /MutationObserver|setInterval\s*\(/);
assert.doesNotMatch(runtime + guard + css + responsive, /https?:\/\//);
assert.doesNotMatch(svg.replace('http://www.w3.org/2000/svg', ''), /https?:\/\//);

assert.match(runtime, /showLocation\?\.\(button\.dataset\.k16Location\)/);
assert.match(runtime, /endDayBtn/);
assert.match(runtime, /KorytoApp\?\.getState/);
assert.match(runtime, /SHORT_LABELS/);
assert.match(runtime, /LOCATION_ICONS/);
assert.match(runtime, /MOBILE_POSITIONS/);
assert.match(runtime, /DESKTOP_NAV/);
assert.match(runtime, /MOBILE_NAV/);
assert.match(runtime, /MORE_NAV/);
assert.match(runtime, /data-k16-more/);
assert.match(runtime, /data-k16-drawer/);
assert.match(runtime, /responsive: true/);
assert.match(runtime, /desktopNavItems/);
assert.match(runtime, /mobileNavItems/);
assert.match(runtime, /mobileDrawerItems/);
assert.match(guard, /stopPropagation/);
assert.match(guard, /v0161InteractionGuard/);
assert.doesNotMatch(guard, /v0162-playtest|playtestRequested|loadPlaytestLayer/);

assert.match(css, /html\.k16-active #app\s*\{[^}]*display:\s*none/s);
assert.match(css, /#v0160Root/);
assert.match(css, /\.k16-hotspot/);
assert.match(css, /\.k16-topbar/);
assert.match(css, /\.k16-bottom/);
assert.match(responsive, /\.k16-bottom-desktop/);
assert.match(responsive, /\.k16-bottom-mobile/);
assert.match(responsive, /\.k16-more-drawer/);
assert.match(responsive, /@media \(max-width: 900px\)/);
assert.match(responsive, /@media \(max-width: 620px\)/);
assert.match(responsive, /@media \(max-width: 390px\)/);
assert.match(responsive, /safe-area-inset-bottom/);
assert.match(responsive, /left:\s*var\(--mx\)/);
assert.match(responsive, /top:\s*var\(--my\)/);
assert.match(responsive, /grid-template-columns:\s*repeat\(5, 1fr\)/);
assert.match(responsive, /min-height:\s*44px/);

assert.match(svg, /viewBox="0 0 1600 1000"/);
assert.doesNotMatch(svg, /<text\b/);
for (const id of ['pub', 'townhall', 'school', 'paper', 'pitch', 'jzd', 'meadow', 'hq']) {
  assert.match(runtime, new RegExp(`${id}: \\[\\d+, \\d+\\]`));
}

console.log('v0.16.5 responsive clean UI subsystem contract passed inside v0.17.2 TEST.1');

