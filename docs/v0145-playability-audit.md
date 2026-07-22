# v0.14.5 – audit hratelnosti

## Cíl

Po technickém rozpadu monolitu ve v0.14.4 bylo hlavním rizikem, že hra sice obsahuje mnoho systémů, ale nový hráč nepozná, co má dělat, proč se hodnoty mění a které rozhodnutí je právě důležité. v0.14.5 proto nemění save schema ani základní volební matematiku; mění způsob, jakým jsou informace načasované, řazené a vysvětlené.

## TEST.1 – prvních deset minut

- Úvod přímo říká délku kampaně, počet akcí a cíl.
- Tvorba postavy vysvětluje obtížnost, herní zaměření a riziko každé třídy.
- Čtyřkrokový průvodce ukazuje čas, mapu, questy a politické následky.
- Průvodce je kdykoli znovu dostupný.

## TEST.2 – denní smyčka

- Ranní briefing shrnuje změny podpory, důvěry, peněz, tlaku, integrity a dluhu.
- Hráč dostává doporučený další krok, ale není nucen jej následovat.
- Před ukončením dne hra upozorní na nevyužité akce.

## TEST.3 – mapa

- Lokace dostávají značky `doporučeno`, `termín` a `příležitost`.
- Nad mapou je jednotný prioritní pruh se třemi nejdůležitějšími problémy.
- Doporučení vychází z termínů questů, pokroku frakcí a napětí ve štábu.

## TEST.4 – questy

- Aktivní questy jsou rozdělené na hlavní kauzy, osobní úkoly a příležitosti.
- Každá položka ukazuje aktuální cíl, zbývající čas a lokaci.
- Urgentní questy mají výrazný vizuální stav.

## TEST.5 – družina

- Loajalita je doplněna slovním stavem a důvodem reakce.
- Kritické napětí a nízká loajalita se objevují mezi denními prioritami.
- Hra vysvětluje, zda člen štábu oceňuje férovost, výsledek, loajalitu nebo osobní zájem.

## TEST.6 – frakce

- Hráč vidí nejsilnější připravovaný plán a jeho postup.
- Soupeřova operace obsahuje odhad dalšího tahu a obranné doporučení.
- Informace jsou soustředěné do briefingu, aby nebylo nutné pročítat všechny panely.

## TEST.7 – debaty

- Záměr soupeře obsahuje doporučený typ protiútoku.
- Doporučení nemění pravděpodobnosti ani nehraje za hráče; pouze zpřístupňuje existující taktiku.
- Třídní a týmové schopnosti zůstávají kompatibilní.

## TEST.8 – volby a koalice

- Výsledek ukazuje nejsilnější a nejslabší voličský blok.
- Politické náklady shrnují nesplněné sliby, dluh, tlak a nízkou integritu.
- Koaliční nabídky mají předem čitelný typ následku.

## TEST.9 – nový obsah

Přibylo osm lokálních událostí: šeptanda u dveří, fotografie hřiště, slib na zastávce, místní influencer, plakátová válka, čaj se seniory, zatopený podchod a tichá většina. Události používají existující lokace, atributy a důsledky a nevyžadují migraci uložené hry.

## TEST.10 – stabilizace

- Build: `0.14.5-test.10`.
- Save verze: `0.14.3-test.2`.
- Save schema: `1`.
- 1000 deterministických kampaní musí skončit bez `NaN` a nedokončených běhů.
- Offline balíček nesmí obsahovat staré RC2/RC3 runtime soubory.
