# Basislab Typen

Webbased typecursus in een ruimte-game voor **groep 6, 7 en 8**, met een uitgebreid **volgsysteem voor leerkrachten**. Leerlingen loggen in met klascode, naam en wachtwoord, op school én thuis, in elke moderne browser.

Uitlegvideo: [`public/video/uitleg.mp4`](public/video/uitleg.mp4) (ook te bekijken in de app via *Uitleg*).

## Voor leerlingen

- **Sterrenkaart met 6 planeten en 20 lessen**, stap voor stap:
  1. *Thuisbasis*: F J, D K, S L, A ;, G H
  2. *Planeet Klinker*: E I, R U, T N, O W
  3. *Komeetkust*: V M, P B, C en komma, Z en punt, Y Q X
  4. *Hoofdletterhaven*: hoofdletters (Shift), ? ! :
  5. *Cijferkomeet*: 1–5, 6–0
  6. *Meesterster*: lange teksten en het **typediploma**
- Elke les heeft vijf stappen: nieuwe toetsen, lettertraining, woorden, ruimtemix en de **sterrentest** (1–3 sterren).
  Teksten worden steeds opnieuw gemaakt en bevatten alléén tekens die de leerling al geleerd heeft.
- Toetsenbord op het scherm met vingerkleuren, handen die de juiste vinger tonen, directe feedback bij fouten.
- Spellen met de eigen geleerde letters: **Meteorenstorm** (woorden wegschieten, steeds snellere golven, power-ups) en **Raketrace** (race tegen drie raketten die zich aanpassen aan de eigen snelheid).
- Beloningen: XP en rangen, sterrenstof, raket versieren in de hangar, 18 badges, weekranglijst, dagreeks, weekdoel.
- Toegankelijk: grotere letters, extra letterafstand (dyslexie), geluid uit, handen uit, aanpasbaar tempo.

## Voor leerkrachten (volgsysteem)

- Klassen aanmaken (groep 6/7/8), leerlingen in één keer toevoegen, **inlogkaarten printen**.
- **Klasoverzicht**: oefentijd, gemiddelde snelheid en nauwkeurigheid, weekdoel, diploma's, oefentijd per dag,
  verdeling over de planeten, lastige toetsen van de hele klas, sorteerbare leerlingtabel.
- **Signalen**: niet geoefend, loopt vast bij een les, dalende of lage nauwkeurigheid, weekdoel gehaald, diploma.
- **Per leerling**: snelheid en nauwkeurigheid in de tijd, toetsenbord-heatmap van fouten, fouten per vinger,
  automatisch advies, oefenkalender, oefenen onder/buiten schooltijd (of op school/thuis via het IP-adres van de school),
  resultaten per les, alle recente activiteit, badges, aantekeningen.
- Differentiatie: **tempo per leerling** (60–120%), lessen vrijgeven, eis voor de volgende les (1, 2 of 3 sterren), spellen en ranglijst aan/uit.
- **Export naar CSV** (Excel) en een printbaar **typediploma**.

## Voor de beheerder

- Het **eerste account** dat wordt aangemaakt, is automatisch **beheerder**. Er kunnen meerdere beheerders zijn.
- Onder **Beheer** staan:
  - **Gebruik:** leerkrachten, klassen, leerlingen, oefentijd per dag, weekdoel, snelheid, diploma's en signalen per klas, met export naar CSV. De beheerder kan elke klas en leerling openen.
  - **Leerkrachten:** toevoegen (met tijdelijk wachtwoord dat bij de eerste keer inloggen wordt vervangen), wachtwoord opnieuw instellen, beheerder maken en verwijderen (klassen overdragen aan een collega).
  - **School en logo:** schoolnaam, logo (PNG, JPG of WebP) en of leerkrachten zelf een account mogen maken. Het logo verschijnt bij het inloggen, in de software voor leerlingen en leerkrachten, op inlogkaarten en op het diploma.

## Doelen per groep

Snelheid in aanslagen per minuut voor 3 sterren loopt per les op. Aan het eind van de leerlijn:
groep 6 ± 80, groep 7 ± 100, groep 8 ± 120 (cijferlessen iets lager). Sterren: 1 ster vanaf 85% goed,
2 sterren vanaf 92% goed en 75% van de doelsnelheid, 3 sterren vanaf 96% goed en de doelsnelheid.

## Snel starten (dubbelklikken)

1. Installeer eenmalig **Node.js** (LTS-versie) via https://nodejs.org.
2. Dubbelklik in de map `basislab-typen` op:
   - **Windows:** `Start Basislab Typen (Windows).bat`
   - **Mac:** `Start Basislab Typen (Mac).command` (de eerste keer: rechtermuisknop → *Open*)
3. De browser opent vanzelf op http://localhost:3000. Laat het zwarte venster open zolang je speelt.

De eerste keer wordt een demoschool klaargezet (zie de demo-inlog hieronder). In het venster staat ook een adres zoals
`http://192.168.1.20:3000`: andere computers in hetzelfde (school)netwerk kunnen via dat adres meedoen.
Voor inloggen van thuis uit moet de app op een server staan (zie *Online zetten*).

