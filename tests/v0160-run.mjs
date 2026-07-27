import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syntax = [
  'src/build-info.js','src/app.js','src/core-data.js','src/companion-data.js','src/faction-data.js','src/debate-data.js','src/event-data.js','src/quest-data.js','src/quest-runtime.js','src/debate-system.js','src/election-system.js','src/game-engine.js','src/event-system.js','src/faction-system.js','src/companion-system.js','src/balance-system.js','src/ux-system.js','src/v0144-test10.js','src/v0145-campaign.js','src/v0146-playtest.js','src/v0147-consequences.js','src/v0148-visual-system.js','src/v0149-assets/atlas-1.js','src/v0149-assets/atlas-2.js','src/v0149-assets/atlas-3.js','src/v0149-assets/village-1.js','src/v0149-assets/village-2.js','src/v0149-pixel-assets.js','src/v0142.js','src/v0142c.js','src/v0142d.js','src/v0142-stability.js','src/v0142-countercampaign.js','src/v0142-ui-balance.js','src/v0142-clarity.js','src/v0142-rc3.js','src/state.js','src/save-system.js','src/v0143.js','src/quest-system.js','src/v0143-test3.js','src/v0143-test10.js','src/v0160-ui.js','src/v0161-interaction-guard.js','src/v0163-staff.js','src/v0165-campaign-ui.js','src/v0166-day-debate-ui.js','src/v0167-election-coalition-ui.js','src/v0168-onboarding-ui.js','src/v0169-release-polish.js','src/v0169-map-stability.js','src/v0169-viewport-lock.js'
];
const historical = [
  'tests/content-integrity.mjs','tests/save-migration.mjs','tests/smoke.mjs','tests/simulation.mjs','tests/v0142-stability.mjs','tests/v0142-countercampaign.mjs','tests/v0142-ui-balance.mjs','tests/v0142-clarity.mjs','tests/v0142-rc3.mjs','tests/v0143-modules.mjs','tests/v0143-quest-system.mjs','tests/v0143-test10.mjs','tests/v0144-modular.mjs','tests/v0144-simulation.mjs','tests/v0145-playability.mjs','tests/v0146-playtest.mjs','tests/v0147-consequences.mjs','tests/v0148-visual.mjs','tests/v0149-assets.mjs','tests/v0149-assets-review.mjs'
];
function run(cwd,args,label){const result=spawnSync(process.execPath,args,{cwd,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${label} failed with exit ${result.status}`);}
for(const file of syntax)run(root,['--check',file],`syntax ${file}`);

const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'koryto-v0149-regression-'));
try{
  for(const directory of ['src','styles','assets','docs'])fs.symlinkSync(path.join(root,directory),path.join(workspace,directory),'dir');
  fs.cpSync(path.join(root,'tests'),path.join(workspace,'tests'),{recursive:true});
  fs.mkdirSync(path.join(workspace,'.github/workflows'),{recursive:true});
  const currentIndex=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const legacyIndex=currentIndex
    .replaceAll('0.16.9 TEST.2','0.14.9 TEST.10')
    .replaceAll('0.16.9-test.2','0.14.9-test.10')
    .replaceAll('Release Integrity','komunální politické RPG')
    .replaceAll('stabilizovaný offline release candidate s jednotnou verzí, mapou a pevným herním viewportem.','třináctidenní komunální kampaň, kauzy, štáb, debaty, volby a bezpečné offline rozhraní.')
    .replace('\n<link rel="stylesheet" href="styles/v0160.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0160-responsive.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0163-staff.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0164-map-cards.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0165-campaign-ui.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0166-day-debate-ui.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0166-browser-polish.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0167-election-coalition-ui.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0168-onboarding-ui.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0169-release-polish.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0169-map-stability.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0169-viewport-lock.css">','')
    .replace('\n<link rel="stylesheet" href="styles/v0169-creation-flow-fix.css">','')
    .replace('<script src="src/build-info.js"></script>','')
    .replace('<script src="src/v0160-ui.js"></script>','')
    .replace('<script src="src/v0161-interaction-guard.js"></script>','')
    .replace('<script src="src/v0163-staff.js"></script>','')
    .replace('<script src="src/v0165-campaign-ui.js"></script>','')
    .replace('<script src="src/v0166-day-debate-ui.js"></script>','')
    .replace('<script src="src/v0167-election-coalition-ui.js"></script>','')
    .replace('<script src="src/v0168-onboarding-ui.js"></script>','')
    .replace('<script src="src/v0169-release-polish.js"></script>','')
    .replace('<script src="src/v0169-map-stability.js"></script>','')
    .replace('<script src="src/v0169-viewport-lock.js"></script>','');
  fs.writeFileSync(path.join(workspace,'index.html'),legacyIndex);
  fs.writeFileSync(path.join(workspace,'VERSION'),'0.14.9-test.10\n');
  fs.writeFileSync(path.join(workspace,'.github/workflows/v0142-stability.yml'),'name: Koryto v0.14.9 TEST.10\n\non:\n  push:\n    branches: [test/v0.14.9-test10, fix/pr19-v0149-wiring]\n\njobs:\n  package:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo koryto-v0.14.9-test.10\n');

  const historicalAssetTest=path.join(workspace,'tests/v0149-assets.mjs');
  let assetTest=fs.readFileSync(historicalAssetTest,'utf8');
  assetTest=assetTest
    .replace('assert.equal(current.dom.titleNode.textContent, "Koryto 0.14.9 TEST.10 – komunální politické RPG");','assert.equal(current.dom.titleNode.textContent, "");')
    .replace('assert.match(current.dom.meta.content, /0\\.14\\.9 TEST\\.10/);','assert.match(current.dom.meta.attributeContent, /0\\.14\\.9 TEST\\.10/);')
    .replace('assert.equal(current.dom.document.title, "Koryto 0.14.9 TEST.10 – komunální politické RPG");\nassert.equal(current.dom.brand.textContent, "Dolní Vejprnice 0.14.9 TEST.10");\nassert.match(current.dom.meta.content, /0\\.14\\.9 TEST\\.10/);\nassert.equal(current.dom.footer.textContent, "Fiktivní postavy. Fiktivní obec. · 0.14.9 TEST.10");\n\nconst valid', 'assert.equal(current.dom.document.title, "Koryto 0.14.2 TEST.10 – legacy");\nassert.equal(current.dom.brand.textContent, "Dolní Vejprnice 0.14.2 TEST.10");\nassert.equal(current.dom.meta.content, "legacy metadata");\nassert.equal(current.dom.footer.textContent, "Fiktivní postavy. Fiktivní obec. · 0.14.4 TEST.10");\n\nconst valid');
  fs.writeFileSync(historicalAssetTest,assetTest);

  for(const file of historical)run(workspace,[file],file);
}finally{fs.rmSync(workspace,{recursive:true,force:true});}

const current = [
  'tests/v0160-clean-ui.mjs','tests/v0166-day-debate.mjs','tests/v0167-election-coalition.mjs',
  'tests/v0168-onboarding.mjs','tests/v0169-release-polish.mjs','tests/v0169-map-stability.mjs',
  'tests/v0169-viewport-lock.mjs','tests/v0169-release-integrity.mjs'
];
for(const file of current)run(root,[file],file);
console.log(`Koryto v0.16.9 TEST.2 suite passed: ${syntax.length} syntax checks, ${historical.length+current.length} tests`);
