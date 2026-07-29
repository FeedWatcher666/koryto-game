# Koryto quest contract

## 1. Premise

- Political absurdity:
- Concrete player goal:
- Immediate stakes:
- Later campaign stake:
- Expected play time:

## 2. Preparation

Specify active party slots, valid companions, item slots, and the information shown before confirmation. Preparation must alter later play.

## 3. Scene graph

For every scene record:

- scene id and location,
- new information,
- available actions,
- prerequisites and locks,
- next scenes,
- state changes,
- soft-lock escape.

A significant quest normally contains briefing, preparation, approach, investigation or negotiation, rival reaction, final decision, and recap.

## 4. Checks

For each check record:

- choice id,
- attribute and DC,
- advantage or disadvantage sources,
- strongest companion contribution,
- item effect,
- critical 20 event,
- success,
- success at cost,
- complication,
- critical 1 event.

A complication must create playable state rather than a dead end.

## 5. Agency audit

Reject the design when:

- choices change only flavor text,
- the best route is obvious before information is gathered,
- every class receives the same solution under a renamed button,
- a companion is only a passive stat bonus,
- the rival acts independently of player behavior,
- the ending resets all consequences.

## 6. Humor audit

Require at least one mechanical joke, one bureaucratic prop, one character reaction, and one consequence whose absurdity follows logically from the political system.

## 7. Implementation handoff

List data additions, state schema changes, rule changes, UI scenes, CSS additions, save migration needs, offline build changes, unit tests, and packaged browser tests.
