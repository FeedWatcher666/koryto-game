# Koryto v0.17.4 TEST.1 — Style Stabilization Pass

## Cíl

Sjednotit kandidáta, mapu, kauzu, lokalitu, událost, výsledek, štáb a rychlé
ovládání pod jeden vizuální systém. Mapa Dolních Vejprnic zůstává zdrojem
pravdy pro materiály, rámečky, navigaci a primární zelené akce.

## Co se mění

- centrální design tokeny s prefixem `--k-`,
- společné prezentační třídy `.k-ui-panel`, `.k-ui-button` a jejich varianty,
- jednotný dřevěný rám, mosazné akcenty a pergamenový obsah,
- stejný top HUD a spodní navigace na mapě, kampani a štábu,
- detail kauzy už nepůsobí jako samostatná modrá aplikace,
- štáb používá stejné panely, záhlaví a aktivní stavy jako mapa,
- tvorba kandidáta používá stejnou panelovou hierarchii jako hra,
- rychlé ovládání je tematický overlay a neposouvá podklad,
- `MutationObserver` označí nově vykreslený povrch a komponenty ještě v
  mikrotasku po legacy renderu, bez časovaných vizuálních přepisů,
- audit `KorytoUI174.audit()` kontroluje aktivní povrch, overflow, sdílené
  komponenty a dosažitelnost primární akce.

## Co se nemění

- herní mechaniky,
- questy a jejich obsah,
- ekonomika a pravděpodobnosti,
- balance,
- save verze `0.14.3-test.2`,
- schema `1`.

## Ruční kontrola

Projít kandidáta, úvodní událost, mapu, detail kauzy, lokalitu, štáb a rychlé
ovládání na `1024 × 550`, `1366 × 768` a `1920 × 1080`. Výšky horního HUD a
spodní navigace se na jednotlivých herních površích nesmí měnit a panel
rychlého ovládání nesmí posunout podklad.
