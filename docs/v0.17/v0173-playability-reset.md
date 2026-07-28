# Koryto v0.17.3 TEST.1 — playability reset

Třetí iterace řady v0.17 je blokující oprava hratelnosti. Ruční test na Retina
Macu odhalil, že screenshot široký přibližně 2048 fyzických pixelů odpovídá
viewportu jen kolem 1024 CSS pixelů a výšce přibližně 550 pixelů. Předchozí gate
začínal na 1280 × 720 a neověřoval tedy skutečné zařízení hráče.

## Nalezená příčina

- vrstva `v0169-viewport-lock` zamykala dokument na `100dvh`,
- tvorba kandidáta, mapa a postranní panely používaly několik vlastních scrollů,
- v0.17.1 na šířce nad 900 px vyžadovala minimálně 1114 px pro třísloupcovou mapu,
- pevná spodní navigace překrývala obsah na krátkém viewportu,
- automatický test dokazoval existenci tlačítek, ne jejich dosažitelnost.

## Oprava

- jedna přirozená svislá stránka namísto vnořených scrollů,
- čitelná dvousloupcová mapa `220 px / fluid` pro šířky 901–1180 px;
  panel soupeře pokračuje pod mapou místo třetího stlačeného sloupce,
- kompaktnější horní HUD pro běžný notebook,
- kandidátní karty bez interního ořezu,
- události a volby mohou přirozeně pokračovat pod první obrazovkou,
- rezerva pod pevnou navigací na desktopu i mobilu,
- nový audit `KorytoUI173`.

## Release gate

- nový cíl `1024 × 550`,
- kontrola, že hlavní akci lze po rolování dostat celou nad spodní navigaci,
- kontrola nulového překrytí hlavní akce navigací,
- kontrola odstranění vnořených scrollů z kritických povrchů,
- zachování tras 1366 × 768, 1280 × 720 a 390 × 844,
- úplný save/load roundtrip,
- save `0.14.3-test.2`, schema `1`.
