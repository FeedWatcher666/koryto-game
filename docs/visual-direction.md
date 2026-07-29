# Koryto — visual direction

These committed concept images are product north stars, not runtime screenshots and not image-only UI specifications.

## Canonical references

| Screen | Reference | Use |
|---|---|---|
| Village map | [map-desktop.jpeg](visual-references/map-desktop.jpeg) | Primary desktop composition, landmarks, compact HUD, current cases |
| Debate | [debate.jpeg](visual-references/debate.jpeg) | Opponents, audience reaction, evidence and action cards |
| Event choice | [event-choice.jpeg](visual-references/event-choice.jpeg) | Illustrated confrontation, clear trade-offs, remembered consequences |
| Inventory | [inventory.jpeg](visual-references/inventory.jpeg) | Item rarity, selected-item explanation, usable evidence and kompromat |
| Party | [party.jpeg](visual-references/party.jpeg) | Active team, collection, equipment, synergies |
| Election night | [election-night.jpeg](visual-references/election-night.jpeg) | Results, mandates, coalition arithmetic, emotional payoff |

## Product hierarchy

The active scene is always first. The compact HUD answers only what the player needs now: day or time, action resource, active case, trust or reputation, and money when relevant. Supporting sheets, logs, and statistics remain reachable without covering the scene.

Desktop screens may use side rails around an illustrated center. Mobile screens recompose into:

1. location or event,
2. player decision or result,
3. immediate consequences,
4. supporting character and inventory detail,
5. secondary navigation.

## Implementation rules

- Build semantic DOM controls and live text; never ship a concept screenshot as an interactive image map.
- Use illustration as a responsive layer behind or beside real controls.
- Preserve offline double-click play, save compatibility, keyboard operation, reduced motion, and readable Czech text.
- Keep one primary action. Avoid equally loud dashboards and repeated navigation.
- Do not copy accidental inconsistencies from the concepts. Reuse the project's established tokens, labels, factions, and rules.
- Treat reference files as immutable evidence. Add a new named reference instead of silently replacing one.

Meaningful visual changes require packaged-build evidence at desktop and 390×844 mobile, plus an automated assertion for the interaction or hierarchy that changed.
