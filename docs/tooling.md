# Koryto — tooling and skill stack

## Repo-local Koryto skills

- `koryto-quest-designer` — quest contracts, branching, class/party/item leverage, fail-forward, rival reactions, and durable consequences.
- `koryto-ui-director` — visual north stars, scene-first information hierarchy, responsive implementation, art direction, and rendered UI review.
- `koryto-playtest-auditor` — four-lens playtest covering impatient, role-playing, system-breaking, and small-mobile players.
- `koryto-release-gate` — exact-SHA CI, packaged build, accessibility, Lighthouse, artifacts, review threads, and mandatory Codex review.

The skills live under `.agents/skills/` and are intentionally small. Read the matching `SKILL.md` before the task.

## Audited external sources

The project reviewed `awesome-actions`, `codex-smart-project-memory`, `Understand-Anything`, `agentic-awesome-skills`, `nature-skills`, and `awesome-agent-skills` on 2026-07-29. They are discovery sources, not trusted dependencies. Useful patterns were adapted into the four small repo-local skills and workflows; no megacatalog is installed.

`Understand-Anything` remains deferred until the active runtime exceeds roughly 30 modules or a second regular contributor needs cross-module onboarding. Until then, focused Markdown memory is faster and easier to verify.

## Automation

- `clean-rewrite.yml` checks out the exact PR head, runs source checks, deterministic build, packaged browser scenarios, accessibility basics, Lighthouse, artifact upload, and one exact-SHA PR report. The test job is read-only; PR write access exists only in the reporting job.
- Codex review is requested after green CI through the connected user account. GitHub Actions bot comments cannot authenticate that request.
- `security.yml` runs an advisory GitHub Actions audit and attempts Dependency Review. Dependency Review becomes a blocking vulnerability gate after Dependency Graph and GitHub Advanced Security are enabled in repository settings.
- `pages.yml` deploys only the last green `main` push build to GitHub Pages after Pages is enabled in repository settings.
- Dependabot checks GitHub Action versions weekly.

## Public tester

Expected URL after GitHub Pages is enabled with **Source: GitHub Actions**:

`https://feedwatcher666.github.io/koryto-game/`
