import assert from 'node:assert/strict';
import { readText, loadGameContext } from './helpers.mjs';

const html = readText('index.html');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'DOM IDs must be unique');
assert.ok(html.includes('styles/base.css'), 'index links extracted CSS');
assert.ok(html.includes('src/app.js'), 'index links extracted JS');
assert.equal((html.match(/<style>/g) || []).length, 0, 'no inline style block remains');
assert.equal((html.match(/<script>/g) || []).length, 0, 'no inline script block remains');

const ctx = loadGameContext();
for (const [id, loc] of Object.entries(ctx.locations)) assert.ok(id && loc.name, `location ${id} has required fields`);
for (const ev of Object.values(ctx.events)) assert.ok(ctx.locations[ev.location], `event ${ev.id} references known location ${ev.location}`);
for (const [id, q] of Object.entries(ctx.questDefs)) assert.ok(ctx.locations[q.location], `quest ${id} references known location ${q.location}`);
for (const [id, f] of Object.entries(ctx.factions)) assert.ok(id && f.name, `faction ${id} has required fields`);
for (const [id, c] of Object.entries(ctx.companions)) assert.ok(id && c.name, `companion ${id} has required fields`);
console.log('content integrity ok');
