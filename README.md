# Koryto

Satirické české politické RPG, ve kterém hráč během třináctidenní komunální kampaně řeší kauzy, skládá štáb, čelí frakcím, bojuje v debatách a po volbách vyjednává o moci.

## Aktuální testovací verze

**v0.14.5 TEST.10 – Hratelná kampaň**

Tato série navazuje na modulární v0.14.4 a soustředí se na samotný zážitek hráče. Začátek kampaně je kratší a srozumitelnější, každý den dostává hráč konkrétní plán, mapa ukazuje priority a rizika a hra lépe vysvětluje následky rozhodnutí, vztahy, tahy frakcí, debaty i volební výsledek.

Save formát zůstává `koryto`, schema `1` a save verze `0.14.3-test.2`. Historické uložené hry v0.09–v0.14 zůstávají podporované.

### Iterace v0.14.5

- **TEST.1 – prvních deset minut:** čtyřkrokový průvodce, vysvětlení tříd, motivací, akcí a cílů kampaně.
- **TEST.2 – denní smyčka:** ranní briefing, bilance předchozího dne a doporučený další krok.
- **TEST.3 – mapa:** viditelné termíny, doporučené lokace, příležitosti a stav dostupných akcí.
- **TEST.4 – questy:** rozdělení na hlavní kauzy, osobní úkoly a politické příležitosti včetně termínů.
- **TEST.5 – družina:** čitelnější postoje, důvody změny loajality a varování před krizí nebo odchodem.
- **TEST.6 – frakce:** přehled nejsilnější hrozby, nejbližšího tahu soupeře a doporučené obrany.
- **TEST.7 – debaty:** záměr soupeře doplněný doporučeným protiútokem a významem jednotlivých taktik.
- **TEST.8 – volby a koalice:** vysvětlení nejsilnějších a nejslabších voličských bloků, politických nákladů a následků nabídek.
- **TEST.9 – nový obsah:** osm nových lokálních událostí z obecní kampaně.
- **TEST.10 – tester build:** úplná regresní sada, 1000 deterministických kampaní, offline ZIP a formulář pro hlášení chyb.

## Hlavní novinky

- Průvodce lze kdykoli znovu otevřít z horní lišty.
- Denní plán řadí urgentní questy, frakční hrozby a napětí ve štábu podle priority.
- Konec dne upozorní na nevyužité akce.
- Questový deník ukazuje typ úkolu, cíl, termín a doporučenou lokaci.
- Debaty obsahují doporučené odpovědi na soupeřův záměr.
- Volební noc vysvětluje, odkud přišly hlasy a jaké politické náklady si hráč nese.
- Tlačítko **Nahlásit chybu** otevře připravený GitHub formulář.

## Modulární struktura

Nová hratelnost je soustředěna v `src/v0145-campaign.js`. Autoritativní data a výpočty zůstávají v modulech v0.14.4; `src/app.js` se znovu nezvětšuje a zůstává pod 1000 řádky.

## Ověření

Automatická sada kontroluje:

- historické savy v0.09–v0.14 a fallback poškozených slotů,
- integritu questů, událostí, frakcí, společníků, debat a voleb,
- nový onboarding, briefing, priority, vztahové signály a volební vysvětlení,
- osm nových událostí a jejich vazby na lokace,
- mobilní výšku dialogů, sticky akce a safe area,
- 1000 deterministických kampaní bez zaseknutí a `NaN`,
- sestavení kompletního offline balíčku.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`. Hra nevyžaduje instalaci ani server.

Chyby a připomínky lze zapisovat přes GitHub Issues v repozitáři. Uveďte verzi, prohlížeč, zařízení, kroky k reprodukci a pokud možno kód kampaně.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
