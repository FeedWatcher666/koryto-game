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
