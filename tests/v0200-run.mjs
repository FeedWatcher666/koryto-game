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
  for (const directory of ['src', 'styles', 'assets', 'docs']) fs.cpSync(path.join(root, directory), path.join(legacyWorkspace, directory), { recursive: true });
  fs.cpSync(path.join(root, 'tests'), path.join(legacyWorkspace, 'tests'), { recursive: true });
  fs.cpSync(path.join(root, '.github'), path.join(legacyWorkspace, '.github'), { recursive: true });

  const legacyIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replaceAll('0.20.0 TEST.1', '0.17.4 TEST.1')
    .replaceAll('0.20.0-test.1', '0.17.4-test.1')
    .replaceAll('Village RPG Reboot', 'Style Stabilization')
    .replaceAll('nový satirický pohybový RPG prototyp s živou obcí, soupeřem a třemi dovednostními minihrami.', 'sjednocený vizuální systém mapy, kauz, štábu, kandidáta a rychlého ovládání.');
  fs.writeFileSync(path.join(legacyWorkspace, 'index.html'), legacyIndex);
  fs.writeFileSync(path.join(legacyWorkspace, 'VERSION'), '0.17.4-test.1\n');

  const buildInfoPath = path.join(legacyWorkspace, 'src/build-info.js');
  fs.writeFileSync(buildInfoPath, fs.readFileSync(buildInfoPath, 'utf8')
    .replaceAll('0.20.0 TEST.1', '0.17.4 TEST.1')
    .replaceAll('0.20.0-test.1', '0.17.4-test.1')
    .replaceAll('Village RPG Reboot', 'Style Stabilization')
    .replaceAll('nový satirický pohybový RPG prototyp s živou obcí, soupeřem a třemi dovednostními minihrami.', 'sjednocený vizuální systém mapy, kauz, štábu, kandidáta a rychlého ovládání.')
    .replace('  installRebootAssets();\n', ''));

  for (const file of ['src/v0200-village-rpg.js', 'styles/v0200-village-rpg.css']) fs.rmSync(path.join(legacyWorkspace, file), { force: true });
  fs.writeFileSync(path.join(legacyWorkspace, 'README.md'), fs.readFileSync(path.join(root, 'README.md'), 'utf8').replaceAll('0.20.0', '0.17.4'));
  fs.writeFileSync(path.join(legacyWorkspace, 'package.json'), JSON.stringify({ scripts: { test: 'node tests/v0160-run.mjs' } }, null, 2));

  const workflowPath = path.join(legacyWorkspace, '.github/workflows/v0142-stability.yml');
  let workflow = fs.readFileSync(workflowPath, 'utf8')
    .replaceAll('0.20.0', '0.17.4')
    .replaceAll('v0200-browser-gate', 'v0174-browser-gate')
    .replaceAll('v0200-village-rpg', 'v0174-style-stabilization')
    .replace('      - agent/v0200-village-rpg-reboot', '      - agent/v0174-style-stabilization');
  workflow = workflow.split('\n').filter((line) => !line.includes('docs/v0.20')).join('\n');
  fs.writeFileSync(workflowPath, workflow);

  run(legacyWorkspace, ['tests/v0160-run.mjs'], 'v0.17.4 compatibility suite');
} finally {
  fs.rmSync(legacyWorkspace, { recursive: true, force: true });
}

run(root, ['--check', 'src/v0200-village-rpg.js'], 'v0.20.0 runtime syntax');
run(root, ['tests/v0200-village-rpg.mjs'], 'v0.20.0 reboot contract');
console.log('Koryto v0.20.0 TEST.1 suite passed with v0.17.4 compatibility coverage');
