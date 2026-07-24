# Koryto v0.16.1 TEST.1 – Layout Polish a mobilní kontrakt

## Cíl

Doladit schválený technický master screen mapy bez přidávání paralelního rendereru nebo zásahů do herní logiky. Desktop, tablet a mobil používají stejný živý DOM a stejné handlery; mění se pouze rozložení komponent.

## Vizuální zdroj pravdy

Při návrhu každého grafického prvku se vychází z vizuální identity projektu Koryto: tmavé vyřezávané dřevo, mosazné rámy, pergamen, teplé zlato, barevně rozlišené systémové ikony a satirická česká komunální atmosféra. Generované desktopové a mobilní master koncepty slouží jako art-direction reference, nikoli jako celoplošné runtime screenshoty.

## Změny

- původní `#app` je při aktivní mapě skrytý přes `display: none`, takže nevytváří duplicitní horní lištu, patičku ani prázdné místo,
- horní HUD byl snížen a logo zmenšeno, aby větší část obrazovky patřila obci,
- levý a pravý panel používají kompaktnější rámy a skutečná herní data,
- aktivní kauza dostala samostatný vizuální blok, termín, progress a původní lokaci,
- osm hotspotů používá krátké viditelné názvy, vlastní ikony, questové badge a plné přístupné názvy v `aria-label`,
- klíčoví lidé zobrazují členy aktuálního štábu; před jejich náborem bezpečné náhledy z `KorytoCompanionData`,
- desktopová spodní navigace má osm položek,
- mobilní navigace má pět velkých dotykových položek: Mapa, Kauzy, Štáb, Vliv a Další,
- Debata, Volby, Koalice a Archiv jsou na mobilu v samostatné vysouvací nabídce,
- mobilní pořadí obsahu je mapa → aktivní kauza → rival a strategie → klíčoví lidé,
- `viewport-fit=cover` a `safe-area-inset-bottom` chrání navigaci na telefonech s výřezem a domovským indikátorem,
- mapa zůstává čistým SVG bez zapečených panelů, textů a ovládacích prvků.

## Cílová rozlišení

### Desktop

- 1920 × 1080
- 1680 × 945
- 1440 × 900
- minimální podporovaná šířka třísloupcového layoutu: přibližně 1120 px

### Tablet

- 1366 × 1024 landscape
- 1024 × 768 landscape
- 834 × 1194 portrait
- pod 900 px se layout skládá vertikálně a mapa je první obsahový blok

### Mobil

- 430 × 932
- 390 × 844
- 375 × 812
- minimální cílová šířka 360 px
- samostatná korekce pro zařízení do 390 px
- dotykové akce mají minimálně 44 px

## Zachované kontrakty

- osm hotspotů volá původní `showLocation(id)`,
- ukončení dne volá původní `#endDayBtn`,
- navigace používá původní desky a handlery,
- save verze zůstává `0.14.3-test.2`,
- save schema zůstává `1`,
- žádný `MutationObserver`, periodický `setInterval`, CDN, externí font nebo síťový asset.

## Soubory

- `src/v0160-ui.js` – jediný čistý renderer a datový adaptér,
- `styles/v0160.css` – základní výtvarný systém,
- `styles/v0160-responsive.css` – responzivní rozložení stejného systému; nejde o další historický skin,
- `assets/v0160/dolni-vejprnice-map.svg` – čistá mapa bez UI.

## Rollback

Rollback baseline je stabilní commit `9575ae8650b09796fcaaffedf368b1fa52569cdd`. Odebrání `styles/v0160.css`, `styles/v0160-responsive.css`, `src/v0160-ui.js` a jejich referencí z `index.html` vrátí původní v0.14.9 rozhraní bez migrace uložených her.

## Další krok

Po ručním schválení desktopového i mobilního layoutu následuje v0.16.2: samostatná ilustrovaná mapa Dolních Vejprnic bez zapečeného UI. Současné živé hotspoty, panely a responzivní chování zůstanou zachované.
