# Koryto v0.20.0 CLEAN TEST.8

Čistý rewrite satirického politického D&D RPG. TEST.8 vrací strategické jádro původního Koryta v nové architektuře bez importu nebo spouštění runtime, CSS, rendererů a ukládání z v0.17.

## Spuštění

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.8/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## Strategická kampaň

První řez TEST.8 obsahuje malou třídenní kampaň v Dolních Vejprnicích:

- dvě akce za den,
- mapu se třemi aktivními lokacemi,
- dvě současné kauzy,
- viditelný plán Vladimíra Věčného a jeho protiakci na konci dne,
- podporu, důkazy a tlak jako hlavní strategické zdroje,
- volbu jednoho člena štábu, který odemkne vlastní akci a mění obsah lokace,
- tři finální strategie,
- skutečnou výhru i prohru,
- d20 jako řešení rizikové akce, nikoli jako náhradu strategie.

Hráč nemůže stihnout všechno. Každá akce ukazuje cenu, zamýšlený efekt a riziko ještě před kliknutím. Výsledek se propíše přímo do mapy, kauz a Věčného tlaku bez samostatné obrazovky „pokračovat“.

## Playtest

Každý dokončený průchod se archivuje samostatně. Závěr nabízí tlačítko **Kopírovat playtest**, které exportuje:

- verzi a build SHA,
- délku průchodu,
- všechny akce a navštívené lokace,
- řešené i zanedbané kauzy,
- Věčného protiakce,
- štáb a finální strategii,
- hody d20,
- zdroje a důvod výhry nebo prohry.

## Ověření

```bash
npm test
npm run check
npm run project:validate
node scripts/build-offline.mjs
```

Packaged browser gate odehraje strategickou výhru na desktopu a skutečnou prohru tlakem na mobilu. Ověřuje také save/reload, šest spotřebovaných akcí, tři Věčného protiakce, odemčenou akci štábu, export playtestu, přístupnost, horizontální overflow a Lighthouse.

## Projektová paměť a skilly

Závazný směr TEST.8 je v `docs/v0.20/test8-core-loop.md` a implementační kontrakt v `docs/v0.20/test8-campaign-contract.md`. Repo obsahuje čtyři lokální skilly pro questy, UI, playtest a release gate.

## Veřejný tester

GitHub Pages nasazuje pouze zelený commit z `main` na:

`https://feedwatcher666.github.io/koryto-game/`

PR #45 zůstává draft. Veřejná stránka se na TEST.8 změní až po zeleném gate, Codex review, lidském schválení a výslovném merge pokynu.

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy runtime.
- Save schema 3 a klíč `koryto.clean.v0200.test8`.
- Offline runtime se generuje z kanonických modulů a ručně se neupravuje.
- Automatické testy dokazují stabilitu, ne zábavnost.
- TEST.8 lze přijmout pouze po lidském průchodu alespoň dvěma mechanicky odlišnými strategiemi.
