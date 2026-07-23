# Koryto v0.15 – závazná vizuální identita

## Stav dokumentu

Tento dokument je zdrojem pravdy pro vizuální směr Koryta od verze v0.15. Vznikl podle schválené sady referenčních obrazovek: obecní mapa Dolních Vejprnic, událost v hospodě, kauza Poslední louka, štáb, mapa vlivu, debata, archiv, volební noc a koaliční vyjednávání.

Reference určují **směr, kompozici, hustotu, materiály a hierarchii**, nejsou však hotovými assety k vložení do hry. Nesmí se použít jako jediný celoplošný obrázek, obkreslit jako neinteraktivní screenshot ani nahradit skutečné herní komponenty.

## Proč v0.15

v0.14.8 a v0.14.9 ověřily funkční komponentovou vizuální vrstvu a offline asset pipeline. Výsledný vzhled ale neodpovídá schválené identitě hry. v0.15 proto není kosmetická výměna několika obrázků. Je to řízené sjednocení všech obrazovek do jednoho čitelného, satirického a produkčně použitelného rozhraní.

Save kontrakt se nemění:

- save verze: `0.14.3-test.2`,
- save schema: `1`,
- historické savy v0.09–v0.14 zůstávají podporované.

Herní logika, questy, pravděpodobnosti, volby, následky, koalice a `campaignMemory` zůstávají zdrojem pravdy. Vizuální vrstva je pouze čte a ovládá existující veřejné handlery.

---

# 1. Identita Koryta

## 1.1 Jedna věta

**Komunální politické RPG z české obce, podané jako hutná dřevěná strategická deskovka s ručně stylizovaným pixel-artem, výraznými postavami a velmi čitelným rozhraním.**

## 1.2 Co Koryto je

- česká komunální politika, nikoli generické fantasy,
- satire s lidskými postavami a konkrétními místními problémy,
- strategické rozhraní s vysokou informační hustotou,
- dřevo, mosaz, pergamen, sklo, razítka, mapy a obecní kanceláře,
- pixel-artové ilustrace, které podporují funkční HTML UI,
- výrazné, jednoznačné akce a okamžitě čitelné důsledky,
- desktop-first zážitek, který se rozumně skládá na tablet a mobil.

## 1.3 Co Koryto není

- světlý generický dashboard,
- minimalistická SaaS aplikace,
- sada emoji na kartách,
- fantasy tavern UI bez českého politického kontextu,
- jedna velká AI ilustrace s falešnými tlačítky,
- screenshot vložený jako pozadí místo fungující hry,
- neonový cyberpunk ani mobilní free-to-play kasino,
- rozhraní závislé na síti, externím fontu nebo vzdáleném assetu.

---

# 2. Globální kompozice

## 2.1 Cílová desktopová kompozice

Primární referenční viewport je 16:9 kolem `1536 × 864`. UI se nesmí natvrdo uzamknout na jedinou velikost, ale na tomto viewportu má působit jako kompletní strategická obrazovka bez zbytečného scrollování.

Každá hlavní obrazovka používá stejný rám:

1. **Horní příčka**
   - vlevo den, datum, počasí a lokalita,
   - uprostřed dominantní logo KORYTO,
   - vpravo důvěra, vliv, peníze a nastavení.
2. **Levý informační sloupec**
   - kontext právě otevřené obrazovky,
   - aktivní kauzy, lidé, důkazy, frakce nebo výsledky.
3. **Střední jeviště**
   - největší plocha obrazovky,
   - mapa, událost, debata, časová osa, štáb nebo koaliční stůl.
4. **Pravý informační sloupec**
   - tlak soupeře, důsledky, rizika, vztahy nebo souhrn.
5. **Spodní akční lišta**
   - hlavní akce aktuální obrazovky,
   - stálá navigace pouze tam, kde neblokuje rozhodovací scénu.

## 2.2 Hierarchie

- Hráč musí do jedné sekundy poznat, **kde je**, **co je problém**, **co může udělat** a **co to stojí**.
- Primární akce má vždy nejsilnější barevný a prostorový důraz.
- Důležitá čísla se zobrazují textem i barevným stavem; nikdy pouze barvou.
- Levý a pravý sloupec nesmějí soupeřit s hlavním jevištěm.
- Každá obrazovka má právě jeden hlavní nadpis v pergamenové nebo dřevěné titulní ceduli.

