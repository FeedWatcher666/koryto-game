# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální experimentální build

**v0.16.1 TEST.1 — Clean UI Layout Polish**

Tato větev mění způsob grafické implementace, nikoli herní mechaniky. Hlavní mapová obrazovka se vykresluje v jednom izolovaném komponentovém kořenu bez řetězení historických vizuálních skinů.

### TEST.1 obsahuje

- kompaktní horní HUD,
- levý panel aktivních kauz,
- čistou SVG mapu Dolních Vejprnic,
- osm živých a přístupných hotspotů,
- pravý panel rivala, strategie, frakcí a klíčových lidí,
- desktopovou navigaci s osmi položkami,
- mobilní navigaci s pěti velkými dotykovými položkami a nabídkou Další,
- responzivní pořadí mapa → kauza → rival → lidé,
- podporu safe-area na telefonech s výřezem,
- původní questy, lokace, handlery a save systém.

### Cílová rozlišení

- desktop: 1920 × 1080, 1680 × 945, 1440 × 900,
- tablet: 1366 × 1024, 1024 × 768, 834 × 1194,
- mobil: 430 × 932, 390 × 844, 375 × 812,
- minimální cílová šířka: 360 px.

### Architektura

- `src/v0160-ui.js` je jediný čistý renderer a datový adaptér,
- `styles/v0160.css` obsahuje základní výtvarný systém,
- `styles/v0160-responsive.css` obsahuje pouze responzivní rozložení stejného UI,
- `assets/v0160/dolni-vejprnice-map.svg` neobsahuje zapečené texty, panely ani ovládání.

Ostatní obrazovky zatím používají stabilní legacy UI. Po schválení mapy budou stejné komponenty použity pro události, štáb, debatu a koalici.

## Spuštění

Rozbalte release ZIP a otevřete `index.html`.

## Kompatibilita

- build: `0.16.1-test.1`,
- save verze: `0.14.3-test.2`,
- save schema: `1`.

Technický základ je v `docs/v0.16/v0160-clean-ui.md`. Responzivní layout a cílová rozlišení jsou popsány v `docs/v0.16/v0161-layout-polish.md`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
