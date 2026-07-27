# Koryto v0.16.6 TEST.1 — přehled dne a veřejná debata

## Cíl iterace

Převést dvě části, které v předchozím auditu zůstaly na starší vizuální vrstvě:

1. potvrzení konce dne a denní přehled,
2. veřejnou debatu a její taktické karty.

Iterace nemění pravidla, hod kostkou, pořadí tahů, spotřebu akcí ani vyhodnocení debaty. Nová vrstva pouze čte aktuální stav a předává kliknutí původním handlerům.

## Přehled dne

Kliknutí na `Ukončit den` nejprve otevře kontrolní obrazovku se skutečnými hodnotami:

- důvěra, vliv, peníze a tlak,
- aktivní kauzy a jejich živé termíny,
- postup v jednotlivých kauzách,
- dnešní zápisy z kroniky a živého světa,
- samostatná mise člena štábu.

Teprve tlačítko `Uzavřít den` propustí původní kliknutí do herního enginu. Tlačítko `Ještě ne` stav hry nemění.

## Veřejná debata

Debata používá původní `#debateScreen`, původní karty, podporu družiny, třídní schopnost, záměr soupeře, reputaci, náladu sálu i log. Nová vrstva:

- přidává jednotnou hlavičku s dnem, kolem a momentem,
- sjednocuje panely s vizuálním systémem mapy, štábu a kauz,
- zvyšuje čitelnost reputace, nálady a soupeřova záměru,
- převádí karty do responzivního gridu,
- zachovává původní tlačítka a handlery,
- doplňuje `aria-live` pro soupeřův záměr a průběh debaty,
- drží minimální dotykový cíl 44 px.

## Bezpečnost

- save verze zůstává `0.14.3-test.2`, schema `1`,
- žádný `MutationObserver`,
- žádný periodický `setInterval`,
- žádné CDN, externí fonty ani síťové assety,
- potvrzení konce dne používá průchozí guard, aby se původní handler spustil přesně jednou.

## Testovací scénář

1. Na mapě kliknout na `Ukončit den`.
2. Ověřit aktivní kauzy, termíny, zdroje a dnešní zápisy.
3. Zavřít přehled přes `Ještě ne` a ověřit, že se den nezměnil.
4. Otevřít přehled znovu a potvrdit uzavření dne.
5. Spustit debatu, zahrát několik taktických karet a použít podporu družiny.
6. Ověřit desktop 1440×900 a mobil 390×844.
