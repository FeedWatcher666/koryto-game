# Koryto — current project status

## Canonical development line

- Repository: `FeedWatcher666/koryto-game`
- Canonical release branch: `main`
- Integration branch: `agent/v0200-clean-rewrite`
- Integration pull request: `#37`
- Current playable version: `0.20.0-clean-test.7`
- Merge state: explicit human approval received; merge only after exact-head CI and Codex review
- Stable archive reference: `archive/koryto-v0174-original`

## What is implemented

- clean offline-first browser runtime independent of v0.17,
- character creation with three origins and three classes,
- six attributes,
- physical 3D d20,
- normal, advantage, and disadvantage rolls,
- critical 1 and 20,
- clear kept/discarded die explanation,
- party and item preparation,
- first multi-scene quest **Krysy v JZD**,
- three quest endings,
- fail-forward complication routes,
- durable campaign consequences,
- save/load schema 2,
- deterministic generated offline package,
- packaged-build browser tests,
- mandatory Codex review workflow.
- committed visual north stars for the map, debate, event, inventory, party, and election-night screens,
- four validated repo-local skills for quests, UI direction, playtesting, and releases.

## Current quality gate

A deliverable build must pass syntax, unit tests, deterministic offline build checks, all changed quest endings, complication-only progression, save/reload, mobile overflow, accessibility basics, Lighthouse thresholds, and Codex review on the exact final SHA.

## Current priority

Merge the green TEST.7 integration line, verify the public `main` tester, then collect human feel-testing feedback. The next content iteration should improve agency, pacing, clarity, humor, or stability in **Krysy v JZD** based on actual play, not add another static quest chain.

## Known limitations

- Automated tests establish stability, not fun.
- GitHub Pages requires the repository Pages source to be enabled for GitHub Actions before the public tester URL can deploy.
- The current class and companion roster is intentionally small.
- Persistent consequences are recorded, but later chapters do not yet consume all of them.
