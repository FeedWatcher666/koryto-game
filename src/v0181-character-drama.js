(() => {
  'use strict';

  const BUILD = '0.18.1-test.1';
  const SAVE_KEY = 'koryto:v0180:vertical-slice';
  const META_KEY = 'koryto:v0181:meta';
  const LEGACY_SAVE_KEYS = ['koryto-save', 'korytoState', 'koryto-save-v1'];

  if (new URLSearchParams(window.location.search).get('legacy') === '1') {
    document.documentElement.classList.add('k181-legacy-mode');
    return;
  }

  const PEOPLE = {
    veteran: { name: 'Miloslav Koutný', role: 'stranický veterán', initials: 'MK', color: 'brass', goal: 'Udržet kontrolu nad místní organizací.', boundary: 'Nenechá se veřejně ponížit.', tells: 'Pamatuje si každou službu i každé odmítnutí.' },
    rival: { name: 'Vladimír Věčný', role: 'úřadující starosta', initials: 'VV', color: 'red', goal: 'Vyhrát nominaci bez otevřeného souboje.', boundary: 'Nikdy nepřizná, že něco potřebuje.', tells: 'Usmívá se jen tehdy, když už rozhodl za vás.' },
    journalist: { name: 'Klára Tichá', role: 'reportérka Vejprnického hlasu', initials: 'KT', color: 'blue', goal: 'Najít příběh, který prorazí za hranice obce.', boundary: 'Nesnese, když jí někdo vědomě lže.', tells: 'Mlčení považuje za druh odpovědi.' },
    donor: { name: 'Roman Bláha', role: 'majitel stavební firmy', initials: 'RB', color: 'green', goal: 'Získat vliv na plánovanou rekonstrukci školy.', boundary: 'Za své peníze očekává konkrétní výsledek.', tells: 'Nabídku vždy nazývá pomocí obci.' },
    conscience: { name: 'Marie Novotná', role: 'vedoucí kampaně', initials: 'MN', color: 'paper', goal: 'Dokázat, že lze vyhrát bez úplného sebezničení.', boundary: 'Odejít umí. Jen to neříká předem.', tells: 'Sleduje rozdíl mezi tím, co říkáte, a co děláte.' }
  };

  const PROFILES = {
    idealist: { name: 'Idealista', copy: 'Vyšší důvěra, méně peněz. Lidé vám věří, dokud je nezklamete.', resources: { influence: 10, trust: 58, money: 10, energy: 4 }, relations: { conscience: 12, journalist: 5 } },
    operator: { name: 'Operátor', copy: 'Více vlivu a peněz. Každý ale předpokládá, že něco sledujete.', resources: { influence: 18, trust: 42, money: 22, energy: 4 }, relations: { veteran: 8, donor: 7 } },
    outsider: { name: 'Outsider', copy: 'Silná veřejná důvěra, slabé vazby uvnitř strany.', resources: { influence: 7, trust: 64, money: 14, energy: 4 }, relations: { rival: -8, journalist: 8 } },
    insider: { name: 'Insider', copy: 'Znáte staré účty a začínáte s důkazem. Všichni ale vědí, že jste byl součástí systému.', resources: { influence: 17, trust: 35, money: 16, energy: 4 }, relations: { veteran: 5, rival: -4, journalist: -3 }, flags: ['insider_start', 'evidence_contract'], unlockAfter: 1 }
  };

  const CHOICE_REACTIONS = {
    priority_party: { veteran: '„Dobře. Takže rozumíte tomu, jak se věci skutečně dělají.“', conscience: 'Marie si do poznámek napsala první otazník.' },
    priority_media: { journalist: '„Dostanete prostor. Ne imunitu.“', veteran: 'Miloslav článek označil za zbytečné předvádění.' },
    priority_money: { donor: 'Roman vám okamžitě začal tykat.', conscience: 'Marie se poprvé zeptala, kdo bude platit účet později.' },
    accept_offer: { rival: '„Věděl jsem, že jste rozumný člověk.“', conscience: 'Marie se na podpis dívala déle než na vás.', journalist: 'Klára si poznamenala přesný čas vaší návštěvy radnice.' },
    expose_offer: { rival: 'Věčný už nepředstírá zdvořilost.', journalist: '„Teď mi dejte dokumenty, ne další slogan.“', conscience: 'Marie vám poprvé bez váhání kryje záda.' },
    collect_evidence: { rival: 'Věčný věří, že vás koupil.', journalist: 'Klára poznala, že jí dávkujete jen část pravdy.', conscience: 'Marie slyší lež, i když není určena jí.' },
    send_intermediary: { veteran: 'Miloslav si z vaší opatrnosti udělal vlastní mandát.', rival: 'Věčný neví, zda jste slabý, nebo nebezpečný.' },
    promise_school: { donor: '„Teď už si rozumíme.“', conscience: 'Marie přestala říkat Romanovým penězům dar.' },
    resist_donor: { donor: 'Roman se přestal usmívat dřív, než zavřel dveře.', conscience: 'Marie poprvé uvěřila, že umíte odmítnout snadnou cestu.' },
    release_documents: { journalist: '„Tohle už není komentář. Tohle je příběh.“', rival: 'Věčný začal hledat, kdo vás pustil ke smlouvám.' },
    turn_attack: { journalist: 'Klára odvysílala váš útok, ale oddělila ho od vlastních zjištění.', conscience: 'Marie slyšela kampaň tam, kde čekala pravdu.' },
    share_recording: { conscience: 'Marie si poslechla i část, kde souhlasíte vy.', rival: 'Věčný stále netuší, že existuje nahrávka.' },
    hide_recording: { conscience: 'Marie poznala, že jste něco vynechal.', rival: 'Věčný má pocit, že drží iniciativu.' },
    honor_intermediary: { veteran: 'Miloslav začal mluvit o vašem společném vítězství.', conscience: 'Marie se ptá, kdy přesně jste mu dali právo vyjednávat.' },
    cut_intermediary: { veteran: 'Miloslav vám neodpustí veřejné odříznutí.', journalist: 'Klára zaznamenala, že jste odmítl vlastní zákulisí.' },
    tell_truth: { journalist: '„Nejste čistý. Ale tentokrát jste nelhal.“', conscience: 'Marie zůstala v místnosti i po skončení hovoru.' },
    controlled_leak: { journalist: 'Klára ví, že chybí stránky.', rival: 'Věčný poprvé ztratil kontrolu nad titulkem.' },
    deny_everything: { journalist: 'Klára poděkovala příliš klidným hlasem.', conscience: 'Marie si uložila kopii vašich slov.' },
    confess_staff: { conscience: '„Neodpouštím vám. Zůstávám, abyste to neudělal znovu.“', veteran: 'Miloslav pochopil, že Marie získala právo veta.' },
    demand_loyalty: { conscience: 'Marie dokončí dnešní práci. Zítřejší už neslíbila.', veteran: 'Miloslav ocenil, že jste ukázal hierarchii.' },
    offer_power: { conscience: '„Dobře. Ale tentokrát to bude napsané.“', veteran: 'Miloslav zjistil, že část moci už není k dispozici.' },
    clean_speech: { conscience: 'Marie stojí v první řadě. Ruce nemá založené.', rival: 'Věčný se směje jen do chvíle, než sál ztichne.' },
    cash_machine: { donor: 'Roman už během hlasování poslal fakturu.', journalist: 'Klára fotografuje mikrobus i registrační značku.' },
    use_evidence: { rival: 'Věčný přestal mluvit a začal volat právníkovi.', journalist: 'Klára ví, že jste právě spálil zdroj i most.' },
    veteran_deal: { veteran: 'Miloslav rozděluje funkce ještě před výsledkem.', conscience: 'Marie pochopila, že program byl jen vyjednávací měna.' }
  };

  const SCENES = {
    morning_one: {
      type: 'briefing', day: 1, kicker: 'PONDĚLÍ · 07:40 · ZADNÍ SALONEK HOSPODY', title: 'První den, první dluh', speaker: 'conscience',
      body: 'Za tři dny se rozhodne, kdo povede kandidátku. Máte čas na jedinou skutečnou prioritu. Všechno ostatní mezitím udělá někdo jiný — pravděpodobně proti vám.',
      line: (state) => `„${escapeHtml(state.candidateName)}, dnes nezjistíme, jestli jste dobrý člověk. Jen čemu dáte přednost, když nemůžete zachránit všechno.“`,
      interjections: [{ person: 'veteran', text: '„Delegáti nečtou program. Čtou, kdo jim volal jako poslední.“' }],
      choices: [
        { id: 'priority_party', label: 'Zajistit stranické delegáty', detail: 'Miloslav otevře dveře, ale zapíše si laskavost.', risk: 'Závazek', effects: { influence: 6, trust: -1, energy: -1 }, relations: { veteran: 7, conscience: -1 }, flags: ['priority_party'], obligation: 'Miloslav očekává místo pro svého člověka.', result: 'Delegáti z horního konce obce začali zvedat telefony. Ne zadarmo.', next: 'mayor_offer' },
        { id: 'priority_media', label: 'Získat veřejnost', detail: 'Klára vám dá prostor, pokud jí řeknete něco skutečného.', risk: 'Odhalení', effects: { trust: 6, influence: -1, energy: -1 }, relations: { journalist: 7, veteran: -2 }, flags: ['priority_media'], result: 'Na webu Vejprnického hlasu visí váš profil. Starosta ho četl dvakrát.', next: 'mayor_offer' },
        { id: 'priority_money', label: 'Sehnat peníze na kampaň', detail: 'Roman zaplatí tisk, ale nebude to dar bez adresy.', risk: 'Protislužba', effects: { money: 12, trust: -2, energy: -1 }, relations: { donor: 8, conscience: -3 }, flags: ['priority_money'], obligation: 'Roman chce vliv na rekonstrukci školy.', result: 'Tiskárna dostala zálohu. Roman dostal vaše soukromé číslo.', next: 'mayor_offer' }
      ]
    },
    mayor_offer: {
      type: 'event', day: 1, kicker: 'PONDĚLÍ · 11:25 · RADNICE', title: 'Nabídka, která se neodmítá', speaker: 'rival', memory: ['rival', 'journalist', 'conscience'],
      body: 'Vladimír Věčný nabízí klid: stáhnete kandidaturu, získáte placené místo v komisi a příští rok možná židli místostarosty. Na stole leží návrh smlouvy ke sportovní hale. Částky nesedí.',
      line: (state) => `„Pane ${escapeHtml(state.candidateName)}, politika není o tom, co chcete. Je o tom, co vám ostatní dovolí přežít.“`,
      interjections: (state) => state.flags.includes('priority_media') ? [{ person: 'journalist', text: 'Klára čeká před radnicí. Věčný si toho všiml.' }] : [{ person: 'conscience', text: 'Marie vám pod stolem poslala jedinou zprávu: NEPODEPISUJ.' }],
      choices: [
        { id: 'accept_offer', label: 'Přijmout dohodu a hrát o čas', detail: 'Okamžitě získáte vliv a peníze. Vznikne kompromitující stopa.', risk: 'Vysoké riziko', cost: '1 energie', effects: { influence: 8, money: 8, trust: -5, energy: -1 }, relations: { rival: 12, conscience: -10, journalist: -4 }, flags: ['accepted_mayor_deal', 'hall_contract_seen'], obligation: 'Věčný očekává stažení kandidatury před sněmem.', scandal: 16, result: 'Podepsali jste jen převzetí podkladů. Věčný se ale tváří, jako by vlastnil i váš podpis.', next: 'donor_visit' },
        { id: 'expose_offer', label: 'Odmítnout a zveřejnit nabídku', detail: 'Veřejnost ocení jasný střet. Stranická organizace začne panikařit.', risk: 'Otevřená válka', cost: '1 energie', effects: { trust: 10, influence: -5, money: -2, energy: -1 }, relations: { rival: -18, journalist: 10, veteran: -8, conscience: 7 }, flags: ['public_war', 'hall_contract_seen'], scandal: 4, result: 'Klára má nahrávku. Do večera už nejde o nominaci, ale o přežití celé místní organizace.', next: 'press_storm' },
        { id: 'collect_evidence', label: 'Předstírat souhlas a sbírat důkazy', detail: 'Získáte páku, ale lžete současně soupeři i vlastnímu štábu.', risk: 'Skryté riziko', cost: '1 energie', effects: { influence: 4, trust: -2, energy: -1 }, relations: { rival: 5, journalist: 2, conscience: -4 }, flags: ['double_game', 'evidence_contract'], scandal: 10, result: 'Telefon zůstal nahrávat. Na záznamu je víc, než jste čekali — včetně vašeho vlastního souhlasu.', next: 'night_recording' },
        { id: 'send_intermediary', label: 'Poslat prostředníka a držet odstup', detail: 'Bez přímého závazku, ale také bez úplné kontroly nad tím, co zazní.', risk: 'Nejistota', cost: '4 000 Kč · 1 energie', condition: (state) => state.resources.money >= 4, locked: 'Potřebujete alespoň 4 000 Kč.', effects: { money: -4, influence: 3, energy: -1 }, relations: { veteran: 4, rival: -2, conscience: 1 }, flags: ['used_intermediary'], result: 'Miloslav se vrátil s větou: „Nic jsem neslíbil.“ Od něj to není uklidňující informace.', next: 'veteran_warning' }
      ]
    },
    donor_visit: {
      type: 'route', route: 'deal', day: 1, kicker: 'PONDĚLÍ · 16:20 · PARKOVIŠTĚ ZA ŠKOLOU', title: 'Cena za klid', speaker: 'donor', memory: ['donor', 'conscience'],
      body: 'Roman Bláha už ví o vaší schůzce s Věčným. Nabízí, že zaplatí zbytek kampaně a pomůže „srovnat očekávání“ delegátů. Chce jen slyšet, že rekonstrukce školy nepůjde do otevřené soutěže.',
      line: '„Já nekupuju politiky. Já investuju do lidí, kteří chápou realitu.“',
      choices: [
        { id: 'promise_school', label: 'Přislíbit Romanovi zakázku', detail: 'Získáte silný finanční polštář a dalšího majitele svého vítězství.', risk: 'Korupční spirála', effects: { money: 14, influence: 5, trust: -7, energy: -1 }, relations: { donor: 14, conscience: -10 }, flags: ['school_promised'], obligation: 'Roman má dostat rekonstrukci školy bez otevřené soutěže.', scandal: 14, result: 'Roman vám potřásl rukou oběma dlaněmi. Marie si rozhovor nahrála pro sebe.', next: 'evening_one' },
        { id: 'resist_donor', label: 'Vrátit peníze a odmítnout další obchod', detail: 'Oslabíte kampaň, ale Věčný ztratí jistotu, že vás lze vlastnit.', risk: 'Finanční nouze', effects: { money: -8, trust: 8, influence: -2, energy: -1 }, relations: { donor: -15, conscience: 10, rival: -3 }, flags: ['donor_refused'], scandal: -4, result: 'Roman odjel bez rozloučení. Do hodiny volal Věčnému.', next: 'evening_one' }
      ]
    },
    press_storm: {
      type: 'route', route: 'war', day: 1, kicker: 'PONDĚLÍ · 17:05 · REDAKCE', title: 'Válka potřebuje první titulek', speaker: 'journalist', memory: ['journalist', 'rival', 'conscience'],
      body: 'Klára má vaši nahrávku, ale bez smluv bude článek působit jako osobní spor. Chce všechny podklady. Vaši lidé mezitím připravili agresivní video, které by mohlo Věčného zasáhnout ještě dnes.',
      line: '„Rozhodněte se: chcete pravdu, nebo jen vyhrát první večer?“',
      choices: [
        { id: 'release_documents', label: 'Předat všechny dokumenty', detail: 'Ztratíte kontrolu nad tempem kauzy, ale příběh bude stát na důkazech.', risk: 'Neřízená exploze', effects: { trust: 9, influence: -2, energy: -1 }, relations: { journalist: 12, rival: -10, conscience: 5 }, flags: ['documents_released', 'evidence_contract'], scandal: -3, result: 'Klára zamkla redakci a vypnula telefon. Věčný svolal mimořádnou radu.', next: 'evening_one' },
        { id: 'turn_attack', label: 'Vypustit útočné video', detail: 'Převezmete pozornost, ale zaměníte důkazy za kampaň.', risk: 'Polarizace', effects: { influence: 9, trust: -4, money: -3, energy: -1 }, relations: { journalist: -7, rival: -13, conscience: -3 }, flags: ['attack_video'], scandal: 5, result: 'Video má tisíce zhlédnutí. Podklady ke smlouvě už nikoho nezajímají tolik jako váš výraz v poslední větě.', next: 'evening_one' }
      ]
    },
    night_recording: {
      type: 'route', route: 'evidence', day: 1, kicker: 'PONDĚLÍ · 22:15 · AUTO PŘED ŠTÁBEM', title: 'Nahrávka má dvě ostří', speaker: 'conscience', memory: ['conscience', 'rival'],
      body: 'Marie objevila nahrávku z radnice. Je na ní Věčný, nabídka i váš hlas, který předstírá souhlas až příliš přesvědčivě. Chce vědět, zda jste měl v plánu říct jí pravdu.',
      line: '„Nepotřebuju čistého kandidáta. Potřebuju vědět, jestli lžete i mně.“',
      choices: [
        { id: 'share_recording', label: 'Předat Marii celý záznam', detail: 'Získá nad vámi páku, ale zároveň se stane skutečným spojencem.', risk: 'Sdílené tajemství', effects: { trust: 5, influence: -1, energy: -1 }, relations: { conscience: 15, rival: -2 }, flags: ['marie_has_recording'], obligation: 'Marie rozhodne, kdy lze nahrávku použít.', scandal: -2, result: 'Marie si soubor zkopírovala. Pak smazala otázku, zda má odejít.', next: 'evening_one' },
        { id: 'hide_recording', label: 'Tvrdit, že záznam není použitelný', detail: 'Udržíte kontrolu nad důkazem. Marie si zapamatuje tón vašeho hlasu.', risk: 'Osobní zrada', effects: { influence: 5, trust: -5, energy: -1 }, relations: { conscience: -14, rival: 2 }, flags: ['recording_hidden'], scandal: 8, result: 'Marie přikývla. Ne proto, že vám uvěřila.', next: 'evening_one' }
      ]
    },
    veteran_warning: {
      type: 'route', route: 'machine', day: 1, kicker: 'PONDĚLÍ · 18:40 · GARÁŽ KULTURNÍHO DOMU', title: 'Prostředník si vzal víc moci', speaker: 'veteran', memory: ['veteran', 'conscience', 'journalist'],
      body: 'Miloslav přiznává, že Věčnému naznačil vaše možné stažení výměnou za tři místa na kandidátce. Tvrdí, že bez takové nabídky by jednání nemělo smysl. Chce, abyste jeho verzi veřejně potvrdil.',
      line: '„Poslal jste mě vyjednávat. Ne recitovat vaše morální pochybnosti.“',
      choices: [
        { id: 'honor_intermediary', label: 'Krýt Miloslavovu dohodu', detail: 'Získáte delegáty a zdědíte závazek, který jste nikdy nevyslovil.', risk: 'Stará struktura', effects: { influence: 10, trust: -5, energy: -1 }, relations: { veteran: 13, conscience: -7 }, flags: ['veteran_authorized'], obligation: 'Tři místa na kandidátce patří Miloslavovým lidem.', scandal: 5, result: 'Miloslav už večer rozdával pořadová čísla na kandidátce.', next: 'evening_one' },
        { id: 'cut_intermediary', label: 'Veřejně jeho slib odmítnout', detail: 'Přijdete o část aparátu, ale ukážete, že prostředník není váš majitel.', risk: 'Vnitřní rozkol', effects: { trust: 8, influence: -6, energy: -1 }, relations: { veteran: -18, journalist: 5, conscience: 6 }, flags: ['veteran_cut_off'], result: 'Miloslav odešel zadním vchodem. Předním už čekala Klára.', next: 'evening_one' }
      ]
    },
    evening_one: { type: 'summary', day: 1, kicker: 'PONDĚLÍ · 23:10 · VOLEBNÍ ŠTÁB', title: 'Obec už reaguje', body: 'Dnešek nevytvořil jen čísla. Vytvořil verze vás samotného, které si jednotliví lidé odnesli domů.', speaker: 'conscience', next: 'journalist_call' },
    journalist_call: {
      type: 'event', day: 2, kicker: 'ÚTERÝ · 08:05 · TELEFONÁT', title: 'Klára zná část příběhu', speaker: 'journalist', memory: ['journalist', 'donor', 'rival', 'conscience'],
      body: 'Reportérka se ptá na smlouvu ke sportovní hale. Má dvě faktury, jméno Romanovy firmy a informaci, že jste byli včera na radnici. Nabízí vám možnost reagovat před zveřejněním.',
      line: (state) => state.flags.includes('accepted_mayor_deal') ? '„Byl jste na radnici a Roman už volá radním. Když mi teď zalžete, článek bude hlavně o vás.“' : state.flags.includes('public_war') ? '„Nahrávku mám. Potřebuju vědět, jestli bojujete proti systému, nebo jen proti Věčnému.“' : '„Některé stránky chybí. Otázka je, jestli je schovává Věčný, nebo vy.“',
      choices: [
        { id: 'tell_truth', label: 'Popsat pravdu včetně vlastní role', detail: 'Ztratíte část kontroly, ale Klára vám uvěří i příště.', risk: 'Bolestivá čistota', effects: { trust: 8, influence: -2, energy: -1 }, relations: { journalist: 12, conscience: 7, rival: -8, donor: -6 }, flags: ['truth_to_press'], scandal: -5, result: 'Článek vás nešetří, ale rozlišuje mezi chybou a korupcí. To je v Dolních Vejprnicích skoro luxus.', next: 'staff_crisis' },
        { id: 'controlled_leak', label: 'Dát jí jen část důkazů', detail: 'Příběh nasměrujete na Věčného. Zbytek může vyplout později.', risk: 'Odložený výbuch', effects: { influence: 5, trust: 2, energy: -1 }, relations: { journalist: 4, rival: -10, conscience: -2 }, flags: ['controlled_leak'], scandal: 5, result: 'První text míří na starostu. Klára si ale všimla, že některé stránky chybí.', next: 'staff_crisis' },
        { id: 'deny_everything', label: 'Všechno popřít', detail: 'Krátkodobě zabráníte titulku. Pokud má Klára nahrávku, cena bude vysoká.', risk: 'Kritické riziko', effects: { trust: -8, influence: 2, energy: -1 }, relations: { journalist: -15, conscience: -8, rival: 3 }, flags: ['lied_to_press'], scandal: 14, result: 'Klára poděkovala za jasné stanovisko. Hlas měla příliš klidný.', next: 'staff_crisis' }
      ]
    },
    staff_crisis: {
      type: 'event', day: 2, kicker: 'ÚTERÝ · 14:30 · VOLEBNÍ ŠTÁB', title: 'Marie pokládá poslední otázku', speaker: 'conscience', memory: ['conscience', 'veteran'],
      body: 'Vaše vedoucí kampaně chce vědět, zda může před lidmi dál tvrdit, že nehrajete stejnou hru jako Věčný. Neptá se na strategii. Ptá se, jestli má zůstat.',
      line: (state) => state.flags.includes('recording_hidden') ? '„Nejde už o to, co jste udělal na radnici. Jde o to, že jste mi pak lhal do očí.“' : state.flags.includes('school_promised') ? '„Roman dnes volal, jakou barvu má mít nová fasáda školy. My ještě ani nevyhráli.“' : '„Řekněte mi jednu větu, kterou budu moci zítra zopakovat bez studu.“',
      choices: [
        { id: 'confess_staff', label: 'Říct jí všechno', detail: 'Marie zůstane. Získá ale právo zastavit jednu budoucí dohodu.', risk: 'Sdílená kontrola', effects: { trust: 4, influence: -1, energy: -1 }, relations: { conscience: 15, veteran: -2 }, flags: ['marie_knows_all'], obligation: 'Marie může vetovat jednu zákulisní dohodu.', scandal: -2, result: 'Marie si sundala kabát a znovu otevřela notebook. Neodpustila vám. Rozhodla se vás hlídat.', next: 'congress' },
        { id: 'demand_loyalty', label: 'Požadovat loajalitu bez vysvětlování', detail: 'Udržíte hierarchii. Možná ne člověka.', risk: 'Rozpad štábu', effects: { influence: 5, trust: -5, energy: -1 }, relations: { conscience: -18, veteran: 5 }, flags: ['marie_alienated'], scandal: 4, result: 'Marie dokončila dnešní plán. Pak si přeposlala všechny pracovní soubory na soukromý e-mail.', next: 'congress' },
        { id: 'offer_power', label: 'Nabídnout jí skutečný podíl na moci', detail: 'Marie získá vliv na program a personální rozhodnutí.', risk: 'Trvalý závazek', effects: { influence: -2, trust: 7, energy: -1 }, relations: { conscience: 10, veteran: -7 }, flags: ['shared_power'], obligation: 'Marie dostane právo schvalovat klíčové nominace.', result: 'Poprvé za dva dny se usmála. Miloslav ne.', next: 'congress' }
      ]
    },
    congress: {
      type: 'finale', day: 3, kicker: 'STŘEDA · 18:00 · KULTURNÍ DŮM', title: 'Hlasování o kandidátce', speaker: 'veteran',
      body: 'Delegáti jsou na místech. Věčný má aparát, vy máte příběh — a několik lidí, kteří vědí, co jste kvůli němu udělali. Poslední tah určí nejen výsledek, ale i cenu vítězství.',
      line: (state) => state.relations.veteran >= 8 ? '„Ještě jednu dohodu a máte to. Otázka je, zda vám po ní něco zůstane.“' : '„Myslel jste, že stačí mít pravdu. Teď zjistíte, kolik hlasů pravda skutečně má.“',
      interjections: (state) => [{ person: 'conscience', text: state.relations.conscience >= 5 ? 'Marie sedí v první řadě a čeká, zda dodržíte poslední slib.' : 'Místo vedle Marie je prázdné.' }, { person: 'rival', text: 'Věčný zdraví delegáty jménem. U některých zná i jejich dluhy.' }],
      choices: [
        { id: 'clean_speech', label: 'Postavit se před ně bez další dohody', detail: 'Výsledek rozhodne důvěra, vztahy a to, zda vám štáb ještě věří.', risk: 'Čistý střet', effects: { trust: 5 }, relations: { conscience: 3, journalist: 2 }, flags: ['clean_finale'], result: 'Mluvíte bez papíru. V sále je poprvé skutečné ticho.', next: 'ending' },
        { id: 'cash_machine', label: 'Spustit poslední placenou mobilizaci', detail: 'Peníze přivezou delegáty i pochybnosti.', risk: 'Drahé vítězství', condition: (state) => state.resources.money >= 8, locked: 'Potřebujete alespoň 8 000 Kč.', effects: { money: -8, influence: 7, trust: -4 }, relations: { donor: 7, journalist: -3 }, flags: ['paid_mobilization'], scandal: 4, result: 'Mikrobus přijel přesně. Stejně přesně přijde později faktura.', next: 'ending' },
        { id: 'use_evidence', label: 'Položit na stůl kompromitující důkaz', detail: 'Věčného zlomíte. Otázka je, kdo další se při pádu sveze.', risk: 'Nezvratné', condition: (state) => state.flags.includes('evidence_contract') || state.flags.includes('truth_to_press') || state.flags.includes('controlled_leak'), locked: 'Nemáte použitelný důkaz ani připravenou mediální stopu.', effects: { influence: 10, trust: -1 }, relations: { rival: -25, journalist: 5, veteran: -5 }, flags: ['evidence_used'], scandal: 5, result: 'Věčný přestal přerušovat řečníky. Začal telefonovat právníkovi.', next: 'ending' },
        { id: 'veteran_deal', label: 'Dát Miloslavovi slíbené místo', detail: 'Delegáti se seřadí. Program se začne rozpadat ještě před hlasováním.', risk: 'Koryto', condition: (state) => state.relations.veteran >= 4 || state.flags.includes('priority_party'), locked: 'Miloslav vám nevěří natolik, aby ručil za výsledek.', effects: { influence: 12, trust: -7 }, relations: { veteran: 12, conscience: -8 }, flags: ['patronage_finale'], obligation: 'Miloslavův člověk musí dostat placenou funkci.', result: 'Hlasování ještě nezačalo, ale Miloslav už rozdává úkoly jako vítěz.', next: 'ending' }
      ]
    }
  };

  const ROUTES = {
    deal: { name: 'Cesta dohody', teaser: 'Co se stane, když Věčný uvěří, že vás koupil?' },
    war: { name: 'Otevřená válka', teaser: 'Jak vypadá kauza, kterou přestanete řídit?' },
    evidence: { name: 'Dvojí hra', teaser: 'Komu svěříte nahrávku, na které kompromitujete i sebe?' },
    machine: { name: 'Stranický aparát', teaser: 'Co slíbí prostředník, když mu nedáte přesné hranice?' }
  };

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
  const deepCopy = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  function baseState() { return { build: BUILD, phase: 'start', sceneId: 'morning_one', profile: null, candidateName: 'Bohuslav Korytář', day: 1, resources: { influence: 10, trust: 50, money: 14, energy: 4 }, relations: { veteran: 0, rival: 0, journalist: 0, donor: 0, conscience: 0 }, memories: {}, flags: [], obligations: [], scandal: 0, history: [], lastResult: null, selectedChoice: null, completionRegistered: false }; }
  function baseMeta() { return { completedRuns: 0, endings: [], routes: [], choices: [] }; }
  let state = baseState();
  let meta = loadMeta();
  let root;
  let announce;

  function loadMeta() { try { return { ...baseMeta(), ...JSON.parse(localStorage.getItem(META_KEY) || '{}') }; } catch { return baseMeta(); } }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {} }
  function hasLegacySave() { return LEGACY_SAVE_KEYS.some((key) => { try { return Boolean(localStorage.getItem(key)); } catch { return false; } }); }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
  function restore() { try { const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (!parsed || !['0.18.0-test.1', BUILD].includes(parsed.build) || !parsed.resources || !parsed.relations) return false; state = { ...baseState(), ...parsed, build: BUILD, memories: parsed.memories || {}, completionRegistered: parsed.completionRegistered || false }; return true; } catch { return false; } }
  function relationLabel(value) { if (value >= 15) return 'spojenec'; if (value >= 5) return 'nakloněný'; if (value <= -15) return 'nepřítel'; if (value <= -5) return 'nedůvěřuje'; return 'vyčkává'; }
  function metric(label, value, suffix = '') { return `<div class="k180-metric"><span>${label}</span><strong>${value}${suffix}</strong></div>`; }
  function personAvatar(personId, large = false) { const person = PEOPLE[personId]; return `<span class="k180-avatar k180-avatar--${person.color}${large ? ' k180-avatar--large' : ''}" aria-hidden="true">${person.initials}</span>`; }
  function scene() { return SCENES[state.sceneId]; }
  function valueOf(value) { return typeof value === 'function' ? value(state) : value; }
  function routeId() { if (state.flags.includes('accepted_mayor_deal')) return 'deal'; if (state.flags.includes('public_war')) return 'war'; if (state.flags.includes('double_game')) return 'evidence'; if (state.flags.includes('used_intermediary')) return 'machine'; return null; }

  function applyProfile(profileId) {
    const profile = PROFILES[profileId];
    if (!profile || (profile.unlockAfter && meta.completedRuns < profile.unlockAfter)) return;
    state.profile = profileId;
    state.resources = deepCopy(profile.resources);
    for (const [personId, delta] of Object.entries(profile.relations || {})) state.relations[personId] = delta;
    for (const flag of profile.flags || []) if (!state.flags.includes(flag)) state.flags.push(flag);
    state.phase = 'scene';
    persist();
    render();
  }
  function choiceAvailable(choice) { return typeof choice.condition !== 'function' || choice.condition(state); }
  function reactionText(personId, delta, choiceId) {
    return CHOICE_REACTIONS[choiceId]?.[personId] || (delta > 0 ? `${PEOPLE[personId].name} si zapamatoval, že jste tentokrát stál na jeho straně.` : `${PEOPLE[personId].name} si zapamatoval, že jste jeho zájem obětoval.`);
  }
  function applyChoice(choiceId) {
    const current = scene();
    const choice = current.choices.find((item) => item.id === choiceId);
    if (!choice || !choiceAvailable(choice)) return;
    const before = deepCopy(state.resources);
    const relationBefore = deepCopy(state.relations);
    for (const [key, delta] of Object.entries(choice.effects || {})) state.resources[key] = clamp(state.resources[key] + delta);
    for (const [personId, delta] of Object.entries(choice.relations || {})) state.relations[personId] = clamp(state.relations[personId] + delta, -30, 30);
    for (const flag of choice.flags || []) if (!state.flags.includes(flag)) state.flags.push(flag);
    if (choice.obligation && !state.obligations.includes(choice.obligation)) state.obligations.push(choice.obligation);
    state.scandal = clamp(state.scandal + (choice.scandal || 0));
    state.history.push({ sceneId: state.sceneId, choiceId, day: current.day });
    state.day = Math.max(state.day, current.day || state.day);
    state.selectedChoice = choiceId;
    const relationChanges = Object.entries(state.relations).map(([key, value]) => ({ key, delta: value - relationBefore[key] })).filter((item) => item.delta !== 0);
    const reactions = relationChanges.map(({ key, delta }) => ({ key, delta, text: reactionText(key, delta, choiceId) }));
    for (const reaction of reactions) state.memories[reaction.key] = reaction.text;
    for (const personId of current.memory || []) if (!state.memories[personId] && CHOICE_REACTIONS[choiceId]?.[personId]) state.memories[personId] = CHOICE_REACTIONS[choiceId][personId];
    state.lastResult = {
      title: choice.label,
      text: choice.result,
      next: choice.next,
      deltas: Object.entries(state.resources).map(([key, value]) => ({ key, delta: value - before[key] })).filter((item) => item.delta !== 0),
      relations: relationChanges,
      reactions,
      obligation: choice.obligation || null,
      scandal: choice.scandal || 0
    };
    if (!meta.choices.includes(choiceId)) meta.choices.push(choiceId);
    saveMeta();
    state.phase = 'result';
    persist();
    render();
    announce.textContent = `Rozhodnutí provedeno: ${choice.label}.`;
  }
  function continueFromResult() {
    const next = state.lastResult?.next;
    if (next === 'ending') {
      state.phase = 'ending';
      state.lastResult = null;
      registerCompletion();
    } else {
      state.sceneId = next;
      state.day = SCENES[next]?.day || state.day;
      state.phase = SCENES[next]?.type === 'summary' ? 'summary' : 'scene';
      state.lastResult = null;
    }
    state.selectedChoice = null;
    persist();
    render();
  }
  function continueSummary() { const next = scene().next; state.sceneId = next; state.day = SCENES[next].day; state.resources.energy = 4; state.phase = 'scene'; persist(); render(); }

  function endingData() {
    const averageAlliance = Object.values(state.relations).reduce((sum, value) => sum + value, 0) / 5;
    const score = state.resources.influence + state.resources.trust * 0.7 + averageAlliance - state.scandal * 0.55;
    const won = score >= 55;
    const clean = state.scandal < 14 && !state.flags.includes('patronage_finale') && !state.flags.includes('lied_to_press') && !state.flags.includes('school_promised');
    const controlled = state.relations.conscience >= 5;
    if (won && clean && controlled) return { id: 'clean_win', badge: 'VÍTĚZSTVÍ BEZ KAPITULACE', title: 'Kandidátku vedete vy. A zatím ještě i sám sebe.', text: 'Delegáti zvolili změnu, protože jste dokázali vytvořit koalici důvěry, nikoli pouze dluhů. Věčný prohrál hlasování, ale neodešel z politiky.', tone: 'good', won };
    if (won) return { id: 'pyrrhic_win', badge: 'PYRRHOVO VÍTĚZSTVÍ', title: 'Vyhráli jste nominaci. Teď začíná splácení.', text: 'Kandidátka je vaše, ale lidé kolem vás už drží účty, nahrávky a přísliby. Moc jste získali. Svobodu rozhodovat zatím ne.', tone: 'warning', won };
    if (!won && state.resources.trust >= 55) return { id: 'movement_loss', badge: 'PROHRA, KTERÁ OTEVŘELA DVEŘE', title: 'Delegáti zvolili Věčného. Obec ale začala poslouchat vás.', text: 'Aparát přežil. Veřejnost však poprvé viděla, jak místní moc funguje. Klára chystá pokračování a vaše kampaň se mění v občanské hnutí.', tone: 'neutral', won };
    return { id: 'removed', badge: 'ODSTAVENÍ', title: 'Prohráli jste hlasování i kontrolu nad vlastním příběhem.', text: 'Věčný zůstal, Marie odešla a vaši dočasní spojenci našli nový projekt. V kronice místní organizace jste vedeni jako krátká personální komplikace.', tone: 'bad', won };
  }
  function registerCompletion() {
    if (state.completionRegistered) return;
    const ending = endingData();
    const route = routeId();
    meta.completedRuns += 1;
    if (!meta.endings.includes(ending.id)) meta.endings.push(ending.id);
    if (route && !meta.routes.includes(route)) meta.routes.push(route);
    state.completionRegistered = true;
    saveMeta();
  }
  function personEpilogue(personId, ending) {
    const relation = state.relations[personId];
    if (personId === 'conscience') {
      if (relation >= 10) return { title: 'Marie zůstala', text: state.flags.includes('shared_power') ? 'Má vlastní podpisové právo a poprvé není jen svědomím cizí kampaně.' : 'Neodpustila vám všechno. Získala ale důvod hlídat, co uděláte s mocí.', tone: 'good' };
      if (relation <= -10) return { title: 'Marie odešla', text: 'Vzala si kopie pracovních souborů. Ne jako pomstu — jako pojistku.', tone: 'bad' };
      return { title: 'Marie vyčkává', text: 'Ještě pracuje pro vás. Už ale nemluví o naší kampani.', tone: 'neutral' };
    }
    if (personId === 'journalist') {
      if (state.flags.includes('lied_to_press')) return { title: 'Klára má druhý text', text: 'První článek byl o Věčném. Pokračování bude o vaší lži.', tone: 'bad' };
      if (relation >= 8) return { title: 'Klára vám věří podmíněně', text: 'Nechrání vás. Jen rozlišuje mezi člověkem, který selhal, a člověkem, který lže.', tone: 'good' };
      return { title: 'Klára stále skládá příběh', text: 'Několik stránek jí chybí. Ví však přesně, u koho je hledat.', tone: 'neutral' };
    }
    if (personId === 'rival') {
      if (state.flags.includes('evidence_used')) return { title: 'Věčný volá právníkům', text: 'Jeho kariéra neskončila. Jen se přesunula z pódia do zákulisí a soudních kanceláří.', tone: 'bad' };
      if (ending.won) return { title: 'Věčný plánuje návrat', text: 'Porážku nazývá dočasným nedorozuměním delegátů.', tone: 'neutral' };
      return { title: 'Věčný zůstal u moci', text: 'Při děkovné řeči ani jednou nevyslovil vaše jméno. Nemusel.', tone: 'bad' };
    }
    if (personId === 'veteran') {
      if (state.flags.includes('patronage_finale') || state.flags.includes('veteran_authorized')) return { title: 'Miloslav už vybírá kancelář', text: 'Vaše vítězství považuje za společný majetek. Především za svůj.', tone: 'warning' };
      if (relation <= -8) return { title: 'Miloslav přešel k Věčnému', text: 'Tvrdí, že vždy stál na straně stability. Fotografie říkají něco jiného.', tone: 'bad' };
      return { title: 'Miloslav počítá další hlasování', text: 'Výsledek respektuje. Poměr sil nikoli.', tone: 'neutral' };
    }
    if (state.flags.includes('school_promised')) return { title: 'Roman poslal návrh smlouvy', text: 'Ve složce je i vizualizace nové školy. Soutěž v ní nikde není.', tone: 'warning' };
    if (relation <= -8) return { title: 'Roman financuje opozici', text: 'Pomoc obci se přesunula k někomu vstřícnějšímu.', tone: 'bad' };
    return { title: 'Roman čeká na návratnost', text: 'Každý dar má podle něj splatnost. Jen ne vždy datum.', tone: 'neutral' };
  }

  function topbar() {
    const dayText = state.phase === 'start' || state.phase === 'profile' ? 'PROLOG' : `DEN ${state.day}/3`;
    return `<header class="k180-topbar"><div class="k180-brand"><span class="k180-brand-mark" aria-hidden="true">K</span><div><small>SATIRICKÉ POLITICKÉ RPG</small><strong>KORYTO <em>v0.18.1</em></strong></div></div><div class="k180-day">${dayText}</div><div class="k180-metrics" aria-label="Zdroje kampaně">${metric('Vliv', state.resources.influence)}${metric('Důvěra', state.resources.trust, '%')}${metric('Peníze', state.resources.money, 'k')}${metric('Energie', state.resources.energy)}</div><div class="k180-tools"><button class="k180-icon-button" type="button" data-action="save">Uložit</button><button class="k180-icon-button" type="button" data-action="load">Načíst</button><a class="k180-icon-button" href="?legacy=1">v0.17</a></div></header>`;
  }
  function startView() {
    const progress = meta.completedRuns ? `<div class="k181-meta-progress"><strong>Vaše předchozí kampaně</strong><span>${meta.endings.length}/4 konců · ${meta.routes.length}/4 cest</span>${meta.completedRuns >= 1 ? '<em>Nově odemčen profil Insider</em>' : ''}</div>` : '';
    return `<main class="k180-start"><section class="k180-start-copy"><p class="k180-kicker">KAPITOLA S PAMĚTÍ</p><h1>Moc má vždycky cenu. Lidé si pamatují komu jste ji nechal zaplatit.</h1><p class="k180-lead">Za tři dny se rozhodne, kdo povede kandidátku. Tentokrát se cesty skutečně rozcházejí a postavy vám na konci vystaví osobní účet.</p><div class="k180-start-promises"><span>4 odlišné prostřední kapitoly</span><span>Konkrétní vzpomínky postav</span><span>4 konce a odemykatelný profil</span></div>${progress}<button class="k180-primary" type="button" data-action="open-profile">Vstoupit do kampaně</button>${hasLegacySave() ? '<p class="k180-legacy-note">Starší kampaň zůstává dostupná přes v0.17.</p>' : ''}</section><aside class="k180-start-scene"><div class="k180-scene-people">${personAvatar('rival', true)}${personAvatar('journalist', true)}${personAvatar('conscience', true)}</div><blockquote>„Nejhorší na politice není, že si lidé pamatují vaše chyby. Pamatují si, koho jste kvůli nim obětoval.“</blockquote></aside></main>`;
  }
  function profileView() {
    return `<main class="k180-profile-screen"><section class="k180-profile-intro"><p class="k180-kicker">KDO JDE DO POLITIKY?</p><h1>Vyberte, co si o vás lidé myslí ještě před první větou.</h1><label class="k180-field">Jméno kandidáta<input id="k180CandidateName" maxlength="28" value="${escapeHtml(state.candidateName)}"></label><p>Po prvním dokončeném průchodu se odemkne Insider — profil s důkazem, ale téměř bez důvěry.</p></section><section class="k180-profile-grid">${Object.entries(PROFILES).map(([id, profile]) => { const locked = profile.unlockAfter && meta.completedRuns < profile.unlockAfter; return `<button class="k180-profile-card ${locked ? 'is-locked' : ''}" type="button" data-profile="${id}" ${locked ? 'disabled' : ''}><span class="k180-profile-name">${profile.name}${locked ? ' · ZAMČENO' : ''}</span><span>${locked ? 'Dokončete nejméně jednu kampaň.' : profile.copy}</span><span class="k180-profile-stats">Vliv ${profile.resources.influence} · Důvěra ${profile.resources.trust}% · Peníze ${profile.resources.money}k</span></button>`; }).join('')}</section></main>`;
  }
  function agenda(currentScene) {
    const branchIds = ['donor_visit', 'press_storm', 'night_recording', 'veteran_warning'];
    const normalized = branchIds.includes(currentScene) ? 'route' : currentScene;
    const steps = [['morning_one', 'Ranní priorita'], ['mayor_offer', 'Nabídka starosty'], ['route', 'Důsledek vaší cesty'], ['journalist_call', 'Mediální tlak'], ['staff_crisis', 'Krize ve štábu'], ['congress', 'Hlasování']];
    const currentIndex = steps.findIndex(([id]) => id === normalized);
    return `<aside class="k180-agenda"><p class="k180-section-label">POSTUP KAPITOLY</p><ol>${steps.map(([id, label], index) => `<li class="${index < currentIndex ? 'is-complete' : ''} ${id === normalized ? 'is-active' : ''}"><span>${index + 1}</span>${label}</li>`).join('')}</ol><div class="k180-pressure"><div><span>Riziko skandálu</span><strong>${state.scandal}%</strong></div><div class="k180-pressure-track"><i style="width:${state.scandal}%"></i></div></div>${state.obligations.length ? `<div class="k180-obligations"><p class="k180-section-label">AKTIVNÍ DLUHY</p>${state.obligations.slice(-3).map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>` : ''}</aside>`;
  }
  function personPanel(personId) {
    const person = PEOPLE[personId];
    const relation = state.relations[personId];
    const memory = state.memories[personId];
    return `<aside class="k180-person-panel"><div class="k180-person-heading">${personAvatar(personId, true)}<div><p>${person.role}</p><h2>${person.name}</h2></div></div><div class="k180-relation"><span>Vztah k vám</span><strong>${relationLabel(relation)} · ${relation > 0 ? '+' : ''}${relation}</strong></div>${memory ? `<div class="k181-person-memory"><span>PAMATUJE SI</span><p>${memory}</p></div>` : ''}<dl><div><dt>Chce</dt><dd>${person.goal}</dd></div><div><dt>Hranice</dt><dd>${person.boundary}</dd></div><div><dt>Co víte</dt><dd>${person.tells}</dd></div></dl></aside>`;
  }
  function choicesView(current) {
    return `<div class="k180-choices" role="list" aria-label="Možnosti rozhodnutí">${current.choices.map((choice, index) => { const available = choiceAvailable(choice); const seen = meta.choices.includes(choice.id); return `<button class="k180-choice ${available ? '' : 'is-locked'}" type="button" role="listitem" data-choice="${choice.id}" ${available ? '' : 'disabled'}><span class="k180-choice-index">${String(index + 1).padStart(2, '0')}</span><span class="k180-choice-copy"><strong>${choice.label}${seen ? '<small class="k181-seen">již zvoleno</small>' : ''}</strong><span>${available ? choice.detail : choice.locked}</span></span><span class="k180-choice-meta"><em>${choice.risk}</em>${choice.cost ? `<small>${choice.cost}</small>` : ''}</span></button>`; }).join('')}</div>`;
  }
  function sceneView() {
    const current = scene();
    const line = valueOf(current.line);
    const interjections = valueOf(current.interjections) || [];
    return `<main class="k180-game-shell">${agenda(state.sceneId)}<section class="k180-event-card"><header><p class="k180-kicker">${current.kicker}</p><h1>${current.title}</h1>${current.route ? `<span class="k181-route-badge">${ROUTES[current.route].name}</span>` : ''}</header><div class="k180-event-body"><p>${current.body}</p></div>${line ? `<div class="k181-dialogue">${personAvatar(current.speaker, true)}<div><span>${PEOPLE[current.speaker].name}</span><blockquote>${line}</blockquote></div></div>` : ''}${interjections.length ? `<div class="k181-interjections">${interjections.map((item) => `<div>${personAvatar(item.person)}<p><strong>${PEOPLE[item.person].name}</strong>${item.text}</p></div>`).join('')}</div>` : ''}${choicesView(current)}${current.memory ? `<footer class="k180-memory"><span>Kdo si rozhodnutí zapamatuje</span>${current.memory.map((id) => `<span title="${PEOPLE[id].name}">${personAvatar(id)}</span>`).join('')}</footer>` : ''}</section>${personPanel(current.speaker)}</main>`;
  }
  function summaryView() {
    const current = scene();
    const strongest = Object.entries(state.relations).sort((a, b) => b[1] - a[1])[0];
    const weakest = Object.entries(state.relations).sort((a, b) => a[1] - b[1])[0];
    const route = routeId();
    return `<main class="k180-summary-screen"><section class="k180-summary-main"><p class="k180-kicker">${current.kicker}</p><h1>${current.title}</h1><p class="k180-lead">${current.body}</p>${route ? `<div class="k181-route-summary"><span>VAŠE CESTA</span><strong>${ROUTES[route].name}</strong><p>${ROUTES[route].teaser}</p></div>` : ''}<div class="k180-summary-grid"><div><span>Nejpevnější vztah</span><strong>${PEOPLE[strongest[0]].name}</strong><small>${state.memories[strongest[0]] || relationLabel(strongest[1])}</small></div><div><span>Největší hrozba</span><strong>${PEOPLE[weakest[0]].name}</strong><small>${state.memories[weakest[0]] || relationLabel(weakest[1])}</small></div><div><span>Aktivní závazky</span><strong>${state.obligations.length}</strong><small>${state.obligations.at(-1) || 'Zatím žádný konkrétní dluh.'}</small></div><div><span>Riziko skandálu</span><strong>${state.scandal}%</strong><small>${state.scandal > 20 ? 'Někdo už skládá příběh.' : 'Stopy zatím nejsou spojené.'}</small></div></div><button class="k180-primary" type="button" data-action="continue-summary">Otevřít druhý den</button></section>${personPanel(current.speaker)}</main>`;
  }
  function resultLabel(key) { return { influence: 'Vliv', trust: 'Důvěra', money: 'Peníze', energy: 'Energie' }[key] || key; }
  function resultView() {
    const result = state.lastResult;
    return `<main class="k180-result-screen"><section class="k180-result-card"><p class="k180-kicker">NÁSLEDEK ROZHODNUTÍ</p><h1>${result.title}</h1><p class="k180-result-text">${result.text}</p><div class="k180-deltas">${result.deltas.map(({ key, delta }) => `<div class="${delta > 0 ? 'is-positive' : 'is-negative'}"><span>${resultLabel(key)}</span><strong>${delta > 0 ? '+' : ''}${delta}${key === 'trust' ? '%' : key === 'money' ? 'k' : ''}</strong></div>`).join('') || '<div class="is-neutral"><span>Zdroje</span><strong>beze změny</strong></div>'}</div>${result.reactions.length ? `<div class="k181-reaction-grid"><p class="k180-section-label">CO SI LIDÉ ODNÁŠEJÍ</p>${result.reactions.map(({ key, delta, text }) => `<div class="k181-reaction ${delta > 0 ? 'is-positive' : 'is-negative'}">${personAvatar(key)}<blockquote>${text}</blockquote></div>`).join('')}</div>` : ''}${result.obligation ? `<div class="k180-new-debt"><span>NOVÝ POLITICKÝ DLUH</span><strong>${result.obligation}</strong></div>` : ''}${result.scandal ? `<p class="k180-hidden-effect">Skryté riziko se změnilo o ${result.scandal > 0 ? '+' : ''}${result.scandal} bodů.</p>` : ''}<button class="k180-primary" type="button" data-action="continue-result">Pokračovat</button></section></main>`;
  }
  function endingView() {
    const ending = endingData();
    const epilogues = ['conscience', 'journalist', 'rival', 'veteran', 'donor'].map((id) => ({ id, ...personEpilogue(id, ending) }));
    const unseen = Object.entries(ROUTES).filter(([id]) => !meta.routes.includes(id));
    return `<main class="k180-ending-screen k181-ending-screen"><section class="k180-ending-card k180-ending-card--${ending.tone} k181-ending-hero"><p class="k180-kicker">${ending.badge}</p><h1>${ending.title}</h1><p class="k180-lead">${ending.text}</p><div class="k180-final-score">${metric('Vliv', state.resources.influence)}${metric('Důvěra', state.resources.trust, '%')}${metric('Skandál', state.scandal, '%')}${metric('Dluhy', state.obligations.length)}</div><div class="k180-chronicle"><p class="k180-section-label">VAŠE KRONIKA</p>${state.history.map((entry, index) => { const sceneData = SCENES[entry.sceneId]; const choice = sceneData.choices.find((item) => item.id === entry.choiceId); return `<div><span>${index + 1}</span><p><strong>${sceneData.title}</strong><small>${choice.label}</small></p></div>`; }).join('')}</div></section><section class="k181-ending-people"><p class="k180-section-label">CO SE STALO S LIDMI KOLEM VÁS</p>${epilogues.map((item) => `<article class="k181-epilogue k181-epilogue--${item.tone}">${personAvatar(item.id)}<div><strong>${item.title}</strong><p>${item.text}</p></div></article>`).join('')}</section><aside class="k181-replay-panel"><p class="k180-section-label">DŮVOD VRÁTIT SE</p><h2>Objeveno ${meta.endings.length}/4 konců a ${meta.routes.length}/4 cest</h2>${unseen.length ? `<div class="k181-unseen">${unseen.map(([id, route]) => `<div><span>UZAMČENÁ CESTA</span><strong>${route.name}</strong><p>${route.teaser}</p></div>`).join('')}</div>` : '<p>Viděli jste všechny hlavní cesty. Zbývá najít odlišné osobní osudy.</p>'}<div class="k181-unlock"><strong>${meta.completedRuns >= 1 ? 'Profil Insider je odemčen' : 'Dokončete kampaň pro nový profil'}</strong><p>Insider začíná s důkazem, ale téměř bez důvěry.</p></div><div class="k180-ending-actions"><button class="k180-primary" type="button" data-action="restart">Zkusit jinou cestu</button><a class="k180-secondary" href="?legacy=1">Otevřít kampaň v0.17</a></div></aside></main>`;
  }
  function content() { if (state.phase === 'start') return startView(); if (state.phase === 'profile') return profileView(); if (state.phase === 'result') return resultView(); if (state.phase === 'summary') return summaryView(); if (state.phase === 'ending') return endingView(); return sceneView(); }
  function render() { root.innerHTML = `${topbar()}${content()}<footer class="k180-footer"><span>Fiktivní obec. Skutečné politické následky.</span><span>Build ${BUILD}</span></footer>`; bind(); }
  function bind() {
    root.querySelector('[data-action="open-profile"]')?.addEventListener('click', () => { state.phase = 'profile'; render(); });
    root.querySelectorAll('[data-profile]').forEach((button) => button.addEventListener('click', () => { const input = root.querySelector('#k180CandidateName'); state.candidateName = input?.value.trim() || 'Bohuslav Korytář'; applyProfile(button.dataset.profile); }));
    root.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => applyChoice(button.dataset.choice)));
    root.querySelector('[data-action="continue-result"]')?.addEventListener('click', continueFromResult);
    root.querySelector('[data-action="continue-summary"]')?.addEventListener('click', continueSummary);
    root.querySelector('[data-action="restart"]')?.addEventListener('click', () => { state = baseState(); try { localStorage.removeItem(SAVE_KEY); } catch {} render(); });
    root.querySelector('[data-action="save"]')?.addEventListener('click', () => { announce.textContent = persist() ? 'Hra byla uložena.' : 'Hru se nepodařilo uložit.'; });
    root.querySelector('[data-action="load"]')?.addEventListener('click', () => { announce.textContent = restore() ? 'Uložená hra byla načtena.' : 'Pro tuto verzi nebyla nalezena uložená hra.'; render(); });
  }
  function mount() {
    document.documentElement.classList.add('k180-active', 'k181-character-drama');
    document.querySelector('#app')?.setAttribute('aria-hidden', 'true');
    document.querySelector('#diceOverlay')?.setAttribute('aria-hidden', 'true');
    root = document.createElement('div');
    root.id = 'k180Root';
    root.className = 'k180-root k181-root';
    announce = document.createElement('div');
    announce.className = 'k180-sr-only';
    announce.setAttribute('aria-live', 'polite');
    document.body.prepend(announce);
    document.body.prepend(root);
    render();
  }

  window.KorytoV0181 = Object.freeze({ BUILD, SAVE_KEY, META_KEY, PEOPLE: deepCopy(PEOPLE), PROFILES: deepCopy(PROFILES), SCENE_IDS: Object.keys(SCENES), ROUTE_IDS: Object.keys(ROUTES), getState: () => deepCopy(state), getMeta: () => deepCopy(meta), reset: () => { state = baseState(); render(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
