---
name: koryto-ui-director
description: Design, implement, or review Koryto interfaces and visual assets. Use for maps, scenes, debates, events, inventory, party screens, elections, responsive layout, art direction, or accessibility-sensitive UI changes. Translate the committed visual north stars into semantic scene-first gameplay without turning reference screenshots into fake interfaces.
---

# Koryto UI Director

Turn the visual north stars into a playable Czech political RPG interface.

## Workflow

1. Read `AGENTS.md`, `docs/decisions.md`, `docs/visual-direction.md`, and only the relevant reference image.
2. State the player task, primary action, essential status, and supporting information for the screen.
3. Sketch the semantic hierarchy before styling. Put the active scene, consequence, or choice first.
4. Reuse the established tokens and components before adding a new visual primitive.
5. Implement live text, buttons, focus order, labels, and state. Do not bake actionable UI or required text into a bitmap.
6. Use illustration to establish place, character, mood, and consequence while preserving responsive reflow.
7. Verify desktop, 390×844 mobile, keyboard operation, visible focus, reduced motion, contrast, zoom, and overflow.
8. Inspect rendered evidence against `references/visual-contract.md` and add a regression test for the changed hierarchy or interaction.

## Visual intent

- Use wood, paper, brass, ink, worn municipal furniture, Czech village landmarks, pub satire, and bureaucratic props.
- Prefer one memorable illustrated scene with a clear action over a dense grid of equally loud panels.
- Keep numbers legible and subordinate to the player decision.
- Preserve humor through characters, props, reactions, and consequences rather than decorative labels alone.
- Avoid generic fantasy chrome, stock SaaS cards, unexplained icon walls, and mobile layouts that place the character sheet before the current scene.

## Deliverable

Provide:

1. player task and information hierarchy,
2. selected north-star reference and borrowed principles,
3. component and asset map,
4. responsive and accessibility behavior,
5. rendered desktop and mobile evidence,
6. automated regression coverage,
7. deliberate deviations from the reference.
