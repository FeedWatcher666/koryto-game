# Koryto v0.16.3 TEST.1 — Staff Polish & Recruitment

## Cíl

Převést obrazovku štábu z funkčního prototypu do stavu vhodného pro skutečný playtest, bez zásahu do herního stavu, náborových událostí nebo save kontraktu.

## Datový kontrakt

UI čte existující:

- `state.party`,
- `state.partyFatigue`,
- `state.partyAssignment`,
- `state.selectedSupport`,
- `state.companionAmbitions`,
- `state.relationships`,
- `state.conflictStates`,
- `KorytoCompanionData`,
- `KorytoQuestData`.

Nábor se neprovádí falešným UI tlačítkem. Zamčená karta pouze ukáže lokaci a příběhovou cestu. Výjimkou je explicitní `?playtest=1`, který slouží k rychlému testování celé obrazovky.

## Funkční záložky

- **Lidé** — kandidát, pět postav, jejich agendy a aktivní role.
- **Role** — obsazené a neobsazené specializace a jejich skutečné bonusy.
- **Loajalita** — loajalita, únava, napětí a riziko odchodu nebo odmítnutí podpory.
- **Konflikty** — vztahové dvojice a přímý vstup do právě aktivního konfliktu.

## Přístupnost a responzivita

- dotykové cíle minimálně 44 px,
- deaktivované akce používají skutečný atribut `disabled`,
- čitelný počáteční stav prázdného štábu,
- stejné DOM komponenty pro desktop, tablet a mobil,
- žádné externí fonty, CDN, `MutationObserver` ani periodický `setInterval`.

## Save kompatibilita

- save verze: `0.14.3-test.2`,
- schema: `1`,
- žádná migrace ani nový paralelní stav.
