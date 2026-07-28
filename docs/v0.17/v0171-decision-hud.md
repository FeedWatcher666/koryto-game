# Koryto v0.17.1 TEST.1 — decision visibility

První dolaďovací iterace řady v0.17 opravuje informační hierarchii bez zásahu
do pravidel. Hráč má na mapě rychleji rozpoznat hlavní cíl tahu a na obrazovce
události vidět samotná rozhodnutí dříve, než dočte dlouhý kontext.

## Rozsah

- širší střed mapy a kompaktnější postranní panely na desktopu,
- viditelný štítek hlavního cíle tahu,
- očíslované a přístupně pojmenované volby,
- vizuální rozlišení rizikové a výhodné volby,
- nižší událostní panel na desktopu, aby volby zůstaly nad navigací,
- kompaktní horizontální karty rozhodnutí na mobilu,
- výraznější hierarchie výsledku a dopadů,
- samostatný audit vrstvy v0.17.1.

## Záměrně beze změny

- obsah a pravděpodobnosti voleb,
- ekonomika, obtížnost a délka kampaně,
- questy, debata, volby a koalice,
- save formát `0.14.3-test.2`,
- save schema `1`.

## Release gate

- kontrakt identity `0.17.1-test.1`,
- přítomnost přístupných popisků a pořadí voleb,
- událost, výsledek, lokalita a mapa na 1366×768, 1280×720 a 390×844,
- žádný horizontální overflow,
- úplný save/load roundtrip,
- žádné vzdálené runtime závislosti.
