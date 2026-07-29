# Koryto v0.20.0 TEST.1 — Village RPG Reboot

Nový hratelný základ satirického politického RPG. Reboot vznikl po ručních playtestech v0.18 a v0.19, které byly srozumitelné nebo systémové, ale nebyly zábavné a odklonily se od původní identity Koryta.

## Bezpečná záloha

Původní stabilní hra v0.17.4 je zachovaná na větvi `archive/koryto-v0174-original` a v tomto buildu ji lze otevřít přes `index.html?legacy=1`.

Experimentální větve v0.18 a v0.19 zůstávají v historii repozitáře, ale jejich PR jsou uzavřené jako slepé směry.

## Co je v rebootu

- skutečný pohyb kandidáta po mřížkové mapě Dolních Vejprnic,
- ovládání kliknutím, šipkami nebo WASD,
- viditelný Vladimír Věčný, který se pohybuje a přebírá voliče,
- deset nerozhodnutých obyvatel s krátkými satirickými postoji,
- okamžitě čitelné získávání a ztrácení hlasů,
- tři odlišné dovednostní minihry:
  - načasovaná hospodská pointa,
  - paměťový šanonový labyrint na úřadě,
  - rychlostní plakátová bitva na návsi,
- předměty přímo na mapě: kobliha, megafon a transparentní obálka,
- použitelný šanon, který může soupeři vrátit hlas mezi nerozhodnuté,
- tři dny kampaně a náhodné obecní události,
- novinový satirický konec podle výsledku a průšvihu,
- samostatný save `koryto:v0200:village-rpg`.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`.

- pohyb: šipky, WASD nebo kliknutí na zvýrazněné sousední pole,
- na voliči zvolte argument podle jeho krátké hlášky,
- na hospodě, úřadě nebo návsi spusťte minihru,
- cílem je získat 8 z 15 hlasů dříve než Vladimír Věčný.

## Co TEST.1 ověřuje

Neověřuje rozsáhlou kampaň ani finální grafiku. Ověřuje, zda je samotné pobíhání po obci, závod se soupeřem, hledání trasy, sbírání předmětů a střídání krátkých miniher hravější než předchozí dashboardové, textové a karetní prototypy.

## Vývojové kontroly

- `npm test` spouští kompletní historickou regresní sadu v0.17.4 v izolovaném workspace,
- kontroluje nový runtime, tři minihry, deset typů voličů a offline závislosti,
- CI sestaví offline balík,
- Playwright projde start, pohyb po mapě, setkání s voliči, hospodskou minihru a novinový konec,
- browser gate běží na notebooku `1024 × 550` i mobilu `390 × 844`.
