# Koryto v0.14.8 TEST.10 – vizuální systém

## Cíl

Převést funkční prototyp do jednotného pixel-artového politického RPG bez nahrazení herní logiky statickým obrázkem. Vizuální vrstva je tvořena HTML, CSS a dynamickými komponentami; stav questů, štábu, soupeře, voleb a paměti kampaně čte přímo z runtime.

## TEST.1–TEST.10

1. sjednocení barev, rámů, typografie a hierarchie;
2. horní HUD pro den, důvěru, vliv a peníze;
3. responzivní mapa obce s urgentními značkami;
4. obrazovka kauz s termíny a lokacemi;
5. obrazovka štábu s loajalitou, stresem a osobními agendami;
6. pixel-artové scény a zpětná vazba lokací;
7. debatní jeviště napojené na existující souboj;
8. mapa vlivu a volební/koaliční projekce;
9. archiv rozhodnutí a paměti kampaně;
10. mobilní adaptace, vysoký kontrast, větší text, omezení animací, lokální zvuky a regresní test.

## Architektura

- `src/v0148-visual-system.js`: dynamické obrazovky, navigace, nastavení a adaptéry runtime.
- `styles/v0148.css`: pixel-artový design systém, desktop/tablet/mobile layout.
- žádná změna save schema;
- žádné přepisování `src/app.js`;
- žádné síťové požadavky ani externí fonty;
- offline provoz zůstává zachován.

## Obrazovky

- Mapa
- Kauzy
- Štáb
- Mapa vlivu
- Debata
- Volby a koalice
- Archiv a paměť
- Nastavení přístupnosti

## Kompatibilita

- build `0.14.8-test.10`
- save `0.14.3-test.2`
- schema `1`
- historické savy v0.09–v0.14 podporované
