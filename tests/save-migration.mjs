import assert from 'node:assert/strict';
import { loadGameContext, assertKnownVersion } from './helpers.mjs';

const ctx = loadGameContext();
const v13 = { version: '0.13', day: 3, hero: { name: 'Test', classId: 'bard' }, stats: { influence: 12 }, flags: {}, completed: [] };
const migrated13 = ctx.migrateSaveForTest(v13);
assertKnownVersion(migrated13);
assert.equal(migrated13.hero.name, 'Test');
assert.ok(migrated13.worldActions && migrated13.coalition, 'v0.13 save gains v0.14 structures');
const v14 = ctx.migrateSaveForTest(ctx.deep(ctx.baseState));
assertKnownVersion(v14);
assert.ok(v14.rivalAI && v14.companionAmbitions, 'v0.14 save keeps modern structures');
console.log('save migration ok');
