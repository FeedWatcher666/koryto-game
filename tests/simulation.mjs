import assert from 'node:assert/strict';
import { loadGameContext } from './helpers.mjs';

const ctx = loadGameContext();
const before = ctx.runSimulationForTest(8, 1234);
const after = ctx.runSimulationForTest(8, 1234);
assert.deepEqual(after, before, 'same seeded simulation remains deterministic after extraction');
console.log('simulation characterization ok');
