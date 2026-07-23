# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální testovací verze

**v0.14.9 TEST.10 – produkční pixel-artový asset pass**

Tato verze nahrazuje provizorní emoji vrstvu lokálními pixel-artovými assety, ale zachovává existující herní logiku, save schema a plně offline spuštění přes `file://`.

### Hlavní změny

- panorama Dolních Vejprnic pro mapu a scénické hlavičky,
- osm lokálních budov pro mapu,
- portréty šesti tříd kandidáta, členů štábu a Vladimíra Věčného,
- pixelové ikony navigace a mocenských bloků,
- sestavení PNG assetů z lokálních JavaScript chunků do datových URL bez síťových požadavků,
- bezpečný fallback na původní funkční UI, pokud assety nejsou dostupné,
- responzivní desktop, tablet a mobil,
- klávesový focus, minimální výška hlavních ovládacích prvků 48 px a podpora `prefers-reduced-motion`.

## Hlavní soubory

- `src/v0149-assets/` – lokální PNG chunky atlasu a vesnického panoramatu,
- `src/v0149-pixel-assets.js` – sestavení datových URL a napojení assetů na runtime,
- `styles/v0149.css` – sprite atlas, panorama, portréty, mapové uzly a responzivní pravidla,
- `tests/v0149-assets.mjs` – integrita PNG, pořadí offline načítání, CSS wiring a fallback.

## Kompatibilita

- build: `0.14.9-test.10`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

## Spuštění

Rozbalte ZIP a otevřete `index.html`. Hra funguje offline bez instalace, serveru, externích fontů nebo síťových assetů.

Diagnostika assetové vrstvy je dostupná v konzoli přes `KorytoPixelAssets149.visualAudit()`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
