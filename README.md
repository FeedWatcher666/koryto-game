# Koryto

Satirické české politické RPG, ve kterém hráč začíná v Dolních Vejprnicích a přes komunální politiku, kauzy, družinu, debaty, volby a koaliční vyjednávání buduje vlastní cestu ke korytu.

## Aktuální stabilní verze

**v0.14 – Živý politický svět**

Hlavní systémy:

- otevřená mapa obce a časový tlak,
- autonomní tahy frakcí,
- politické dluhy, sliby a protislužby,
- družina s loajalitou, ambicemi a konflikty,
- větvené kauzy včetně Operace SILO,
- vícekolové debatní bossfighty,
- volby, mandáty a koaliční vyjednávání,
- migrace uložených her,
- první pixel-artová mapová vrstva.

## Kandidát na vydání v0.14.2 RC3

RC3 opravuje ukládání verze kandidáta na vydání do ručních i automatických pozic. Současně zachovává obnovu poškozeného stavu, stabilní rozhraní a regresní průchody čisté i korupční kampaně. Build zůstává oddělený od stabilní verze v `main`.

## Struktura repozitáře

```text
koryto-game/
├── index.html
├── AGENTS.md
├── VERSION
├── docs/
│   ├── architecture.md
│   ├── codex-task-v0.14.1.md
│   └── v0.14/
├── builds/
│   └── v0.14/
└── assets/
    └── reference/
```

## Nejbližší technický krok

Větev `codex/v0.14.1-modular-refactor` je určena pro bezpečné rozdělení současného jednosouborového HTML do modulů bez změny herního chování.

Codex musí před refaktoringem přečíst `AGENTS.md` a `docs/codex-task-v0.14.1.md`.

## Spuštění

Po nahrání stabilního buildu otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
