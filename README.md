# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální testovací verze

**v0.14.7 TEST.10 – Následky a znovuhratelnost**

Hra si nyní pamatuje důležité volby a vrací je později jako politické následky. Tři hlavní kauzy mají vlastní cestu, Vladimír Věčný používá jednu z pěti strategií, společníci mohou položit ultimátum nebo odejít a závěr kampaně rozlišuje několik typů vítězství, opozice i veřejného pádu.

### Série TEST.1–TEST.10

- **TEST.1:** audit skutečných a falešných rozhodnutí.
- **TEST.2:** jednotná paměť kampaně, laskavostí, nepřátel a svědků.
- **TEST.3:** návraty starších rozhodnutí.
- **TEST.4:** větvení Kandidátky, Střechy a Poslední louky.
- **TEST.5:** pět strategií Vladimíra Věčného.
- **TEST.6:** ultimáta, odchody a přeběhnutí družiny.
- **TEST.7:** mocenská mapa šesti oblastí obce.
- **TEST.8:** debata používající historii kampaně.
- **TEST.9:** osm hlavních typů zakončení a fallback opozice.
- **TEST.10:** párový replay audit 240 kampaní.

## Hlavní soubory

- `src/v0147-consequences.js` – paměť, následky, soupeř, ultimáta, konce a replay audit.
- `styles/v0147.css` – mocenská mapa, debatní paměť a závěrečný přehled.
- `docs/v0.14/v0147-consequence-report.md` – úplný audit verze.

## Kompatibilita

- build: `0.14.7-test.10`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

## Spuštění

Rozbalte ZIP a otevřete `index.html`. Hra funguje offline bez instalace a serveru.

Pro zobrazení replay QA přidejte k adrese `?replayqa=1`. Základní laboratoř v0.14.6 zůstává dostupná přes `?qa=1`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
