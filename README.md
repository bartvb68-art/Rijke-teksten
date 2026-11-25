# Basislab Meestertekst – meestertekst.basislab.nl

Rijke teksten voor de klas, in de huisstijl van Basislab Doorstroom. De leerkracht kiest een **thema**, **groep (3–8, met AVI-niveau)**,
**tekstsoort** en **lengte**. De app maakt dan:

- een introductie om voor te lezen, plus een video (Klokhuis, Jeugdjournaal, Schooltv…) als die gevonden is,
- een rijke tekst met tussenkopjes, waarin moeilijke woorden een uitleg krijgen,
- een woordenlijst,
- 6 vragen (onthouden, begrijpen, woordenschat, verbanden, mening, burgerschap) met een antwoordmodel,
- 5 meerkeuzevragen in toetsstijl met uitleg,
- differentiatie (ondersteuning en uitdaging),
- een lijst met de gebruikte bronnen.

Daarnaast: **makkelijker/moeilijker** (zelfde bronnen, andere groep), **voorlezen** (spraak van de browser, Nederlandse stem),
**dyslexievriendelijke weergave**, **afdrukken** en **Word-export** (leerlingversie en leerkrachtversie met antwoorden).

## Alleen erkende bronnen

De AI (Claude) mag alleen zoeken en lezen op de bronnen in [`server/bronnen.ts`](server/bronnen.ts):
NOS Jeugdjournaal, Het Klokhuis, Kidsweek, Schooltv, NPO Kennis en (optioneel) WikiKids. Dat wordt op drie plekken afgedwongen:

1. De zoek- en leesfunctie van Claude krijgt alleen deze domeinen (`allowed_domains`). Andere sites kan hij niet zien.
2. De tekst mag alleen feiten bevatten uit het feitenoverzicht dat uit die pagina's is gehaald.
3. Elke link in het lesmateriaal komt uit de echte zoekresultaten en wordt door de server opnieuw tegen de lijst gecontroleerd.
   Verzonnen links zijn daardoor niet mogelijk. Vindt de AI niets over een thema, dan krijgt de leerkracht een melding.

Een bron toevoegen of weghalen: pas de lijst in `server/bronnen.ts` aan.

## Lokaal starten

Vereist: Node.js 22.18 of hoger.

```bash
npm install
npm run mock        # testmodus zonder API-sleutel (voorbeeldinhoud) → http://localhost:8080
ANTHROPIC_API_KEY=sk-ant-... npm start
```

`npm run check` controleert de TypeScript-code. `./maak-zip.sh` maakt `dist/basislab-meestertekst-server.zip` voor de server.

## Installeren op de TransIP-VPS (naast Basislab Typen)

Zelfde werkwijze als Basislab Ontleden: de app draait als eigen container op het Docker-netwerk van Typen
(`deploy_default`) en de Caddy van Typen (`deploy-caddy-1`) regelt het webadres en het slotje.

1. **API-sleutel**: maak op https://console.anthropic.com een sleutel aan (Settings → API keys), zet er tegoed op en stel een maandlimiet in.
2. **DNS bij TransIP**: A-record `meestertekst` → `136.144.142.66`.
3. **Uploaden** (PowerShell op je eigen computer):
   ```powershell
   scp $HOME\Downloads\basislab-meestertekst-server.zip bartvanbergen@136.144.142.66:~
   ssh bartvanbergen@136.144.142.66
   ```
4. **Uitpakken** (op de server):
   ```bash
   sudo mkdir -p /opt/basislab-meestertekst
   sudo unzip -o ~/basislab-meestertekst-server.zip -d /opt/basislab-meestertekst
   ```
5. **Instellingen**: vul de API-sleutel en een toegangscode voor leerkrachten in:
   ```bash
   cd /opt/basislab-meestertekst/deploy
   sudo cp .env.example .env && sudo nano .env      # opslaan: Ctrl+O, Enter, Ctrl+X
   sudo chmod 600 .env
   ```
6. **Starten**:
   ```bash
   sudo docker compose -f naast-typen.yml up -d --build
   sudo docker ps --format '{{.Names}}  {{.Status}}'   # basislab-meestertekst-meestertekst-1  Up … (healthy)
   ```
7. **Webadres koppelen** (reservekopie, blok toevoegen, controleren, herladen):
   ```bash
   sudo cp /opt/Rijke-teksten/basislab-typen/deploy/Caddyfile /opt/Rijke-teksten/basislab-typen/deploy/Caddyfile.backup
   printf '\nmeestertekst.basislab.nl {\n\tencode zstd gzip\n\treverse_proxy basislab-meestertekst-meestertekst-1:8080\n}\n' | sudo tee -a /opt/Rijke-teksten/basislab-typen/deploy/Caddyfile
   sudo docker exec deploy-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   sudo docker exec deploy-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
   ```
   Alleen herladen als de controle `Valid configuration` geeft.
8. **Testen**: open https://meestertekst.basislab.nl, vul de toegangscode in en maak een tekst.

**Nieuwe versie installeren**: upload de nieuwe zip (stap 3), pak uit (stap 4) en start opnieuw (stap 6).
Het bestand `.env` blijft staan, want dat zit niet in de zip.

## Kosten

Per lespakket worden twee AI-stappen gedaan (zoeken in de bronnen, daarna schrijven). Afhankelijk van lengte en aantal
gelezen pagina's kost dat een paar dubbeltjes per pakket. "Makkelijker/moeilijker" hergebruikt de gevonden bronnen en is daardoor goedkoper.

## Opbouw

```
server/index.ts      webserver (Express): /api/config, /api/genereer (voortgang live), /api/docx
server/generator.ts  stap 1: zoeken in erkende bronnen · stap 2: rijke tekst + opdrachten schrijven
server/bronnen.ts    de lijst met erkende bronnen en de linkcontrole
server/docx.ts       Word-export (leerling / leerkracht)
server/mock.ts       testmodus
public/              voorkant (HTML/CSS/JS, geen bouwstap)
```
