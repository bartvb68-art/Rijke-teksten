# Basislab Ontleden

Webbased oefenomgeving voor **zinsontleding** (redekundig ontleden) in een muziekgame voor **groep 5, 6, 7 en 8**, met een uitgebreid **volgsysteem voor leerkrachten**. Zelfde opzet en stijl als Basislab Typen: leerlingen loggen in met klascode, naam en wachtwoord, op school én thuis, in elke moderne browser.

## Voor leerlingen

- **Tourkaart met 6 podia en 20 lessen**, stap voor stap:
  1. *Oefenhok*: zinnen knippen in zinsdelen (verschuifproef), persoonsvorm (tijdproef), onderwerp, pv + ow benoemen
  2. *Repetitieruimte*: werkwoordelijk gezegde, pv/ow/wg benoemen, lange zinnen knippen
  3. *Clubpodium*: lijdend voorwerp, ontleden met lv, onderwerp of lv?
  4. *Festivaltent*: meewerkend voorwerp, welke vraag stel je?, ontleden met mv
  5. *Hoofdpodium*: bijwoordelijke bepaling, soorten (tijd, plaats, manier, reden), alles ontleden
  6. *Stadion*: naamwoordelijk gezegde, wg of ng?, meesterontleder en het **ontleeddiploma**
- Elke les heeft vier stappen: **Soundcheck** (uitleg met voorbeeld en drie zinnen met hulp), **Repetitie**, **Jamsessie** (met eerdere lessen) en het **Optreden** (10 zinnen, 1–3 sterren).
- Vier opdrachtvormen: zinsdelen **knippen**, een zinsdeel **aanwijzen**, **etiketten** plakken (cijfertoetsen werken ook) en **vragen**.
  Na elk antwoord volgt uitleg met de proef, ingevuld met de woorden van de zin ("Wie of wat stemt de gitarist? Antwoord: zijn gitaar.").
- 133 zinnen met muziekthema, zelf geschreven en per zinsdeel gemarkeerd (met de vorm in een andere tijd voor de tijdproef). Zinnen worden steeds anders gekozen en passen bij de groep.
- Spellen met de zinsdelen die de leerling al kent: **Notenregen** (ritmespel: zinsdelen vallen als noten, kies het etiket voor de lijn) en **Bandbattle** (race tegen drie bands die zich aanpassen aan het eigen tempo).
- Beloningen: XP en rangen (van Straatmuzikant tot Legende), muzieknoten, eigen gitaar versieren in de studio, 18 badges, hitlijst van de week, dagreeks, weekdoel.
- Toegankelijk: zinnen **voorlezen** (spraak van de browser zelf), grotere letters, extra letterafstand (dyslexie), geluid uit, volledig met het toetsenbord te bedienen.

## Voor leerkrachten (volgsysteem)

- Klassen aanmaken (groep 5–8), leerlingen in één keer toevoegen, **inlogkaarten printen**.
- **Klasoverzicht**: oefentijd, score (% goed), tempo (seconden per zin), weekdoel, diploma's, oefentijd per dag, verdeling over de podia,
  **lastige zinsdelen** en **verwarringen** van de hele klas (bijv. lijdend voorwerp aangezien voor onderwerp), sorteerbare leerlingtabel.
- **Signalen**: niet geoefend, loopt vast bij een les, dalende of lage score, verwart vaak twee zinsdelen, weekdoel gehaald, diploma.
- **Per leerling**: score en tempo in de tijd, foutpercentage per zinsdeel, verwarringen, automatisch advies (met de les die helpt),
  oefenkalender, oefenen onder/buiten schooltijd (of school/thuis via het IP-adres van de school), resultaten per les, recente activiteit, badges, aantekeningen.
- Differentiatie: **niveau van de zinnen** per leerling (makkelijker / normaal / uitdaging), lessen vrijgeven, eis voor de volgende les (1, 2 of 3 sterren), spellen en hitlijst aan/uit, voorlezen.
- **Export naar CSV** (Excel) en een printbaar **ontleeddiploma**.
- Beheer (eerste account is beheerder): gebruik van de hele school, leerkrachten toevoegen en beheren, schoolnaam en logo.

## Doelen per groep

Groep 5 werkt aan podium 1 en 2, groep 6 aan podium 2 en 3, groep 7 aan podium 3 tot en met 5 en groep 8 rondt af met podium 6 en het diploma.
De groep bepaalt de lengte en moeilijkheid van de zinnen (groep 5 vooral korte zinnen, groep 8 vooral lange).
Sterren: 1 ster vanaf 60% goed, 2 sterren vanaf 80%, 3 sterren vanaf 90%. Diploma: examen (12 zinnen volledig ontleden) met minstens 2 sterren.

