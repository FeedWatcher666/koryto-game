import {spawnSync} from 'node:child_process';

const result = spawnSync(process.execPath, ['tests/v0200-dnd-reset.mjs'], {stdio: 'inherit'});
if (result.status !== 0) process.exit(result.status || 1);

console.log('Koryto v0.20.0 TEST.1 current-tree suite passed.');
