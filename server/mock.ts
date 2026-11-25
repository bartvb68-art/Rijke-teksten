// Testmodus (MOCK=1): laat de app werken zonder API-sleutel, met voorbeeldinhoud.
import type { Aanvraag, Lesmateriaal } from './types.ts';
import { GROEPEN } from './types.ts';
import type { Melding } from './generator.ts';

const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function genereerMock(a: Aanvraag, _id: string | undefined, meld: Melding) {
  meld('Zoekt alleen in: NOS Jeugdjournaal, Het Klokhuis, Kidsweek, Schooltv, NPO Kennis');
  await wacht(500);
  meld(`Zoekt in de erkende bronnen: “${a.thema} uitleg kinderen”`);
  await wacht(500);
  meld('8 resultaten gevonden');
  await wacht(400);
  meld('Leest: https://www.hetklokhuis.nl/onderwerp/bijen');
  await wacht(500);
  meld(`Schrijft de rijke tekst voor ${GROEPEN[a.groep].label}…`);
  await wacht(700);
  const materiaal: Lesmateriaal = {
    titel: 'Kleine bij, grote taak',
    introductie: 'Stel je voor: er bestaat een dier dat zo klein is als je vingertop, maar zonder dat dier zouden er veel minder appels, aardbeien en bloemen zijn. Welk dier zou dat zijn?',
    hoofdtekst: `Op een zonnige dag zoemt het in de tuin. Een bij landt op een bloem, kruipt erin en vliegt weer verder. Het lijkt een klein moment, maar er gebeurt iets heel belangrijks.

## Van bloem naar bloem
Een bij zoekt nectar, een zoet sap in de bloem. Terwijl ze drinkt, blijft er stuifmeel aan haar harige lijf plakken. Bij de volgende bloem valt een deel van dat stuifmeel er weer af. Dat heet bestuiven. Doordat bloemen bestoven worden, kunnen er vruchten en zaden groeien.

## Samen in een volk
Honingbijen leven in een volk met duizenden bijen. Er is één koningin die eitjes legt. De werksters doen al het andere werk: ze maken de kast schoon, zorgen voor de larven en halen voedsel. Elke bij heeft dus een eigen taak.

## Waarom bijen het moeilijk hebben
Bijen hebben bloemen nodig om te kunnen leven. Als er minder bloemen zijn, vinden bijen minder voedsel. Daardoor kunnen er minder bijen overleven. Ook jij kunt helpen, bijvoorbeeld door bloemen te zaaien in de tuin of op het balkon.`,
    woorden: [
      { woord: 'nectar', uitleg: 'zoet sap in een bloem' },
      { woord: 'stuifmeel', uitleg: 'heel fijn geel poeder in een bloem' },
      { woord: 'bestuiven', uitleg: 'stuifmeel van de ene naar de andere bloem brengen' },
      { woord: 'volk', uitleg: 'een grote groep bijen die samen leeft' },
      { woord: 'werkster', uitleg: 'een bij die al het werk in het volk doet' },
      { woord: 'larve', uitleg: 'een jong diertje dat uit een eitje komt' },
    ],
    vragen: [
      { soort: 'Onthouden', vraag: 'Wat zoekt een bij in een bloem?', antwoord: 'Nectar, een zoet sap.' },
      { soort: 'Begrijpen', vraag: 'Leg in je eigen woorden uit wat bestuiven is.', antwoord: 'Stuifmeel wordt door de bij van bloem naar bloem gebracht, zodat er vruchten kunnen groeien.' },
      { soort: 'Woordenschat', vraag: 'Wat betekent het woord “werkster” in deze tekst?', antwoord: 'Een bij die het werk in het volk doet.' },
      { soort: 'Verbanden leggen', vraag: 'Waarom zijn er minder appels als er minder bijen zijn?', antwoord: 'Bijen bestuiven de bloemen; zonder bestuiving groeien er minder vruchten.' },
      { soort: 'Mening', vraag: 'Vind jij dat iedereen bloemen zou moeten zaaien? Waarom wel of niet?', antwoord: 'Eigen mening met een argument uit de tekst.' },
      { soort: 'Burgerschap', vraag: 'Wat zou jullie school samen kunnen doen om bijen te helpen?', antwoord: 'Bijvoorbeeld een bloemenperk aanleggen of een bijenhotel maken.' },
    ],
    meerkeuze: [
      { vraag: 'Wat is het belangrijkste doel van deze tekst?', opties: { A: 'Uitleggen hoe je honing maakt', B: 'Uitleggen waarom bijen belangrijk zijn', C: 'Vertellen over een bijensteek', D: 'Reclame maken voor bloemen' }, antwoord: 'B', uitleg: 'De tekst legt uit welke taak bijen hebben en waarom dat belangrijk is.' },
      { vraag: 'Wie legt de eitjes in een bijenvolk?', opties: { A: 'De werksters', B: 'De larven', C: 'De koningin', D: 'Alle bijen' }, antwoord: 'C', uitleg: 'Er staat dat er één koningin is die eitjes legt.' },
      { vraag: 'Welk woord past bij “stuifmeel”?', opties: { A: 'Poeder', B: 'Sap', C: 'Blad', D: 'Wortel' }, antwoord: 'A', uitleg: 'Stuifmeel is heel fijn poeder.' },
      { vraag: 'Wat is een gevolg van minder bloemen?', opties: { A: 'Bijen worden groter', B: 'Er komen meer koninginnen', C: 'Bijen vinden minder voedsel', D: 'Bijen gaan slapen' }, antwoord: 'C', uitleg: 'Bijen hebben bloemen nodig voor voedsel.' },
      { vraag: 'Wat kun jij volgens de tekst doen om bijen te helpen?', opties: { A: 'Bloemen zaaien', B: 'Bijen vangen', C: 'Honing eten', D: 'Gras maaien' }, antwoord: 'A', uitleg: 'De tekst noemt bloemen zaaien in de tuin of op het balkon.' },
    ],
    differentiatie: {
      ondersteuning: 'Lees de tekst eerst samen voor en bespreek de woorden vooraf met plaatjes. Laat leerlingen per tussenkopje één zin vertellen wat ze hebben geleerd.',
      uitdaging: 'Laat leerlingen een stroomschema maken: van bloem naar vrucht. Daarna bedenken ze een plan voor een bijvriendelijk schoolplein en presenteren dat aan de klas.',
    },
    bronnen: [
      { nr: 1, titel: 'Waarom zijn bijen belangrijk?', url: 'https://www.hetklokhuis.nl/onderwerp/bijen', bron: 'Het Klokhuis', video: true },
      { nr: 2, titel: 'Het gaat niet goed met de bij', url: 'https://nos.nl/jeugdjournaal/artikel/voorbeeld', bron: 'NOS Jeugdjournaal', video: true },
    ],
    beeldmateriaal: [{ nr: 1, titel: 'Waarom zijn bijen belangrijk?', url: 'https://www.hetklokhuis.nl/onderwerp/bijen', bron: 'Het Klokhuis', video: true }],
    groep: a.groep,
    thema: a.thema,
  };
  return { materiaal, onderzoekId: 'mock' };
}
