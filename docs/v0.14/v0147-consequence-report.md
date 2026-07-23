# Koryto v0.14.7 TEST.10 – audit následků a znovuhratelnosti

## Souhrn

Verze v0.14.7 zavádí jednotnou paměť kampaně. Hra si ukládá nejen okamžitou změnu statistik, ale také typ rozhodnutí, hlavní questovou cestu, vzniklé laskavosti, nepřátele, svědky, ultimáta a návraty následků. Tyto údaje používá pozdější obsah, debata, mocenská mapa a závěrečné vyhodnocení.

## TEST.1 – audit rozhodnutí

- 105 událostí obsahuje alespoň dvě volby.
- 98 událostí má současně rozdílné výsledkové podpisy a rozdílné strategické rodiny.
- Automatický audit nenašel volbu, jejíž všechny varianty by měly totožné tagy i stejné úspěšné a neúspěšné efekty.
- Audit zůstává konzervativní: literárně falešné volby stále vyžadují ruční redakční úsudek.

## TEST.2 – paměť kampaně

Nový stav `campaignMemory` eviduje:

- posledních 120 rozhodnutí,
- rodinu rozhodnutí a designové tagy,
- laskavosti, nepřátele a svědky,
- cesty questů Kandidátka, Střecha a Poslední louka,
- návraty následků,
- ultimáta a zrady družiny,
- strategii Vladimíra Věčného,
- mocenskou mapu šesti oblastí,
- dosažený závěr a replay fingerprint.

Save verze zůstává `0.14.3-test.2` a schema `1`. Staré uložené hry dostanou paměť při normalizaci bez nutnosti změnit formát.

## TEST.3 – návraty starších rozhodnutí

Přibyly čtyři runtime události:

1. `v0147RegisterReturn` – původ podpisů se vrací jako seznam svědků,
2. `v0147RoofReturn` – první déšť prověří střechu i zakázku,
3. `v0147MeadowReturn` – původní slib se střetne s bagrem, mapou nebo kompromisem,
4. `v0147CompanionUltimatum` – člen štábu vyžaduje změnu, odchází nebo přijímá protislužbu.

Texty událostí se mění podle původní cesty: poctivé, právní, mocenské, korupční nebo mediálně manipulativní.

## TEST.4 – tři hlavní questové oblouky

Kandidátka, Střecha a Poslední louka nyní uchovávají vlastní cestu a pozdější návrat. Následek není pouze další postih: hráč může původní volbu potvrdit, napravit, zakrýt nebo proměnit v nový politický dluh.

## TEST.5 – Vladimír Věčný

Každá kampaň dostane jednu z pěti deterministických strategií:

- Operace Klid na práci,
- Operace Papír vítězí,
- Operace Volné křeslo,
- Operace Vaše složka,
- Operace Všichni něco chtějí.

Strategie vytváří tlak ve dnech 3, 6, 9 a 12, ovlivňuje debatu a je viditelná v mocenské mapě poté, co se odhalí.

## TEST.6 – ultimáta a zrada

Od sedmého dne může nejméně loajální nebo nejvíce napjatý společník položit ultimátum. Hráč může:

- přijmout veřejný závazek,
- odmítnout a riskovat odchod či přeběhnutí,
- koupit klid funkcí nebo protislužbou.

Odchod se ukládá do paměti kampaně a může posílit Věčného.

## TEST.7 – mocenská mapa

Mapa ukazuje kontrolu nad šesti oblastmi:

- média,
- úřad,
- podnikatelé,
- JZD a venkov,
- rodiče,
- spolky a hospoda.

Každá oblast je označena jako kontrolovaná hráčem, soupeřem či sporná. Výpočet kombinuje podporu voličských bloků, postup frakčních plánů, momentum soupeře a klíčové statistiky.

## TEST.8 – personalizovaná debata

Debata používá historii kampaně. Poctivá či právní převaha může poskytnout první obranný štít, zatímco korupční a manipulativní historie dává Věčnému silnější nástup. Debatní panel vypíše konkrétní soupeřovu strategii i cesty hlavních kauz.

## TEST.9 – osm konců

- Mandát bez přívěsku,
- Nepohodlná čistá koalice,
- Starosta na splátky,
- Nový Věčný,
- Většina z velmi různých důvodů,
- Prohrál jste volby, otevřel jste archiv,
- Opozice, kterou nelze koupit prvním výborem,
- Kampaň skončila dřív než tisková konference,
- plus základní těsná opozice jako fallback.

Závěrečná obrazovka nově shrnuje hlavní questové cesty, poslední rozhodnutí, ultimáta, zrady a návraty následků.

## TEST.10 – replay audit

Finální lokální matice:

- 120 párů průchodů,
- 240 kampaní,
- osm hráčských archetypů,
- šest tříd,
- 100 % párů mělo odlišnou trasu a replay fingerprint,
- 36,7 % párů se lišilo alespoň v jedné ze tří hlavních questových cest,
- dosaženo osm rozdílných konců,
- dosaženo všech pět strategií Věčného,
- žádný automatický P1/P2 nález.

Tento audit doplňuje 2400kampanovou základní laboratoř z v0.14.6; nenahrazuje skutečné lidské testování srozumitelnosti, humoru a emocí.