## 2.3 Hustota

Reference jsou informačně bohaté, ale ne chaotické. Platí:

- panely mají viditelné skupiny a nadpisy,
- opakované řádky používají konzistentní výšku,
- ikony jsou doplněk, nikoli náhrada textu,
- dlouhé vysvětlení se zkracuje na jádro a detail se otevírá zvlášť,
- na desktopu se využívá šířka obrazovky; nesmí vzniknout úzký mobilní sloupec uprostřed monitoru.

---

# 3. Materiály a barevný jazyk

## 3.1 Základní materiály

### Tmavé dřevo

Použití: vnější rám, horní příčka, spodní navigace, těžké panely, rámy oken.

Vlastnosti:

- teplá tmavě hnědá,
- jemná textura prken nebo ručního opracování,
- výrazná vnitřní i vnější hrana,
- tmavý stín, nikoli měkký moderní drop shadow.

### Mosaz a zlato

Použití: šrouby, rohy, dělicí linky, zvýraznění, mince, logo.

Vlastnosti:

- tlumená zlatá, ne čistá žlutá,
- světlá horní hrana a tmavá spodní hrana,
- důležité prvky mohou mít teplejší zlatý akcent.

### Pergamen

Použití: titulní cedule, dopisy, požadavky, důsledky, delší texty.

Vlastnosti:

- teplá krémová,
- tmavě hnědý text,
- lehce nepravidelný okraj,
- dostatečný kontrast bez špinavého filtru přes text.

### Tmavý kov / sklo

Použití: statové lišty, sloty, vypnuté prvky, technické panely.

## 3.2 Doporučené tokeny

Skutečné hodnoty se mohou při implementaci mírně upravit podle assetů, ale význam tokenů musí zůstat stabilní.

```css
:root {
  --koryto-wood-950: #160c08;
  --koryto-wood-900: #24130d;
  --koryto-wood-800: #3a2116;
  --koryto-wood-700: #56351f;
  --koryto-wood-600: #7a4e2d;
  --koryto-brass-dark: #6c431c;
  --koryto-brass: #b57927;
  --koryto-gold: #e2ad2f;
  --koryto-gold-light: #ffd75a;
  --koryto-parchment: #e6ca95;
  --koryto-parchment-light: #f4e1b6;
  --koryto-ink: #2b1a12;
  --koryto-cream: #fff0cf;
  --koryto-success: #4aaE32;
  --koryto-success-dark: #1f6e22;
  --koryto-danger: #b5422f;
  --koryto-danger-dark: #6e211b;
  --koryto-info: #347ea7;
  --koryto-info-dark: #204c69;
  --koryto-purple: #7a43ad;
  --koryto-warning: #d69d25;
  --koryto-neutral: #777067;
}
```

## 3.3 Význam akčních barev

- **zelená** – potvrdit, přijmout, provést hlavní tah,
- **červená** – odmítnout, konflikt, destruktivní nebo vysoce riziková akce,
- **modrá** – vyjednávat, mluvit, zobrazit další informační krok,
- **zlatá** – systémová nebo dlouhodobě významná akce,
- **fialová** – politický vliv, soupeřova moc, kompromat,
- **šedá** – nedostupné, neutrální nebo neobsazené.

Barva musí být podpořena ikonou a textem.

---

# 4. Typografie

## 4.1 Role

- Logo KORYTO: masivní blokové písmo s tmavou extruzí a zlatým čelem.
- Hlavní názvy obrazovek: dekorativní český serif nebo robustní slab serif.
- Nadpisy panelů: kondenzované verzálky.
- Běžný text: čitelný sans-serif.
- Čísla ve statových lištách: tučné, tabulkové číslice, vysoký kontrast.

## 4.2 Offline pravidlo

- Žádný Google Fonts nebo síťový font.
- Lze použít systémové stacky nebo později přidat licenčně čistý lokální WOFF2.
- Bez lokálního fontu musí UI zůstat čitelné a nesmí se rozpadnout.

## 4.3 Minimální velikosti

- běžný desktopový text: 14–16 px,
- panelové nadpisy: 16–20 px,
- hlavní titulek: 28–42 px podle viewportu,
- primární tlačítko: nejméně 18 px,
- žádný důležitý text pod 12 px.

---

# 5. Komponentový systém

Vizuální identita se musí skládat z opakovaně použitelných DOM komponent. Minimální sada:

