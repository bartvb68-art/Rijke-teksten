# Basislab Teksten – teksten.basislab.nl

Rijke teksten voor de klas, in de huisstijl van Basislab. De leerkracht kiest een **thema**, **groep (3–8, met AVI-niveau)**,
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
cp .env.example .env   # vul ANTHROPIC_API_KEY (en eventueel TOEGANGSCODE) in
node --env-file=.env server/index.ts
```

`npm run check` controleert de TypeScript-code.

## Installeren op de TransIP-VPS (naast Basislab Typen)

1. DNS bij TransIP: A-record `teksten` → IP-adres van de VPS.
2. Zet deze map op de server, bijv. in `/opt/basislab-teksten`, en maak daar een `.env` aan (zie `.env.example`).
   Kies een **TOEGANGSCODE**: zonder code kan iedereen met de link teksten maken op jouw kosten.
3. Start de container:
   ```bash
   cd /opt/basislab-teksten/deploy && sudo docker compose up -d --build
   ```
   (Heet het netwerk van Typen niet `deploy_default`? Zie `sudo docker network ls` en start met `TYPEN_NETWERK=<naam>`.)
4. Voeg aan de Caddyfile van Basislab Typen toe en herstart Caddy:
   ```
   teksten.basislab.nl {
   	reverse_proxy basislab-teksten-teksten-1:8080
   }
   ```

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
