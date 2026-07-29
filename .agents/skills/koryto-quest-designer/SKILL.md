---
name: koryto-quest-designer
description: Design, revise, or audit quests for the Koryto political D&D browser RPG. Use when creating a new quest, expanding a scene chain, adding class/party/item-specific solutions, balancing d20 checks, writing political satire, defining rival counteractions, or deciding durable campaign consequences. Produce implementation-ready quest contracts that preserve player agency, fail-forward progression, Czech local-political absurdity, and the clean offline architecture.
---

# Koryto Quest Designer

Design quests as playable political RPG systems, not as sequences of text buttons.

## Workflow

1. Read `AGENTS.md`, `docs/project-status.md`, `docs/decisions.md`, and the relevant existing quest module before proposing changes.
2. Define the quest contract using `references/quest-contract.md`.
3. Build a scene graph with at least one meaningful branch before the first roll and at least one delayed consequence after the ending.
4. Give classes, companions, items, and previous campaign decisions distinct leverage. Do not create cosmetic alternatives that converge immediately.
5. Use d20 checks only when uncertainty is interesting. Show DC and known modifiers; keep hidden modifiers clueable.
6. Make failure advance the story with a cost, altered evidence, pressure, relationship change, or new branch. Never soft-lock the quest.
7. Give the rival an explicit counteraction that reacts to the player's earlier approach.
8. Write humor into mechanics, props, dialogue, and consequences. Do not rely only on joke labels.
9. End with a durable state mutation that can matter in a later chapter.
10. Provide implementation notes and test scenarios before code is changed.

## Non-negotiable design rules

- Target 15–25 minutes for a significant quest.
- Require preparation when the quest uses a party or equipment.
- Keep honest and dirty routes comparably viable, with different costs.
- Do not label moral choices as good or evil.
- Preserve the rule that only the strongest relevant companion numerical help applies to one check unless a quest explicitly states a tested exception.
- Preserve advantage and disadvantage semantics: two d20, keep higher or lower respectively.
- Use critical 1 and 20 as memorable authored events, not only larger numbers.
- Do not add legacy runtime dependencies or hand-maintained bundles.

## Deliverable

Return:

1. quest premise and player goal,
2. scene graph,
3. choice table with class/party/item interactions,
4. check table with DC, outcomes, and clueable hidden modifiers,
5. rival counteraction,
6. three or more endings when the quest scope justifies them,
7. durable consequences,
8. implementation file map,
9. browser-test matrix including complication paths.

Read `references/quest-contract.md` for the required template and quality gate.
