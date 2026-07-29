# Koryto — durable decisions

## Product identity

Koryto is a story-driven Czech political RPG in which a custom character, party, equipment, and d20 checks resolve absurd local scandals. Every solution changes relationships, options, reputation, debts, pressure, or character.

Priority order: humor, story, roleplaying, collecting and upgrading, strategy, replayability, exploration.

## Architecture

- Rewrite from scratch; old builds are design reference only.
- No legacy runtime imports, compatibility shims, or hand-maintained generated bundle.
- Canonical ES modules generate one deterministic offline runtime.
- Offline double-click play remains a release requirement.
- Save files are validated by schema and version.

## Game rules

- Six attributes: charisma, intelligence, authority, media talent, morality, luck.
- d20 is visible and frequent, but only used when uncertainty is interesting.
- Advantage rolls two d20 and keeps the higher result.
- Disadvantage rolls two d20 and keeps the lower result.
- Critical results are evaluated only from the kept die.
- Failure normally advances the story at a cost.
- Hidden modifiers must have discoverable clues.
- Only the strongest relevant companion numerical contribution applies to one check unless an explicit tested rule says otherwise.

## Quest rules

- Significant quests target 15–25 minutes.
- Preparation, several scenes, class/party/item-specific solutions, rival counteraction, and a durable consequence are required.
- Honest and dirty routes must both be viable and carry different costs.
- Moral choices are not labeled.
- Intentional in-world uncertainty is allowed; UI uncertainty is not.
- A reachable scene without a valid continuation is a blocking defect.

## UI and tone

- Present an RPG world and scene, not an administrative dashboard.
- Keep day/time, actions, active quest, reputation, and money understandable.
- Use Czech pub satire, dry irony, and absurd bureaucracy.
- Humor must appear in mechanics, dialogue, props, and consequences.
- Mobile interaction and reduced motion are release requirements.

## Delivery

- Every meaningful build is tested from the packaged offline artifact.
- Every meaningful build receives a Codex review after CI passes.
- P0–P2 findings are fixed, retested, and reviewed again.
- Never merge without explicit user instruction.
