# Koryto v0.17.4 TEST.1

Hratelný offline test nové vizuální základny kampaně a prvního průchodu
čitelností rozhodování.

## Spuštění

Rozbalte ZIP a otevřete `index.html`.

## Co přidává v0.17.0

- jednotný dřevěný, kovový a pergamenový vizuální systém podle schváleného směru,
- čitelnější hierarchii hlavní mapy, aktivní kauzy, rivala a klíčových lidí,
- přepracované lokality, události, volby a výsledkové karty bez změny mechanik,
- kompaktní mobilní rozložení se stejnými herními informacemi jako desktop,
- komponentové CSS a lehkou dekorační vrstvu bez vzdálených závislostí,
- plný save/load roundtrip se zachovaným formátem `0.14.3-test.2 / schema 1`.

## Co dolaďuje v0.17.1

- mapa dává větší prostor hernímu světu a jasně označuje hlavní cíl tahu,
- události na desktopu ukazují rozhodovací karty ještě nad spodní navigací,
- volby jsou očíslované, přístupně pojmenované a vizuálně rozlišují riziko,
- mobil používá kompaktní horizontální volby místo dlouhých obrazových bloků,
- výsledky mají výraznější oddělení dopadů od příběhového textu,
- mechaniky a save formát zůstávají beze změny.

## Co dolaďuje v0.17.2

- horní HUD jasně odlišuje plný tah, poslední akci a vyčerpaný tah,
- předčasné ukončení dne ukazuje přesnou penalizaci a vyžaduje potvrzení,
- dostupné a zamčené volby mají explicitní stav,
- rozhodovací i výsledkové obrazovky uvádějí cenu jedné akce,
- dopady výsledku jsou rozdělené na kladné, záporné a neutrální položky,
- mechaniky, balanc, questy a save formát zůstávají beze změny.

## Co opravuje v0.17.3

- nahrazuje dlouhou webovou stránku pevným herním rámem na desktopu,
- opravuje skutečný Retina/MacBook viewport kolem `1024 × 550` CSS pixelů,
- drží aktivní kauzu, mapu a soupeře současně v jedné scéně,
- ukazuje všechny volby události společně s kontextem ještě před rolováním,
- zobrazuje všech šest povolání a potvrzení kandidáta v jednom viewportu,
- skládá lokalitu do scény a samostatného seznamu kliknutelných akcí,
- používá samostatnou portrétní kompozici mapy a voleb na mobilu,
- zabraňuje překrytí hlavních akcí pevnou spodní navigací,
- přidává gate skutečné viditelnosti ovládání, ne pouze existence prvků v DOM,
- mechaniky, balanc, questy a save formát zůstávají beze změny.

## Co sjednocuje v0.17.4

- používá mapu Dolních Vejprnic jako vizuální zdroj pravdy pro celou hru,
- zavádí centrální design tokeny a společné panelové a tlačítkové komponenty,
- sjednocuje kandidáta, detail kauzy, události, výsledky a štáb,
- převádí rychlé ovládání do stejného dřevěného a mosazného materiálového systému,
- odstraňuje viditelné přechody mezi několika generacemi UI,
- označuje aktivní povrch a nové legacy rendery v mikrotasku bez časovaného překreslení,
- přidává audit společných panelů, tlačítek, overflow a geometrie HUD/navigace,
- mechaniky, balance, questy a save formát zůstávají beze změny.

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

Podrobný popis iterace je v `docs/v0.17/v0174-style-stabilization.md`.
