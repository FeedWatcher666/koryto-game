# CLEAN TEST.3 — prostorová d20

TEST.2 byla vizuálně plochá: CSS otáčelo jediný mnohoúhelník, takže výsledek připomínal minci.

TEST.3 používá skutečný model dvacetistěnu vykreslený bez externí knihovny:

- 12 prostorových vrcholů,
- 20 trojúhelníkových stěn,
- rotace kolem os X, Y a Z,
- perspektivní projekce,
- výpočet normál jednotlivých ploch,
- dynamické osvětlení a stínování,
- měnící se vržený stín,
- samostatná fáze letu, dopadu a ustálení.

Číslo je překryvné pouze kvůli čitelnosti. Browser gate porovnává dva snímky canvasu a potvrzuje změnu geometrie i rozdílné osvětlení ploch.
