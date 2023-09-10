Med Passerende Skip kan du få varsel når skip går inn i et valgt geografisk område. Løsningen bruker norske AIS data.

Dette er en første versjon og om interesse og tid samsvarer så kan det være det kommer mer funksjonalitet etterhvert. Frem til versjon 1.0.0 så kan det være flowkort endrer seg.

For å få det til å virke legger du til en enhet. Du kan pr. i dag kun legge til en enhet.

Følgende konfigurasjon kan/må settes opp på enheten:
- Du må legge inn en "ClientID" og "ClientSecret". Denne lager du på MyPage på Barentswatch. Dette gir tilgang til Kystverkets AIS data. 
-- Gå til: https://www.barentswatch.no/minside/
-- Sett opp en ny klient. Velg et klientnavn, Klienttype skal være AIS-Data, Legg inn et passord (ClientSecret).
-- Legg inn ClientID (din@epost.no:klientnavn) og ClientSecret (passordet du nettopp ga opp)
- Du kan velge å overstyre din lokasjon. I utgangspunktet brukes lokasjonen til din Homey.
- Du må legge inn en GeoJSON som beskriver hvilket areal du skal overvåke. Dette bør ikke være for stort. Intensjonen er at du overvåker det du ser fra din Homey lokasjon. Formatet på denne er: { "type": "Polygon", "coordinates": [ [ [ 6.184478066111999, 62.474786444721374 ], [ 6.183887242493443, 62.496939442347866 ], [ 6.295995708367114, 62.498287166356747 ], [ 6.302261762396829, 62.466357084842059 ], [ 6.184478066111999, 62.474786444721374 ] ] ] }
-- Gå til kystinfo.no. Zoom slik at du ser ditt område (ikke for stort...)
-- Velg "Tegn og mål" til høgre. Velg så Polygon
-- Trykk på kartet for å sette punkt. Dobbeltklikk på første punkt for å avslutte.
-- Eksporter (se helt nederst til høgre) som GeoJSON.
-- Du skal ha en del av GeoJSON inn i konfigurasjonen. Se på eksempelet og få samme format

Data hentes fra Kystverket via Barentswatch sine Live AIS API.


