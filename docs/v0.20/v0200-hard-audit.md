# Koryto v0.20.0 — tvrdý audit v0.17.4

## Verdikt bez diplomacie

Stará hra neprohrává proto, že by neměla obsah nebo systémy. Prohrává proto, že má příliš mnoho polovičně propojených systémů, které hráč sleduje v panelech, ale málo je skutečně hraje ve scénách.

V kódu už existují dobré základy: třídy, d20, lokace, kauzy, společníci, vztahy, návraty rozhodnutí, adaptace Vladimíra Věčného, frakční plány, volby a koalice. Hráč je však většinou zažívá jako jednorázovou textovou událost se třemi tlačítky a následnou změnou několika čísel.

Hlavní chyba není nedostatek mechanik. Hlavní chyba je, že mechaniky nejsou uspořádány do čitelného D&D dobrodružství.

## Kořenové příčiny

1. **Hlavní obrazovka je administrativní dashboard.** Současně ukazuje kampaň, duši, družinu, vztahy, voliče, frakce, štáb, questy, zprávy, dluhy, plány, svět, ambice, soupeřovu operaci, Operaci SILO a inventář.
2. **Quest je většinou jediná událost, nikoli výprava.** Hráč přijde na lokaci, vybere jednu ze tří odpovědí, hodí a quest se často uzavře.
3. **Postava není dostatečně odlišná.** Šest tříd má dobré názvy, ale sdílí téměř stejný obsah a liší se hlavně číslem u hodu nebo jednou schopností.
4. **Družina existuje systémově, ale ne scénicky.** Loajalita, ambice a konflikty jsou přítomné, ale hráč si před questem nevytváří skutečnou aktivní skupinu a společníci málo vstupují do dialogu.
5. **D20 je časté, ale výsledek je převážně binární.** Datový model událostí pracuje hlavně s `success` a `fail`; drahý úspěch a komplikace vznikají dodatečným přepočtem, nikoli ručně napsanou scénou.
6. **Věčný reaguje pozdě a nepřímo.** Adaptace a vícekolové operace jsou dobrý základ, ale začínají hlavně ve střední části kampaně a hráč je čte v panelu místo osobního konfliktu.
7. **Technická architektura vrství opravy přes opravy.** Jeden dokument načítá desítky runtime a prezentačních vrstev od v0.14 po v0.17. `app.js` současně řeší svět, vztahy, debatu, UI, questy i soupeře.
8. **Hra nevede pozornost.** Hráč vidí mnoho relevantních údajů, ale není mu jasné, který z nich je právě rozhodující a co má konkrétně udělat.

# Audit systémů

## 1. Premisa, svět a tón — ZACHOVAT

**Co funguje:** Dolní Vejprnice jako fantasy svět české komunální politiky; JZD, radnice, hospoda, škola, louka, obecní médium, stadion a kulturní dům; humor názvů, popisů a důsledků.

**Proč:** Toto je nejsilnější identita projektu a přesně odpovídá schválené definici hry.

**Zásah:** Texty nevyhazovat. Editovat je do scén, dialogů, předmětů a lokálních vizuálních gagů.

**Priorita:** nedotknutelné jádro.

## 2. Celkový oblouk kampaně — ZACHOVAT A ZPŘESNIT

**Co funguje:** kandidatura → kauzy → družina → debata → volby → koalice.

**Problém:** Třináctidenní struktura dnes působí jako seznam termínů a denních uzávěrek, ne jako dobrodružná kapitola.

**Zásah:** Zachovat celý oblouk, ale rozdělit ho do kapitol. Čas postupuje hlavně dokončováním scén a questů. Standard jsou tři hlavní akce za den.

**Priorita:** P0.

## 3. Tvorba postavy — PŘEPSAT

**Současný stav:** jméno, jeden ze tří původů a šest tříd. Původ má malý dopad a osobnost postavy se po úvodu téměř neprojevuje.

**Nový stav:** vlastní postava s výrazným hlasem podle původu. Tvorba musí ukázat třídu, slabinu, preferovaný styl, zakázané nebo nákladné přístupy a první osobní motivaci.

**Povinné:** minimálně osm tříd v plné verzi; bizarní a objektivně slabší sestavy jsou povolené a komicky rozehrané.

**Priorita:** P0.

## 4. Atributy — PŘEPSAT

**Současný stav:** charisma, intellect, cunning, authority a resilience. Integrita je oddělená kampaňová statistika.

**Schválený stav:**

- charisma,
- inteligence,
- autorita,
- mediální talent,
- morálka,
- štěstí.

Každý atribut musí odemykat vlastní řešení a vlastní typ neúspěchu. Nestačí pouze přidat bonus k identické volbě.

**Priorita:** P0.

