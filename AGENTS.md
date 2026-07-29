# Koryto clean rewrite

This repository contains an offline-first browser RPG. The current implementation is intentionally independent from the archived v0.17 runtime.

## Code Review Rules

### Playable state flow

- Flag any reachable scene that can leave the player without a valid enabled action, or any result path that prevents the current quest from continuing. A failed or critical roll may change consequences, but must not soft-lock the campaign.
- Flag scene transitions that allow the same check, reward, rival choice, or quest consequence to be applied more than once through ordinary UI interaction.

### Save and offline runtime

- Flag changes that make a valid current-schema save impossible to load, save a transient rolling state, or create inconsistent state between source modules and the generated offline runtime.
- The playable ZIP must be generated from canonical modules. Do not introduce a hand-maintained runtime bundle or an external network dependency.

### Dice, party, and quest rules

- The kept D20 must be the higher die for advantage and the lower die for disadvantage; critical 1 or 20 is evaluated only from the kept die.
- During Krysy v JZD, preparation must require exactly two valid companions and one valid item before the quest can advance.
- Flag unintended stacking of multiple companions or repeated item effects that contradicts the displayed modifier breakdown.
- Every quest ending must record a durable consequence and remain reachable after complication outcomes.

### Review focus

Prioritize game-breaking regressions, state corruption, incorrect rule resolution, offline-build divergence, missing end-to-end coverage, and mobile interaction blockers. Leave formatting and other deterministic checks to CI.
