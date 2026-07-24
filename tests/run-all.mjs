import { spawnSync } from "node:child_process";

const syntaxFiles = [
  "src/app.js", "src/core-data.js", "src/companion-data.js", "src/faction-data.js",
  "src/debate-data.js", "src/event-data.js", "src/quest-data.js", "src/quest-runtime.js",
  "src/debate-system.js", "src/election-system.js", "src/game-engine.js", "src/event-system.js",
  "src/faction-system.js", "src/companion-system.js", "src/balance-system.js", "src/ux-system.js",
  "src/v0144-test10.js", "src/v0145-campaign.js", "src/v0146-playtest.js",
  "src/v0147-consequences.js", "src/v0148-visual-system.js",
  "src/v0149-assets/atlas-1.js", "src/v0149-assets/atlas-2.js", "src/v0149-assets/atlas-3.js",
  "src/v0149-assets/village-1.js", "src/v0149-assets/village-2.js", "src/v0149-pixel-assets.js",
  "src/v0150-visual-core.js", "src/v0150-visual-shell.js", "src/v0150-visual-content.js",
  "src/v0150-visual-foundation.js", "src/v0151-graphics.js", "src/v0152-reference-match.js",
  "src/v0142.js", "src/v0142c.js", "src/v0142d.js", "src/v0142-stability.js",
  "src/v0142-countercampaign.js", "src/v0142-ui-balance.js", "src/v0142-clarity.js",
  "src/v0142-rc3.js", "src/state.js", "src/save-system.js", "src/v0143.js",
  "src/quest-system.js", "src/v0143-test3.js", "src/v0143-test10.js"
];

const tests = [
  "tests/content-integrity.mjs", "tests/save-migration.mjs", "tests/smoke.mjs",
  "tests/simulation.mjs", "tests/v0142-stability.mjs", "tests/v0142-countercampaign.mjs",
  "tests/v0142-ui-balance.mjs", "tests/v0142-clarity.mjs", "tests/v0142-rc3.mjs",
  "tests/v0143-modules.mjs", "tests/v0143-quest-system.mjs", "tests/v0143-test10.mjs",
  "tests/v0144-modular.mjs", "tests/v0144-simulation.mjs", "tests/v0145-playability.mjs",
  "tests/v0146-playtest.mjs", "tests/v0147-consequences.mjs", "tests/v0148-visual.mjs",
  "tests/v0149-assets-review.mjs", "tests/layered-regressions.mjs",
  "tests/v0152-reference-match.mjs"
];

function run(args, label) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit ${result.status}`);
}

for (const file of syntaxFiles) run(["--check", file], `syntax ${file}`);
for (const file of tests) run([file], file);

console.log(`Koryto layered suite passed: ${syntaxFiles.length} syntax checks, ${tests.length} regression tests`);
