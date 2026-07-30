# Koryto — next session handoff

## Startup order

1. Read `AGENTS.md`.
2. Read `docs/project-status.md`.
3. Read `docs/decisions.md`.
4. Read `docs/v0.20/test8-core-loop.md`.
5. Inspect PR #45 exact head, CI report, review threads, and artifacts.
6. Inspect only the files needed for the requested task.

## Current handoff

- `main` still serves public TEST.7.
- TEST.7 passed technical gates but failed the human fun and agency gate.
- The approved direction is: restore the original strategic core, do not restore the original confusion.
- TEST.8 is implemented on `codex/v0.20.0-clean-test.8-nonlinear-core` in draft PR #45.
- Do not revive or import legacy v0.17 runtime layers.
- Do not merge PR #45 without an explicit user instruction.
- For quest or campaign rules, use `.agents/skills/koryto-quest-designer/`.
- For map and responsive UI changes, use `.agents/skills/koryto-ui-director/`.
- For human feedback classification, use `.agents/skills/koryto-playtest-auditor/`.
- Before delivery, use `.agents/skills/koryto-release-gate/`.

## Next concrete task

1. Resolve every failing PR #45 check on the exact head.
2. Inspect desktop and 390 × 844 screenshot artifacts.
3. Request and address Codex review on the same green SHA.
4. Hand the downloadable TEST.8 artifact to the user without merging.
5. Collect two complete human playthroughs with different staff and final strategy choices.

TEST.8 passes the human gate only when the user confirms that the goal was clear during the first minute, each day required a sacrifice, Věčný changed the plan, and the second run was mechanically different.

## End-of-session maintenance

Update this file only with the next concrete task. Record durable decisions in `docs/decisions.md`, current facts in `docs/project-status.md`, and observed defects or human feedback in `docs/playtest-findings.md` or a versioned playtest record.
