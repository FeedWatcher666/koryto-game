# Koryto v0.19.0 TEST.1

Taktický prototyp českého politického RPG. v0.19 opouští model interaktivní povídky a testuje, zda je zábavná samotná herní smyčka.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`. Hra nepotřebuje server ani připojení k internetu.

Původní v0.17 zůstává dostupná přes tlačítko **v0.17** nebo adresu `index.html?legacy=1`. Starší uložené hry se nemažou; v0.19 používá vlastní save.

## Cíl hry

Během šesti kol získat alespoň 8 z 15 delegátů. Začínáte se 4 hlasy, Vladimír Věčný má 6 a pět delegátů je nerozhodnutých.

## Co přidává v0.19.0

- jednu válečnou místnost místo rozvětveného formuláře,
- šest skutečných herních kol,
- tři akční body na kolo,
- balíček patnácti karet,
- pět karet na ruce,
- aktivního soupeře s dopředu viditelným záměrem,
- tři současné fronty: strana, média a štáb,
- tresty za nevyřešené krize,
- tři členy štábu s mechanickými schopnostmi,
- čisté a špinavé operace,
- politické dluhy, důkazy, skandál a morálku,
- momentum za kombinování akcí na stejné frontě,
- proměnlivé pořadí karet a soupeřových útoků podle seedu,
- samostatný offline save/load,
- responzivní rozhraní pro notebook i mobil.

## Jak hrát

1. Podívejte se, co Věčný udělá na konci kola.
2. Zkontrolujte tlak na straně, v médiích a ve štábu.
3. Volitelně vyberte Marii, Miloslava nebo Kláru.
4. Zahrajte kartu a využijte jejich bonus.
5. Rozhodněte, které krize necháte shořet.
6. Ukončete kolo a sledujte skutečný tah soupeře.

## Lidé ve štábu

- **Marie:** zesílí čistou akci, zvedne morálku a odmítne špinavý tah.
- **Miloslav:** u stranické akce přivede dalšího delegáta, ale vytvoří dluh.
- **Klára:** u mediální akce zablokuje mediální útok a ukáže příští záměr.

## Vývojové kontroly

- `npm test` spouští historickou regresní sadu v0.17.4 a nový kontrakt v0.19,
- CI sestaví samostatný offline balík,
- Playwright odehraje celou šestikolovou partii,
- testuje notebook `1024 × 550` a mobil `390 × 844`,
- kontroluje se počet delegátů, kombinace se štábem, soupeřův tah, konec hry, overflow a chyby konzole.

Podrobný návrh je v `docs/v0.19/v0190-war-room.md`.
