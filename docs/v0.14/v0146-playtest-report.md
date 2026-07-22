# Koryto 0.14.6 TEST.10 - AI playtest report

- Runs: 2400
- Completed: 2400/2400
- Win rate: 32.4 %
- Average vote: 32.4 %
- Average seats: 4.9
- Route diversity: 2400
- Event coverage: 95/101 (94.1 %)
- Release ready: YES

## Profiles

| Profile | Runs | Win % | Vote % | Seats | Deadlocks | Wasted actions |
|---|---:|---:|---:|---:|---:|---:|
| novice | 300 | 58.3 | 34.5 | 5.2 | 0 | 341 |
| idealist | 300 | 91.3 | 40.9 | 6.2 | 0 | 0 |
| pragmatist | 300 | 36.7 | 45.2 | 6.8 | 0 | 122 |
| corrupt | 300 | 66 | 28.7 | 4.4 | 0 | 242 |
| chaotic | 300 | 3.7 | 21.6 | 3.3 | 0 | 1526 |
| questIgnoring | 300 | 0 | 26.7 | 4 | 0 | 937 |
| resourceMax | 300 | 1 | 27.9 | 4.2 | 0 | 0 |
| mobileMisclick | 300 | 2.3 | 34 | 5.1 | 0 | 818 |

## Classes

| Class | Runs | Win % | Vote % | Seats | Heat | Integrity |
|---|---:|---:|---:|---:|---:|---:|
| bard | 400 | 32.8 | 36.2 | 5.4 | 107.1 | 51.8 |
| rogue | 400 | 32.3 | 31.7 | 4.8 | 110.2 | 50 |
| paladin | 400 | 32.5 | 32.4 | 4.9 | 111.5 | 50.6 |
| mage | 400 | 33.8 | 31.5 | 4.8 | 110.9 | 50.1 |
| technocrat | 400 | 33.3 | 31.6 | 4.7 | 112.8 | 50.2 |
| necro | 400 | 30 | 31.2 | 4.7 | 113.2 | 50.5 |

## Quest completion

| Quest | Complete % | Fail % | Active | Locked |
|---|---:|---:|---:|---:|
| register | 100 | 0 | 0 | 0 |
| diesel | 82.1 | 17.9 | 0 | 0 |
| roof | 91.1 | 8.9 | 0 | 0 |
| meadow | 66.1 | 33.9 | 0 | 0 |
| paper | 76.2 | 23.8 | 0 | 0 |
| oldfiles | 70.5 | 29.5 | 0 | 0 |
| water | 28.3 | 71.8 | 0 | 0 |
| budget | 48.8 | 51.2 | 0 | 0 |
| debate | 53.2 | 46.8 | 0 | 0 |
| waste | 52 | 48 | 0 | 0 |
| ballots | 64.3 | 35.7 | 0 | 0 |

## Findings

No P1/P2 findings.

## Recommendations

No automatic recommendation.
## Opravene nalezy v TEST.8-TEST.10

- Normalizace savu uz pouzivala nemenny vychozi stav a opravuje spatne typy kolekci.
- Neplatne polozky v party, questech a dalsich mapach se odstrani nebo nahradi vychozi hodnotou.
- Neznamy quest se pri migraci odstrani.
- Quest `meadow` se odemyka pátý den a ma realny prostor pred terminem.
- Zacatecnik dostava citelne koalicni doporuceni; modelova uspesnost vzrostla z 1,3 % na 58,3 %.
- Riskantni cesta u `planPressSpecial` dostala skutecnou taktickou odmenu a nizsi obtiznost.
- Dominantni volba je hlasena jen pri dostatecnem vzorku protichudnych strategickych rodin.
