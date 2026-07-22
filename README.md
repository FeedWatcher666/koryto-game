# Koryto

Satiricke ceske politicke RPG o trinactidenni komunalni kampani v Dolnich Vejprnicich.

## Aktualni testovaci verze

**v0.14.6 TEST.10 - AI playtest a hluboke QA**

Tato verze pridava autonomni playtestovaci laborator, ktera umi hrat kampan jako osm rozdilnych typu hracu a porovnat vsech sest trid. Laborator meri trasy, questy, volby, udalosti, slepe stavy, dominantni rozhodnuti, balans trid a odolnost poskozenych savu.

### Iterace v0.14.6

- TEST.1: telemetrie rozhodnuti a tras.
- TEST.2: osm modelovych typu hracu.
- TEST.3: matice vsech sesti trid.
- TEST.4: questova uspesnost a terminy.
- TEST.5: pokryti udalosti a dominantni volby.
- TEST.6: chaos testy a poskozene savy.
- TEST.7: obsahovy a UX audit.
- TEST.8: oprava normalizace kolekci a neznamych questu.
- TEST.9: odemceni questu Posledni louka, koalicni doporuceni a vyvazeni predvolebniho specialu.
- TEST.10: 2400 kampani, release report a offline ZIP.

## Vysledek laboratore

- 2400 dokoncenych kampani z 2400.
- 8 hracskych archetypu.
- 6 trid.
- 2400 unikatnich tras.
- 95 ze 101 udalosti navstiveno, tedy 94,1 %.
- prumerny vysledek 32,4 % hlasu a 4,9 mandatu.
- rozdil prumerneho vysledku trid 5 procentnich bodu.
- zadny zbyvajici P1 ani P2 nalez.

Plny report je v `docs/v0.14/v0146-playtest-report.md`.

## Spusteni QA laboratore

Hru lze otevrit normalne pres `index.html`. Pro interni QA panel pridejte k URL parametr `?qa=1`. Laborator lze take volat z konzole:

```js
KorytoPlaytestLab.runLab({ runs: 400, seed: 146000 })
```

## Kompatibilita

- Save format: `koryto`.
- Save schema: `1`.
- Save verze: `0.14.3-test.2`.
- Historicke savy v0.09-v0.14 zustavaji podporovane.
- Build verze: `0.14.6-test.10`.

## Spusteni hry

Rozbalte ZIP a otevřete `index.html`. Hra nevyzaduje server ani instalaci.
