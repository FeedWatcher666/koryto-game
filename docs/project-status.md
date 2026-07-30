# Koryto — current project status

## Canonical development line

- Repository: `FeedWatcher666/koryto-game`
- Canonical release branch: `main`
- Current public release: `0.20.0-clean-test.7`
- Active integration branch: `codex/v0.20.0-clean-test.8-nonlinear-core`
- Active draft pull request: `#45`
- Active tracking issue: `#44`
- TEST.8 candidate version: `0.20.0-clean-test.8`
- Stable archive reference: `archive/koryto-v0174-original`
- Merge state: draft, no merge approval

## Human playtest verdict

TEST.7 was technically stable but linear and not fun. The first TEST.8 campaign restored a map, action budget and rival pressure, but also failed the human gate:

- fun: no,
- felt sacrifice: no,
- visible plan change caused by Věčný: unclear,
- mechanical difference between strategies: unclear.

The evidence is recorded in `docs/v0.20/test8-human-playtest-01.md`. The current branch is therefore a redesign candidate, not an accepted TEST.8 build.

## Current TEST.8 redesign candidate

- clean offline-first runtime independent of v0.17,
- three-day campaign and two actions per day,
- at least three important opportunities each day,
- one named irreversible sacrifice after every day,
- Věčný mutates the following board by blocking a location or damaging a route,
- responding to Věčný consumes one of the next day's two actions,
- staff choice before day two,
- public, legal or worker doctrine chosen before day two,
- doctrine-exclusive actions on days two and three,
- different doctrine resources, failure gates and two final tactics per doctrine,
- d20 resolves execution risk but cannot replace missing preparation,
- terminal case states after every ending,
- separate playtest archives containing sacrifices, mutations, doctrine, tactic and exact build SHA,
- save schema 4 under `koryto.clean.v0200.test8`,
- deterministic generated offline package.

## Current quality gate

The redesign candidate must pass:

- campaign state and doctrine invariants,
- one sacrifice and rival mutation per day,
- syntax and project-memory validation,
- deterministic offline build with exact SHA,
- packaged desktop doctrine win,
- packaged mobile pressure defeat,
- save/reload during the campaign,
- blocked-location and response-action coverage,
- terminal case-state and playtest-export coverage,
- accessibility, reduced motion, mobile overflow and Lighthouse,
- Codex review on the exact final SHA when review capacity is available,
- a new human playthrough.

## Current priority

Make the agency redesign green on PR #45 without merging it. The next human test has only three acceptance questions:

1. What did you knowingly sacrifice?
2. What did Věčný physically change and how did it alter your next turn?
3. How did your doctrine change the actions and failure condition?

Fun is still a separate mandatory gate. Automated stability does not answer it.

## Known limitations

- The candidate remains a deliberately small three-day campaign, not the full election arc.
- Debate, elections, coalition negotiation, inventory progression and the wider staff roster remain later systems.
- Codex review is currently blocked by the connected account's code-review usage limit.
- GitHub Pages continues to serve TEST.7 until TEST.8 is explicitly approved and merged into `main`.
