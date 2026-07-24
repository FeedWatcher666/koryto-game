# Koryto v0.16.1 TEST.1 – Layout Polish

## Cíl

Doladit schválený technický master screen mapy bez přidávání dalších vizuálních vrstev nebo zásahů do herní logiky.

## Změny

- původní `#app` je při aktivní mapě skrytý přes `display: none`, takže nevytváří duplicitní horní lištu, patičku ani prázdné místo,
- horní HUD byl snížen z přibližně 112 px na 92 px,
- logo Koryto bylo zmenšeno přibližně o čtvrtinu,
- levý a pravý panel byly zúženy a vnitřní rámečky zeslabeny,
- spodní navigace byla snížena na 56 px,
- mapové hotspoty používají krátké viditelné názvy, vlastní ikony a plné přístupné názvy v `aria-label`,
- klíčoví lidé zobrazují členy aktuálního štábu; před jejich náborem používají bezpečné náhledy z `KorytoCompanionData`,
- mapa zůstává čistým SVG bez textů a ovládacích prvků.

## Zachované kontrakty

- osm hotspotů volá původní `showLocation(id)`,
- ukončení dne volá původní `#endDayBtn`,
- navigace používá původní desky a handlery,
- save verze zůstává `0.14.3-test.2`,
- save schema zůstává `1`,
- žádný `MutationObserver`, periodický `setInterval`, CDN, externí font nebo síťový asset.

## Rollback

Rollback baseline je stabilní commit `9575ae8650b09796fcaaffedf368b1fa52569cdd`. Odebrání `styles/v0160.css`, `src/v0160-ui.js` a jejich referencí z `index.html` vrátí původní v0.14.9 rozhraní bez migrace uložených her.

## Další krok

Po ručním schválení layoutu následuje v0.16.2: samostatná ilustrovaná mapa Dolních Vejprnic bez zapečeného UI. Současné živé hotspoty a panely nad ní zůstanou zachované.