## Snel starten (dubbelklikken)

1. Installeer eenmalig **Node.js** (LTS-versie) via https://nodejs.org.
2. Dubbelklik in de map `basislab-ontleden` op `Start Basislab Ontleden (Windows).bat` of `Start Basislab Ontleden (Mac).command`.
3. De browser opent op http://localhost:3000. De eerste keer wordt een demoschool klaargezet.

## Installeren

Vereist **Node.js 22.5 of nieuwer**, geen npm-pakketten (alleen ingebouwde modules: `node:http`, `node:sqlite`, `node:crypto`).

```bash
cd basislab-ontleden
npm start            # http://localhost:3000
npm test             # tests van API, leerlijn en zinnen
npm run demo         # demoschool met 4 klassen en weken aan oefengeschiedenis
```

Demo-inlog: beheerder `demo@basislab.nl` / `basislab-ontleden` (leerkrachten `ahmed@`, `lotte@` en `mirjam@basislab.nl`, zelfde wachtwoord);
leerlingen Groep 7b: klascode `DRUM-42K`, wachtwoord `gitaar12`.

Instellingen via omgevingsvariabelen zijn gelijk aan Basislab Typen: `PORT`, `DB_FILE` (standaard `./data/basislab-ontleden.db`), `SIGNUP_CODE`, `TRUST_PROXY`, `COOKIE_SECURE`, `TZ_SCHOOL`.

### Online zetten naast Basislab Typen (TransIP-VPS)

Net als Basislab Lezen draait Ontleden als extra container op het Docker-netwerk van Typen; de Caddy van Typen regelt het webadres en HTTPS.

1. DNS: A-record `ontleden` → IP-adres van de VPS.
2. Zet de map `basislab-ontleden` op de server (bijv. `/opt/basislab-ontleden`).
3. `cd /opt/basislab-ontleden/deploy && cp .env.example .env` en vul `SIGNUP_CODE` in.
4. `sudo docker compose -f naast-typen.yml up -d --build`
   (Heet het netwerk van Typen niet `deploy_default`? Zie `sudo docker network ls` en start met `TYPEN_NETWERK=<naam>`.)
5. Voeg aan de Caddyfile van Basislab Typen toe en herstart Caddy:
   ```
   ontleden.basislab.nl {
   	reverse_proxy basislab-ontleden-ontleden-1:3000
   }
   ```
6. Open https://ontleden.basislab.nl, kies *Ik ben leerkracht* en maak het eerste account (dat wordt beheerder).

Op een eigen server zonder Typen: `cd deploy && cp .env.example .env` (vul `DOMEIN` en `SIGNUP_CODE` in) en `docker compose up -d --build`.
Back-up: `docker compose exec app npm run backup` (of `-f naast-typen.yml exec ontleden npm run backup`).

## Privacy en veiligheid

Gelijk aan Basislab Typen: alle gegevens in één SQLite-bestand op de eigen server, geen externe diensten, trackers of advertenties,
lettertypen lokaal, alleen voornaam en klascode van leerlingen, wachtwoorden gehasht met scrypt, HttpOnly-sessies, remming op inlogpogingen,
CSRF-bescherming en strikte Content-Security-Policy. Voorlezen gebruikt de spraak die in de browser zit; er gaat geen tekst naar buiten.

## Projectstructuur

```
server.js                 start de HTTP-server
src/app.js                API, inloggen, beloningen, volgsysteem, statische bestanden
src/db.js                 databaseschema (SQLite)
src/stats.js              voortgang, signalen, zinsdelen en verwarringen
public/js/shared/         zinnen, leerlijn en nakijken, beloningen (gedeeld door server en browser)
public/js/student/        tourkaart, lessen, Notenregen, Bandbattle, studio, gouden platen
public/js/teacher/        dashboard, klas, leerling, inlogkaarten, grafieken, beheer
scripts/seed-demo.js      demodata
test/                     tests (node --test)
```

## Bronnen en licenties

Code, zinnen, lessen, iconen en tekeningen zijn voor dit project geschreven. Vormgeving volgens de Basislab-huisstijl. Lettertype Poppins (`public/fonts/`, lokaal geserveerd): SIL Open Font License 1.1.
Geluiden worden in de browser opgewekt; er worden geen externe bibliotheken of geluidsbestanden meegeleverd.
