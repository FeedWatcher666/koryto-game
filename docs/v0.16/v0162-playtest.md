# Koryto v0.16.2 TEST.1 — Playable Map + Staff

## Účel

První ručně testovatelný build nového komponentového UI. Nasazuje schválený mapový art a obrazovku štábu bez změny questů, eventů, volebních výpočtů nebo save kontraktu.

## Funkční propojení

- hotspot mapy volá původní `showLocation(id)`,
- aktivní podpora zapisuje `state.selectedSupport`,
- mise zapisuje `state.partyAssignment`, `partyUsedDay` a únavu stejným kontraktem jako původní `dispatchCompanion`,
- osobní agenda vede do skutečné lokace postavy,
- otevřený konflikt volá původní konfliktový event,
- výsledek mise zpracuje původní `resolvePartyAssignment` při ukončení dne.

## Playtest režim

`index.html?playtest=1` zobrazí bezpečné tlačítko pro doplnění všech pěti členů štábu. Funkce není automatická a nemění save schema.

## Rollback

Odebrání `src/v0162-playtest.js`, `styles/v0162-playtest.css`, `assets/v0162/` a dynamického loaderu ve `src/v0161-interaction-guard.js` vrátí v0.16.1 mapový build.
