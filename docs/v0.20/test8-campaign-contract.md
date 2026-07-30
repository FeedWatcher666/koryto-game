# TEST.8 campaign contract — Tři dny do jednání

## Premise

- Player-facing problem: Vladimír Věčný připravuje prodej majetku bývalého JZD, zatímco rozpočet silnice ke škole mizí v dodatcích.
- Political absurdity: obec prodává stroje, které stále stojí v hale, a opakovaně platí za stejný výkop.
- Player goal: během tří dnů získat dost důkazů a podpory, narušit Věčného plány a uspět ve finálním veřejném střetu.
- Rival goal: určit tempo kampaně, odvézt důkazy, rozdělit občany a zaplnit jednání vlastními lidmi.
- Target duration: 10–15 minut pro první strategický řez.
- Entry requirements: vytvořená postava; žádný import nebo save z legacy runtime.

## Strategic graph

`creation → day1-map`

Day 1 offers three mutually competing actions, of which only two can be used:

- `jzd-logbook` — evidence route,
- `pub-workers` — support route,
- `office-contract` — legal evidence route.

After the second action:

`day1-map → rival-plan-1 → staff-choice`

Staff choice creates an exclusive content branch:

- `marie → staff-marie-annex`,
- `bohumil → staff-bohumil-room`,
- `radek → staff-radek-hall`.

`staff-choice → day2-map`

Day 2 unlocks the second case and offers the staff action plus ordinary actions for both cases. Only two can be used.

`day2-map → rival-plan-2 → final-strategy-choice`

Final strategy creates a mechanically distinct finale:

- `public` uses charisma and support,
- `legal` uses intellect and evidence,
- `workers` uses authority, JZD progress, and support.

`final-strategy-choice → day3-map → rival-plan-3 → final-check`

The final check can produce:

- campaign win,
- costly win when strategic preparation is strong enough,
- campaign defeat,
- early pressure defeat at pressure 10 before the finale.

No reachable state lacks an enabled continuation. The only terminal states are authored win or defeat endings.

## Choice and leverage table

### Day 1

| Choice | Visible intent | Main leverage | Immediate cost | Delayed consequence |
| --- | --- | --- | --- | --- |
| JZD logbook | gain transport evidence | rogue/class and intellect | one action; exposure risk | weak evidence lets Věčný remove books |
| Pub workers | gain witnesses and support | bard/class and charisma | one action; rumor risk | support protects the final meeting |
| Office contract | gain legal evidence | paladin/class and authority | one action; official trace | evidence lowers legal finale difficulty |

The unused action is a real sacrifice because it cannot be recovered later.

### Staff

| Staff | Unique action | Content change | Political cost |
| --- | --- | --- | --- |
| Marie | lost annex | connects both cases without a roll | she becomes identifiable as the source |
| Bohumil | closed back room | creates a broad coalition without a roll | the pub risks municipal business |
| Radek | hidden JZD hall | reveals machines and protects workers | Věčný can identify who opened the hall |

Only the selected staff action is available in the run.

### Final strategy

| Strategy | Preparation that matters | Attribute | Distinct fantasy |
| --- | --- | --- | --- |
| Public meeting | support | charisma | overwhelm the council with visible public pressure |
| Legal ambush | evidence | intellect | force hidden annexes into the official record |
| Workers' blockade | JZD progress plus support | authority | stop the disposal physically and politically |

## Check table

Every ordinary risky action shows the attribute, current DC, intent, and risk before activation. Pressure can increase DC. The active staff member grants advantage at their home location and contributes the single strongest companion numerical bonus.

Every action defines authored critical, success, costly, and complication effects. Complications consume the action and advance the campaign by increasing pressure, neglect, or lost support. They never create a soft-lock.

The final check DC is calculated from:

- selected strategy preparation,
- total case neglect,
- accumulated Věčný pressure.

A good final roll cannot fully erase a campaign played without preparation, and a strategically strong campaign can survive a costly final result.

## Rival counteractions

### End of day 1

- Intent: remove JZD accounting books.
- Weak trigger: fewer than two evidence or JZD progress.
- Strong consequence: evidence loss, JZD neglect, and pressure.
- Disrupted consequence: only minor pressure and an explicit acknowledgement that the player delayed him.

### End of day 2

- Intent: redirect the school-road budget.
- Weak trigger: insufficient road-case progress.
- Strong consequence: support loss, road neglect, and pressure.
- Disrupted consequence: the transfer becomes visible but Věčný gains time.

### End of day 3

- Intent: fill the public meeting with loyalists.
- Weak trigger: support below five.
- Strong consequence: support loss and pressure before the finale.
- Disrupted consequence: the loyalist bus arrives after the hall is already full.

## Durable state mutations

The ending and playtest export preserve:

- support, evidence, and pressure,
- both case progress and neglect,
- visited locations,
- all six selected actions,
- every rival counteraction,
- selected staff member,
- final strategy,
- all d20 results,
- exact win or defeat reason.

Later chapters can consume unresolved-case neglect, identified sources, staff choice, and whether Věčný lost control publicly, legally, or through worker action.

## Implementation map

- `src/test8-campaign.js` — campaign rules and state.
- `src/test8-main.js` — renderer and interaction orchestration.
- `styles/test8.css` — map, decisions, endings, and responsive layout.
- `tests/test8-campaign.mjs` — state/rule invariants.
- `tests/browser.mjs` — packaged win, defeat, save/reload, export, desktop, and mobile.
- `tests/accessibility.mjs` — semantic controls, focus, dice dialog, reduced motion, and overflow.
- `scripts/build-offline.mjs` — deterministic TEST.8 package.
- Save impact: new schema 3 and key `koryto.clean.v0200.test8`.
- Offline impact: only active TEST.8 modules are bundled; generated runtime is not committed.

## Test matrix

- strategic desktop win through Marie and legal strategy,
- mobile pressure defeat from repeated complications,
- staff-specific action exclusivity,
- active staff advantage at their location,
- second case unlock on day two,
- three rival counteractions,
- six-action campaign budget,
- final DC reduced by strategic preparation,
- real early defeat at pressure ten,
- save/reload after the first action,
- used action remains unavailable after reload,
- one archived playtest per completed run,
- one-click export or visible fallback,
- duplicate-click lock in the active renderer,
- keyboard selection and visible focus,
- dice dialog focus containment and reduced motion,
- desktop and 390 × 844 without horizontal overflow.
