# Koryto v0.20.0 CLEAN TEST.5

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Spuštění

Hratelný offline balík vzniká příkazem:

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.5/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## Kostky v TEST.5

Fyzický model D20 a systém výhody/nevýhody zůstávají z TEST.4. TEST.5 opravuje jejich vysvětlení.

Hráč nyní ještě před kliknutím vidí:

- kolik kostek hodí,
- která kostka se započítá,
- proč má výhodu nebo nevýhodu,
- technický zápis až jako vedlejší detail.

Pravidla jsou formulována přímo:

- běžný hod: jedna d20, započítá se její výsledek,
- výhoda: dvě d20, započítá se vyšší výsledek,
- nevýhoda: dvě d20, započítá se nižší výsledek.

Po dopadu je ponechaná kostka výrazně označena `POČÍTÁ SE`; druhá ztmavne, přeškrtne se a dostane označení `NEPOČÍTÁ SE`. Výsledková karta následně lidskou větou vysvětlí oba hody a vybraný výsledek. Syntaxe `2d20kh1` a `2d20kl1` zůstává skrytá v rozbalitelném technickém výpočtu.

Implementace je inspirována běžnou D&D syntaxí a chováním dice enginů, ale nepřidává Python ani externí runtime závislost.

## Ověření

```bash
npm test
npm run check
node scripts/build-offline.mjs
```

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy skriptů.
- Nový save klíč `koryto.clean.v0200`.
- Offline runtime se generuje z kanonických modulů, ručně se neudržuje.
- První vertikální řez: tvorba postavy, tutorial, d20, předmět, družina, registrace kandidatury a otevření kapitoly Krysy v JZD.
