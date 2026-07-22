# Koryto

Satirické české politické RPG, ve kterém hráč začíná v Dolních Vejprnicích a přes komunální politiku, kauzy, družinu, debaty, volby a koaliční vyjednávání buduje vlastní cestu ke korytu.

## Aktuální stabilní verze

**v0.14.1 – Modulární technický refaktor**

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

První technický refaktor oddělil HTML shell, CSS a JavaScript do statických souborů bez záměrné změny herního chování. Kontroly lze spustit příkazem `npm test`.

## Spuštění

Po nahrání stabilního buildu otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.