- `KorytoShell` – společný rám obrazovky,
- `KorytoTopBar` – den, logo, staty, nastavení,
- `KorytoSidePanel` – levý a pravý kontextový sloupec,
- `KorytoTitleBanner` – pergamenová titulní cedule,
- `KorytoPanel` – dřevěný nebo pergamenový panel,
- `KorytoStatBar` – důvěra, vliv, peníze, stabilita, stres,
- `KorytoActionButton` – green/red/blue/gold varianty,
- `KorytoPortrait` – portrét s fallbackem a stavem,
- `KorytoBadge` – upozornění, počet, deadline, riziko,
- `KorytoCard` – quest, důkaz, partner, operace, debatní karta,
- `KorytoBottomNav` – mapa, questy, štáb, debata, volby, archiv,
- `KorytoTooltip` nebo přístupný detailový popover,
- `KorytoModal` – rozhodovací nebo informační overlay.

Komponenty mají používat datové hodnoty z existujícího stavu. Nesmí vzniknout paralelní falešná data pouze pro vzhled.

---

# 6. Assetová architektura

## 6.1 Povolené assety

- samostatné lokální PNG/WebP pro velké scény,
- sprite atlas pro portréty a ikony,
- malé SVG pouze tam, kde zachovají pixelový vzhled a jsou offline,
- CSS rámy a devítidílné řezy pro škálovatelné panely,
- `image-rendering: pixelated` pro skutečný pixel-art.

## 6.2 Zakázané řešení

- jeden screenshot celé obrazovky,
- neviditelné HTML hotspoty položené na screenshotu,
- text napevno zapečený v obrázku tam, kde se má měnit,
- vzdálené URL,
- assety bez licenčního původu,
- automaticky generovaný text uvnitř obrázku jako součást funkčního UI,
- base64 chunky bez testované a zdokumentované nutnosti.

## 6.3 Fallback

Každý dekorativní asset musí mít čitelný fallback:

- portrét → barevná silueta/iniciála,
- mapa → funkční DOM mapa s názvy lokací,
- pozadí scény → materiálový gradient,
- ikona → textový label.

Chybějící art nesmí zablokovat hru.

---

# 7. Závazný kontrakt jednotlivých obrazovek

## 7.1 Mapa Dolních Vejprnic

Mapa je hlavní domovská obrazovka a první produkční vertikální řez.

Povinné prvky:

- centrální ilustrovaná obec s radnicí, hospodou, školou, redakcí, JZD, loukou a štábem,
- každá lokace je skutečné fokusovatelné tlačítko,
- vlevo aktivní kauza s důkazy a dalším seznamem kauz,
- vpravo tlak rivalů, aktuální strategie, malá mapa vlivu a klíčoví lidé,
- dole primární akce „Jít na tah“ a navigace,
- aktivní/urgentní/stavové značky jsou čitelné bez hoveru,
- mapa reaguje na skutečný den, questy a dostupnost lokací.

Zakázáno:

- zapečené názvy lokací do jednoho pozadí bez DOM ovládání,
- falešné hodnoty rivalů nebo questů,
- horizontální scroll na běžném desktopu.

## 7.2 Událost

- scénické pozadí konkrétní lokace,
- viditelný mluvčí a kandidát,
- centrální textový panel,
- 2–4 velké rozhodovací karty,
- okamžitý i dlouhodobý dopad,
- seznam lidí, kteří si rozhodnutí zapamatují,
- návrat do obce jako jasná sekundární akce.

## 7.3 Kauza

- dominantní ilustrace kauzy,
- deadline a důkazy,
- klíčoví svědci a zúčastněné strany,
- 3–4 odlišné přístupy,
- náklady, čas, riziko a očekávané důsledky,
- potvrzení je samostatná hlavní akce; výběr karty nesmí omylem ihned rozhodnout.

## 7.4 Štáb

- kandidát jako centrální karta,
- členové štábu s portrétem, rolí, loajalitou, stresem a rizikem,
- aktivní role a neobsazené pozice,
- týmová morálka a konflikty,
- akce „Nasadit“, „Promluvit“, „Vyřešit spor“ a přesun role,
- data z existujícího `party`, companion ambitions a vztahů.

## 7.5 Mapa vlivu

