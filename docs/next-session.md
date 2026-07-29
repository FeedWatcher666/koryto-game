# Koryto — next session handoff

## Startup order

1. Read `AGENTS.md`.
2. Read `docs/project-status.md`.
3. Read `docs/decisions.md`.
4. Read the latest PR #37 comments, CI result, and Codex review.
5. Inspect only the files needed for the requested task.

## Current handoff

- Continue from branch `agent/v0200-clean-rewrite` and draft PR #37.
- TEST.6 is the current human-test candidate.
- Do not revive legacy v0.17 layers.
- Do not merge without explicit instruction.
- For a quest change, use `.agents/skills/koryto-quest-designer/`.
- For build evaluation, use `.agents/skills/koryto-playtest-auditor/`.
- Before delivery, use `.agents/skills/koryto-release-gate/`.

## Next likely task

Collect human feedback from a full **Krysy v JZD** playthrough, classify it by agency, pacing, clarity, humor, and technical stability, then perform a focused TEST.7 polish iteration.

## End-of-session maintenance

Update this file only with the next concrete task. Record durable decisions in `docs/decisions.md`, current facts in `docs/project-status.md`, and defects in `docs/playtest-findings.md`.
