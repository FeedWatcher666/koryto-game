# v0.20.0 TEST.1 — první implementační řez

Tento build není nový prototyp ani nový žánr. Je to původní kompletní Koryto v0.17.4 rozšířené o soustředěný D&D onboarding a jasné vedení hráče.

## Co zůstává beze změny

- původní mapa Dolních Vejprnic,
- původní questy a kauzy,
- původní družina a vztahy,
- Vladimír Věčný a jeho protiakce,
- debata, volby a koaliční dungeon,
- save/load kontrakt `0.14.3-test.2`, schema 1.

## Co TEST.1 mění

- zobrazuje šest schválených RPG atributů,
- převádí je do starých hodových pravidel bez odstranění obsahu,
- přidává krátký tutorial před původní hospodský prolog,
- učí první d20 zkoušku, úspěch za cenu a komplikaci,
- dává hráči první předmět a prvního společníka,
- zavádí tři akce za den,
- drží vždy viditelný aktuální cíl, riziko a čas,
- administrativní panely ve výchozím stavu skládá do volitelné kroniky.

## Release gate

PR musí zůstat draft, dokud:

1. neprojde kompletní historická regresní sada,
2. neprojde packaged browser gate na notebooku a mobilu,
3. ruční test nepotvrdí, že hráč rozumí prvním dvaceti minutám,
4. ruční test nepotvrdí, že nejde jen o další klikací formulář.
