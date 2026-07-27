# Koryto v0.17.0 TEST.1 — visual foundation

První iterace řady v0.17 převádí fungující vertikální řez v0.16 do jednotného
herního vizuálního systému. Referencí je desková politická RPG estetika:
tmavé dřevo, mosaz, pergamen, výrazné zelené akce a červené hrozby.

## Rozsah

- hlavní mapa a její desktopové i mobilní informační panely,
- společná horní lišta, zdroje a spodní navigace,
- detail lokality, událost, volby a výsledek rozhodnutí,
- sémantické značky povrchů pro další iterace a automatizovaný audit,
- identita buildu `0.17.0-test.1`.

## Záměrně beze změny

- pravidla kampaně, ekonomika a obtížnost,
- obsah questů, událostí, debaty, voleb a koalice,
- formát uložené hry `0.14.3-test.2`,
- save schema `1` a migrace starších uložených her.

## Vizuální zásady

1. Herní data zůstávají živé HTML; referenční obrazovky nejsou nahrazeny
   jedním velkým obrázkem.
2. Každá důležitá akce má textový popisek, stav fokusu a nejméně 44px
   dotykovou plochu na mobilu.
3. Mobil zachovává stejná rozhodnutí a informace, jen mění pořadí panelů.
4. Všechny assety jsou lokální a hra zůstává spustitelná z `file://`.

## Release gate

- syntax všech nových skriptů,
- přesná identita HTML, `VERSION` a build-info,
- osm mapových hotspotů a jediná použitelná navigace,
- žádný horizontální overflow na 1366×768, 1280×720 a 390×844,
- událost → výsledek → lokalita → mapa,
- kompletní save/load roundtrip po normalizaci pouze transientních polí,
- žádné vzdálené runtime závislosti.
