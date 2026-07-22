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

## Testovací kandidát v0.14.3 TEST.1

TEST.1 odděluje kanonický herní stav a ukládání do modulů `src/state.js` a `src/save-system.js` bez změny herních mechanik. Zachovává kompatibilitu savů od v0.13, map-only ruční ukládání i autosave a umí přeskočit poškozenou novější pozici ve prospěch použitelného autosavu nebo staršího kompatibilního savu. Build zůstává oddělený od stabilní verze v `main`.

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

Větev `test/v0.14.3-modules` ověřuje první bezpečné oddělení stavu a save systému. Další doménové moduly se mají vytahovat až po přijetí tohoto charakterizačního kroku a bez změny hratelnosti.

Codex musí před refaktoringem přečíst `AGENTS.md` a `docs/codex-task-v0.14.1.md`.

## Spuštění

Po nahrání stabilního buildu otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
