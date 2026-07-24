# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální experimentální build

**v0.16.0 TEST.1 — Clean UI Rebuild**

Tato větev mění způsob grafické implementace, nikoli herní mechaniky. Hlavní mapová obrazovka se vykresluje v izolovaném komponentovém kořenu bez řetězení vizuálních skinů v0.14.8–v0.15.2.

### TEST.1 obsahuje

- nový společný horní HUD,
- levý panel aktivních kauz,
- čistou SVG mapu Dolních Vejprnic,
- osm živých a přístupných hotspotů,
- pravý panel rivala, frakcí a štábu,
- spodní navigaci,
- původní questy, lokace, handlery a save systém.

Ostatní obrazovky zatím používají stabilní legacy UI. Po schválení mapy budou stejné komponenty postupně použity pro události, štáb, debatu a koalici.

## Spuštění

Rozbalte release ZIP a otevřete `index.html`.

## Kompatibilita

- build: `0.16.0-test.1`
- save verze: `0.14.3-test.2`
- save schema: `1`

Podrobný technický kontrakt je v `docs/v0.16/v0160-clean-ui.md`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
