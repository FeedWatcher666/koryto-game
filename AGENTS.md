# Koryto clean rewrite

This repository contains an offline-first browser RPG. The current implementation is intentionally independent from the archived v0.17 runtime.

## Startup chain

Before changing code, read only the smallest useful context in this order:

1. `docs/project-status.md`
2. `docs/decisions.md`
3. `docs/next-session.md`
4. the relevant module, quest, test, or repo-local skill

Use:

- `.agents/skills/koryto-quest-designer/` for quest design or revision,
- `.agents/skills/koryto-playtest-auditor/` for playable-build evaluation,
- `.agents/skills/koryto-release-gate/` before presenting a build.

Do not scan archives or old branches unless the task explicitly needs design reference material.

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

Prioritize game-breaking regressions, state corruption, incorrect rule resolution, offline-build divergence, missing end-to-end coverage, accessibility regressions, and mobile interaction blockers. Leave formatting and other deterministic checks to CI.

## Mandatory delivery loop

For every meaningful build:

1. inspect the diff,
2. run unit and syntax checks,
3. generate and verify the offline build,
4. run packaged browser, accessibility, and quality gates,
5. inspect rendered evidence,
6. request Codex review on the exact green head SHA,
7. fix P0–P2 findings,
8. rerun the full gate and request a fresh Codex review.

Never claim a review or playtest happened when it did not. Never merge without explicit user instruction.
