# Koryto v0.20.0 CLEAN TEST.2

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Co přináší TEST.2

- samostatnou vrstvu animované d20,
- rotaci a průběžně se měnící čísla před dopadem,
- viditelnou obtížnost a rozpad známých bonusů,
- odlišný zlatý dopad kritické dvacítky,
- červený otřes kritické jedničky,
- syntetické zvuky bez externích souborů,
- krátké reakce Marie, Bohumila nebo samotné obce,
- respektování nastavení omezených animací,
- možnost animaci přeskočit.

## Spuštění

Zdrojový `index.html` používá ES moduly a je určený pro lokální server. Hratelný artefakt z GitHub Actions obsahuje vygenerovaný offline runtime a otevře se dvojklikem na `index.html`.

```bash
npm run build:offline
```

Vytvoří složku `dist/koryto-v0.20.0-clean-test.2`.

## Ověření

```bash
npm test
npm run check
npm run build:offline
```

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy skriptů.
- Nový save klíč `koryto.clean.v0200`.
- Offline runtime se generuje z kanonických modulů; nesmí se ručně upravovat.
- První vertikální řez: tvorba postavy, tutorial, d20, předmět, družina, registrace kandidatury a otevření kapitoly Krysy v JZD.
