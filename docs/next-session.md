# Koryto — next session handoff

## Startup order

1. Read `AGENTS.md`.
2. Read `docs/project-status.md`.
3. Read `docs/decisions.md`.
4. Read the latest `main` CI result, Pages deployment, and any remaining PR #37 review context.
5. Inspect only the files needed for the requested task.

## Current handoff

- Continue from the green `main` commit after PR #37.
- TEST.7 is the current public human-test candidate after the scene-priority repair.
- Do not revive legacy v0.17 layers.
- Do not open a new content branch until the public tester is verified.
- For a quest change, use `.agents/skills/koryto-quest-designer/`.
- For UI or art changes, use `.agents/skills/koryto-ui-director/`.
- For build evaluation, use `.agents/skills/koryto-playtest-auditor/`.
- Before delivery, use `.agents/skills/koryto-release-gate/`.

## Next likely task

Verify the GitHub Pages build records the merged `main` SHA, then collect human feedback from a full **Krysy v JZD** TEST.7 playthrough and classify it by agency, pacing, clarity, humor, and technical stability. The next iteration must be driven by those observations rather than another speculative system.

## End-of-session maintenance

Update this file only with the next concrete task. Record durable decisions in `docs/decisions.md`, current facts in `docs/project-status.md`, and defects in `docs/playtest-findings.md`.
