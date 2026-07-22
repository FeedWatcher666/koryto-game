# Codex task: v0.14.1 – modular refactor without gameplay changes

## Goal

Split the current single-file Koryto v0.14 build into maintainable static web modules while preserving behavior, saved-game compatibility and offline execution.

## Non-goals

- no new gameplay,
- no balance changes,
- no content removal,
- no redesign of screens,
- no external framework unless strictly necessary,
- no backend or database.

## Required target structure

```text
index.html
src/
  app.js
  state.js
  save-system.js
  events.js
  quests.js
  factions.js
  companions.js
  debate.js
  elections.js
  coalition.js
  ui.js
data/
  events.json
  characters.json
  factions.json
  locations.json
styles/
  base.css
  layout.css
  components.css
  pixel-ui.css
tests/
  smoke.mjs
  content-integrity.mjs
  save-migration.mjs
  simulation.mjs
```

Equivalent structure is acceptable when justified in the PR.

## Acceptance criteria

1. Current v0.14 behavior remains materially unchanged.
2. The game runs from static files without a build server.
3. Existing v0.13 and v0.14 saves load successfully.
4. Event, character, location and faction references pass integrity checks.
5. No duplicate DOM IDs.
6. A smoke test covers: new game, character creation, map, one quest, debate initialization, election calculation and coalition initialization.
7. Simulation output is compared before and after refactor with documented tolerances.
8. `npm test` or one documented command runs all checks.
9. The PR includes a migration note and list of intentionally unchanged systems.
10. Do not merge automatically.

## Work sequence

1. Inspect and document the original v0.14 architecture.
2. Add characterization tests before moving code.
3. Extract CSS without changing selectors or layout behavior.
4. Extract JavaScript by domain.
5. Extract stable content data only after behavior tests pass.
6. Verify save migration.
7. Run simulations and compare distributions.
8. Open a draft PR with results, risks and screenshots.

## Special caution

The game currently embeds the first pixel-art map layer. Preserve the ability to toggle that layer. Do not make the game dependent on remote images or CDN resources.