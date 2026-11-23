# Basislab Doorstroom

Adaptieve voorbereiding op de **doorstroomtoets (IEP)** voor groep 8, met een **weekplanning** tot de toets en een **volgsysteem voor leerkrachten**. Zelfde opzet als Basislab Typen: Node.js zonder extra pakketten, SQLite, inloggen met klascode, Docker met Caddy.

## Voor leerlingen

- **Startscherm met bergroute**: elke week een stap naar de top (de toets), met de weektaak, het weekdoel, een aftelklok en een bericht van de juf of meester.
- **Weektaak**: 70% van de opgaven gaat over de focus van de week, 30% herhaalt wat voor die leerling nog lastig is of lang niet is geoefend.
- **Zelf oefenen** per vakgebied of onderdeel, of alles door elkaar zoals in de toets.
- Na elke opgave direct **feedback met uitleg**; na een ronde van 10 opgaven zie je per onderdeel of je niveau omhoog ging.
- **Proeftoets** (36 vragen: 12 rekenen, 12 taalverzorging, 12 lezen) zonder tussentijdse feedback, met een niveau per vakgebied als uitslag.
- **Mijn niveau**: niveaumeter per vakgebied, niveau per onderdeel, groei per week en de laatste fouten met het goede antwoord.
- Toegankelijk: voorleesknop (spraak van de browser), grotere letters, extra letter- en regelruimte, werkt op tablet en telefoon. Meerkeuze ook met de toetsen A–D of 1–4.

## Inhoud (18 onderdelen)

| Vakgebied | Onderdelen | Oefenstof |
|---|---|---|
| Rekenen | getallen, bewerkingen, breuken, kommagetallen, procenten, verhoudingen, meten en tijd, meetkunde, tabellen en grafieken | 95 sjablonen op 5 niveaus, steeds nieuwe getallen, met figuren, tabellen en grafieken: onuitputtelijk |
| Taalverzorging | werkwoordspelling, spelling, leestekens en hoofdletters, zinsdelen en woordsoorten, goede zinnen | werkwoordspelling gegenereerd uit 54 werkwoorden (tt, vt, vd, dt, Engelse werkwoorden, je/jij), 34 ontleedzinnen, 86 spellingwoorden, 37 leesteken-items, 36 zinsbouw-items |
| Lezen | woordenschat, begrijpend lezen, signaalwoorden, informatie opzoeken | 17 eigen teksten met 85 vragen (verhaal, informatief, nieuws, brief, interview, betoog, instructie), 75 woorden en uitdrukkingen, 48 signaalwoord-items, onbeperkt dienstregelingen, prijslijsten en roosters |

Leerlingen krijgen eerst opgaven die ze nog niet hebben gehad. De teksten en banken staan in `src/content/` en zijn eenvoudig uit te breiden (zie het formaat bovenaan elk bestand).

## Adaptief: hoe het werkt

Per leerling en onderdeel wordt een **score van 1 tot 5** bijgehouden (Rasch/Elo-model). Na elk antwoord wordt die bijgewerkt; de volgende opgave krijgt een moeilijkheid waarbij de kans op goed ongeveer 70–75% is. Zo worden alle functioneringsniveaus bediend, van groep 6-niveau tot pittig 1S.

| Score | Niveau |
|---|---|
| onder 2,0 | op weg naar 1F |
| 2,0 – 3,0 | 1F |
| 3,0 – 3,7 | op weg naar 2F (taal) / 1S (rekenen) |
| 3,7 en hoger | 2F / 1S |

De score is een schatting op basis van het oefenen en geen officiële toetsuitslag.

## Voor leerkrachten (volgsysteem)

- **Mijn klassen**: per klas de week, weektaak, % goed en de niveauverdeling per vakgebied.
- **Overzicht**: deze week (focus, weekdoel, voortgang per leerling), niveauverdeling, signalen en opgaven per dag.
- **Leerlingen**: sorteerbare tabel met niveau en score per vakgebied, weektaak, % goed, laatst actief en signalen.
- **Vaardigheden**: kleurenkaart leerlingen × 18 onderdelen, met klasgemiddelde en de focus van de week.
- **Instructiegroepjes**: per onderdeel wie extra instructie nodig heeft (score < 2,4) en wie verrijking aankan (≥ 3,8). Af te drukken.
- **Weekplanning**: per week focus-onderdelen, weekdoel, proeftoets open/dicht, vakantieweek en een bericht voor de klas. Er staat meteen een standaardplanning klaar van de startweek tot de toets (alle 18 onderdelen komen aan bod, met kerstvakantie en twee proeftoetsweken).
- **Proeftoetsen**: uitslagen per week per leerling; een toets wissen zodat hij opnieuw kan.
- **Per leerling**: niveau per vakgebied, automatisch advies, groei per week, weektaak per week, tabel per onderdeel met trend, proeftoetsen, en **alle antwoorden** (opgave, gegeven en goed antwoord, moeilijkheid, tijd), te filteren op onderdeel en fout.
- **Differentiatie per leerling**: startniveau per vakgebied, weekdoel 50–150%, eigen leerdoelen in de weektaak, voorlezen, grote letters, letterruimte, rustige modus, notitie, niveau opnieuw laten bepalen.
- **Signalen**: niet geoefend (vanaf woensdag), onder 1F, veel fout bij een onderdeel, daling, en "klikt snel door".
- Inlogkaarten printen, export naar Excel (CSV), op school of thuis (via het IP-adres van de school).
- **Beheer** (eerste account): gebruik van de hele school, leerkrachten, schoolnaam en logo, registratie aan/uit.

