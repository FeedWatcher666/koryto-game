# Koryto v0.16.6 TEST.1 — browserový smoke test

## Prostředí

Hratelný artefakt vytvořený GitHub Actions byl spuštěn v headless Chromiu jako samostatný lokální dokument s vloženými skripty a styly. Test proběhl ve dvou viewpointech:

- desktop: **1440 × 900**,
- mobil: **390 × 844**.

## Ověřené toky

- úvodní obrazovka se vykreslí a tlačítko zahájí tvorbu kandidáta,
- tvorba kandidáta otevře prologovou událost,
- mapová komponenta se aktivuje bez JavaScriptové chyby,
- kliknutí na `Ukončit den` otevře novou denní uzávěrku,
- denní uzávěrka obsahuje potvrzení i bezpečné zrušení,
- `Ještě ne` zachová stejné číslo dne,
- aktivní debata dostane novou hlavičku,
- všech šest skutečných debatních karet dostane nový responzivní styl,
- na desktopu ani mobilu nevzniká horizontální přetečení,
- během kontrolovaného toku nebyla zachycena JavaScriptová chyba.

## Nalezená a opravená chyba

Starší styl `v0149.css` vkládal do viditelného záhlaví verzi `0.14.9 TEST.10` pomocí pseudo-elementu, přestože dokument a build už byly v0.16.6. Oprava v `styles/v0166-browser-polish.css` přepisuje pouze tento viditelný štítek na `Dolní Vejprnice 0.16.6 TEST.1`.

## Omezení testu

Test ověřuje render, DOM, interakce, změnu stavu a responzivní přetečení. Nenahrazuje delší ruční playtest celé třináctidenní kampaně ani kontrolu každého grafického assetu při všech cílových rozlišeních.