## Installeren

Vereist **Node.js 22.5 of nieuwer**. Er zijn geen npm-pakketten nodig: de server gebruikt alleen ingebouwde modules
(`node:http`, `node:sqlite`, `node:crypto`).

```bash
cd basislab-typen
npm start            # http://localhost:3000
npm test             # tests van API en leerlijn
npm run demo         # voorbeeldschool met 3 klassen en weken aan oefengeschiedenis
```

Demo-inlog: beheerder `demo@basislab.nl` / `basislab-typen` (leerkrachten `ahmed@basislab.nl` en `lotte@basislab.nl`, zelfde wachtwoord); leerlingen Groep 7b: klascode `MAAN-42K`, wachtwoord `raket12`.

### Instellingen (omgevingsvariabelen)

| Variabele | Betekenis | Standaard |
|---|---|---|
| `PORT` | poort | `3000` |
| `DB_FILE` | SQLite-databasebestand | `./data/basislab-typen.db` |
| `SIGNUP_CODE` | als ingesteld, hebben nieuwe leerkrachten deze code nodig om een account te maken | leeg (vrij registreren) |
| `TRUST_PROXY` | `1` als de app achter een reverse proxy draait (voor het juiste IP-adres) | uit |
| `COOKIE_SECURE` | `1` bij gebruik van HTTPS | uit |
| `TZ_SCHOOL` | tijdzone voor dagen, weken en schooltijd | `Europe/Amsterdam` |

### Online zetten (thuis én op school)

In `deploy/` staat een kant-en-klare opstelling met automatische HTTPS (Caddy + Let's Encrypt):

```bash
cd basislab-typen/deploy
cp .env.example .env        # vul DOMEIN en SIGNUP_CODE in
docker compose up -d --build
```

Back-up maken (ook terwijl de app draait): `docker compose exec app npm run backup`
(buiten Docker: `npm run backup`). Er worden 14 kopieën bewaard in `data/backups/`.

## Privacy en veiligheid

- Alle gegevens staan in één SQLite-bestand op de eigen server. Geen externe diensten, geen trackers, geen advertenties;
  ook de lettertypen worden lokaal geserveerd.
- Leerlingen hebben alleen een voornaam en een klascode; er zijn geen e-mailadressen van kinderen nodig.
- Wachtwoorden worden gehasht met scrypt; sessies zitten in een HttpOnly-cookie (leerlingen 12 uur, leerkrachten 7 dagen).
- Remming op inlogpogingen, CSRF-bescherming via een verplichte header, strikte Content-Security-Policy.
- Voor de signalering school/thuis wordt alleen "school" of "thuis" opgeslagen, nooit het IP-adres zelf.
- Leerkrachten zien alleen hun eigen klassen; leerlingen en klassen kunnen volledig worden verwijderd.

## Bronnen en licenties

| Onderdeel | Herkomst | Licentie |
|---|---|---|
| Code, lessen, woordenlijst, zinnen, teksten, iconen en tekeningen | Voor dit project geschreven | Eigen werk (zie `package.json`) |
| Lettertypen Lexend en Fredoka (`public/fonts/`) | Google Fonts, via Fontsource | SIL Open Font License 1.1 (`public/fonts/OFL-*.txt`) |
| Stem in de uitlegvideo | Piper-stem *nl-rdh-medium*, getraind op [dutch-vl-tts](https://github.com/r-dh/dutch-vl-tts) | Dataset CC0 1.0; Piper zelf is GPL-3.0 en wordt niet meegeleverd |
| Kleurenpalet van de grafieken | Algemene kleurwaarden | Niet beschermd |

Er worden geen externe bibliotheken, afbeeldingen of geluidsbestanden meegeleverd. De geluiden worden in de browser opgewekt.

## Projectstructuur

```
server.js                 start de HTTP-server
src/app.js                API, inloggen, beloningen, volgsysteem, statische bestanden
src/db.js                 databaseschema (SQLite)
src/stats.js              voortgang, signalen, statistiek
public/js/shared/         leerlijn, woordenlijst en beloningen (gedeeld door server en browser)
public/js/student/        sterrenkaart, lessen, spellen, hangar, erekast
public/js/teacher/        dashboard, klas, leerling, inlogkaarten, grafieken
scripts/seed-demo.js      demodata
video/                    script voor de uitlegvideo (zie hieronder)
test/                     tests (node --test)
```

## Uitlegvideo opnieuw maken

De video wordt gemaakt door de echte app automatisch te bedienen en op te nemen:

```bash
pip install piper-tts                     # offline Nederlandse spraak
# download een Nederlandse Piper-stem (bijv. nl-rdh-medium) en zet PIPER_MODEL naar het .onnx-bestand
npm run demo -- --reset && PORT=3100 npm start &
PIPER_MODEL=/pad/nl-rdh-medium.onnx python3 video/tts.py   # voice-over + tijden
BASE=http://localhost:3100 node video/record.cjs           # opname met Playwright
python3 video/build.py                                     # montage met ffmpeg
```

De vertelteksten staan in `video/narration.json`.