- centrální územní nebo mocenská mapa,
- jasné barvy vlastní/rival/neutral,
- frakce vlevo,
- rivalova strategie a operace vpravo,
- dostupné operace dole,
- odhad dopadu před potvrzením,
- hodnoty napojené na `campaignMemory.powerMap` a existující rival operation.

## 7.6 Debata

- kandidát a rival na skutečném jevišti,
- čas nebo počet tahů,
- sebevědomí, podpora a tlak,
- dostupné důkazy a aktivní pomoc štábu,
- pět hlavních typů karet: fakta, emoce, útok, obrana, důkaz,
- jasná primární akce „Zahrát tah“,
- reakce publika a informace o rivalovi,
- mechanika zůstává existující turn-based debatou.

## 7.7 Archiv a paměť

- časová osa kampaně,
- filtry kauzy/sliby/lidé/média/důsledky,
- každý řádek zobrazuje den, událost, kdo si ji pamatuje a dopad,
- souhrn slibů, důkazů, skandálů, vztahů a deadline,
- data pouze z `campaignMemory`, zpráv a existujících souhrnů.

## 7.8 Volební noc

- výsledky stran a mandáty,
- vizuální rozdělení zastupitelstva,
- mapa okrsků nebo ekvivalentní souhrn,
- emoce vlastního a opozičního tábora,
- koaliční matematika,
- jasný přechod do vyjednávání.

## 7.9 Koaliční vyjednávání

- centrální jednací stůl nebo rada partnerů,
- mandáty, důvěra a postoje partnerů,
- nabídka funkcí, peněz a programu,
- požadavky stran,
- stabilita, nákladovost a šance dohody,
- historie vyjednávání,
- jasné akce předložit nabídku / pokračovat / odejít.

---

# 8. v0.15.0 TEST.1 – scope prvního PR

První PR nezkouší přepsat všech devět obrazovek naráz. Dodá produkční vizuální základ a jeden kompletní vertikální řez.

## 8.1 Povinné změny

1. Zavést nové komponentové jádro v samostatném modulu, například:
   - `src/v0150-visual-foundation.js`,
   - `styles/v0150.css`.
2. Vytvořit jednotný globální shell:
   - dřevěný vnější rám,
   - horní HUD,
   - titulní cedule,
   - levý a pravý side panel,
   - spodní navigace.
3. Předělat hlavní mapu podle kapitoly 7.1.
4. Vytvořit znovupoužitelné komponenty panelu, stat bar, tlačítka, badge a portrétu.
5. Zachovat funkční starší UI jako fallback, pokud se nový shell nepodaří inicializovat.
6. Nepřepsat `src/app.js` a neměnit save schema.
7. Aktualizovat viditelný build na `0.15.0 TEST.1`, ale save metadata ponechat beze změny.
8. Přidat vizuální QA režim, například `?visualqa=1`, který zobrazí komponentovou galerii a stav assetů.

## 8.2 Co do TEST.1 nepatří

- nová herní mechanika,
- změna balancu,
- změna questových dat,
- úplné překreslení debaty, voleb a koalice,
- odstraňování historických vrstev bez charakterizačního testu,
- obří nerozdělený obrázek celé mapové obrazovky.

## 8.3 Dočasné použití na ostatních obrazovkách

Ostatní obrazovky mají v TEST.1 získat pouze:

- společný horní HUD,
- společný rám,
- společnou typografii,
- kompatibilní side-panel a button skin,
- beze změny své existující funkční vnitřní struktury.

To umožní pozdější postupnou migraci bez regresí.

---

# 9. Responzivita

## 9.1 Desktop ≥ 1280 px

- tři sloupce: levý panel / hlavní jeviště / pravý panel,
- horní lišta v jednom řádku,
- spodní navigace zůstává viditelná,
- hlavní obrazovka se ideálně vejde do viewportu.

## 9.2 Tablet 768–1279 px

- side panely lze zúžit nebo otevřít jako zásuvky,
- horní HUD může přejít do dvou řádků,
- hlavní akce zůstává bez scrollování dostupná,
- minimální dotykový cíl 48 px.

## 9.3 Mobil < 768 px

- jedna hlavní obsahová osa,
- levý a pravý panel jako samostatné přístupné zásuvky nebo sekce,
- logo a staty se zmenší, ale nezmizí,
- mapa může být vertikálně posuvná, nikoli mikroskopicky zmenšená,
- hlavní akce je sticky nad spodní navigací,
- žádný text ani tlačítko mimo viewport.

