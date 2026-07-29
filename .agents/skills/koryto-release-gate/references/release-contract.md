# Koryto release contract

## Source and architecture

- Canonical modules remain the only maintained runtime source.
- No legacy v0.17 runtime, compatibility shim, or external network dependency enters gameplay.
- Generated offline runtime matches the canonical modules.
- Save schema changes include validation or migration behavior.

## Rules and state

- Advantage keeps the higher d20; disadvantage keeps the lower.
- Criticals use only the kept die.
- Only the strongest relevant companion numerical contribution applies unless a tested quest rule says otherwise.
- Every reachable scene has a valid continuation.
- Rewards, rival choices, and durable consequences cannot be applied twice through normal interaction.

## Coverage

- Syntax and unit tests pass.
- Offline build contract passes.
- All changed endings pass in the packaged build.
- At least one complication-only path reaches completion.
- Save/reload restores every actionable choice.
- Mobile viewport has no horizontal overflow or unreachable main control.
- Accessibility basics and Lighthouse thresholds pass or have an explicit approved exception.

## Review and delivery

- Codex reviewed the exact final SHA after CI passed.
- Every P0–P2 finding is fixed and rechecked.
- Review threads are resolved with evidence.
- Artifact metadata and digest are recorded.
- PR remains draft and unmerged until explicit human approval.
