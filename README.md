# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální testovací verze

**v0.14.9 TEST.10 – bezpečná vizuální stabilizace**

Tato verze opravuje technickou chybu předchozího asset passu a vrací hru k původnímu tmavému vizuálnímu jazyku Koryta. Herní logika, save schema a offline spuštění přes `file://` zůstávají beze změny.

### Stav grafiky

- původní tmavé uhlové pozadí, tlumená mosaz, papírové plochy a redakčně-politická typografie jsou znovu výchozí,
- funkční obrazovky v0.14.8 zůstávají zachované, ale světlé dřevěné fantasy stylování je ve fallbacku potlačeno,
- bitmapový atlas portrétů je technicky validní,
- panorama vesnice je strukturálně poškozené (`truncated IDAT`) a je proto v karanténě,
- dokud nebude dodán schválený a validní art pack, hra bezpečně ponechá textové a emoji ikony místo rozbitých obrázků,
- současné bitmapy nejsou schválený finální art direction.

### Bezpečnost asset pipeline

Runtime před zapnutím obrazové vrstvy ověřuje:

- PNG signaturu,
- úplné hranice chunků,
- `IHDR`, rozměry a podporované parametry,
- přítomnost `IDAT` a koncového `IEND`,
- CRC každého PNG chunku,
- absenci trailing dat.

Jakákoli chyba ponechá původní funkční UI a nezakryje ikony ani text. I technicky validní bitmapy zůstávají vypnuté, dokud není výtvarný směr výslovně schválen.

## Hlavní soubory

- `src/v0149-assets/` – lokální chunky kandidátních bitmap,
- `src/v0149-pixel-assets.js` – validace PNG, karanténa a kanonické označení buildu,
- `styles/v0149.css` – bezpečný tmavý fallback v původním stylu Koryta,
- `tests/v0149-assets.mjs` – validní PNG, useknutý `IDAT`, špatné CRC, chybějící `IEND`, prohozené chunky a fallback.

## Kompatibilita

- build: `0.14.9-test.10`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

## Spuštění

Rozbalte ZIP a otevřete `index.html`. Hra funguje offline bez instalace, serveru, externích fontů nebo síťových assetů.

Diagnostika vizuální vrstvy je dostupná v konzoli přes `KorytoPixelAssets149.visualAudit()`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