---

# 10. Přístupnost

Povinné:

- viditelný `:focus-visible`,
- ovládání klávesnicí,
- smysluplné labely a `aria-label` tam, kde ikona nemá text,
- minimálně 48 px pro hlavní ovládací prvky,
- stav nekomunikovat pouze barvou,
- podpora `prefers-reduced-motion`,
- vysoký kontrast a větší text musí fungovat i s novým skinem,
- dekorativní obrázky nesmějí zahlcovat čtečku,
- fokus se po otevření/zavření panelu nebo modalu správně přesune a vrátí.

---

# 11. Technická omezení

- statické HTML/CSS/JavaScript,
- plná funkčnost přes `file://`,
- žádný backend, bundler ani runtime síťová závislost,
- žádné externí fonty nebo obrázky,
- žádný `MutationObserver` pro plošné sledování aplikace,
- žádný periodický `setInterval` pro repaint UI,
- aktualizace přes existující handlery, explicitní refresh a koalescovaný `setTimeout` pouze tam, kde je nutný,
- žádné duplicitní DOM ID,
- žádné zhoršení migrace savů,
- žádná ztráta původních ovládacích akcí.

---

# 12. Testy a QA pro TEST.1

Přidat nový test, například `tests/v0150-visual-foundation.mjs`, který ověří:

1. verzi buildu a nezměněný save kontrakt,
2. načtení CSS a JS v korektním pořadí,
3. veřejné API vizuální vrstvy,
4. existenci všech základních komponentových tříd,
5. napojení mapy na skutečné lokace a stav questů,
6. fokusovatelnost a labely lokací,
7. přítomnost desktop/tablet/mobile breakpointů,
8. `prefers-reduced-motion` a `focus-visible`,
9. zákaz vzdálených URL,
10. zákaz `MutationObserver` a `setInterval`,
11. fallback bez dekorativních assetů,
12. zachování stávajících historických testů.

Vizuální QA musí obsahovat alespoň:

- shell na desktopu,
- shell na tabletu,
- shell na mobilu,
- všechny varianty tlačítek,
- statové lišty,
- side panely,
- mapu s nulovou, běžnou a urgentní kauzou,
- chybějící portrét/asset fallback,
- high contrast,
- large text,
- reduced motion.

---

# 13. Přijímací kritéria TEST.1

PR lze označit jako připravený pouze tehdy, když:

- hra na první pohled odpovídá dřevěno-pergamenové identitě Koryta,
- horní HUD, rám, panely, tlačítka a mapa tvoří jeden systém,
- mapa je plně interaktivní a napojená na skutečný stav,
- není použita jedna celoplošná obrazovka jako náhrada UI,
- všechny lokace, akce a navigace fungují myší i klávesnicí,
- desktop 1536×864 působí jako kompletní strategická obrazovka,
- tablet a mobil jsou použitelné bez překrytí a ztráty akcí,
- hra funguje offline z rozbaleného ZIPu,
- `npm test` je zelené,
- vznikne GitHub Actions artefakt `koryto-v0.15.0-test.1`,
- Codex review nemá otevřený P1/P2 nález,
- save verze zůstává `0.14.3-test.2` a schema `1`.

---

# 14. Roadmapa TEST.2–TEST.10

- **TEST.2:** události a rozhodovací karty,
- **TEST.3:** kauzy, důkazy a přístupy,
- **TEST.4:** štáb, role, loajalita a konflikty,
- **TEST.5:** mapa vlivu a operace rivalů,
- **TEST.6:** debata a karty argumentů,
- **TEST.7:** archiv, paměť a vztahy,
- **TEST.8:** volební noc a mandáty,
- **TEST.9:** koaliční vyjednávání,
- **TEST.10:** úplné responzivní sjednocení, art pass, přístupnost, offline release audit a playtest.

Každá iterace musí být kumulativní, samostatně testovatelná a nesmí rozbít předchozí obrazovky.

---

# 15. Definition of Done celé v0.15

v0.15 je dokončena, až když všechny hlavní obrazovky používají stejný shell, materiály, typografii, komponenty a stavový jazyk; všechny ilustrace podporují skutečnou interaktivitu; hra zůstává offline a kompatibilní se savy; a nový hráč bez vysvětlování pozná, že mapa, událost, štáb, vliv, debata, archiv, volby a koalice patří do jedné hry jménem Koryto.