## Doorstroomtoets 2027

Alle groep 8-leerlingen maken de doorstroomtoets in 2027 tussen **25 januari en 12 februari**; de papieren afname is op 26 en 27 januari ([Rijksoverheid](https://www.rijksoverheid.nl/onderwerpen/schooladvies-en-doorstroomtoets-basisschool/vraag-en-antwoord/wanneer-doorstroomtoets-basisonderwijs)). De standaard toetsdatum is **26 januari 2027**; zet bij de klas onder *Weekplanning* de datum die de school met Bureau ICE heeft afgesproken.

## Snel starten

Vereist **Node.js 22.5 of nieuwer**, geen npm-pakketten.

```bash
cd basislab-doorstroom
npm run demo      # demoschool: groep 8a met 24 leerlingen en drie weken oefengeschiedenis
npm start         # http://localhost:3000
npm test          # tests van API, adaptieve motor, planning en alle opgaven
```

Of dubbelklik op `Start Basislab Doorstroom (Windows).bat` / `(Mac).command`.

Demo-inlog: leerkracht `demo@basislab.nl` / `basislab-doorstroom` (beheerder); leerlingen klascode `BERG-42K`, wachtwoord `kompas12`.

Instellingen (omgevingsvariabelen): `PORT`, `DB_FILE` (standaard `./data/basislab-doorstroom.db`), `SIGNUP_CODE`, `TRUST_PROXY`, `COOKIE_SECURE`, `TZ_SCHOOL` — zelfde betekenis als bij Basislab Typen.

## Online zetten

### Op dezelfde VPS als Basislab Typen (aanbevolen)

De Caddy van Basislab Typen regelt dan ook het certificaat voor Doorstroom.

1. DNS bij TransIP: A-record `doorstroom` naar het IP-adres van de VPS.
2. Code ophalen en instellen:
   ```bash
   cd /opt/Rijke-teksten && sudo git pull
   cd basislab-doorstroom/deploy && sudo cp .env.example .env && sudo nano .env   # SIGNUP_CODE invullen
   ```
3. Controleer de netwerknaam van Typen met `sudo docker network ls` (standaard `deploy_default`; anders `TYPEN_NETWORK=...` in `.env` zetten) en start:
   ```bash
   sudo docker compose -f docker-compose.samevps.yml up -d --build
   ```
4. Voeg onderaan `/opt/Rijke-teksten/basislab-typen/deploy/Caddyfile` toe:
   ```
   doorstroom.basislab.nl {
   	encode zstd gzip
   	reverse_proxy doorstroom:3000
   	header Strict-Transport-Security "max-age=31536000"
   }
   ```
   en herstart Caddy: `cd /opt/Rijke-teksten/basislab-typen/deploy && sudo docker compose restart caddy`.
5. Controle: `https://doorstroom.basislab.nl/api/health` geeft `{"ok":true}`.

Let op: een `git pull` overschrijft de Caddyfile van Typen niet zolang je die wijziging niet terugdraait; zet de regel er na een update eventueel opnieuw in.

### Op een eigen server

```bash
cd basislab-doorstroom/deploy
cp .env.example .env        # DOMEIN en SIGNUP_CODE invullen
docker compose up -d --build
```

Back-up: `docker compose exec app npm run backup` (14 kopieën in het volume, zoals bij Typen). Nooit `docker compose down -v` gebruiken: dat wist de gegevens.

## Privacy en veiligheid

Gelijk aan Basislab Typen: alle gegevens in één SQLite-bestand op de eigen server; van leerlingen alleen voornaam en oefengegevens; wachtwoorden met scrypt; HttpOnly-cookies; rem op inlogpogingen; CSRF-header; strikte Content-Security-Policy; geen externe diensten, trackers of lettertypen van buiten. De antwoorden van opgaven blijven op de server, zodat leerlingen ze niet in de browser kunnen opzoeken. Voorlezen gebruikt de spraak van het apparaat zelf.

## Projectstructuur

```
server.js                   start de HTTP-server
src/app.js                  API: inloggen, oefenen, proeftoets, volgsysteem, beheer
src/engine.js               adaptieve keuze, planning, proeftoets-schatting, signalen
src/content/                opgaven: rekenen.js, taal.js, lezen.js, teksten.js, index.js (maken en nakijken)
public/js/shared/skills.js  vakgebieden, onderdelen, niveaus, standaardplanning (server en browser)
public/js/student/          startscherm, oefenen, proeftoets, mijn niveau
public/js/teacher/          klassen, klas (7 tabbladen), leerling, inlogkaarten, beheer
scripts/                    demo en back-up
test/                       node --test
```