## 5. Třídy a specializace — PŘEPSAT MECHANICKY, ZACHOVAT FANTAZII

**Zachovat:** Populistický bard, Kmotrovský rogue, Lidový paladin, Dotační mág, Technokratický čaroděj a Stranický nekromant jako výchozí fantasy.

**Přepsat:** Třídy dnes převážně přidávají bonus nebo jednorázový efekt. Nově musí mít:

- unikátní aktivní schopnost,
- pasivní pravidlo,
- zásadní slabinu,
- vlastní možnosti v questech,
- vlastní kritické katastrofy,
- dvě až tři specializace,
- skutečně nedostupné volby.

Doplnit nejméně dvě další třídy. Pracovní kandidáti: Odborářský barbar a Liberální ranger; názvy nejsou zatím závazné.

**Priorita:** P0.

## 6. D20 systém — ZACHOVAT KOSTRU, PŘEPSAT VÝSLEDKY

**Zachovat:** d20, viditelnou obtížnost, známé bonusy, skryté modifikátory se stopou a dramatickou animaci.

**Přepsat:** Každá významná zkouška má čtyři ručně napsané výsledky:

1. kritický úspěch,
2. čistý úspěch,
3. úspěch za cenu,
4. komplikace.

Kritická jednička může vytvořit katastrofu, nový quest nebo dlouhodobou ostudu. Kritická dvacítka může dát unikátní předmět, perk, kontakt nebo absurdní přesah původního cíle.

Hod lze ovlivnit právě třemi schválenými cestami: aktivním společníkem, vybaveným předmětem a opakováním za cenu následku.

**Priorita:** P0.

## 7. Questy a kauzy — PŘEPSAT STRUKTURU, ZACHOVAT TÉMATA

**Zachovat témata:** registrace kandidátky, nafta z JZD, střecha školy, poslední louka, obecní zpravodaj, archiv, voda, noční rozpočet, debata, odpad a hlasovací lístky.

**Současný problém:** většina questů je jedna událost se třemi přístupy a okamžitým dokončením.

**Nový významný quest musí mít:**

- vstupní scénu,
- průzkum nebo přípravu,
- výběr dvou společníků,
- jeden vybavený předmět,
- dvě až čtyři zkoušky,
- nejméně jeden návrat předchozího rozhodnutí,
- několik řešení podle třídy, atributu a družiny,
- krátký epilog viditelný ve světě,
- délku přibližně 15–25 minut.

Aktivní stav: jeden hlavní a maximálně tři vedlejší questy.

**Priorita:** P0 pro registraci kandidátky a Krysy v JZD; P1 pro zbytek.

## 8. Tutorial a prvních dvacet minut — KOMPLETNĚ PŘEPSAT

Tutorial nesmí být soustava informačních oken. Hráč se má cítit ztracený v obci, nikoli ztracený v ovládání.

Povinný průběh:

1. tvorba postavy s jasnou třídní výhodou a slabinou,
2. příjezd na špatnou zastávku,
3. rozhlížení po obci bez časového postihu,
4. první d20 zkouška s postupem příběhu i při neúspěchu,
5. setkání se dvěma potenciálními společníky,
6. získání prvního absurdního předmětu,
7. quest registrace kandidatury,
8. první osobní reakce Vladimíra Věčného,
9. otevření kapitoly Krysy v JZD.

Hráč musí vždy vidět aktuální cíl, cenu akce a možné přípravy.

**Priorita:** P0 — první hratelný výstup v0.20.0.

## 9. Mapa a lokace — ZACHOVAT, OPRAVIT NAVIGACI

**Zachovat:** osm lokalit a mapovou identitu Dolních Vejprnic.

**Odstranit:** mapu jako rozcestník bez kontextu a panely obklopující svět.

**Nově:** mapa ukazuje hlavní cíl, maximálně tři vedlejší cíle, viditelné změny světa a jednu aktuální aktivitu Věčného. Kliknutí na lokaci předem ukáže cenu času, dostupné questy a doporučenou přípravu.

**Priorita:** P0.

## 10. Družina — ZACHOVAT POSTAVY, PŘEPSAT HRANÍ

**Zachovat:** Marii, Danielu, Brázdu, Bohumila a Holuba, jejich hodnoty, konflikty a osobní agendy.

**Současný problém:** družina je převážně seznam loajality, denní mise a jednorázové bonusy.

**Nově:**

- hráč bere standardně dva společníky na quest,
- velké výpravy mohou povolit třetího,
- společníci vstupují do dialogu a navrhují vlastní řešení,
- mohou odmítnout akci, hádat se, zradit, být zatčeni nebo se přidat k soupeři,
- nelze je ztratit natrvalo z celé hry; vracejí se v jiné roli,
- romantické linie jsou povolené,
- osobní quest mění schopnost i vztah, nikoli jen číslo loajality.

