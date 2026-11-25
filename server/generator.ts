import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import { type Bron, bronVoorUrl, kiesBronnen, leesDomeinen, zoekDomeinen } from './bronnen.ts';
import { type Aanvraag, type GevondenBron, type Lesmateriaal, GROEPEN, LENGTES, TEKSTSOORTEN } from './types.ts';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

let client: Anthropic | null = null;
const claude = () => (client ??= new Anthropic());

export type Melding = (tekst: string) => void;

export class GebruikersFout extends Error {}

/* ------------------------------------------------------------------ */
/* Onderzoek wordt even bewaard, zodat "makkelijker/moeilijker" niet   */
/* opnieuw hoeft te zoeken.                                            */
/* ------------------------------------------------------------------ */
interface Onderzoek {
  thema: string;
  notities: string;
  bronnen: GevondenBron[];
  verloopt: number;
}
const onderzoeken = new Map<string, Onderzoek>();
const BEWAARTIJD = 2 * 60 * 60 * 1000;
function bewaar(o: Omit<Onderzoek, 'verloopt'>): string {
  const nu = Date.now();
  for (const [k, v] of onderzoeken) if (v.verloopt < nu) onderzoeken.delete(k);
  const id = randomUUID();
  onderzoeken.set(id, { ...o, verloopt: nu + BEWAARTIJD });
  return id;
}

/* ------------------------------------------------------------------ */
/* Stap 1 – zoeken in uitsluitend de erkende bronnen                   */
/* ------------------------------------------------------------------ */
async function doeOnderzoek(a: Aanvraag, bronnen: Bron[], meld: Melding) {
  const groep = GROEPEN[a.groep];
  const lijst = bronnen.map((b) => `- ${b.naam} (${b.domein})`).join('\n');

  const system = `Je bent onderzoeksassistent van een leerkracht in het Nederlandse basisonderwijs.
Je verzamelt betrouwbare informatie voor een lestekst. Je mag UITSLUITEND informatie gebruiken uit deze erkende kinderbronnen:
${lijst}

Werkwijze:
1. Zoek met web_search (meerdere zoekvragen in het Nederlands, kort en concreet). Lees de beste pagina's met web_fetch.
2. Gebruik GEEN eigen voorkennis als feit. Alles wat je noteert, moet je op een van deze pagina's hebben gelezen.
3. Schrijf daarna een feitenoverzicht in het Nederlands: korte opsommingen, gegroepeerd per deelonderwerp.
   Zet achter ELK feit tussen haakjes de volledige URL van de pagina waar het staat.
4. Noem ook welke pagina's een video bevatten die geschikt is als introductie in de klas.
5. Vind je in deze bronnen weinig of niets over het thema, zeg dat dan eerlijk. Verzin niets.`;

  const user = `Thema: ${a.thema}
Doelgroep: ${groep.label} (${groep.avi})
Tekstsoort die er later van gemaakt wordt: ${TEKSTSOORTEN[a.tekstsoort]}
Verzamel genoeg feiten voor een tekst van ongeveer ${LENGTES[a.lengte].woorden} woorden.`;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: user }];
  const gevonden = new Map<string, Omit<GevondenBron, 'nr'>>();
  const notities: string[] = [];

  const registreer = (url: string, titel: string) => {
    const bron = bronVoorUrl(url, bronnen);
    if (!bron) return;
    const schoon = url.split('#')[0];
    const bestaand = gevonden.get(schoon);
    if (bestaand && bestaand.titel) return;
    gevonden.set(schoon, { url: schoon, titel: titel?.trim() || bron.naam, bron: bron.naam, video: bron.video });
  };

  for (let ronde = 0; ronde < 5; ronde++) {
    const stream = claude().beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system,
      messages,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 8,
          allowed_domains: zoekDomeinen(bronnen),
          user_location: { type: 'approximate', country: 'NL' },
        },
        {
          type: 'web_fetch_20250910',
          name: 'web_fetch',
          max_uses: 6,
          allowed_domains: leesDomeinen(bronnen),
          max_content_tokens: 12000,
        },
      ],
    });

    stream.on('contentBlock', (blok) => {
      if (blok.type === 'server_tool_use') {
        const input = blok.input as { query?: string; url?: string };
        if (blok.name === 'web_search' && input.query) meld(`Zoekt in de erkende bronnen: “${input.query}”`);
        if (blok.name === 'web_fetch' && input.url) meld(`Leest: ${input.url}`);
      } else if (blok.type === 'web_search_tool_result' && Array.isArray(blok.content)) {
        for (const r of blok.content) registreer(r.url, r.title);
        meld(`${blok.content.length} resultaten gevonden`);
      } else if (blok.type === 'web_fetch_tool_result' && blok.content.type === 'web_fetch_result') {
        registreer(blok.content.url, blok.content.content.title ?? '');
      }
    });

    const antwoord = await stream.finalMessage();
    if (antwoord.stop_reason === 'refusal') throw new GebruikersFout('Dit thema kan niet worden uitgewerkt. Kies een ander thema.');
    for (const blok of antwoord.content) if (blok.type === 'text') notities.push(blok.text);

    if (antwoord.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: antwoord.content });
      continue;
    }
    break;
  }

  // Alleen bronnen die het onderzoek ook echt noemt (of alles als er niets genoemd is)
  const tekst = notities.join('\n').trim();
  let lijstBronnen = [...gevonden.values()];
  const genoemd = lijstBronnen.filter((b) => tekst.includes(b.url) || tekst.includes(b.url.replace(/\/$/, '')));
  if (genoemd.length) lijstBronnen = genoemd;

  if (!tekst || lijstBronnen.length === 0) {
    throw new GebruikersFout(
      `In de gekozen erkende bronnen is (nog) niets bruikbaars gevonden over “${a.thema}”. Probeer een breder of ander thema, of vink meer bronnen aan.`,
    );
  }
  const genummerd: GevondenBron[] = lijstBronnen.slice(0, 20).map((b, i) => ({ ...b, nr: i + 1 }));
  return { notities: tekst, bronnen: genummerd };
}

