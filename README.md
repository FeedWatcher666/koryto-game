# Koryto

Satirické české politické RPG, ve kterém hráč začíná v Dolních Vejprnicích a přes komunální politiku, kauzy, družinu, debaty, volby a koaliční vyjednávání buduje vlastní cestu ke korytu.

## Aktuální testovací verze

**v0.14.4 TEST.10 – Rozpad monolitu**

Tato verze fyzicky přesouvá autoritativní herní data a klíčové výpočty z původního `src/app.js` do samostatných modulů. `app.js` klesl z 1 716 řádků na méně než 900 a funguje především jako uživatelské rozhraní a orchestrátor.

Hratelnost, texty událostí, pravidla hodů a volební výsledky zůstávají kompatibilní s v0.14.3. Save formát zůstává `koryto`, schema `1` a save verze `0.14.3-test.2`; nová migrace uložených her proto není nutná.

### Iterace v0.14.4

- **TEST.1:** charakterizační audit monolitu, závislostí a save kontraktu.
- **TEST.2:** fyzický přesun tříd, lokací, voličů, základního stavu a všech 11 questů.
- **TEST.3:** fyzický přesun katalogu více než 50 událostí do továrny `event-data.js`.
- **TEST.4:** přesun frakčních plánů, koaličních partnerů, protioperací a živého světa.
- **TEST.5:** přesun společníků, osobních příběhů, vztahů, konfliktů a ambicí.
- **TEST.6:** samostatné čisté výpočty debat, projekcí, hlasů a mandátů.
- **TEST.7:** veřejné API `KorytoApp` a normalizační `KorytoGameEngine`.
- **TEST.8:** přístupné dialogy, focus management, mobilní safe area a sticky akce.
- **TEST.9:** balanční guardraily a audit tisíce deterministických kampaní.
- **TEST.10:** kompatibilní testovací loader, úplný release audit a offline ZIP.

## Modulární struktura

```text
src/
├── core-data.js          # třídy, lokace, voliči a výchozí stav
├── quest-data.js         # autoritativní definice questů
├── event-data.js         # autoritativní události a odemykání
├── faction-data.js       # frakce, koalice a soupeřovy operace
├── companion-data.js     # společníci, vztahy, příběhy a ambice
├── debate-data.js        # karty, mastery a tahy soupeře
├── quest-runtime.js      # stavy, termíny a přechody questů
├── debate-system.js      # čisté debatní výpočty
├── election-system.js    # projekce, hlasy, mandáty a kapacita koalice
├── game-engine.js        # normalizace stavu a orchestrace kontraktů
├── event-system.js       # katalog a validace událostí
├── faction-system.js     # frakční stav a největší hrozba
├── companion-system.js   # soupis a morálka družiny
├── balance-system.js     # guardraily a simulační audit
├── ux-system.js          # dialogy, mobilní UX a přístupnost
├── app.js                # UI, renderování a koordinace hry
└── v0144-test10.js       # release vrstva v0.14.4
```

## Ověření

Automatická sada kontroluje:

- historické savy v0.09–v0.14,
- map-only ukládání a fallback z poškozeného slotu,
- normalizaci číselných questových hodnot,
- integritu questů, událostí, frakcí, společníků a debat,
- shodu projekcí, hlasů a mandátů s původními pravidly,
- pořadí offline skriptů,
- přístupnost a mobilní výšku dialogů,
- tisíc deterministických kampaní bez zaseknutí nebo `NaN`,
- sestavení kompletního offline balíčku.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`. Hra nevyžaduje server ani instalaci.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
