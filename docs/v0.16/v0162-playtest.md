# Koryto v0.16.2 TEST.1 — archiv playtest prototypu

## Stav ve v0.16.9 TEST.3

Experimentální query režim `?playtest=1` byl z distribuovaného releasu odstraněn. Odkazoval na soubory, které nebyly součástí offline ZIPu, a proto vytvářel dvě chyby 404.

Běžná hra, testovací workflow ani dokumentace už tento režim neprezentují jako podporovanou funkci. Testování štábu probíhá standardní herní cestou a přes automatické kontrakty obrazovky štábu.

## Zachovaný historický kontext

v0.16.2 ověřovala propojení nové mapy a štábu s původními funkcemi `showLocation`, `dispatchCompanion`, `resolvePartyAssignment` a se save kontraktem `0.14.3-test.2` / schema `1`.

## Rollback

Žádný produkční loader v0.16.2 již neexistuje. Návrat k dřívějšímu UI se řeší verzovaným Git commitem, nikoli query parametrem.
