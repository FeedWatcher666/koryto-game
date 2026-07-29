import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function run(cwd, args, label) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit ${result.status}`);
}

const legacyWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'koryto-v0174-compat-'));
try {
  fs.cpSync(path.join(root, 'src'), path.join(legacyWorkspace, 'src'), { recursive: true });
  for (const directory of ['styles', 'assets', 'docs']) fs.symlinkSync(path.join(root, directory), path.join(legacyWorkspace, directory), 'dir');
  fs.cpSync(path.join(root, 'tests'), path.join(legacyWorkspace, 'tests'), { recursive: true });
  fs.cpSync(path.join(root, '.github'), path.join(legacyWorkspace, '.github'), { recursive: true });

  const legacyIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replaceAll('0.18.0 TEST.1', '0.17.4 TEST.1')
    .replaceAll('0.18.0-test.1', '0.17.4-test.1')
    .replaceAll('Vertical Slice Reset', 'Style Stabilization')
    .replaceAll('první skutečný vertikální řez politického RPG s jasnými volbami, vztahy, dluhy a následky.', 'sjednocený vizuální systém mapy, kauz, štábu, kandidáta a rychlého ovládání.')
    .replace('\n<link rel="stylesheet" href="styles/v0180-vertical-slice.css">', '')
    .replace('<script src="src/v0180-vertical-slice.js"></script>', '');
  fs.writeFileSync(path.join(legacyWorkspace, 'index.html'), legacyIndex);
  fs.writeFileSync(path.join(legacyWorkspace, 'VERSION'), '0.17.4-test.1\n');

  const buildInfoPath = path.join(legacyWorkspace, 'src/build-info.js');
  fs.writeFileSync(buildInfoPath, fs.readFileSync(buildInfoPath, 'utf8')
    .replaceAll('0.18.0 TEST.1', '0.17.4 TEST.1')
    .replaceAll('0.18.0-test.1', '0.17.4-test.1')
    .replaceAll('Vertical Slice Reset', 'Style Stabilization')
    .replaceAll('první skutečný vertikální řez politického RPG s jasnými volbami, vztahy, dluhy a následky.', 'sjednocený vizuální systém mapy, kauz, štábu, kandidáta a rychlého ovládání.'));
  fs.rmSync(path.join(legacyWorkspace, 'src/v0180-vertical-slice.js'), { force: true });
  fs.writeFileSync(path.join(legacyWorkspace, 'README.md'), fs.readFileSync(path.join(root, 'README.md'), 'utf8').replaceAll('0.18.0', '0.17.4'));
  fs.writeFileSync(path.join(legacyWorkspace, 'package.json'), JSON.stringify({ scripts: { test: 'node tests/v0160-run.mjs' } }, null, 2));

  const workflowPath = path.join(legacyWorkspace, '.github/workflows/v0142-stability.yml');
  const legacyWorkflow = fs.readFileSync(workflowPath, 'utf8')
    .replaceAll('0.18.0', '0.17.4')
    .replaceAll('v0180-browser-gate', 'v0174-browser-gate')
    .replaceAll('v0180-vertical-slice', 'v0174-style-stabilization')
    .replace('      - agent/v0180-vertical-slice', '      - agent/v0174-style-stabilization');
  fs.writeFileSync(workflowPath, legacyWorkflow);
  run(legacyWorkspace, ['tests/v0160-run.mjs'], 'v0.17.4 compatibility suite');
} finally {
  fs.rmSync(legacyWorkspace, { recursive: true, force: true });
}
run(root, ['--check', 'src/v0180-vertical-slice.js'], 'v0.18.0 runtime syntax');
run(root, ['tests/v0180-vertical-slice.mjs'], 'v0.18.0 contract');
console.log('Koryto v0.18.0 TEST.1 suite passed with v0.17.4 compatibility coverage');
