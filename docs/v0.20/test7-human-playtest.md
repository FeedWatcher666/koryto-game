# CLEAN TEST.7 — human playtest verdict

## Build

- Version: `0.20.0-clean-test.7`
- Public tester: GitHub Pages
- Human runs: two complete playthroughs
- State evidence recovered from the final local save

## Technical result

The tested run completed without a soft-lock. Save data recorded character creation, party preparation, multiple d20 checks, a complication route, a critical final result, one of the authored endings, resources, relationships, consequences, and full roll history.

This proves reachability and state recording. It does not prove fun.

## Human verdict

> „Ne a ne, je to lineární, nemám důvod to číst, jen klikám.“

Clarification:

> „Původní hra byla docela zábavná, ale moc složitá na pochopení. Tohle je nezábavné a lineární.“

## Classification

### P0 product failure — no meaningful game loop

- Agency: failed. Choices mostly selected a modifier or route inside one fixed sequence.
- Pacing: failed. The player advanced by repeatedly clicking through action, roll, result, and continuation screens.
- Clarity: technically improved over v0.17, but achieved by removing most strategic systems.
- Humor: unread, because reading was not necessary to choose or win.
- Stability: passed sufficiently to complete two runs.
- Replayability: failed. The second run did not create a convincing reason to continue experimenting.

## Root cause

TEST.7 solved the wrong problem. The original game's weakness was excessive simultaneous complexity and unclear priorities. The rewrite treated the mechanics themselves as the problem and removed:

- the map as a decision surface,
- competing cases,
- limited campaign time,
- an independently acting rival,
- strategic resource allocation,
- a real loss state,
- wider campaign progression toward debate, elections, and coalition building.

The remaining quest became a linear interactive story with d20 presentation.

## Durable correction

TEST.8 must restore the original strategic core in clean architecture while teaching one system at a time. It must not become another deduction-story experiment and must not import the legacy runtime.

Acceptance requires a human confirmation that:

- the goal is clear in the first minute,
- every day requires a sacrifice,
- not every problem can be solved,
- Věčný changes the plan,
- d20 supports strategy rather than replacing it,
- a second run is mechanically different,
- the result is more fun than TEST.7 and clearer than v0.17.4.
