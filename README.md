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

## Testovací kandidát v0.14.3 TEST.3

TEST.3 je první doménová modularizační iterace nad ověřeným základem TEST.2. Přidává samostatný modul `src/quest-system.js`, který poskytuje jednotný kontrakt pro jedenáct kampaních questů: kontroluje úplnost definic, platnost lokací a termínů, integritu questového stavu, efektivní deadline a přehled aktivních úkolů.

Herní obsah, výsledky voleb, questové následky ani pravidla hodů se nemění. Save formát zůstává `koryto`, schema `1` a runtime save verze `0.14.3-test.2`, takže TEST.3 nevyžaduje novou migraci uložených pozic. Build a uživatelské rozhraní mají samostatnou verzi `0.14.3-test.3`.

Automatická sada nadále ověřuje bezpečný save fallback včetně poškozených vnořených kolekcí, map-only ukládání, historické pozice v0.09–v0.14, 200 deterministických kampaní, všech jedenáct questových definic a kompletní offline balíček.

## Struktura repozitáře

```text
koryto-game/
├── index.html
├── AGENTS.md
├── VERSION
├── src/
│   ├── app.js
│   ├── state.js
│   ├── save-system.js
│   ├── quest-system.js
│   ├── v0143.js
│   └── v0143-test3.js
├── tests/
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

Po přijetí questového kontraktu lze v dalších iteracích bezpečně přesouvat samotné questové definice a operace z monolitického `app.js` do doménového modulu po malých, charakterizačně krytých částech. Změny nesmějí měnit hratelnost ani kompatibilitu savů.

Codex musí před refaktoringem přečíst `AGENTS.md` a `docs/codex-task-v0.14.1.md`.

## Spuštění

Otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci a offline artefakt obsahuje všechny potřebné lokální soubory.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
