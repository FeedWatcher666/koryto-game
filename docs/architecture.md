# Architektura čistého rewritu

## Tvrdá hranice

Nový runtime nesmí importovat, spouštět ani opravovat žádný soubor z v0.17 nebo starších verzí. Staré buildy slouží pouze jako referenční katalog nápadů, postav, questů, mechanik a humoru.

## Aktivní moduly TEST.8

- `src/data.js` — třídy, původy, atributy, postavy a sdílené výsledky d20.
- `src/rules.js` — d20, výhoda, nevýhoda, modifikátory a stupně výsledků.
- `src/test8-campaign.js` — kanonický stav třídenní kampaně, akce, kauzy, soupeř, štáb, výhra, prohra, save a export playtestu.
- `src/dice-physics.js` — fyzika a vykreslení d20.
- `src/dice.js` — přístupná prezentace hodu a fallback.
- `src/test8-main.js` — jediný aktivní renderer a orchestrace TEST.8.
- `styles/test8.css` — jediná aktivní herní stylová vrstva TEST.8.
- `styles/dice3d.css` — izolovaná stylová vrstva fyzické kostky.

`scripts/build-offline.mjs` skládá pouze tyto aktivní kanonické moduly do deterministického `src/runtime.js`. Generovaný runtime se nikdy neupravuje ručně.

## Stavová hranice

TEST.8 používá save schema 3 a klíč `koryto.clean.v0200.test8`. TEST.7 schema 2 se automaticky nemigruje, protože lineární questový stav nemá jednoznačný převod na strategickou kampaň. Dokončené TEST.8 průchody se v rámci nového schématu ukládají odděleně jako playtestové souhrny.

## Zakázané vzory

- vrstvení oprav nad historickými renderery,
- několik souběžných aktivních UI systémů,
- skryté legacy obrazovky,
- kompatibilní shim pro staré globální objekty,
- ručně udržovaný distribuční bundle,
- administrativní dashboard bez RPG světa,
- lineární řetězec situace → hod → tlačítko pokračovat,
- mechanika, kterou musí hráč pochopit dřív, než ji poprvé použije.

## Strategická smyčka TEST.8

1. Mapa ukáže cíl, zbývající akce, dvě hrozby a Věčného plán.
2. Hráč vybere jednu ze tří lokací a vidí cenu, záměr a riziko.
3. Riziková akce použije d20; jistá štábní akce vytvoří politický účet bez hodu.
4. Výsledek okamžitě změní zdroje, kauzu nebo zanedbání.
5. Po druhé akci Věčný provede vlastní protiakci.
6. Další den přidá pouze jeden nový systém: štáb, druhou kauzu nebo finální strategii.
7. Finální d20 používá obtížnost vytvořenou předchozími šesti akcemi.
8. Kampaň skončí skutečnou výhrou nebo prohrou a nabídne export playtestu.

## Rozšíření po TEST.8

Debata, volby, koalice, inventář, širší štáb a dlouhodobá progrese se mají přidávat jako samostatné, testovatelné systémy nad touto smyčkou. Nesmějí se vrátit všechny najednou do prvního dne kampaně.
