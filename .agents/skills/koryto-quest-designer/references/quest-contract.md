# Koryto quest contract

Complete this contract before implementing or materially revising a quest.

## Premise

- Player-facing problem:
- Political absurdity:
- Player goal:
- Rival goal:
- Target duration:
- Entry requirements:

## Scene graph

List every scene as `id → choices → next scene or ending`. Include:

- one meaningful branch before the first roll,
- one rival counteraction based on an earlier approach,
- at least one fail-forward complication,
- every ending and its durable consequence.

No reachable scene may lack an enabled continuation.

## Choice and leverage table

For every choice record:

- visible intent,
- required class, origin, companion, item, clue, or prior consequence,
- immediate cost or gain,
- delayed consequence,
- whether another route remains comparably viable.

Cosmetic alternatives that immediately converge do not count as agency.

## Check table

For every d20 check record:

- attribute and visible DC,
- visible modifiers,
- clueable hidden modifiers,
- advantage or disadvantage source,
- success, complication, critical 1, and critical 20 outcome,
- next scene for every outcome.

Only the kept die determines a critical result. Failure must advance the story.

## State mutations

Name the exact flags, relationships, resources, inventory changes, debts, pressure, or reputation effects written by each ending. State which future chapter can consume each mutation.

## Implementation map

List canonical source modules, styles, tests, save-schema impact, offline-build impact, and changed selectors. Generated runtime files are never edited by hand.

## Test matrix

Cover:

- every ending,
- a complication-only route,
- critical 1 and 20 where authored,
- class, companion, and item gating,
- rival counteraction,
- duplicate-click protection,
- save/reload before and after a roll,
- desktop and 390×844 mobile,
- keyboard navigation and reduced motion.

Implementation may start only when the scene graph has no dead end and the test matrix can prove every changed path.
