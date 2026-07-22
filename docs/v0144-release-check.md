# v0.14.4 TEST.10 – finální release kontrola

Tento dokument zaznamenává finální ověřovací bránu kumulativní série TEST.1 až TEST.10.

- build: `0.14.4-test.10`
- save verze: `0.14.3-test.2`
- save schema: `1`
- cílová větev: `test/v0.14.2-playable`
- `main` se nemění
- historické kompatibilní testy používají aktuální build metadata, nikoli změnu save kontraktu
- vydání vyžaduje zelený kompletní `npm test`, 1000 deterministických kampaní a ověřený offline ZIP
