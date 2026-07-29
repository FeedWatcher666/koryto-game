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
- Status: fixed in TEST.7; packaged verification pending

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
- Status: fixed in TEST.7; packaged verification pending

Human feel testing of agency, pacing, and humor is still pending.
