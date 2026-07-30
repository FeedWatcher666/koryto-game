# Koryto v0.20.0 CLEAN TEST.8 — design kontrakt

## Schválený směr

Cílem TEST.8 není vytvořit novou dedukční povídku ani dále zjednodušovat hru odebíráním systémů. Cílem je znovu postavit zábavné strategické RPG jádro původního Koryta v čisté architektuře a naučit ho hráče postupně.

Schválený produktový princip:

> Vrátit strategickou hru, ne vracet zmatek.

Původní Koryto bylo zábavné díky mapě, omezeným akcím, více současným kauzám, aktivnímu soupeři, zdrojům, štábu, vztahům, d20, debatě, volbám a koalici. Jeho hlavní slabinou byla špatná orientace hráče, příliš mnoho systémů najednou a nejasné následky rozhodnutí.

TEST.7 selhal opačným extrémem: odstranil chaos tím, že odstranil také většinu herního rozhodování. Výsledkem byl lineární click-through průchod bez důvodu číst nebo plánovat.

## Herní slib TEST.8

Hráč během první minuty pochopí:

1. čeho chce dosáhnout,
2. kolik má akcí,
3. jaké dva problémy právě soupeří o jeho pozornost,
4. co udělá Vladimír Věčný, pokud je nechá být,
5. že nemůže stihnout všechno.

Každý tah musí být skutečná volba mezi alespoň dvěma rozumnými možnostmi. Hráč nesmí být veden jediným koridorem a nesmí být možné vyhrát pouhým klikáním na nejvýraznější tlačítko.

## První hratelný řez

### Rozsah kampaně

- 3 herní dny,
- 2 akce za den,
- 3 aktivní lokace na mapě,
- 2 současné kauzy,
- 1 viditelný soupeřův záměr na každý den,
- alespoň 1 stav výhry,
- alespoň 1 skutečný stav prohry,
- alespoň 2 mechanicky odlišné cesty k výsledku.

### Domovská obrazovka

Mapa Dolních Vejprnic je hlavní herní povrch. V základním stavu ukazuje pouze:

- hlavní cíl kampaně,
- aktuální den,
- zbývající akce,
- tři relevantní zdroje,
- dvě aktivní kauzy,
- nejbližší protiakci Vladimíra Věčného,
- tři dostupné lokace.

Podrobné statistiky, archiv, dlouhé vysvětlivky a budoucí systémy nesmějí překážet v hlavním rozhodnutí.

## Denní smyčka

1. Hráč se vrátí na mapu.
2. Vidí dvě aktuální hrozby a Věčného plán.
3. Vybere lokaci nebo aktivitu.
4. Před potvrzením vidí cenu, riziko a zamýšlený efekt.
5. Akce změní svět, zdroje, kauzu nebo vztah.
6. Hráč se vrátí na mapu a rozhodne o druhé akci.
7. Po vyčerpání akcí Věčný provede viditelnou protiakci.
8. Hra stručně ukáže, co se změnilo a proč.
9. Začne další den s novou prioritou nebo komplikací.

Samostatné obrazovky „pokračovat“ jsou zakázané tam, kde hráč nic nerozhoduje.

## Postupné uvedení systémů

### Den 1 — mapa, akce, riziko

- jedna hlavní kauza,
- tři lokace,
- dvě akce,
- jeden d20 hod,
- jasné vysvětlení ceny a následku,
- první Věčného protiakce.

### Den 2 — štáb a druhá kauza

- odemkne se druhá současná kauza,
- hráč zvolí aktivního člena štábu,
- člen štábu odemyká akci nebo mění obsah lokace,
- hráč poprvé nemůže zachránit všechno.

### Den 3 — politický střet

- finální debata, veřejné jednání nebo jiný politický konflikt,
- výsledek závisí na předchozích rozhodnutích, zdrojích a zanedbaných problémech,
- d20 řeší riziko, ale nenahrazuje strategickou přípravu.

## Povinné systémy

### Omezené akce

- každá hlavní aktivita stojí jednu akci,
- ukončení dne předem ukazuje, co hráč nechává nedokončené,
- nevyužité nebo promarněné akce mají viditelný důsledek,
- hráč nemůže během jednoho průchodu získat vše.

### Aktivní soupeř

Vladimír Věčný není pouze číslo nebo závěrečný boss. Každý den má:

- viditelný záměr,
- jasnou podmínku spuštění,
- konkrétní zásah do mapy, zdrojů, kauzy nebo vztahů,
- možnost hráče tento záměr narušit, oslabit nebo ignorovat.

### Kauzy

Každá kauza obsahuje:

- stav problému,
- termín nebo tlak,
- dvě až tři možné strategie,
- viditelnou cenu ignorování,
- alespoň jeden trvalý následek.

### Štáb a družina

Člen štábu nesmí být pouze číselný bonus. Musí alespoň jedno z následujícího:

- odemknout lokaci,
- odemknout zvláštní akci,
- změnit obsah scény,
- odhalit soupeřův záměr,
- ochránit konkrétní zdroj,
- vytvořit nový konflikt nebo dluh.

### D20

D20 se používá pouze tam, kde existuje skutečné riziko a nejistota. Hráč musí před hodem vědět:

- o co se pokouší,
- co může získat,
- co riskuje,
- jak mu pomáhá postava, štáb nebo vybavení.

Výsledek hodu musí změnit další dostupné možnosti, ne pouze zobrazit textovou reakci.

## Zjednodušení bez ořezání hry

- jedna dominantní akce nebo rozhodovací oblast na obrazovku,
- maximálně tři hlavní zdroje v základním HUD,
- krátké kontextové vysvětlení přímo u rozhodnutí,
- budoucí systémy jsou skryté, dokud nejsou potřeba,
- žádné vnořené scrollování,
- žádné hlavní akce pod spodní navigací,
- žádná úvodní encyklopedie pravidel,
- každá nová mechanika se poprvé vysvětlí v situaci, kde ji hráč ihned použije.

## Playtestový kontrakt

TEST.8 není hotový, dokud lidský tester nepotvrdí:

- během první minuty jsem věděl, co je cílem,
- každé kolo jsem se rozhodoval, co obětuji,
- nemohl jsem stihnout všechno,
- Věčný alespoň jednou změnil můj plán,
- d20 doplňovala strategii,
- druhý průchod byl mechanicky jiný,
- hra byla zábavnější než TEST.7,
- hra byla srozumitelnější než archivní v0.17.4.

Na konci průchodu hra nabídne tlačítko „Kopírovat playtest“. Export obsahuje:

- verzi a build SHA,
- délku průchodu,
- dny a spotřebované akce,
- navštívené lokace,
- řešené a ignorované kauzy,
- Věčného protiakce,
- složení štábu,
- d20 výsledky,
- konečný stav a důvod výhry nebo prohry.

## Technická hranice

Archivní v0.17.4 je pouze designová a obsahová reference. TEST.8 nesmí importovat, spouštět ani vrstvit starý runtime, staré renderery, staré CSS nebo starý save kontrakt.
