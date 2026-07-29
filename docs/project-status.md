# Koryto — current project status

## Canonical development line

- Repository: `FeedWatcher666/koryto-game`
- Active branch: `agent/v0200-clean-rewrite`
- Active pull request: `#37`
- Current playable version: `0.20.0-clean-test.7`
- Merge state: draft and unmerged until explicit human approval
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

## Current quality gate

A deliverable build must pass syntax, unit tests, deterministic offline build checks, all changed quest endings, complication-only progression, save/reload, mobile overflow, accessibility basics, Lighthouse thresholds, and Codex review on the exact final SHA.

## Current priority

Do not broaden the campaign until TEST.7 receives human feel-testing feedback. TEST.7 only corrects scene priority, transition position, and HUD obstruction observed in TEST.6; the next content iteration should still improve agency, pacing, and clarity in **Krysy v JZD** based on actual play, not add another static quest chain.

## Known limitations

- Automated tests establish stability, not fun.
- GitHub Pages requires the repository Pages source to be enabled for GitHub Actions before the public tester URL can deploy.
- The current class and companion roster is intentionally small.
- Persistent consequences are recorded, but later chapters do not yet consume all of them.
