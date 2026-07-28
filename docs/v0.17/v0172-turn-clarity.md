# Koryto v0.17.2 TEST.1 — turn clarity & feedback

Druhá dolaďovací iterace řady v0.17 zpřesňuje informace, které hráč potřebuje
bezprostředně před a po rozhodnutí. Pravidla zůstávají stejná; rozhraní pouze
ukazuje skutečnou cenu tahu a následky dříve, než se ztratí v příběhovém textu.

## Rozsah

- výraznější počet zbývajících akcí v horním HUDu,
- rozlišení plného tahu, poslední akce a vyčerpaného tahu,
- viditelná penalizace předčasného ukončení dne,
- dvoukrokové potvrzení před zahozením nevyužitých akcí,
- explicitní stav dostupné a zamčené rozhodovací karty,
- informace, že rozhodnutí spotřebuje jednu akci,
- rozpad výsledkového souhrnu na kladné, záporné a neutrální dopady,
- auditovatelná vrstva `KorytoUI172`.

## Audit mechanik a balancu

- den stále začíná se dvěma akcemi,
- zvolená událost stále spotřebuje právě jednu akci,
- předčasné ukončení dne stále přidává soupeři dva body tlaku za každou
  nevyužitou akci,
- výsledky, pravděpodobnosti, questové termíny a ekonomika se nepřepočítávají,
- save formát zůstává `0.14.3-test.2`, schema `1`.

## Release gate

- kontrakt identity `0.17.2-test.1`,
- ověření stavového HUDu, dostupnosti voleb a výsledkových čipů,
- kontrola dvoukrokového ukončení dne bez změny pravidel,
- událost, výsledek, lokalita a mapa na 1366×768, 1280×720 a 390×844,
- žádný horizontální overflow,
- úplný save/load roundtrip,
- žádné vzdálené runtime závislosti.
