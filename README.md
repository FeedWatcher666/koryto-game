# Koryto v0.17.0 TEST.1

Hratelný offline test nové vizuální základny kampaně.

## Spuštění

Rozbalte ZIP a otevřete `index.html`.

## Co přidává v0.17.0

- jednotný dřevěný, kovový a pergamenový vizuální systém podle schváleného směru,
- čitelnější hierarchii hlavní mapy, aktivní kauzy, rivala a klíčových lidí,
- přepracované lokality, události, volby a výsledkové karty bez změny mechanik,
- kompaktní mobilní rozložení se stejnými herními informacemi jako desktop,
- komponentové CSS a lehkou dekorační vrstvu bez vzdálených závislostí,
- plný save/load roundtrip se zachovaným formátem `0.14.3-test.2 / schema 1`.

## Zachované hratelné části řady v0.16

- úvodní briefing třináctidenní kampaně,
- tvorba kandidáta s živým náhledem,
- tři výchozí motivace a šest politických povolání,
- pixel-cartoon mapa Dolních Vejprnic,
- funkční štáb, nábor, vztahy a samostatné mise,
- přehled a detail kauz i osmi lokalit,
- události, hody a výsledky rozhodnutí,
- denní uzávěrka,
- veřejná debata a taktické karty,
- volební noc a patnáctimandátový přehled,
- koaliční salonek a živý log vyjednávání,
- rychlé ovládání napojené na původní save/load/map/kronika handlery,
- větší text, vysoký kontrast, omezení pohybu, skip link a viditelný fokus,
- responzivní desktopové, tabletové a mobilní rozhraní.

## Klávesové zkratky

- `Alt+U` – panel rychlého ovládání,
- `Alt+S` – uložit na mapě,
- `Alt+L` – načíst,
- `Alt+M` – návrat na mapu,
- `Alt+K` – export kroniky,
- `Esc` – zavřít panel.

## Doporučený finální test

1. Projít úvod a všech šest povolání.
2. Odehrát několik dní, událostí, questů a jednu debatu.
3. Vyzkoušet uložení a načtení na mapě; v události musí být uložení zablokované.
4. Zapnout větší text, kontrast a omezení pohybu a obnovit stránku.
5. Dokončit volby a koaliční vyjednávání.
6. Ověřit celý tok na desktopu a při šířce 390 px.

Podrobný popis iterace je v `docs/v0.17/v0170-visual-foundation.md`.
