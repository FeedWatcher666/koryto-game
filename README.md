# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální hratelný build

**v0.15.2 TEST.1 – Reference Match Pass**

Tato verze nepřidává nové mechaniky. Přibližuje pět klíčových obrazovek schválené grafické předloze a zachovává existující herní logiku, questy, události, štáb, debatu, volby, koaliční vyjednávání a historické uložené pozice.

### Co je nové

- hlavní mapa používá schválenou podobu Dolních Vejprnic a osm skutečných interaktivních hotspotů,
- horní HUD, boční panely a spodní navigace mají přesnější proporce předlohy,
- událost používá lokální scénický výřez, reálný dialog a skutečné volby s následky,
- štáb má portréty, pětičlennou sestavu, role, loajalitu, stres a akce napojené na existující lokace a události,
- debata zachovává skutečné karty, podporu, důkazy a herní stav,
- koaliční vyjednávání zachovává skutečné výsledky, partnery, nabídky a původní handlery,
- scény jsou pouze výtvarné pozadí; tlačítka, hotspoty, karty a statistiky zůstávají živé DOM prvky,
- všechny assety jsou lokální a hra funguje přes `file://` bez serveru,
- žádné externí fonty, CDN ani síťové assety.

## Spuštění

1. Rozbalte ZIP.
2. Otevřete `index.html` v moderním prohlížeči.
3. Vytvořte kandidáta a zahajte kampaň.

## Kompatibilita

- build: `0.15.2-test.1`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

## Hlavní soubory

- `src/v0151-graphics.js` – hratelné obrazovky štábu, událostí, debaty a koalice,
- `src/v0152-reference-match.js` – mapové hotspoty, scénické výřezy a kanonické označení buildu,
- `styles/v0151.css` a `styles/v0152.css` – produkční shell a přesnější proporce předlohy,
- `assets/v0151/` – lokální portréty,
- `assets/v0152/` – lokální referenční scény,
- `tests/v0152-reference-match.mjs` – kontrakt verze, offline assetů a save kompatibility.

## Rollback

Výchozí rollback baseline je commit `c59327241107e128cc808b999af977b5763253c6` na větvi `test/v0.15.0-test1-visual-foundation`. Odebráním `styles/v0151.css`, `styles/v0152.css`, `src/v0151-graphics.js` a `src/v0152-reference-match.js` se rozhraní vrátí na v0.15.0 bez migrace save dat.
