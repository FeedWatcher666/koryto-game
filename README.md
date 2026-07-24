# Koryto

Satirické české politické RPG o třináctidenní komunální kampani v Dolních Vejprnicích.

## Aktuální experimentální build

**v0.16.1 TEST.1 — Clean UI Layout Polish**

Tato větev mění způsob grafické implementace, nikoli herní mechaniky. Hlavní mapová obrazovka se vykresluje v izolovaném komponentovém kořenu bez řetězení vizuálních skinů v0.14.8–v0.15.2.

### TEST.1 obsahuje

- nový společný horní HUD,
- levý panel aktivních kauz,
- čistou SVG mapu Dolních Vejprnic,
- osm živých a přístupných hotspotů,
- pravý panel rivala, frakcí a klíčových lidí,
- kompaktní spodní navigaci,
- původní questy, lokace, handlery a save systém.

### Změny v0.16.1

- legacy aplikace je při aktivní nové mapě úplně skrytá, takže se nezobrazuje původní horní lišta ani patička,
- horní HUD a logo jsou nižší a nechávají více prostoru obci,
- levý a pravý panel jsou užší a mají jemnější vnitřní rámečky,
- cedule lokalit jsou menší, používají krátké názvy a vlastní ikony,
- klíčoví lidé zobrazují skutečné členy štábu nebo bezpečné náborové náhledy z herních dat,
- spodní navigace je přibližně o čtvrtinu nižší,
- mapa zůstává jediným novým master screenem; ostatní obrazovky stále používají stabilní legacy UI.

## Spuštění

Rozbalte release ZIP a otevřete `index.html`.

## Kompatibilita

- build: `0.16.1-test.1`
- save verze: `0.14.3-test.2`
- save schema: `1`

Technický základ je v `docs/v0.16/v0160-clean-ui.md`. Layout polish je popsán v `docs/v0.16/v0161-layout-polish.md`.

## Stav projektu

Projekt je soukromý a zatím bez licence. Zdrojový kód ani grafické podklady nejsou určeny k dalšímu šíření bez souhlasu vlastníka.
