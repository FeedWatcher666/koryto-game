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
- Merge state: draft, no merge approval for the implementation candidate

## Human playtest verdict

TEST.7 was technically stable but failed the human fun and agency gate:

> „Původní hra byla docela zábavná, ale moc složitá na pochopení. Tohle je nezábavné a lineární.“

The product correction is not another story experiment. TEST.8 restores the strategic game underneath the original Koryto while presenting it gradually and clearly.

## TEST.8 implementation candidate

- clean offline-first runtime independent of v0.17,
- character creation with three classes and three origins,
- three-day campaign and two actions per day,
- map as the home screen,
- three active locations,
- two simultaneous cases from day two,
- visible rival intent and one Vladimír Věčný counteraction per day,
- support, evidence, and pressure as the main strategic resources,
- real pressure defeat and strategic final win or defeat,
- staff choice that unlocks a unique action and changes a location roll,
- three final strategies,
- physical d20 for uncertain actions,
- separate archived playtest records and one-click export,
- save schema 3 under `koryto.clean.v0200.test8`,
- deterministic generated offline package.

## Current quality gate

The candidate must pass:

- campaign state and balance invariants,
- syntax checks,
- project-memory validation,
- deterministic offline build,
- packaged desktop strategic win,
- packaged mobile pressure defeat,
- save/reload during the campaign,
- playtest export,
- accessibility and reduced-motion checks,
- mobile overflow checks,
- Lighthouse thresholds,
- Codex review on the exact final SHA,
- two human playthroughs with mechanically different strategies.

## Current priority

Make PR #45 green and reviewable without merging it. Then hand the TEST.8 artifact to the user for two human playthroughs. The acceptance question is whether it is more fun than TEST.7 while remaining easier to understand than archived v0.17.4.

## Known limitations

- The candidate uses a deliberately small three-day campaign, not the full election arc.
- Debate, elections, coalition negotiation, inventory progression, and the wider staff roster remain target systems for later iterations.
- Automated tests establish stability and reachability, not fun.
- GitHub Pages continues to serve TEST.7 until TEST.8 is explicitly approved and merged into `main`.
