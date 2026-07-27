# Koryto v0.16.5 TEST.1 — audit funkčnosti, UX/UI a návazností

## Rozsah této iterace

Tato iterace převádí čtyři nejpoužívanější části kampaně do jednoho živého komponentového systému:

1. přehled a detail kauz,
2. detail osmi lokalit,
3. příběhové události a volby,
4. výsledek rozhodnutí.

Texty, termíny, stav questů, dostupné aktivity, volby, pravděpodobnosti a následky nejsou zapečené v obrázcích. Čtou se ze skutečného herního stavu. Ilustrace fungují pouze jako výtvarná vrstva.

## Automatické kontroly

- Datové validátory: **0 chyb** v questech, stavech questů, událostech, frakcích, postavách, debatě a volbách.
- Simulační audit: **1200/1200 dokončených kampaní**.
- Jedinečné simulační trasy: **1200**.
- Rozsah volebních výsledků v auditu: **9–58 %**.
- Kampaně zakončené koalicí: **377/1200**.
- Strukturální audit nového UI: **33/33 kontrol úspěšných**.
- Všechny JavaScripty prošly `node --check`.
- Všech **20 nových WebP assetů** je čitelných.
- Nebyl nalezen žádný chybějící lokální asset.
- Save kontrakt zůstává `0.14.3-test.2`, schema `1`.
- Nová vrstva nepoužívá `MutationObserver`, periodický `setInterval`, CDN ani síťové grafické assety.

## UX/UI audit

### Splněno

- Mapa, štáb, kauzy, lokality, události a výsledky sdílejí dřevo, mosaz, pergamen, zelené akce a červené hrozby.
- Osm lokalit má samostatné ilustrace.
- Hlavní kauzy mají samostatnou výtvarnou vrstvu a živé termíny.
- Volby v událostech používají šest výtvarných archetypů taktik podle skutečných tagů volby.
- Na mobilu je pět hlavních položek a nabídka `Další`; žádná sekce se neztrácí.
- Dotykové cíle mají základ nejméně 44 px.
- Desktop, tablet a mobil používají stejný DOM a stejné herní handlery.
- Zamčené, aktivní, splněné a selhané kauzy jsou vizuálně odlišné.
- Dynamické termíny překrývají případné zbytky původních art-direction badge, aby obrázek nemohl lhát o stavu hry.
- Názvy lokalit byly sjednoceny s mapou: Hospoda U Tří lip, Radnice, Redakce Vejprnického hlasu, JZD a sídliště, Stadion a Kulturní dům a štáb.

### Otevřené body — P2

1. **Ruční browserový smoke test je stále nutný.** Firemní politika Chromia v tomto prostředí blokuje `file://` i localhost, proto nebylo možné automaticky proklikat skutečný render.
2. **Úvod, tvorba kandidáta, debata, volby, koalice, archiv, konec dne a závěrečný screen** zatím používají starší vizuální vrstvu.
3. **Mapa a nové šablony potřebují ruční kontrolu na 1440×900, 1024×768, 430×932, 390×844 a 360×800.**
4. **Karty voleb používají výtvarné archetypy**, ne unikátní ilustraci pro každou z více než stovky událostí. Funkčně je to správně, obsahovou pestrost budeme doplňovat postupně.

### Otevřené body — P3

- Doplnit klávesnicový a screen-reader audit v reálném prohlížeči.
- Doplnit animace pouze pro potvrzení akce, změnu stavu a urgentní termín; vyhnout se dekorativnímu pohybu.
- Sjednotit další informační desky: Archiv, Vliv, Přehled dne a závazky.
- Převést debatu, volby, koalici a závěr na stejný komponentový základ.

## Příběhové a systémové návaznosti

- Marie Čistá už po úvodním projevu nevstupuje automaticky do štábu. Získá pouze stav `Kontakt navázán` a skutečný nábor nastane přes školní kauzu.
- Questové termíny používají `KorytoQuestRuntime.deadline()`, včetně procesních bonusů.
- Výběr volby stále volá původní herní tlačítko a původní resolver. Nové UI nemá paralelní kopii pravidel.
- Výsledek rozhodnutí čte skutečný `resultBox` vytvořený původním resolverem. Akce se spotřebuje až původním tlačítkem `Pokračovat na mapu`.
- Save/load zůstává v původním enginu a nová vrstva do uloženého formátu nepřidává povinná pole.

## Doporučení pro další iteraci v0.16.6

1. převést konec dne a přehled dne,
2. převést debatu a její karty,
3. udělat ruční test všech nových šablon na desktopu i mobilu,
4. opravit zjištěné přetečení, ořezy a pozice,
5. teprve potom převést volby a koalici.
