# TEST.8 human playtest 01 — blocked

## Provenance

- Version reported by export: `0.20.0-clean-test.8`
- Exported build SHA: `development`
- Run ID: `1785402533327-bard-idealist`
- Duration: 49 seconds
- Route: bard / idealist / Marie / legal strategy
- Exact commit attribution: unavailable because the export did not embed a real build SHA

## Telemetry summary

The player reached day 3, spent all six campaign actions, visited JZD, the pub, and the municipal office, selected Marie, chose the legal final strategy, and won with strategic preparation 9 and final total 21 against DC 14.

The campaign recorded three rival actions and one complication. Both cases nevertheless remained marked `active` after the campaign-win outcome.

## Direct human verdict

- Was the game fun? **No.**
- Did Věčný change the player's plan? **The player could not tell.**
- Did the player decide what to sacrifice? **No.**
- Did legal, public, and worker strategies appear to create meaningfully different play? **The player could not tell.**

## Release verdict

**Blocked.** The build is technically functional but fails the human acceptance gate for agency, rival responsiveness, strategic sacrifice, route legibility, and fun.

## Findings

### P2 — No felt sacrifice or opportunity cost

- Starting state: three-day campaign with two actions per day
- Expected: each day forces the player to leave a meaningful opportunity unresolved or accept a visible cost
- Actual: the player did not feel that anything meaningful was sacrificed
- Evidence: direct answer `ne`
- Smallest credible fix: every action pair must contain at least one mutually exclusive benefit, relationship, witness, resource, or case state; the skipped option must visibly worsen, disappear, or empower Věčný
- Regression evidence: a human tester can name what they gave up on each day without reading telemetry

### P2 — Rival action does not create a legible response problem

- Expected: Věčný's announced plan changes the player's next decision
- Actual: the player could not tell whether Věčný changed the plan
- Evidence: direct answer `nevím`
- Smallest credible fix: each rival action must visibly alter one location, action, ally, deadline, or resource and present the player with a concrete response choice on the next screen
- Regression evidence: a human tester can state what Věčný changed and how they reacted

### P2 — Final strategies are not legibly different

- Expected: legal, public, and worker strategies change available preparation, risks, resources, and finale behavior
- Actual: the player could not tell whether they lead to different play
- Evidence: direct answer `nevím`
- Smallest credible fix: choose the strategic doctrine earlier, lock two exclusive preparation actions to it, and give each doctrine a different failure mode and victory condition
- Regression evidence: a second human playthrough exposes at least two actions and one final rule unavailable in the first

### P2 — Campaign is not fun despite technical completion

- Expected: the restored strategic loop is more engaging than TEST.7
- Actual: direct verdict `ne`
- Evidence: 49-second completed run plus explicit answer
- Smallest credible fix: stop adding breadth; redesign the six actions around tension, character conflict, irreversible consequences, and visible counterplay
- Regression evidence: tester voluntarily reads choices, can recount one memorable dilemma, and wants to try a second route

### P1 — Resolved cases remain active after victory

- Expected: cases resolved by the campaign outcome transition to a terminal state
- Actual: both `jzd` and `road` remained `active` after `campaign-win`
- Smallest credible fix: resolve or fail each case when committing the campaign outcome and assert the terminal state in unit and packaged browser tests

### P2 — Export cannot identify the tested commit

- Expected: every playtest export contains the exact build commit
- Actual: `buildSha` is `development`
- Smallest credible fix: inject exact SHA during artifact build and reject release artifacts whose embedded SHA is missing or `development`

## Three highest-leverage changes

1. Build each day around a real irreversible sacrifice, not two independent stat gains.
2. Turn Věčný's move into a visible board-state mutation that demands an immediate response.
3. Make the chosen final strategy alter the preceding day, available actions, and win condition rather than only the final modifier.

Do not expand campaign length, locations, cases, inventory, or visual polish until another human test passes these three checks.
