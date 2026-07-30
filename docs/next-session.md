# Koryto — next session handoff

## Startup order

1. Read `AGENTS.md`.
2. Read `docs/project-status.md`.
3. Read `docs/decisions.md`.
4. Read `docs/v0.20/test8-redesign-brief.md`.
5. Inspect PR #45 exact head, CI report, review threads and artifacts.
6. Inspect only the files needed for the requested task.

## Current handoff

- `main` still serves public TEST.7.
- TEST.7 failed as linear and not fun.
- The first TEST.8 implementation also failed the human gate: no fun, no felt sacrifice, unclear rival impact and unclear strategy difference.
- TEST.8 is being redesigned on `codex/v0.20.0-clean-test.8-nonlinear-core` in draft PR #45.
- The current redesign makes one skipped opportunity a permanent sacrifice each day, lets Věčný block the following board, and moves doctrine selection before day two.
- Public, legal and worker doctrine now expose exclusive actions, distinct gates and two final tactics.
- Save schema is 4 under `koryto.clean.v0200.test8`.
- Do not revive or import legacy v0.17 runtime layers.
- Do not merge PR #45 without an explicit user instruction.
- Codex review remains unavailable until the connected account's code-review limit resets.

## Next concrete task

1. Resolve every failing PR #45 check on the exact redesign head.
2. Inspect desktop and 390 × 844 mutation screenshots.
3. Verify the offline playtest export contains the exact build SHA, three sacrifices, board mutations, doctrine and tactic.
4. Keep the PR draft and hand the artifact to the user for one focused human playthrough.
5. Ask only whether the user can name the sacrifice, Věčný's board change, the mechanical doctrine difference and whether the result was fun.

Do not expand campaign breadth or apply cosmetic polish before this human gate passes.

## End-of-session maintenance

Update this file only with the next concrete task. Record durable decisions in `docs/decisions.md`, current facts in `docs/project-status.md`, and observed defects or human feedback in `docs/playtest-findings.md` or a versioned playtest record.
