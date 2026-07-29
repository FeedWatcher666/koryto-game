# Koryto — tooling and skill stack

## Repo-local Koryto skills

- `koryto-quest-designer` — quest contracts, branching, class/party/item leverage, fail-forward, rival reactions, and durable consequences.
- `koryto-playtest-auditor` — four-lens playtest covering impatient, role-playing, system-breaking, and small-mobile players.
- `koryto-release-gate` — exact-SHA CI, packaged build, accessibility, Lighthouse, artifacts, review threads, and mandatory Codex review.

The skills live under `.agents/skills/` and are intentionally small. Read the matching `SKILL.md` before the task.

## Approved external capability shortlist

Do not install a full megacatalog. Review and add exact skills only when the current task needs them:

- game design,
- game audio,
- frontend design,
- UI review,
- accessibility audit,
- webapp testing,
- systematic debugging,
- code review checklist,
- skill creation,
- algorithmic art.

## Automation

- `clean-rewrite.yml` runs source checks, deterministic build, packaged browser scenarios, accessibility basics, Lighthouse, artifact upload, PR reporting, and automatic Codex review request.
- `security.yml` runs an advisory GitHub Actions audit and attempts Dependency Review. Dependency Review becomes a blocking vulnerability gate after Dependency Graph and GitHub Advanced Security are enabled in repository settings.
- `pages.yml` deploys the last green push build to GitHub Pages after Pages is enabled in repository settings.
- Dependabot checks GitHub Action versions weekly.

## Public tester

Expected URL after GitHub Pages is enabled with **Source: GitHub Actions**:

`https://feedwatcher666.github.io/koryto-game/`
