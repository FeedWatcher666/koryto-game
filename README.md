# Koryto v0.20.0 CLEAN TEST.4

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Spuštění

Hratelný offline balík vzniká příkazem:

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.4/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## TEST.4

- skutečná výhoda `2d20kh1` a nevýhoda `2d20kl1`,
- dva samostatné fyzické hody d20,
- jasně označená ponechaná a vyřazená kostka,
- čísla vykreslená přímo na trojúhelníkových stěnách,
- let přes stůl, první náraz, menší odskok a dojezd,
- opotřebený bakelitový materiál, dynamické světlo a pohyblivý stín,
- oddělený zvuk hodu, nárazů a výsledku,
- viditelné zdroje výhody nebo nevýhody před hodem.

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
