# Koryto v0.18.0 TEST.1

První skutečný vertikální řez satirického českého politického RPG.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`. Hra nepotřebuje server ani připojení k internetu.

Původní třináctidenní prototyp v0.17 zůstává dostupný přes tlačítko **v0.17** nebo adresu `index.html?legacy=1`. Starší uložené hry se nemažou; v0.18 používá vlastní oddělený save.

## Co je nové ve v0.18.0

- izolovaná nová hlavní herní obrazovka bez dashboardové změti,
- třídenní boj o vedení kandidátky v Dolních Vejprnicích,
- pět postav s vlastní motivací, hranicí a pamětí rozhodnutí,
- čtyři čitelné zdroje: vliv, důvěra, peníze a energie,
- politické dluhy, skryté riziko skandálu a podmíněné volby,
- okamžitá obrazovka následků po každém rozhodnutí,
- večerní bilance vztahů a závazků,
- několik odlišných konců podle způsobu vítězství nebo prohry,
- samostatný offline save/load,
- responzivní layout pro notebook 1024×550 i mobil 390×844.

## První průchod

1. Zvolte výchozí profil kandidáta.
2. Vyberte prioritu prvního rána.
3. Reagujte na nabídku starosty.
4. Ustůjte mediální tlak a krizi ve štábu.
5. Rozhodněte nominaci na stranickém sněmu.

Jeden průchod je záměrně krátký. Cílem TEST.1 je ověřit, že samotné rozhodování, vztahy a následky fungují jako hra ještě před rozšiřováním mapy a obsahu.

## Vývojové kontroly

- `npm test` spouští kompatibilní v0.17 regresní sadu a nový v0.18 kontrakt,
- CI sestaví offline balík,
- Playwright projde začátek kampaně na notebooku a mobilu,
- kontroluje se horizontální overflow, konzolové chyby a dostupnost voleb.

Podrobný návrh je v `docs/v0.18/v0180-vertical-slice.md`.
