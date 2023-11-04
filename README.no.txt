Med Passerende Skip kan du få varsel når skip går inn i et valgt geografisk område. Løsningen bruker norske AIS data.

Dette er en første versjon og om interesse og tid samsvarer så kan det være det kommer mer funksjonalitet etterhvert. Frem til versjon 1.0.0 så kan det være flowkort endrer seg.

For å få det til å virke legger du til et område du ønsker å overvåke. Du kan legge til maks tre områder. De bør ikke være for store...

For å få det til å virke trenger du:
- En id og secret fra Barentswatch API.
- Å legge inn et navn på et skipsområde og tegne opp området i et kart
- Systemet bruker automatisk Homey sin lokasjon, dette kan overstyres i innstillinger

Data hentes fra Kystverket via Barentswatch sine Live AIS API.

Kildekoden er tilgjengelig her: https://github.com/arneunneland/homey-passing-ships