**Priorita:** P1, ale první společník musí fungovat už v tutorialu P0.

## 11. Vztahy a morálka — ZACHOVAT ZÁMĚR, OPRAVIT ZPĚTNOU VAZBU

**Zachovat:** vztahy mezi společníky, loajalitu, konflikty, politické dluhy, vydíratelnost a cenu špinavých rozhodnutí.

**Problém:** mnoho hodnot je skrytých nebo rozptýlených a hráč často neví, proč postava reagovala.

**Nově:** vztah se vysvětluje konkrétní vzpomínkou a posledním konfliktem. Morální volby nejsou označené, ale postavy, popisy a stopy musí umožnit předvídat riziko.

Pořadí ceny špinavé politiky:

1. ztráta důvěry,
2. politický dluh,
3. vydíratelnost,
4. skandál.

**Priorita:** P1.

## 12. Inventář a vybavení — PŘEPSAT

**Současný stav:** předměty fungují hlavně jako flagy, bonusy nebo podmínky v pozadí.

**Nově:** před questem lze vybavit omezený počet předmětů. Každý musí mít jasnou aktivní funkci, komický popis a alespoň jednu nečekanou nevýhodu. Některé předměty se mění podle výsledku hodu.

Předmět nesmí být jen `+2`. Musí měnit scénu, umožnit opakování, otevřít řešení nebo přijmout konkrétní cenu.

**Priorita:** P1; jeden předmět v tutorialu P0.

## 13. Čas a akce — OPRAVIT

**Současný stav:** třináct dní a dvě akce denně.

**Schválený stav:** tři hlavní akce denně. Čas postupuje podle scén a questů. Den končí kombinací vyčerpaných akcí, únavy, zavírací doby a termínů.

Rozhlížení v tutorialu a čtení dostupných informací nesmí spotřebovávat akci.

**Priorita:** P0.

## 14. Vladimír Věčný — ZACHOVAT SYSTÉMOVÝ NÁPAD, PŘEPSAT PREZENTACI

**Zachovat:** adaptaci na opakovaný styl hráče, unikátní protioperace a možnost porazit, zdiskreditovat, zatknout, přijmout do koalice nebo následovat Věčného.

**Problém:** systém se probouzí pozdě a jeho průběh se převážně čte v panelu.

**Nově:** Věčný se objeví osobně v prvních dvaceti minutách. Reaguje po významných questech, používá lokace a postavy a zanechává ve světě viditelnou stopu. Je prvním bossem, ne jediným nepřítelem hry.

**Priorita:** P0 pro první reakci, P1 pro plnou adaptaci.

## 15. Frakce, voličské bloky a Operace SILO — ZACHOVAT V POZADÍ, ZJEDNODUŠIT POVRCH

**Zachovat:** vnitřní simulaci frakcí, voličských bloků, konspirace a návratů rozhodnutí.

**Odstranit:** trvalé zobrazování všech procent, progress barů a kroků plánů na hlavní obrazovce.

Hráč má informace získávat přes lidi, mapu, zprávy, společníky a konkrétní stopy. Přesná čísla jsou dostupná v kronice nebo specializovaným třídám.

**Priorita:** P1.

## 16. Debata — PŘEPSAT POVRCH, ZACHOVAT BOSSFIGHT

**Zachovat:** vícekolový střet, záměr soupeře, reputaci, náladu sálu, pomoc družiny, třídní schopnost a d20.

**Přepsat:** Debata nesmí působit jako samostatná karetní hra. Současné „karty“ se změní na dialogové a třídní akce ve stejném RPG jazyce jako zbytek hry. Dostupné akce vycházejí z atributů, třídy, questových důkazů, společníků a slibů.

**Priorita:** P2 po dokončení hlavní kampaně.

## 17. Volby — ZACHOVAT VÝPOČET, OPRAVIT ČITELNOST

**Zachovat:** voličské skupiny, účast, vliv důvěry, tlaku, soupeřova momenta a dřívějších rozhodnutí.

**Problém:** výsledek je složitý matematický součet, jehož příčiny hráč obtížně čte.

**Nově:** volební noc ukáže pět až sedm největších příčin výsledku a konkrétní návraty questů. Výhra voleb nemusí vždy znamenat výhru příběhu.

**Priorita:** P2.

## 18. Koalice — ZACHOVAT JAKO ZÁVĚREČNÝ DUNGEON, PŘEPSAT INTERAKCI

**Zachovat:** patnáct mandátů, většinu osmi, různé koaliční bloky, důvěryhodnost, patronáž a tlak.

