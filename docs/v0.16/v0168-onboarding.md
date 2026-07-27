# V0.16.8 TEST.1 — úvod a tvorba kandidáta

## Cíl

Převést první dvě obrazovky hry do stejného živého vizuálního systému jako mapa, štáb, kauzy, události, debata, volby a koalice. Hráč má ještě před prvním rozhodnutím rozumět délce kampaně, počtu akcí, cíli voleb a dopadům volby postavy.

## Implementace

- Úvod dostal kampaňový briefing s třináctidenní osou, dvěma akcemi denně a patnáctimandátovou radou.
- Původní tlačítko `startBtn` zůstává jediným zdrojem přechodu do tvorby postavy.
- Tři motivace používají původní select `origin`; nové karty pouze mění jeho skutečnou hodnotu a vyvolají standardní `change` událost.
- Šest původních tlačítek `data-class` zůstává zdrojem výběru povolání. Vrstva pouze doplňuje atributy, název schopnosti a stav `aria-pressed`.
- Kandidátní list živě čte jméno, vybrané povolání, motivaci a skutečné atributy z `KorytoCoreData.classes`.
- Původní `confirmBtn` a `newGame` zůstávají zdrojem vytvoření hry a aplikace výchozích bonusů.

## Mechaniky beze změny

- motivace `idealist`, `ambitious` a `revenge`,
- povolání `bard`, `rogue`, `paladin`, `mage`, `technocrat` a `necro`,
- atributy, třídní schopnosti a výchozí bonusy,
- save verze `0.14.3-test.2`, schema `1`,
- prolog a všechny navazující herní handlery.

## Responzivita a přístupnost

Desktop používá dvousloupcový úvod a třísloupcovou tvorbu kandidáta. Tablet přesouvá živý kandidátní list pod formulář. Mobil skládá vše do jednoho sloupce, zachovává minimální výšku ovládacích prvků 44 px a spodní safe area.

Vrstva nepoužívá síťové assety, CDN, `MutationObserver` ani periodický `setInterval`.
