# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální hratelný build

**v0.15.0 TEST.1 – vizuální identita a plně hratelná obecní mapa**

Tento build sjednocuje celou existující hru do tmavého dřevěno-pergamenového rozhraní podle schválených referencí. Herní logika, questy, debaty, volby, koalice, následky a uložené pozice zůstávají funkční. Hra běží kompletně offline po otevření `index.html`.

### Co je nové

- nový horní HUD s dnem, počasím, logem KORYTO, důvěrou, vlivem a penězi,
- levý panel aktivních kauz a pravý panel soupeře, vlivu a klíčových lidí,
- nová lokální ilustrovaná mapa Dolních Vejprnic s osmi funkčními místy,
- dřevěné panely, mosazné hrany, pergamenové titulky a barevně jednoznačné akce,
- nová spodní navigace pro mapu, questy, štáb, vliv, debatu, volby a archiv,
- společný skin pro události, debatu, koalici, volební noc a existující systémové obrazovky,
- systémové menu pro save/load, kroniku, novou hru a režimy čitelnosti,
- desktop, tablet a mobil, klávesový focus, vysoký kontrast, větší text a omezení animací,
- vizuální QA galerie přes `?visualqa=1`,
- žádné externí fonty, vzdálené obrázky ani síťové požadavky.

## Spuštění

1. Rozbalte ZIP.
2. Otevřete `index.html` v moderním prohlížeči.
3. Vytvořte kandidáta a zahajte třináctidenní kampaň.

Hru není nutné instalovat a nepotřebuje lokální server. Save pozice používají úložiště prohlížeče.

## Hlavní soubory v0.15

- `src/v0150-visual-foundation.js` – společný shell, skutečná data panelů, navigace, systémové menu a vizuální QA,
- `styles/v0150.css` – dřevo, mosaz, pergamen, responzivní layout a skin herních obrazovek,
- `assets/v0150/dolni-vejprnice.svg` – lokální mapa obce,
- `tests/v0150-visual-foundation.mjs` – kontrakt buildu, pořadí načítání, offline mapa a fallback runtime,
- `docs/v0.15/v0150-visual-identity.md` – závazný vizuální směr projektu.

## Kompatibilita

- build: `0.15.0-test.1`,
- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

## Diagnostika

V konzoli prohlížeče:

```js
KorytoVisual150.visualAudit()
```

Vizuální galerie:

```text
index.html?visualqa=1
```

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
