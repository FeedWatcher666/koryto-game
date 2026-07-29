# Koryto v0.18.1 TEST.1

Rozvětvený vertikální řez satirického českého politického RPG.

## Spuštění

Rozbalte offline ZIP a otevřete `index.html`. Hra nepotřebuje server ani připojení k internetu.

Původní třináctidenní prototyp v0.17 zůstává dostupný přes tlačítko **v0.17** nebo adresu `index.html?legacy=1`. Starší uložené hry se nemažou; v0.18 používá vlastní oddělený save.

## Základ v0.18.0

- třídenní boj o vedení kandidátky v Dolních Vejprnicích,
- pět klíčových postav,
- čtyři čitelné zdroje,
- politické dluhy a skandály,
- okamžité následky rozhodnutí,
- více vítězných a proherních konců.

## Co přidává v0.18.1

- čtyři exkluzivní prostřední kapitoly podle reakce na nabídku starosty,
- konkrétní dialogy místo anonymního zvyšování vztahových čísel,
- osobní paměť postav na předchozí dohody, lži a odmítnutí,
- pozdější dialogy reagující na dřívější rozhodnutí,
- pět osobních epilogů na konci kampaně,
- sledování objevených cest, konců a již zvolených možností,
- náhled dosud neobjevených cest,
- odemykatelný profil Insider po prvním dokončení,
- kompatibilní načtení uložené hry z v0.18.0.

## První průchod

1. Zvolte výchozí profil kandidáta.
2. Vyberte prioritu prvního rána.
3. Reagujte na nabídku starosty.
4. Odehrajte exkluzivní kapitolu své cesty.
5. Ustůjte mediální tlak a krizi ve štábu.
6. Rozhodněte nominaci a sledujte osobní osudy všech pěti postav.

## Testovací cíl

Hráč by si měl zapamatovat nejméně dvě postavy, rozpoznat konkrétní reakci na své dřívější jednání a po závěru chtít otevřít alespoň jednu zamčenou cestu.

## Vývojové kontroly

- `npm test` spouští historickou regresní sadu a nový v0.18.1 kontrakt,
- CI sestaví offline balík,
- Playwright dokončí jednu celou rozvětvenou trasu na notebooku a mobilu,
- kontroluje se pět epilogů, metaprogrese, overflow a konzolové chyby.

Podrobnosti jsou v `docs/v0.18/v0180-vertical-slice.md` a `docs/v0.18/v0181-character-drama.md`.
