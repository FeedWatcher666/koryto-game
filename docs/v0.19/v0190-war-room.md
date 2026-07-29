# Koryto v0.19.0 TEST.1 — War Room Prototype

## Proč vzniká

Ruční test v0.18 potvrdil, že srozumitelná rozvětvená povídka nestačí. Hráč pouze vybíral odpovědi a nemusel nic plánovat, odhadovat ani zvládnout. v0.19 proto začíná znovu od stabilního základu v0.17.4 a ověřuje samotnou herní mechaniku bez závislosti na dlouhém příběhu.

## Herní cíl

Během šesti kol získat alespoň 8 z 15 delegátů. Hráč začíná se 4, Vladimír Věčný se 6 a pět lidí je nerozhodnutých.

## Základní smyčka

1. Kolo přidá krizi na jednu nebo více front.
2. Soupeř dopředu ukáže svůj zamýšlený útok.
3. Hráč má tři akční body a pět karet.
4. Ke kartě může jednou za kolo přiřadit Marii, Miloslava nebo Kláru.
5. Po ukončení kola provede Věčný svůj tah a nevyřešené krize udělí tresty.
6. Po šestém kole rozhodne počet delegátů; dříve lze prohrát rozpadem důvěry nebo štábu.

## Tři fronty

- **Strana:** při tlaku 7+ hráč ztratí delegáta.
- **Veřejnost a média:** při tlaku 7+ klesne důvěra a vzroste skandál.
- **Volební štáb:** při tlaku 7+ klesne morálka.

## Taktické systémy

- balíček 15 karet s čistými, špinavými, obrannými a zdrojovými akcemi,
- viditelný soupeřův záměr,
- obrana konkrétní fronty,
- kombinování karet na stejné frontě vytváří momentum,
- důkazy zesilují únik dokumentů a snižují jeho riziko,
- Miloslav získává delegáty za cenu dluhu,
- Marie zesiluje čisté operace a odmítá špinavé,
- Klára odhaluje další útok a připravuje mediální obranu,
- různé pořadí karet a útoků podle seedu.

## Testovací otázka

Je samotné hraní jednoho kola zajímavé i bez dialogů a příběhových odstavců? Hráč má mít pocit, že může zahrát dobrý nebo špatný tah, že soupeř mění situaci a že nemůže vyřešit všechny problémy současně.

## Kompatibilita

Původní v0.17 zůstává dostupná přes `?legacy=1`. Starý save formát `0.14.3-test.2 / schema 1` se nemění. v0.19 používá samostatný klíč `koryto:v0190:war-room`.
