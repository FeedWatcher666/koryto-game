# AGENTS.md

## Účel projektu

Koryto je satirické české politické RPG. Prioritou je zachovat funkční hratelný vertical slice, kompatibilitu uložených her a dohledatelnost každé změny.

## Závazná pravidla pro Codex

1. Před změnou vždy přečti `README.md`, `VERSION` a relevantní zadání v `docs/`.
2. Neměň herní chování, pokud to zadání výslovně nepožaduje.
3. Zachovej kompatibilitu savů minimálně od v0.13.
4. Neodstraňuj existující obsah, questy, události ani konce bez výslovného souhlasu.
5. Nezaváděj síťové služby, analytiku, reklamy ani placené API.
6. Vše musí fungovat jako statická HTML/CSS/JavaScript hra bez backendu.
7. Každá významná změna musí mít test nebo kontrolní skript.
8. Při refaktoringu nejprve vytvoř charakterizační testy současného chování.
9. Udržuj odděleně data, herní logiku, UI a styly.
10. Nepřepisuj `main` přímo. Pracuj ve vlastní větvi a otevři pull request.

## Minimální kontrola před PR

- JavaScript bez syntaktických chyb.
- Hra se načte bez chyb v konzoli.
- Lze vytvořit postavu a zahájit kampaň.
- Funguje mapa, quest, debata, volby a koaliční obrazovka.
- Save/load funguje a starší save se migruje.
- Neexistují duplicitní DOM ID.
- Odkazy událostí na lokace a postavy jsou platné.
- Build neobsahuje vzdálené závislosti nutné pro spuštění.

## Verze

Menší technické změny používají formát `v0.14.1`, `v0.14.2` atd. Hlavní designové iterace pokračují `v0.15`, `v0.16` atd.

## Vizuální směr

Pixel-art UI se implementuje komponentově. Nepoužívej jediný velký obrázek jako náhradu interaktivního rozhraní. Mechaniky musí zůstat funkční i bez dekorativních assetů.