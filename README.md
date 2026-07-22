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

## Testovací kandidát v0.14.3 TEST.10

TEST.10 uzavírá kumulativní sérii TEST.4 až TEST.10 nad ověřeným save základem TEST.2. Build přidává samostatná runtime autoritativní questová data, questový runtime, katalog událostí, frakční a společníkový systém, globální mobilní UX vrstvu a souhrnný release/balance audit.

Herní obsah, výsledky voleb, questové následky ani pravidla hodů se nemění. Save formát zůstává `koryto`, schema `1` a runtime save verze `0.14.3-test.2`, takže TEST.10 nevyžaduje novou migraci uložených pozic. Build a uživatelské rozhraní mají verzi `0.14.3-test.10`.

Automatická sada ověřuje bezpečný save fallback včetně poškozených vnořených kolekcí, map-only ukládání, historické pozice v0.09–v0.14, normalizaci číselných questových hodnot, 200 deterministických kampaní, integritu událostí, frakcí a společníků i kompletní offline balíček.

### Iterace

- TEST.4: externí questová data s kontrolou driftu vůči původnímu monolitu.
- TEST.5: normalizace questového stavu, termíny, přechody a priority.
- TEST.6: katalog a integrita událostí podle lokací a questů.
- TEST.7: frakční plány, konspirační stopy a koaliční partneři.
- TEST.8: společníci, osobní příběhy, vztahy a konflikty.
- TEST.9: viewport-safe dialogy, mobilní safe area, sticky akce a přístupné focus stavy.
- TEST.10: jednotný release report, balanční guardraily, 200 simulací a offline balíček.

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
│   ├── quest-data.js
│   ├── quest-runtime.js
│   ├── quest-system.js
│   ├── event-system.js
│   ├── faction-system.js
│   ├── companion-system.js
│   ├── ux-system.js
│   ├── v0143.js
│   ├── v0143-test3.js
│   └── v0143-test10.js
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

Další hlavní vývojová větev může fyzicky zmenšovat `app.js` po jednotlivých doménách. TEST.10 už poskytuje externí autoritativní data, runtime kontrakty a regresní síť, takže tento přesun lze dělat bez změny hratelnosti a kompatibility savů.

Codex musí před refaktoringem přečíst `AGENTS.md` a `docs/codex-task-v0.14.1.md`.

## Spuštění

Otevřete `index.html` v prohlížeči. Hra nevyžaduje server ani instalaci a offline artefakt obsahuje všechny potřebné lokální soubory.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
