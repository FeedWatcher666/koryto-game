# Architektura čistého rewritu

## Tvrdá hranice

Nový runtime nesmí importovat, spouštět ani opravovat žádný soubor z v0.17 nebo starších verzí. Staré buildy slouží pouze jako referenční katalog nápadů, postav, questů a humoru.

## Moduly

- `src/data.js` — čistá data tříd, původů, atributů, družiny a prvních scén.
- `src/rules.js` — d20, obtížnost, stupně výsledků a následky.
- `src/state.js` — nový stav hry a nový save kontrakt bez migrace legacy dat.
- `src/ui.js` — jediný renderer celé hry.
- `src/main.js` — orchestrace scén a vstupů.
- `styles/game.css` — jediná stylová vrstva.

## Zakázané vzory

- vrstvení oprav nad historickými renderery,
- několik souběžných UI systémů,
- skryté legacy obrazovky,
- staré save schema,
- kompatibilní shim pro staré globální objekty,
- mřížkový pohyb, deckbuilder a administrativní dashboard.

## První vertikální řez

1. Tvorba postavy se třemi třídami a třemi původy.
2. Šest skutečných atributů.
3. Ztracení na špatné zastávce.
4. První transparentní d20 zkouška.
5. Propiska na řetízku jako přehod za cenu.
6. Marie nebo Bohumil jako první člen družiny.
7. Registrace kandidatury s několika řešeními.
8. První politický dluh a otevření kapitoly Krysy v JZD.
