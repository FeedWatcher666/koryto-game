# Koryto v0.18.0 TEST.1 – Vertical Slice Reset

## Cíl

Nahradit dashboardový způsob hraní jedním jasným politickým příběhem, ve kterém hráč vždy rozumí aktuální situaci, dostupným rozhodnutím a okamžitým následkům.

## Hratelný obsah

- třídenní boj o vedení kandidátky v Dolních Vejprnicích,
- pět klíčových postav s vlastní motivací, hranicí a pamětí,
- čtyři hlavní zdroje: vliv, veřejná důvěra, peníze a energie,
- politické závazky a skryté riziko skandálu,
- šest hlavních scén a několik různých zakončení,
- okamžitá výsledková obrazovka po každé volbě,
- večerní souhrn vztahů, dluhů a hrozeb.

## Technické řešení

Nový povrch je izolovaný v `src/v0180-vertical-slice.js` a `styles/v0180-vertical-slice.css`. Starší systém zůstává v repozitáři a lze jej spustit přes `?legacy=1`. Nová hra používá samostatný klíč localStorage a nemaže starší save data.

## Testovací kontrakt

- statický test `tests/v0180-vertical-slice.mjs`,
- syntax check nového runtime,
- packaged Playwright gate pro 1024×550 a 390×844,
- kontrola nulového horizontálního overflow,
- kontrola prvního toku start → profil → briefing → následek → hlavní událost,
- bez vzdálených runtime závislostí.
