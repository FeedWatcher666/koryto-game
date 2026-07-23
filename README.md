# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální testovací verze

**v0.14.9 TEST.10 – produkční pixel-art asset pass**

Hratelný vizuální systém v0.14.8 nyní používá skutečné lokální pixel-artové podklady. Atlas obsahuje portréty, budovy a ikony rozhraní; samostatné panorama zobrazuje Dolní Vejprnice na mapě a v obrazovkových scénách. Assety se při spuštění sestaví z lokálních JavaScriptových chunků do `data:` URL, takže fungují i při přímém otevření `index.html` přes `file://`.

### Hlavní změny

- vlastní pixel-artové panorama Dolních Vejprnic,
- osm lokálních budov pro mapu,
- portréty šesti tříd, členů štábu a Vladimíra Věčného,
- produkční ikony mapy, navigace a mocenských bloků,
- pixelový znak Koryta bez síťového assetu,
- art pass mapy, štábu, debaty, scén a volebního zakončení,
- responzivní desktop, tablet a mobil,
- klávesový focus, ovládací prvky nejméně 48 px a `prefers-reduced-motion`,
- interní vizuální audit přes `?visualqa=1`.

## Hlavní soubory

- `src/v0149-assets/` – pět lokálních PNG chunků pro atlas a panorama,
- `src/v0149-pixel-assets.js` – validace, sestavení datových URL a napojení assetů na runtime,
- `styles/v0149.css` – produkční pixel-artové styly a responzivní pravidla,
- `tests/v0149-assets.mjs` – kontrola PNG dat, pořadí načítání, offline wiring a runtime kontraktu,
- `docs/v0.14/v0149-asset-pass.md` – release a QA poznámky.

## Kompatibilita

- build: `0.14.9-test.10`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované,
- herní logika a save kontrakt se nemění.

## Spuštění

Rozbalte ZIP a otevřete `index.html`. Hra funguje offline bez instalace, serveru, externích fontů a síťových assetů.

Pro vizuální galerii a kontrolu assetů přidejte k adrese `?visualqa=1`. Replay audit v0.14.7 je dostupný přes `?replayqa=1` a playtestovací laboratoř v0.14.6 přes `?qa=1`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
