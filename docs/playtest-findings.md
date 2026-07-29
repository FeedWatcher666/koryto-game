# Koryto — playtest findings

Record only observed defects or clear human feedback. Do not use this file as a speculative backlog.

## Template

### P0–P3 — short title

- Build and commit:
- Device and viewport:
- Starting state:
- Reproduction:
- Expected:
- Actual:
- Evidence:
- Proposed smallest fix:
- Regression test:
- Status: open / fixed / verified

## Active findings

### P2 — Desktop HUD obscures the active scene

- Build and commit: `0.20.0-clean-test.6`, `d3affa697953471d3b7ad83d65e6663ee88f7d20`
- Device and viewport: Chromium desktop, 1100 × 720 and 1000 × 720
- Starting state: completed **Krysy v JZD** ending
- Reproduction: complete the quest after playing a choice near the bottom of the previous scene
- Expected: the new ending title and consequence appear in the visible viewport without obstruction
- Actual: preserved scroll position and the two-row sticky HUD cover the ending and central content
- Evidence: exact-SHA CI screenshots `jzd-dirty-ending-desktop.png` and `jzd-publish-complication-ending.png`
- Proposed smallest fix: make the HUD non-sticky and move focus plus scroll position to the newly rendered world stage
- Regression test: packaged browser gate checks computed HUD position and visible scene heading after transitions
- Status: fixed and visually verified in packaged TEST.7

### P2 — Mobile character sheet delays every scene

- Build and commit: `0.20.0-clean-test.6`, `d3affa697953471d3b7ad83d65e6663ee88f7d20`
- Device and viewport: Chromium mobile, 390 × 844
- Starting state: completed **Krysy v JZD** ending
- Reproduction: finish the public council route
- Expected: the ending and its consequences appear before secondary reference panels
- Actual: the full character sheet is rendered before the ending, forcing a long scroll before the result
- Evidence: exact-SHA CI screenshot `jzd-public-ending-mobile.png`
- Proposed smallest fix: order the world stage before character and support panels below 760 px
- Regression test: packaged mobile gate compares world-stage and hero-panel geometry after scene transitions
- Status: fixed and visually verified in packaged TEST.7

Human feel testing of agency, pacing, and humor is still pending.

### P2 — Věčný's pressure was displayed but did not affect the finale

- Build and commit: `0.20.0-clean-test.7`, `44100ebad10aafa88f8b392d3a6098cbced00916`
- Device and viewport: rules and packaged UI review
- Starting state: JZD finale after costly or complication outcomes
- Reproduction: compare final choices at equal evidence with low and high `quest.rivalPressure`
- Expected: accumulated rival pressure changes Věčný's counteraction or final difficulty
- Actual: pressure was only displayed; final choices were identical
- Evidence: exact-SHA Codex review requested after CI run `30490033781`
- Smallest fix: add one final DC for every two pressure, capped at +3, and show the source on each affected choice
- Regression test: all three final choices are exactly three DC harder at pressure 6 than at pressure 0
- Status: fixed in the PR candidate; release evidence is recorded by the exact-head CI and review on PR #37

### P2 — Call-bluff's own pressure erased its promised publishing advantage

- Build and commit: `0.20.0-clean-test.7`, `fbf054882e285160a60e02c58b8d6e8764f1913b`
- Device and viewport: rules review
- Starting state: JZD rival choice at any reachable pressure
- Reproduction: compare `publish-dossier` after `call-bluff` and `protect-workers` at equal evidence and starting pressure
- Expected: `call-bluff` keeps the advertised easier publication after all costs are applied
- Actual: its +2 pressure added +1 final difficulty and cancelled the former −1 route bonus
- Evidence: exact-SHA Codex review on PR #37
- Smallest fix: make the publication route reduction −2 so the net advantage remains −1 after the route's +2 pressure
- Regression test: publication after `call-bluff` is exactly one DC easier than after `protect-workers`
- Status: fixed in the PR candidate; release evidence is recorded by the exact-head CI and review on PR #37

### P2 — Save failures blocked persisted scene transitions

