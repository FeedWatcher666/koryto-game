# Koryto v0.14.9 TEST.10 – produkční pixel-art asset pass

## Účel

Tato oprava dokončuje původní PR #19. Herní logika v0.14.8 zůstává beze změny; nová vrstva pouze nahrazuje provizorní emoji a dekorace lokálními pixel-artovými podklady.

## Offline asset pipeline

Repozitář obsahuje dva skutečné PNG zdroje rozdělené do JavaScriptových chunků:

- atlas `1024 × 1024` ve třech souborech,
- panorama Dolních Vejprnic `1280 × 720` ve dvou souborech.

`index.html` načte všech pět chunků před `src/v0149-pixel-assets.js`. Runtime ověří počet částí a PNG signaturu, sestaví base64 datové proudy a zapíše je do CSS proměnných `--v0149-atlas` a `--v0149-village`. Neprobíhá žádný síťový požadavek a přímé spuštění přes `file://` zůstává podporované.

## Integrace

- atlas: třídy kandidáta, členové štábu, Vladimír Věčný, lokace, navigace a mocenské bloky,
- panorama: hlavní mapa, úvod, scény, deskové hlavičky, debata a volební zakončení,
- znak Koryta: malý CSS pixelový štít, takže nevyžaduje další chybějící datový soubor,
- mechaniky zůstávají funkční i při selhání dekorativního assetu.

## Přístupnost a responzivita

- hlavní ovládací prvky mají minimální výšku 48 px,
- všechny nové dekorativní sprajty mají textový kontext v okolním UI,
- klávesový focus je výrazně viditelný,
- `prefers-reduced-motion` vypíná animace a přechody,
- breakpointy pokrývají desktop, tablet a mobil.

## QA

`tests/v0149-assets.mjs` ověřuje:

1. verzi a pořadí skriptů v HTML,
2. přítomnost všech pěti chunků v release wiring,
3. skutečné PNG signatury a rozměry obou obrázků,
4. sestavení `data:image/png;base64,...` URL,
5. instalaci CSS proměnných a stav `ready`,
6. absenci vzdálených URL, `MutationObserver` a `setInterval`,
7. zahrnutí nové vrstvy do `npm test` a release artefaktu.

Vizuální galerie je dostupná přes `?visualqa=1`.

## Kompatibilita

- build: `0.14.9-test.10`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- žádná změna herních dat, pravděpodobností ani save formátu.
