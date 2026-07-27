# Koryto v0.16.9 TEST.1 – release polish

## Cíl

Uzavřít řadu v0.16 posledním bezpečným UX a přístupnostním passem bez změny mechanik, save kontraktu nebo volebních výpočtů.

## Nové rychlé ovládání

- plovoucí panel dostupný na úvodu, mapě, událostech, debatě, koalici i konečném výsledku,
- proxy tlačítka používají původní handlery pro uložení, načtení, mapu, kroniku a novou hru,
- uložení je povolené pouze ve stejné fázi jako původní `save()` – na mapě a před koncem kampaně,
- klávesové zkratky `Alt+S`, `Alt+L`, `Alt+M`, `Alt+K` a `Alt+U`,
- klávesové zkratky se nespouštějí při psaní do formulářů.

## Přístupnost

- skip link na právě aktivní herní povrch,
- viditelný `:focus-visible` stav,
- živé oznamování systémových akcí,
- volitelný větší text,
- volitelný vysoký kontrast,
- volitelné omezení animací,
- preference se ukládají odděleně do `koryto_ui_0169` a nemění herní save.

## Bezpečnost

- save verze zůstává `0.14.3-test.2`, schema `1`,
- žádný `MutationObserver`, periodický `setInterval`, CDN ani síťové assety,
- nová vrstva nevytváří vlastní herní stav a neposouvá den ani akce,
- všechny herní povely jsou předávány existujícím tlačítkům a handlerům.

## Doporučený audit

1. Otevřít panel přes tlačítko i `Alt+U`.
2. Na mapě vyzkoušet uložit, načíst, kroniku a návrat na mapu.
3. V události ověřit, že je uložení správně zablokované.
4. Zapnout větší text, kontrast a omezení pohybu; obnovit stránku a ověřit zachování preferencí.
5. Pomocí Tab projít panel i aktivní obrazovku.
6. Ověřit desktop, tablet a mobil do šířky 390 px.
7. Dokončit jednu celou kampaň až do koalice nebo konečného výsledku.
