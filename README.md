# Koryto v0.20.0 CLEAN TEST.3

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Spuštění

Hratelný offline balík vzniká příkazem:

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.3/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## Ověření

```bash
npm test
npm run check
```

## D20 v TEST.3

TEST.2 byla vizuálně plochá: CSS otáčelo jediný mnohoúhelník, takže výsledek připomínal minci. TEST.3 tento efekt kompletně nahrazuje.

- skutečný matematický model dvacetistěnu,
- 12 prostorových vrcholů a 20 trojúhelníkových stěn,
- perspektivní projekce na canvas,
- rotace kolem tří os,
- odlišné stínování každé stěny,
- měnící se vržený stín a výška nad podložkou,
- samostatná fáze letu, dopadu a ustálení,
- kritická 20, kritická 1, zvuk, vibrace a reakce družiny.

Číslo je překryvné pouze kvůli čitelnosti. Samotné těleso pod ním se prostorově přepočítává v každém snímku. Detail je v `docs/v0.20/d20-test3-note.md`.

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy skriptů.
- Nový save klíč `koryto.clean.v0200`.
- Offline runtime se generuje z kanonických modulů, ručně se neudržuje.
- První vertikální řez: tvorba postavy, tutorial, d20, předmět, družina, registrace kandidatury a otevření kapitoly Krysy v JZD.
