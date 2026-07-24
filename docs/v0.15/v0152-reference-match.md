# Koryto v0.15.2 TEST.1 – Reference Match Pass

## Cíl

Přiblížit hratelné rozhraní schváleným konceptům bez změny mechanik, datového toku nebo save kontraktu.

## Rollback baseline

- základní commit: `c59327241107e128cc808b999af977b5763253c6`
- základní větev: `test/v0.15.0-test1-visual-foundation`
- rollback: odebrat vrstvy v0.15.1/v0.15.2 a lokální assety; save data se nemigrují

## Rozsah

- mapa jako master screen s osmi skutečnými interaktivními hotspoty,
- přesnější proporce horního HUDu, bočních panelů a spodní navigace,
- scénický pass události, debaty a koaličního vyjednávání,
- sjednocené portréty a pětičlenné rozložení štábu,
- lokální WebP podklady bez síťových požadavků,
- desktop, tablet a mobil.

## Již přidané assety

- `assets/v0152/map.webp`
- `assets/v0152/staff.webp`
- `assets/v0152/event.webp`
- `assets/v0152/debate.webp`
- `assets/v0152/coalition.webp`
- dostupné portréty v `assets/v0151/`

Obrázky v `assets/v0152/` jsou zmenšené schválené referenční obrazovky. Nesmí nahrazovat celou aplikaci. CSS je smí použít pouze jako výtvarné pozadí vyříznuté na středovou scénu; skutečné statistiky, karty, tlačítka, hotspoty a navigace musí zůstat živé DOM prvky napojené na stávající handlery.

## Bezpečnost

- herní logika a původní handlery zůstávají zdrojem pravdy,
- save verze zůstává `0.14.3-test.2`, schema `1`,
- žádná změna questů, volebních výpočtů, událostí ani koaliční logiky,
- vrstva nepoužívá `MutationObserver`, periodický `setInterval`, CDN ani síťové assety,
- nové soubory se načítají až za `src/v0150-visual-foundation.js`.

## Acceptance criteria

- build `0.15.2-test.1`,
- `npm test` je zelené,
- offline ZIP obsahuje vrstvy a lokální WebP assety,
- osm mapových míst zůstává klikacích,
- události, štáb, debata a koalice používají původní herní data a handlery,
- vypnutí nových souborů vrátí rozhraní na v0.15.0 bez migrace save dat,
- žádné celoplošné statické překrytí interaktivního UI.
