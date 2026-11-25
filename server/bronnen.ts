// De ENIGE bronnen die Basislab Teksten mag gebruiken.
// Claude kan via de zoekfunctie alleen op deze sites zoeken en lezen; elke link die
// in het lesmateriaal terechtkomt, wordt daarnaast door de server opnieuw tegen deze lijst gecontroleerd.
// Een bron toevoegen? Voeg hier een regel toe (domein zonder https://, eventueel met pad).

export interface Bron {
  id: string;
  naam: string;
  domein: string; // host, eventueel met pad (bijv. nos.nl/jeugdjournaal)
  omschrijving: string;
  video: boolean; // levert (ook) video's die geschikt zijn als introductie
  standaard: boolean; // standaard aangevinkt
}

export const BRONNEN: Bron[] = [
  { id: 'jeugdjournaal', naam: 'NOS Jeugdjournaal', domein: 'nos.nl/jeugdjournaal', omschrijving: 'Nieuws voor kinderen', video: true, standaard: true },
  { id: 'klokhuis', naam: 'Het Klokhuis', domein: 'hetklokhuis.nl', omschrijving: 'Uitleg over wetenschap, techniek, natuur en cultuur', video: true, standaard: true },
  { id: 'kidsweek', naam: 'Kidsweek', domein: 'kidsweek.nl', omschrijving: 'Nieuwskrant voor kinderen', video: false, standaard: true },
  { id: 'schooltv', naam: 'Schooltv', domein: 'schooltv.nl', omschrijving: 'Educatieve video’s van NTR', video: true, standaard: true },
  { id: 'npokennis', naam: 'NPO Kennis', domein: 'npokennis.nl', omschrijving: 'Achtergrond en uitleg van de publieke omroep', video: true, standaard: true },
  { id: 'wikikids', naam: 'WikiKids', domein: 'wikikids.nl', omschrijving: 'Encyclopedie voor en door kinderen', video: false, standaard: false },
];

export function kiesBronnen(ids: unknown): Bron[] {
  const gekozen = Array.isArray(ids) ? BRONNEN.filter((b) => ids.includes(b.id)) : [];
  return gekozen.length ? gekozen : BRONNEN.filter((b) => b.standaard);
}

/** Hoort deze URL bij een van de gekozen bronnen? Controleert host én (indien opgegeven) pad. */
export function bronVoorUrl(url: string, bronnen: Bron[]): Bron | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  for (const b of bronnen) {
    const [bHost, ...padDelen] = b.domein.split('/');
    const bPad = padDelen.length ? '/' + padDelen.join('/') : '';
    const hostOk = host === bHost || host.endsWith('.' + bHost);
    const padOk = !bPad || u.pathname === bPad || u.pathname.startsWith(bPad + '/');
    if (hostOk && padOk) return b;
  }
  return null;
}

/** Domeinlijst voor web_search (paden toegestaan). */
export const zoekDomeinen = (bronnen: Bron[]) => bronnen.map((b) => b.domein);
/** Domeinlijst voor web_fetch (alleen hosts). De server filtert daarna op het volledige pad. */
export const leesDomeinen = (bronnen: Bron[]) => [...new Set(bronnen.map((b) => b.domein.split('/')[0]))];