**Přepsat:** Koalice nesmí být tabulka nabídek. Musí být krátká série scén s lidmi, požadavky, předměty, důkazy, vztahy a d20. Předchozí dluhy a společníci musí vstupovat do místnosti.

**Priorita:** P2.

## 19. Save/load, determinismus a testy — ZACHOVAT

**Co funguje:** robustní normalizace starších savů, validace struktury, automatické ukládání, deterministický RNG a rozsáhlé regresní testy.

**Zásah:** Zachovat kompatibilitu prostřednictvím migrační vrstvy. Nový datový model nesmí dál rozšiřovat jediný obří objekt bez modulárních schémat.

**Priorita:** P0 technická pojistka.

## 20. UI shell — KOMPLETNĚ PŘEPSAT

Hlavní obrazovka smí vždy ukazovat jen pět povinných údajů:

- den a čas,
- zbývající akce,
- aktivní quest a aktuální cíl,
- reputaci,
- peníze.

Střed obrazovky patří scéně, mapě nebo dialogu. Družina, inventář, kronika a ostatní questy jsou dostupné jedním krokem, ale nejsou trvale otevřené.

Grafický směr: profesionálně dotažený styl v0.17.4, pixel-art a komiksová koláž jako jeho součásti. Ne nový vizuální žánr.

**Priorita:** P0.

## 21. Technická architektura — KOMPLETNĚ PŘEPSAT POSTUPNĚ

Současný build načítá dlouhou řadu historických runtime a UI vrstev. To zvyšuje riziko, že novější renderer opravuje nebo znovu přepisuje starší renderer.

Nový základ musí oddělit:

- datové definice,
- stav a migrace,
- d20 resolver,
- questový runtime,
- družinu,
- soupeře,
- svět a čas,
- UI scény.

Starý runtime se nemaže najednou. Nejprve se vytvoří nová modulární cesta pro tutorial a první kapitolu; zbytek kampaně zůstane přes kompatibilní adaptér funkční. Každá další kapitola se převede až po hratelném testu předchozí.

**Priorita:** P0.

# Pracovní odpověď na otázky 50 a 51

## Tři nedotknutelné pilíře

1. D&D smyčka: postava + družina + předmět + d20 + trvalý následek.
2. Satirický svět Dolních Vejprnic, jeho lokace, karikatury a kauzy.
3. Celá politická výprava: questy → debata → volby → koalice.

## Tři systémy ke kompletnímu přepsání

1. Hlavní UI a navigace pozornosti.
2. Struktura questové scény a čtyřstupňové výsledky hodů.
3. Atributy, třídy, původy a vývoj postavy.

# Pořadí implementace

## v0.20.0 — první hratelná kapitola

- nový modulární základ bez odstranění starého obsahu,
- nové atributy a první tři kompletně funkční třídy,
- nový tutorial a registrace kandidatury,
- první společník a první vybavitelný předmět,
- první osobní střet s Věčným,
- nový soustředěný UI shell,
- přechod do existující kapitoly Krysy v JZD.

## v0.20.1 až v0.20.3 — roleplaying a questy

- všech osm tříd,
- původy a osobnost,
- kompletní Krysy v JZD jako vícefázový quest,
- čtyři ručně psané výsledky každé významné zkoušky.

## v0.20.4 až v0.20.6 — družina a živý svět

- dva aktivní společníci,
- osobní dialogy, konflikty, zrada a romance,
- Věčného reakce a viditelné změny lokací,
- zjednodušené frakce a voličské informace.

## v0.20.7 až v0.20.10 — finále a kompletní audit

- debata v jednotném RPG systému,
- čitelné volby,
- scénická koalice,
- kompletní migrace kampaně,
- balance, mobil, save/load a dvě plné lidské kampaně.

# Gate pro v0.20.0

Build nesmí být označen jako hratelný, dokud ruční test nepotvrdí:

1. Hráč během prvních dvaceti minut ani jednou neřekne „nevím, co mám udělat“ kvůli rozhraní.
2. Rozhlížení po obci působí jako součást roleplayingu, nikoli jako hledání správného tlačítka.
3. Třída alespoň jednou otevře unikátní řešení a alespoň jednou něco znemožní nebo zdraží.
4. Neúspěšný hod posune děj a vytvoří zapamatovatelnou komplikaci.
5. Společník promluví, ovlivní hod a projeví vlastní názor.
6. Předmět změní scénu, nikoli jen číslo.
7. Věčný osobně zareaguje na hráčovo jednání.
8. Hlavní obrazovka neobsahuje administrativní dashboard.
9. Starý save lze migrovat nebo bezpečně otevřít v archivním režimu.
10. Hráč chce po otevření questu Krysy v JZD pokračovat.

Dokud neprojde tento gate, nepřidává se další kapitola, další třída ani grafické zdobení.