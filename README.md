# Koryto v0.20.0 CLEAN TEST.6

Čistý rewrite politického D&D RPG. Tento strom neobsahuje ani nespouští runtime, CSS, ukládání nebo renderery z v0.17 a starších buildů.

## Spuštění

Hratelný offline balík vzniká příkazem:

```bash
node scripts/build-offline.mjs
```

Potom otevřete `dist/koryto-v0.20.0-clean-test.6/index.html`. Distribuční soubor funguje dvojklikem bez lokálního serveru.

## První plnohodnotný quest

TEST.6 přidává kapitolu **Krysy v JZD** jako první vícefázovou politickou D&D výpravu:

1. briefing a vysvětlení kauzy,
2. výběr přesně dvou členů aktivní družiny,
3. výběr jednoho předmětu,
4. tři rozdílné cesty do areálu,
5. tři způsoby získání důkazů,
6. vědomá reakce na protiakci Vladimíra Věčného,
7. tři finální způsoby použití důkazů,
8. trvalý následek zaznamenaný do kampaně.

Hody nemění pouze reputaci. Průběžně upravují:

- množství důkazů,
- důvěru pracovníků,
- tlak Věčného,
- vztahy se společníky,
- politické dluhy a páku,
- obtížnost finální zkoušky,
- pozdější návrat důsledku.

## Družina a vybavení

K Marii Čisté a Bohumilu Tichému přibyl Radek Šroub, údržbář bývalého JZD. Do výpravy lze vzít dva ze tří společníků a jeden předmět:

- kazetový diktafon,
- klíč od archivu,
- termosku odborového čaje.

Družina i vybavení mění bonusy, výhodu nebo nevýhodu a dostupnou politickou cestu. Při dvojici společníků se použije jediná nejsilnější relevantní pomoc; bonusy různých společníků se nesčítají do jednoho hodu.

## Kostky

Fyzický model D20 a srozumitelná výhoda/nevýhoda zůstávají uzamčené:

- běžný hod: jedna d20,
- výhoda: dvě d20 a vyšší výsledek,
- nevýhoda: dvě d20 a nižší výsledek,
- ponechaná a vyřazená kostka jsou jasně označené,
- technický výpočet je dostupný až v detailu.

## Ověření

```bash
npm test
npm run check
node scripts/build-offline.mjs
```

Browser gate prochází všechny tři konce kapitoly, veřejnou a špinavou cestu, čistě komplikovaný průchod bez soft-locku, přesnou náhradu aktivní družiny a přehod první zkoušky po uložení a reloadu.

Každý významný build navíc prochází Codex review podle pravidel v `AGENTS.md`. Nálezy týkající se stavu hry, ukládání, pravidel hodů, družiny a offline balíku jsou blokující do opravy a opakované kontroly.

## Zásady

- Staré buildy jsou pouze obsahová a designová reference.
- Žádný import legacy skriptů.
- Save schema 2 a klíč `koryto.clean.v0200`.
- Offline runtime se generuje z kanonických modulů, ručně se neudržuje.
- Každý významný quest musí mít přípravu, několik scén, aktivní družinu, protiakci soupeře a trvalý následek.
