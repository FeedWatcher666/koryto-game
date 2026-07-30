# Koryto — durable decisions

## Product identity

Koryto is a story-driven Czech political RPG in which a custom character, party, equipment, strategic campaign decisions, and d20 checks resolve absurd local scandals. Every solution changes relationships, options, reputation, debts, pressure, resources, cases, or character.

Priority order: humor, story, roleplaying, collecting and upgrading, strategy, replayability, exploration.

## TEST.8 product correction

Human testing established two distinct facts:

- archived v0.17 had a fairly fun strategic game but was too complicated to understand,
- CLEAN TEST.7 was easier to understand but became linear and unfun.

The durable product rule is:

> Restore the strategic game, not the confusion.

Do not answer a clarity problem by deleting map choice, limited actions, simultaneous cases, active rival pressure, staff, resources, debate, elections, or coalition systems. Introduce them gradually, keep only current information visible, and explain each system in the situation where the player immediately uses it.

A linear story chain is not an acceptable core loop for Koryto. The home loop must give the player competing priorities, limited time, an active rival, real sacrifice, and a reachable loss state.

## Architecture

- Rewrite from scratch; old builds are design reference only.
- No legacy runtime imports, compatibility shims, or hand-maintained generated bundle.
- Canonical ES modules generate one deterministic offline runtime.
- Offline double-click play remains a release requirement.
- Save compatibility is governed by schema. A structural campaign rewrite may use a new schema when migration would invent strategic decisions the player never made.

## Game rules

- Six attributes: charisma, intelligence, authority, media talent, morality, luck.
- d20 is visible and frequent, but only used when uncertainty is interesting.
- Advantage rolls two d20 and keeps the higher result.
- Disadvantage rolls two d20 and keeps the lower result.
- Critical results are evaluated only from the kept die.
- Failure normally advances the story at a cost or can contribute to a genuine campaign defeat.
- Hidden modifiers must have discoverable clues.
- Only the strongest relevant companion numerical contribution applies to one check unless an explicit tested rule says otherwise.
- d20 resolves the risk of a selected strategy; it does not replace strategic preparation.

## Campaign rules

- The player must always understand the current goal, available actions, competing threats, and rival intent.
- Limited actions mean not every opportunity can be completed in one run.
- The rival acts independently after a visible trigger and can alter the player's plan.
- Staff members unlock content, actions, protection, or information; they are not only numerical bonuses.
- At least one real win and one real loss state are required in every campaign slice.
- A second playthrough must be mechanically different, not merely differently worded.

## Quest rules

- Significant quests target 15–25 minutes.
- Preparation, several scenes, class/party/item-specific solutions, rival counteraction, and a durable consequence are required.
- Honest and dirty routes must both be viable and carry different costs.
- Moral choices are not labeled.
- Intentional in-world uncertainty is allowed; UI uncertainty is not.
- A reachable scene without a valid continuation is a blocking defect.

## UI and tone

- Present an RPG world and scene, not an administrative dashboard.
- The committed map, debate, event, inventory, party, and election-night concepts are immutable north-star evidence; `docs/visual-direction.md` defines how they translate into live UI.
- Required text and actions remain semantic DOM. Concept screenshots and image maps never replace accessible controls.
- Keep the current day, actions, active cases, rival intent, and three relevant resources understandable.
- Use Czech pub satire, dry irony, and absurd bureaucracy.
- Humor must appear in mechanics, dialogue, props, and consequences.
- Mobile interaction and reduced motion are release requirements.

## Delivery

- Every meaningful build is tested from the packaged offline artifact.
- CI test jobs use read-only repository permissions; PR write permission is isolated to reporting.
- GitHub Pages deploys only a green `main` commit.
- Every meaningful build receives a Codex review after CI passes.
- P0–P2 findings are fixed, retested, and reviewed again.
- Automated tests establish stability, not fun.
- Never merge without explicit user instruction.
