# Koryto v0.20.0 CLEAN TEST.8

Čistý rewrite satirického politického D&D RPG. TEST.8 vrací strategické jádro původního Koryta v nové architektuře bez importu nebo spouštění runtime, CSS, rendererů a ukládání z v0.17.

## Spuštění

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.8/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## Strategická kampaň po prvním lidském playtestu

První lidský průchod původního TEST.8 selhal: hráč necítil oběť, nedokázal určit dopad Věčného a strategie působily stejně. Aktuální redesign proto mění samotná pravidla kampaně:

- tři herní dny a dvě akce za den,
- každý den nabízí nejméně tři důležité příležitosti,
- po druhé akci se jedna neprovedená příležitost změní v pojmenovanou nevratnou oběť,
- Věčný podle oběti fyzicky uzavře lokaci nebo poškodí následující herní stav,
- reakce na Věčného stojí jednu z pouhých dvou akcí dalšího dne,
- veřejná, právní nebo dělnická doktrína se volí už před druhým dnem,
- každá doktrína odemyká vlastní akce, používá jiný hlavní zdroj a má vlastní podmínku selhání,
- každá doktrína nabízí dvě rozdílné finální taktiky,
- d20 rozhoduje riziko provedení, ale neumí nahradit chybějící strategickou přípravu,
- kauzy po konci kampaně přecházejí do terminálního stavu místo chybného `active`.

## Playtest

Každý dokončený průchod se archivuje samostatně. Závěr nabízí tlačítko **Kopírovat playtest**, které exportuje:

- verzi a přesný build SHA,
- délku průchodu,
- všechny akce a navštívené lokace,
- každodenní oběti,
- změny mapy způsobené Věčným a reakce hráče,
- stav obou kauz,
- člena štábu, doktrínu a finální taktiku,
- hody d20, zdroje, příznaky kampaně a důvod výhry nebo prohry.

## Ověření

```bash
npm test
npm run check
npm run project:validate
node scripts/build-offline.mjs
```

Packaged browser gate musí odehrát doktrinální výhru na desktopu a skutečnou prohru tlakem na mobilu. Ověřuje také save/reload, uzavření lokace Věčným, reakční akci, každodenní oběti, terminální stavy kauz, export playtestu, přístupnost, horizontální overflow a Lighthouse.

## Projektová paměť a skilly

Závazný směr TEST.8 je v `docs/v0.20/test8-core-loop.md`, implementační kontrakt v `docs/v0.20/test8-campaign-contract.md` a redesign po lidském neúspěchu v `docs/v0.20/test8-redesign-brief.md`. Repo obsahuje čtyři lokální skilly pro questy, UI, playtest a release gate.

## Veřejný tester

GitHub Pages nasazuje pouze zelený commit z `main` na:

`https://feedwatcher666.github.io/koryto-game/`

PR #45 zůstává draft. Veřejná stránka se na TEST.8 změní až po zeleném gate, Codex review, lidském schválení a výslovném merge pokynu.

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy runtime.
- Save schema 4 a klíč `koryto.clean.v0200.test8`.
- Offline runtime se generuje z kanonických modulů, ručně se neupravuje a obsahuje přesný SHA sestavení.
- Automatické testy dokazují stabilitu, ne zábavnost.
- TEST.8 lze přijmout pouze po lidském potvrzení, že hráč umí pojmenovat vlastní oběť, konkrétní zásah Věčného a mechanický rozdíl zvolené doktríny.
