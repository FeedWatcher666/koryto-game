# Koryto v0.20.0 CLEAN TEST.7

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Spuštění

Hratelný offline balík vzniká příkazem:

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.7/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## První plnohodnotný quest

TEST.7 drží obsah kapitoly **Krysy v JZD** beze změny a opravuje hierarchii hraní podle ručního vizuálního auditu TEST.6. Nová scéna se po každém přechodu dostane do zorného pole, vysoký HUD už nepřekrývá obsah a na mobilu se rozhodnutí i závěr kapitoly zobrazují před listem postavy a podpůrnými statistikami.

Družina i vybavení mění bonusy, výhodu nebo nevýhodu a dostupnou politickou cestu. Při dvojici společníků se použije jediná nejsilnější relevantní pomoc; bonusy různých společníků se nesčítají do jednoho hodu.

## Kostky

- běžný hod: jedna d20,
- výhoda: dvě d20 a vyšší výsledek,
- nevýhoda: dvě d20 a nižší výsledek,
- ponechaná a vyřazená kostka jsou jasně označené,
- technický výpočet je dostupný až v detailu.

## Ověření

```bash
npm test
npm run check
npm run project:validate
node scripts/build-offline.mjs
```

Browser gate prochází všechny tři konce kapitoly, veřejnou a špinavou cestu, čistě komplikovaný průchod bez soft-locku, přesnou náhradu aktivní družiny a přehod první zkoušky po uložení a reloadu. CI navíc kontroluje základní přístupnost a Lighthouse skóre z hotového offline balíku.

Každý významný build prochází Codex review podle pravidel v `AGENTS.md`. CI testuje a reportuje skutečný PR head SHA. Po zeleném gate musí být review vyžádáno z připojeného uživatelského účtu na stejném SHA; komentář vytvořený účtem GitHub Actions se za Codex review nepovažuje.

## Projektová paměť a skilly

Aktuální fakta, rozhodnutí a handoff jsou rozdělené do malých souborů v `docs/`. Repo obsahuje tři vlastní Codex/agent skilly v `.agents/skills/`: návrh questů, playtest audit a release gate. Přesný aktivní seznam je v `.agents/koryto-skill-stack.json`.

## Veřejný tester

Po aktivaci **Settings → Pages → Source: GitHub Actions** nasazuje `pages.yml` poslední zelený push build na:

`https://feedwatcher666.github.io/koryto-game/`

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy skriptů.
- Save schema 2 a klíč `koryto.clean.v0200`.
- Offline runtime se generuje z kanonických modulů, ručně se neudržuje.
- Každý významný quest musí mít přípravu, několik scén, aktivní družinu, protiakci soupeře a trvalý následek.
- Automatické testy dokazují stabilitu, ne zábavnost; merge vyžaduje výslovné lidské schválení.
