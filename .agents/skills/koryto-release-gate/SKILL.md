---
name: koryto-release-gate
description: Validate and release-gate a Koryto build or pull request. Use before presenting any downloadable build, after implementing a quest or system change, after fixing Codex feedback, or when deciding whether a commit is ready for human testing. Require canonical-source checks, deterministic offline packaging, unit and browser tests, all relevant endings and complication routes, save/load coverage, mobile and accessibility checks, resolved review findings, and a fresh Codex review on the exact final commit.
---

# Koryto Release Gate

Treat a build as deliverable only when every required layer is proven on the exact final commit.

## Gate order

1. Confirm the intended branch, commit, version, and artifact name.
2. Inspect the diff and reject unrelated or legacy-runtime changes.
3. Run syntax and unit tests.
4. Build the offline artifact twice and compare hashes or contents for determinism.
5. Run packaged-build browser tests, not only source-server tests.
6. Exercise all changed endings, at least one complication-only route, save/reload, duplicate-click protection, and mobile overflow.
7. Run the repository accessibility and web-quality checks.
8. Inspect screenshots or the rendered build for visual regressions.
9. Request Codex review on the exact tested head SHA.
10. Fix every P0–P2 finding, rerun the complete gate, and request a fresh Codex review.
11. Confirm no unresolved review threads remain.
12. Publish the artifact and report the run ID, artifact ID, digest, commit, and known limitations.

## Blocking conditions

Block release when any item in `references/release-contract.md` is false. Automated tests prove stability, not entertainment; human feel testing remains required before merge.

## Output

Return a concise release report containing:

- final commit,
- version and artifact,
- checks run and their results,
- Codex review result,
- resolved findings,
- unresolved risks,
- merge state.

Never claim Codex review, visual inspection, or human playtesting occurred unless it actually occurred.
