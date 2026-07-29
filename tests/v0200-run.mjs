import {spawnSync} from 'node:child_process';

for (const file of ['tests/v0160-run.mjs', 'tests/v0200-dnd-reset.mjs']) {
  const result = spawnSync(process.execPath, [file], {stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Koryto v0.20.0 TEST.1 suite passed.');
