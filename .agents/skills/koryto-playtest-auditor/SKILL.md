---
name: koryto-playtest-auditor
description: Playtest and audit Koryto builds, quest branches, UI flows, save/load behavior, mobile layouts, and player agency. Use after a playable change, before handing a build to the user, when screenshots or tester feedback show confusion, or when a quest may contain soft locks, repeated rewards, unreadable choices, weak consequences, or meaningless clicking. Produce reproducible P0–P3 findings, evidence, and focused fixes without confusing automated stability with fun.
---

# Koryto Playtest Auditor

Audit the game through four distinct player lenses and separate technical correctness from play quality.

## Required inputs

Use the exact build or commit, viewport, route, forced-roll sequence when applicable, and expected quest outcome. Never audit an unspecified older artifact.

## Four-pass playtest

1. **Impatient player** — skim text, choose quickly, and verify the objective and next action remain obvious.
2. **Role-player** — make decisions consistent with class, origin, companions, and morality; verify the game recognizes them later.
3. **System breaker** — repeat clicks, reload during results, change party selections, force complications, and try to duplicate rewards or reach impossible state.
4. **Small-mobile player** — use 390×844 or smaller, keyboard navigation where possible, reduced motion, and check overflow, focus, readable dice explanations, and reachable buttons.

## Audit categories

- agency and meaningful choice,
- quest clarity and pacing,
- humor and character response,
- d20 transparency,
- party and item impact,
- rival responsiveness,
- consequence persistence,
- save/load integrity,
- mobile interaction,
- accessibility basics,
- source/offline-build parity.

## Evidence rules

For every defect provide:

- severity,
- exact build or commit,
- starting state,
- reproduction steps,
- expected result,
- actual result,
- screenshot or state snapshot when available,
- smallest credible fix,
- regression test to add.

Do not call a build fun because tests pass. Do not call a visual issue fixed without inspecting the rendered result.

## Output

Start with a verdict: blocked, technically stable but needs play polish, or ready for human feel testing. Then list findings by severity using `references/severity-and-personas.md`. End with the three highest-leverage improvements, not a long wishlist.
