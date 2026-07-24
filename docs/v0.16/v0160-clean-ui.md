# Koryto v0.16.0 TEST.1 — Clean UI Rebuild

## Cíl

Přestat vrstvit další skin přes předchozí skiny a vytvořit jeden izolovaný komponentový renderer. Herní engine, questy, události, volby, koalice a save systém zůstávají zdrojem pravdy.

## Rozsah TEST.1

- pouze hlavní mapová obrazovka jako master screen,
- nový izolovaný kořen `#v0160Root`,
- společné komponenty HUD, panel, resource box, progress bar, hotspot a spodní navigace,
- čistý SVG podklad obce bez zapečených panelů, textů a statistik,
- osm živých HTML hotspotů napojených na původní `showLocation(id)`,
- skutečné questy, zdroje, rival, frakce a štáb čtené z existujícího stavu,
- ostatní obrazovky zatím používají stabilní legacy UI.

## Architektura

```text
Existující herní engine
└── state, questy, události, volby, save

v0.16 UI adapter
├── čte KorytoApp.getState()
├── volá původní showLocation / showMap / endDay
└── vykresluje izolovaný #v0160Root

Komponenty
├── HUD
├── panel
├── resource card
├── progress bar
├── hotspot
├── map action
└── bottom navigation
```

## Asset contract

`assets/v0160/dolni-vejprnice-map.svg` obsahuje pouze scénu obce. Neobsahuje klikací prvky, statistiky ani postranní panely. Názvy lokalit, questové badge a focus stavy jsou samostatné DOM prvky.

## Save kompatibilita

- save verze: `0.14.3-test.2`
- schema: `1`
- žádná migrace save dat

## Rollback

Odebrání `styles/v0160.css`, `src/v0160-ui.js` a jejich referencí v `index.html` vrátí stabilní v0.14.9 UI bez zásahu do uložených her.
