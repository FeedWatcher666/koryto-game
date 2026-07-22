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

## Testovací kandidát v0.14.3 TEST.2

TEST.2 navazuje na dokončené oddělení kanonického stavu a save systému z TEST.1. Nové uložené pozice mají identifikátor formátu a schema verzi, zatímco historické pozice od v0.09 do v0.14 zůstávají migrovatelné. Poškozený, cizí nebo příliš nový slot nezakryje použitelný autosave či starší pozici. Integrační vrstva už nepoužívá periodický polling ani plošný `MutationObserver`, takže verzi a ovládací prvky nastavuje pouze při skutečné inicializaci nebo explicitním obnovení.

Automatická sada ověřuje map-only ukládání, prioritu ruční save → autosave → legacy, izolaci migrace, zachování vnořených dat, všechny podporované historické klíče, 200 deterministických kampaní a kompletní offline balíček.

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

Větev `test/v0.14.3-test2` je stabilizační pokračování modulárního state/save základu. Další doménové moduly se mají vytahovat až po ověření TEST.2 a bez změny herních pravidel.

Codex musí před refaktoringem přečíst `AGENTS.md` a `docs/codex-task-v0.14.1.md`.

## Spuštění

Otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci a offline artefakt obsahuje všechny potřebné lokální soubory.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