- Build and commit: `0.20.0-clean-test.7`, `4427c6048fcdc2b500aede808df5d8a3e93d991c`
- Device and viewport: offline build with Web Storage denied
- Starting state: any persisted transition, including accepting registration or quest preparation
- Reproduction: make `Storage.setItem()` throw and activate a persisted action
- Expected: the in-memory campaign continues even if it cannot be saved
- Actual: the exception aborted `commit()` before the new state was rendered
- Evidence: exact-SHA Codex review on PR #37
- Smallest fix: make save, load, and clear operations recoverable; the manual save control reports failure
- Regression test: packaged accessibility gate denies storage, accepts registration, and reaches `chapterOpen`
- Status: fixed in the PR candidate; release evidence is recorded by the exact-head CI and review on PR #37

### P2 — Evidence floor erased play-along's promised trade advantage

- Build and commit: `0.20.0-clean-test.7`, `4427c6048fcdc2b500aede808df5d8a3e93d991c`
- Device and viewport: rules review
- Starting state: JZD finale with at least three evidence
- Reproduction: compare `trade-evidence` after `play-along` and `protect-workers`
- Expected: accepting political debt keeps the advertised easier trade
- Actual: both routes stopped at evidence floor DC 9
- Evidence: exact-SHA Codex review on PR #37
- Smallest fix: apply the route reduction after the evidence floor, then apply the shared pressure penalty
- Regression test: all three rival choices keep their advertised favored ending at every reachable starting pressure 0–5
- Status: fixed in the PR candidate; release evidence is recorded by the exact-head CI and review on PR #37

### P1 — TEST.7 rejected a valid TEST.6 save

- Build and commit: `0.20.0-clean-test.7`, `abbb525844c64b5c31bc93172f56f7d1cb46cb42`
- Device and viewport: returning GitHub Pages session, any viewport
- Starting state: valid TEST.6 save using save schema 2
- Reproduction: open TEST.7 with the TEST.6 save stored under `koryto.clean.v0200`
- Expected: the compatible campaign continues
- Actual: the display-version mismatch caused `loadGame()` to return `null`
- Evidence: exact-SHA Codex review `4812546958`
- Proposed smallest fix: validate compatibility by `saveSchema` and upgrade the display version in memory
- Regression test: unit test loads a TEST.6/schema-2 save and still rejects schema 1
- Status: fixed in TEST.7; full exact-SHA verification pending

### P1 — Non-JZD save checkpoints lacked packaged continuation coverage

- Build and commit: `0.20.0-clean-test.7`, `82451d2be883f97d3f84dcfd726c333a84162c08`
- Device and viewport: packaged Chromium build, 900 × 680
- Starting state: new campaign before the first arrival choice
- Reproduction: inspect the release gate's save/reload scenarios before `jzdPrep`
- Expected: every actionable scene can be saved, reloaded, rendered, and continued
- Actual: only `firstResult` had non-JZD reload coverage
- Evidence: exact-SHA Codex review `4812636673`
- Proposed smallest fix: add one sequential packaged scenario covering every actionable checkpoint from `arrival` through `jzdBriefing`
- Regression test: browser gate saves, reloads, verifies, and continues all seven missing scene shapes plus `firstResult`
- Status: fixed in TEST.7; full exact-SHA verification pending

### P2 — Mobile visual order differed from DOM order

- Build and commit: `0.20.0-clean-test.7`, `82451d2be883f97d3f84dcfd726c333a84162c08`
- Device and viewport: mobile and linearized/screen-reader navigation
- Starting state: any active game scene
- Reproduction: compare flex visual order with the DOM emitted by `gameView()`
- Expected: the current scene precedes secondary character and support panels visually and programmatically
- Actual: CSS displayed the scene first while the DOM still emitted the character panel first
- Evidence: exact-SHA Codex review `4812636673`
- Proposed smallest fix: emit the world stage first and assign explicit desktop grid cells to the three panels
- Regression test: packaged mobile hierarchy gate checks both geometry and DOM order
- Status: fixed in TEST.7; full exact-SHA verification pending
