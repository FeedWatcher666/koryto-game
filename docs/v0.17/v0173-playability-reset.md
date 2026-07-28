# Koryto v0.17.3 TEST.1 — playable game-frame redesign

Třetí iterace řady v0.17 je blokující strukturální oprava hratelnosti. Ruční test
na Retina Macu ukázal, že předchozí rozhraní sice technicky obsahovalo ovládací
prvky, ale v reálném viewportu kolem `1024 × 550` CSS pixelů je skrývalo pod
okrajem, navigací nebo několika navzájem soupeřícími panely.

## Nalezená příčina

- mapa neměla stabilní prostor mezi horním HUDem a spodní navigací,
- událost ukázala příběh, ale samotné rozhodnutí až pod prvním viewportem,
- tvorba kandidáta vyžadovala rolování mezi povoláními, náhledem a potvrzením,
- lokality používaly velkou dekorativní plochu a akce odsouvaly dolů,
- automatický test si hlavní tlačítko sám odroloval do záběru, a tím problém skryl.

## Strukturální oprava

- desktop používá pevný herní rám: kompaktní HUD, jedna herní scéna a jedna
  navigace, bez dlouhého dokumentu,
- mapa zachovává současně aktivní kauzu, svět a tlak rivala i na `1024 × 550`,
- hlavní kauza dostává jedinou dominantní akci přímo pod mapou,
- událost drží příběhový kontext a všechny dostupné volby v prvním viewportu;
  delší text zůstává dostupný přes rozbalovací „Celý kontext události“,
- lokalita je rozdělena na scénu a samostatný seznam skutečně kliknutelných akcí,
- šest povolání tvoří mřížku `2 × 3` a tlačítko potvrzení je viditelné bez rolování,
- mobil používá vlastní portrétní mapu, vertikální volby a pětiprvkovou navigaci,
- nový audit `KorytoUI173` měří skutečnou viditelnost, ne pouze existenci v DOM.

## Co se nemění

- dvě akce za den a jejich spotřeba,
- penalizace za předčasné ukončení dne,
- questy, události, hody, balanc a pravděpodobnosti,
- save `0.14.3-test.2`, schema `1`.

## Release gate

- cíle `1366 × 768`, `1280 × 720`, `1024 × 550` a `390 × 844`,
- všech šest povolání a potvrzení viditelné bez rolování na desktopu,
- všechny dostupné volby události v prvním desktopovém viewportu,
- osm viditelných lokalit a jediná dominantní akce mapy,
- nulové překrytí hlavních akcí spodní navigací,
- událost → výsledek → mapa → potvrzení dne → lokalita,
- úplný save/load roundtrip,
- žádné vzdálené runtime závislosti.
