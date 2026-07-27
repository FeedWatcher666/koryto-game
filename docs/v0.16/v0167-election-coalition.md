# Koryto v0.16.7 TEST.1 — volební noc a koaliční vyjednávání

## Cíl iterace

Převést poslední rozhodující část kampaně do stejného živého vizuálního systému jako mapa, štáb, kauzy, události, denní uzávěrka a debata. Nová vrstva nepřepisuje volební ani koaliční pravidla. Čte skutečný stav a doplňuje kontext nad existujícími tlačítky a resolvery.

## Volební noc

- Zobrazuje skutečné procento hlasů, vlastní mandáty, hranici většiny a celkový koaliční blok.
- Patnáct mandátů je znázorněno jako živý pás: vlastní klub, spojenci a opozice.
- Konečný screen doplňuje důvěru, integritu, tlak, počet partnerů a typ uzavřených dohod.
- Původní titul, příběh konce, volební účet a tlačítko nové hry zůstávají zdrojem pravdy.

## Koaliční salonek

- Hlavička ukazuje výsledek voleb, počet chybějících mandátů a aktuální kolo.
- Vyjednávací kapitál používá původní zdroje důvěryhodnost, trafiky a tlak.
- Karty klubů rozlišují dostupný, připojený a uzamčený stav.
- Nabídky programové dohody, funkce a nátlaku zůstávají původními tlačítky se stejnými náklady, DC a hody.
- Log vyjednávání je živý a zachovává skutečné výsledky resolveru.

## Kompatibilita a bezpečnost

- Save verze: `0.14.3-test.2`.
- Save schema: `1`.
- Žádná změna výpočtu hlasů, mandátů, koaliční kapacity, hodů nebo endingů.
- Bez CDN, síťových assetů, `MutationObserver` a periodického `setInterval`.
- Desktop, tablet a mobil používají stejný DOM a stejné původní handlery.

## Otevřené body pro další iteraci

1. dlouhý ruční průchod celé kampaně až do všech typů endingů,
2. kontrola koaličního salonku při extrémně dlouhých názvech závazků,
3. sjednocení úvodu a tvorby kandidáta,
4. následně převod archivu, mapy vlivu a kroniky.
