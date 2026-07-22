# v0.14.4 – audit a fyzický rozpad monolitu

## Výchozí stav

`src/app.js` měl 1 716 řádků a současně vlastnil obsah, doménová data, výpočty, UI, ukládání i orchestrace. TEST.4–TEST.10 ve v0.14.3 vytvořily validační kontrakty, ale původní definice stále zůstávaly v monolitu a externí moduly je po startu pouze přepisovaly.

## Výsledek

`src/app.js` má méně než 900 řádků. Definice tříd, lokací, voličů, questů, událostí, frakcí, koalic, společníků, vztahů, debatních karet a soupeřových operací se v něm už nevyskytují. Data jsou načtena před aplikací a `app.js` získává pouze jejich reference.

### Vlastnictví systémů

| Oblast | Autoritativní modul | Runtime modul |
|---|---|---|
| Core stav | `core-data.js` | `game-engine.js` |
| Questy | `quest-data.js` | `quest-runtime.js` |
| Události | `event-data.js` | `event-system.js` |
| Frakce | `faction-data.js` | `faction-system.js` |
| Společníci | `companion-data.js` | `companion-system.js` |
| Debaty | `debate-data.js` | `debate-system.js` |
| Volby | `core-data.js` | `election-system.js` |
| UX | HTML/CSS | `ux-system.js` |
| Balance | simulace | `balance-system.js` |

## Kompatibilita

- Save formát: `koryto`.
- Save schema: `1`.
- Save verze: `0.14.3-test.2`.
- Podporované historické sloty: v0.09 až v0.14.
- Číselné řetězce v `quest.stage` a `deadlineBonus` jsou převedeny na nezáporná celá čísla.
- Poškozený ruční slot nezakryje validní autosave nebo starší save.

## Rizika a jejich krytí

1. **Pořadí klasických skriptů.** Data a čisté enginy se načítají před `app.js`; integrační a release vrstvy až po něm. Pořadí je testováno.
2. **Funkce uvnitř eventových definic.** `event-data.js` je továrna volaná až po vytvoření potřebných helperů v `app.js`.
3. **Lexikální globály starších vrstev.** `app.js` zachovává původní názvy přes reference na modulární data.
4. **Save migrace.** `game-engine.js` a `quest-runtime.js` jsou zapojeny do skutečné normalizační cesty.
5. **Mobilní dialogy.** Dialogy mají vlastní scroll, `100dvh`, safe area, sticky primární akci, role a focus management.
6. **Balanční drift.** Volební a debatní výpočty byly přesunuty beze změny koeficientů a tisíc kampaní musí skončit bez neplatných čísel.

## Další krok

v0.15.0 může bezpečně přidávat nové obce, strany, procedurální skandály a povolební vládnutí bez opětovného zvětšování `app.js`.