/* ------------------------------------------------------------------ */
/* Stap 2 – de rijke tekst en de opdrachten schrijven                  */
/* ------------------------------------------------------------------ */
const str = { type: 'string' } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const SCHEMA = obj({
  titel: str,
  introductie: str,
  hoofdtekst: str,
  woorden: { type: 'array', items: obj({ woord: str, uitleg: str }) },
  vragen: { type: 'array', items: obj({ soort: str, vraag: str, antwoord: str }) },
  meerkeuze: {
    type: 'array',
    items: obj({
      vraag: str,
      opties: obj({ A: str, B: str, C: str, D: str }),
      antwoord: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
      uitleg: str,
    }),
  },
  differentiatie: obj({ ondersteuning: str, uitdaging: str }),
  gebruikte_bronnen: { type: 'array', items: { type: 'integer' } },
  introductie_videos: { type: 'array', items: { type: 'integer' } },
});

type Schrijfresultaat = Omit<Lesmateriaal, 'bronnen' | 'beeldmateriaal' | 'groep' | 'thema'> & {
  gebruikte_bronnen: number[];
  introductie_videos: number[];
};

async function schrijf(a: Aanvraag, o: { notities: string; bronnen: GevondenBron[] }, meld: Melding): Promise<Lesmateriaal> {
  const groep = GROEPEN[a.groep];
  const woorden = LENGTES[a.lengte].woorden;
  meld(`Schrijft de rijke tekst voor ${groep.label}…`);

  const system = `Je bent een ervaren leerkracht en schrijver van lesteksten voor het Nederlandse basisonderwijs.
Je schrijft een RIJKE TEKST: inhoudsrijk en betekenisvol, samenhangend (duidelijke opbouw en verbanden),
met rijke maar passende woordenschat, die voortbouwt op kennis van de wereld en leerlingen uitdaagt om door te denken.

Harde regels:
- Gebruik UITSLUITEND feiten uit het feitenoverzicht hieronder (afkomstig uit erkende kinderbronnen). Voeg geen feiten, getallen, namen of jaartallen toe die daar niet in staan. Je mag wel uitleggen, verbinden en voorbeelden uit het dagelijks leven van kinderen gebruiken.
- Taalniveau: ${groep.label} (${groep.avi}): ${groep.woorden}.
- Tekstsoort: ${TEKSTSOORTEN[a.tekstsoort]}.
- Lengte hoofdtekst: ongeveer ${woorden} woorden.
- Hoofdtekst: géén titel; begin met een korte inleidende alinea, daarna tussenkopjes op een eigen regel in de vorm "## Kopje". Lege regel tussen alinea's. Geen opsommingstekens, geen vetgedrukte tekst, geen links.
- Spreek leerlingen aan op een respectvolle, nieuwsgierig makende toon. Geen moraliserende afsluiting.
- Introductie: 2–3 zinnen die de leerkracht voorleest om voorkennis te activeren en nieuwsgierig te maken (eindig met een vraag aan de klas).
- Woorden: 6–10 moeilijke of belangrijke woorden uit de hoofdtekst, met een kindvriendelijke uitleg.
- Vragen: precies 6, met als soort achtereenvolgens: "Onthouden", "Begrijpen", "Woordenschat", "Verbanden leggen", "Mening", "Burgerschap". Geef bij elke vraag een antwoordmodel voor de leerkracht.
- Meerkeuze: precies 5 vragen in toetsstijl (zoals bij begrijpend lezen-toetsen), met één goed antwoord en drie aannemelijke afleiders. Varieer de plek van het goede antwoord. Uitleg = waarom dit antwoord klopt.
- Differentiatie: een concrete aanpak voor leerlingen die ondersteuning nodig hebben en een verdiepende opdracht voor snelle/sterke lezers.
- gebruikte_bronnen: de nummers van de bronnen waaruit je feiten hebt gebruikt.
- introductie_videos: de nummers (max. 2) van bronnen met een video die geschikt is als introductie; alleen bronnen die in het feitenoverzicht als video worden genoemd. Leeg laten als er geen zijn.`;

  const bronlijst = o.bronnen.map((b) => `[${b.nr}] ${b.titel} – ${b.bron} – ${b.url}${b.video ? ' (bron met video’s)' : ''}`).join('\n');
  const user = `Thema: ${a.thema}

Genummerde bronnen:
${bronlijst}

Feitenoverzicht (met URL achter elk feit):
${o.notities}`;

  const stream = claude().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system,
    messages: [{ role: 'user', content: user }],
  });
  const antwoord = await stream.finalMessage();
  if (antwoord.stop_reason === 'refusal') throw new GebruikersFout('Dit thema kan niet worden uitgewerkt. Kies een ander thema.');
  if (antwoord.stop_reason === 'max_tokens') throw new Error('Het antwoord werd te lang. Kies een kortere tekst.');
  const tekst = antwoord.content.find((b) => b.type === 'text');
  if (!tekst || tekst.type !== 'text') throw new Error('Geen tekst ontvangen.');
  const r = JSON.parse(tekst.text) as Schrijfresultaat;

  const perNr = new Map(o.bronnen.map((b) => [b.nr, b]));
  let gebruikt = [...new Set(r.gebruikte_bronnen)].map((n) => perNr.get(n)).filter((b): b is GevondenBron => !!b);
  if (!gebruikt.length) gebruikt = o.bronnen;
  const videos = [...new Set(r.introductie_videos)]
    .map((n) => perNr.get(n))
    .filter((b): b is GevondenBron => !!b && b.video)
    .slice(0, 2);

  return {
    titel: r.titel,
    introductie: r.introductie,
    hoofdtekst: r.hoofdtekst,
    woorden: r.woorden,
    vragen: r.vragen,
    meerkeuze: r.meerkeuze,
    differentiatie: r.differentiatie,
    bronnen: gebruikt,
    beeldmateriaal: videos,
    groep: a.groep,
    thema: a.thema,
  };
}

/* ------------------------------------------------------------------ */
export async function genereer(a: Aanvraag, onderzoekId: string | undefined, meld: Melding) {
  const bewaard = onderzoekId ? onderzoeken.get(onderzoekId) : undefined;
  if (bewaard && bewaard.verloopt > Date.now() && bewaard.thema === a.thema) {
    meld('Gebruikt de bronnen die al gevonden waren');
    const materiaal = await schrijf(a, bewaard, meld);
    return { materiaal, onderzoekId };
  }
  const bronnen = kiesBronnen(a.bronnen);
  meld(`Zoekt alleen in: ${bronnen.map((b) => b.naam).join(', ')}`);
  const o = await doeOnderzoek(a, bronnen, meld);
  meld(`${o.bronnen.length} bruikbare pagina’s gevonden in erkende bronnen`);
  const id = bewaar({ thema: a.thema, ...o });
  const materiaal = await schrijf(a, o, meld);
  return { materiaal, onderzoekId: id };
}

export { MODEL };
