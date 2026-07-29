import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../src/v0200-dnd-rpg-reset.js', import.meta.url), 'utf8');
const hostFix = fs.readFileSync(new URL('../src/v0200-objective-host-fix.js', import.meta.url), 'utf8');
const buildInfo = fs.readFileSync(new URL('../src/build-info.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles/v0200-dnd-rpg-reset.css', import.meta.url), 'utf8');
const legacy = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

for (const attribute of ['charisma','intellect','authority','media','morality','luck']) {
  assert.match(js, new RegExp(`\\b${attribute}\\b`), `missing RPG attribute ${attribute}`);
}
assert.match(js, /d20 \+ atribut proti obtížnosti/);
assert.match(js, /Úspěch za cenu/);
assert.match(js, /Komplikace/);
assert.match(js, /Propiska na řetízku/);
assert.match(js, /Marie Čistá/);
assert.match(js, /Bohumil Tichý/);
assert.match(js, /v0200Objective/);
assert.match(js, /v0200-details-open/);
assert.match(js, /app\(\)\.showEvent\("intro"\)/);
assert.match(hostFix, /#v0165Root:not\(\[hidden\]\) \.k165-shell/);
assert.match(hostFix, /insertAdjacentElement\("afterend", objective\)/);
assert.match(hostFix, /objective\.append\(toggle\)/);
assert.match(hostFix, /v0200ActiveControl/);
assert.match(buildInfo, /src\/v0200-objective-host-fix\.js/);
assert.match(css, /v0200-focus-mode/);
assert.match(css, /v0200-tutorial/);
assert.match(css, /\.v0200-objective > #v0200DetailsToggle/);

for (const preserved of ['function startDebate', 'function finalizeElection', 'function initCoalition', 'function newGame']) {
  assert.ok(legacy.includes(preserved), `legacy campaign system removed: ${preserved}`);
}
for (const script of ['src/app.js','src/v0174-style-stabilization.js']) {
  assert.ok(index.includes(script), `legacy runtime no longer wired: ${script}`);
}

console.log('Koryto v0.20.0 D&D reset contract passed.');
