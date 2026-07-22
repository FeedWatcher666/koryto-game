# Architecture baseline

## Current state

The verified v0.14 build is still distributed as a single self-contained HTML file. It contains:

- markup and screen containers,
- CSS and prototype visual styling,
- game state and save migration,
- event and quest data,
- factions and autonomous world turns,
- companion ambitions and conflicts,
- debate combat,
- election and coalition systems,
- simulation and audit helpers,
- embedded pixel-map asset.

## Main technical risk

A single-file build makes unrelated systems easy to change accidentally and makes it possible to test a different build than the one distributed. The first refactor must therefore preserve behavior before improving design.

## Intended boundaries

- `state` owns canonical game state and defaults.
- `save-system` owns serialization, versioning and migration.
- `data` contains declarative content only.
- domain modules own rules but not direct DOM manipulation.
- `ui` renders state and dispatches player intents.
- tests verify content integrity, migration and representative play flows.

## Distribution rule

`main` contains the last accepted playable version. Experimental work lives in branches and enters `main` only through reviewed pull requests.