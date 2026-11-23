// Vakgebieden en onderdelen van de doorstroomtoets (IEP), gedeeld door server en browser.
// Niveauschaal (theta): 1 = groep 6-niveau, 2 = 1F in zicht, 3 = 1F beheerst, 4 = 2F/1S, 5 = boven 2F/1S.

export const DOMAINS = [
  { id: 'rk', name: 'Rekenen', streef: '1S', color: '#2a78d6', icon: 'calc' },
  { id: 'tv', name: 'Taalverzorging', streef: '2F', color: '#1baf7a', icon: 'pen' },
  { id: 'lz', name: 'Lezen', streef: '2F', color: '#eb6834', icon: 'book' },
];
export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));

export const SKILLS = [
  { id: 'rk-getal', domain: 'rk', name: 'Getallen', desc: 'Plaatswaarde, afronden, de getallenlijn, grote en negatieve getallen' },
  { id: 'rk-bewerk', domain: 'rk', name: 'Bewerkingen', desc: 'Optellen, aftrekken, vermenigvuldigen en delen, ook in verhaaltjes' },
  { id: 'rk-breuk', domain: 'rk', name: 'Breuken', desc: 'Deel van een geheel, vergelijken, optellen en een breuk van een getal' },
  { id: 'rk-komma', domain: 'rk', name: 'Kommagetallen', desc: 'Ordenen, rekenen met kommagetallen en geld' },
  { id: 'rk-procent', domain: 'rk', name: 'Procenten', desc: 'Procent van een bedrag, korting, en hoeveel procent iets is' },
  { id: 'rk-verhouding', domain: 'rk', name: 'Verhoudingen', desc: 'Verhoudingstabel, recepten, schaal en snelheid' },
  { id: 'rk-meten', domain: 'rk', name: 'Meten en tijd', desc: 'Lengte, gewicht, inhoud, tijd en omrekenen' },
  { id: 'rk-meetkunde', domain: 'rk', name: 'Meetkunde', desc: 'Omtrek, oppervlakte, inhoud en hoeken' },
  { id: 'rk-verband', domain: 'rk', name: 'Tabellen en grafieken', desc: 'Aflezen, vergelijken en het gemiddelde' },
  { id: 'tv-ww', domain: 'tv', name: 'Werkwoordspelling', desc: 'Tegenwoordige tijd, verleden tijd en voltooid deelwoord (d, t of dt)' },
  { id: 'tv-spelling', domain: 'tv', name: 'Spelling', desc: 'Klankgroepen, ei/ij, au/ou, leenwoorden, meervoud en verkleinwoorden' },
  { id: 'tv-interpunctie', domain: 'tv', name: 'Leestekens en hoofdletters', desc: 'Punt, komma, aanhalingstekens, apostrof, trema en hoofdletters' },
  { id: 'tv-grammatica', domain: 'tv', name: 'Zinsdelen en woordsoorten', desc: 'Persoonsvorm, onderwerp, lijdend voorwerp en woordsoorten' },
  { id: 'tv-zinsbouw', domain: 'tv', name: 'Goede zinnen', desc: 'Dan of als, hun of hen, die of dat en zinnen goed opbouwen' },
  { id: 'lz-woordenschat', domain: 'lz', name: 'Woordenschat', desc: 'Betekenis van woorden en uitdrukkingen in een zin' },
  { id: 'lz-begrijpend', domain: 'lz', name: 'Begrijpend lezen', desc: 'Teksten lezen: hoofdgedachte, details, verwijzingen en bedoeling van de schrijver' },
  { id: 'lz-verbanden', domain: 'lz', name: 'Signaalwoorden', desc: 'Verbanden in zinnen: oorzaak, gevolg, tegenstelling, tijd en meer' },
  { id: 'lz-informatie', domain: 'lz', name: 'Informatie opzoeken', desc: 'Dienstregelingen, prijslijsten, roosters en tabellen lezen' },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillsOf = (domainId) => SKILLS.filter((s) => s.domain === domainId);

export const THETA_MIN = 0.5;
export const THETA_MAX = 5.5;
export const DEFAULT_THETA = 2.5;

/** Startniveaus die de leerkracht per leerling kan kiezen. */
export const START_LEVELS = [
  { id: 'auto', name: 'Automatisch (begint rond 1F)', theta: DEFAULT_THETA },
  { id: 'basis', name: 'Basis: onder 1F', theta: 1.5 },
  { id: '1F', name: '1F', theta: 2.6 },
  { id: '2F', name: '2F/1S', theta: 3.8 },
];

/**
 * Niveaulabel bij een theta. De grenzen sluiten aan bij de referentieniveaus waarop de IEP rapporteert.
 */
export function niveauFor(theta, domainId) {
  const streef = DOMAIN_BY_ID[domainId]?.streef || '2F';
  if (theta == null) return { id: 'onbekend', short: '–', name: 'Nog niet bekend', rank: -1 };
  if (theta < 2.0) return { id: 'onder', short: '<1F', name: 'Op weg naar 1F', rank: 0 };
  if (theta < 3.0) return { id: '1F', short: '1F', name: '1F', rank: 1 };
  if (theta < 3.7) return { id: '1F+', short: `1F→${streef}`, name: `1F, op weg naar ${streef}`, rank: 2 };
  return { id: '2F', short: streef, name: streef, rank: 3 };
}

export const NIVEAU_COLORS = { onbekend: '#c9ccd6', onder: '#ec835a', '1F': '#fab219', '1F+': '#7fc97f', '2F': '#1baf7a' };

/** Kans op een goed antwoord (Rasch-achtig model). */
export function pCorrect(theta, difficulty) {
  return 1 / (1 + Math.exp(-1.7 * (theta - difficulty)));
}

/** Nieuwe theta na een antwoord; stapgrootte neemt af naarmate er meer gegevens zijn. */
export function updateTheta(theta, n, difficulty, correct) {
  const k = 0.12 + 0.55 / (1 + n / 12);
  const next = theta + k * ((correct ? 1 : 0) - pCorrect(theta, difficulty));
  return Math.max(THETA_MIN, Math.min(THETA_MAX, next));
}

// ---------- weken en planning ----------
const pad = (n) => String(n).padStart(2, '0');
export const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Maandag (JJJJ-MM-DD) van de week waarin de dag valt. */
export function mondayOf(dayKey) {
  const d = new Date(`${dayKey}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoDay(d);
}

export function addDays(dayKey, n) {
  const d = new Date(`${dayKey}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

/** Alle maandagen vanaf de startweek tot en met de week van de toets. */
export function weeksBetween(startDay, toetsDay) {
  const out = [];
  let w = mondayOf(startDay);
  const last = mondayOf(toetsDay);
  while (w <= last && out.length < 60) {
    out.push(w);
    w = addDays(w, 7);
  }
  return out;
}

/** Kerstvakantie 2026-2027 (alle regio's): daarin wordt standaard niet gepland. */
export const DEFAULT_HOLIDAYS = ['2026-12-21', '2026-12-28'];

/**
 * In 2027 maken alle groep 8-leerlingen de doorstroomtoets tussen 25 januari en 12 februari;
 * de papieren afname is op 26 en 27 januari. De school stelt de eigen datum in bij de klas.
 */
export const DEFAULT_TOETS_DAY = '2027-01-26';

/**
 * Standaard weekplanning: in elke week een rekenonderdeel, een taalonderdeel en een leesonderdeel,
 * zodat alles minstens twee keer aan bod komt. In de laatste twee weken herhaling en een proeftoets.
 */
export function defaultPlan(startDay, toetsDay, holidays = DEFAULT_HOLIDAYS) {
  const weeks = weeksBetween(startDay, toetsDay);
  const rk = skillsOf('rk').map((s) => s.id);
  const tv = skillsOf('tv').map((s) => s.id);
  const lz = skillsOf('lz').map((s) => s.id);
  const plan = {};
  let i = 0;
  const work = weeks.filter((w) => !holidays.includes(w));
  weeks.forEach((w) => {
    if (holidays.includes(w)) {
      plan[w] = { focus: [], goal: 0, test: false, holiday: true, note: 'Vakantie: oefenen mag, hoeft niet.' };
      return;
    }
    const idx = work.indexOf(w);
    const fromEnd = work.length - 1 - idx;
    if (fromEnd === 0) {
      plan[w] = { focus: [], goal: 30, test: false, holiday: false, note: 'Toetsweek: rustig herhalen. Succes!' };
    } else if (fromEnd === 1 || (fromEnd === 4 && work.length > 6)) {
      plan[w] = { focus: [], goal: 60, test: true, holiday: false, note: 'Proeftoets en herhaling van je zwakste onderdelen.' };
    } else {
      plan[w] = { focus: [rk[i % rk.length], rk[(i + 4) % rk.length], tv[i % tv.length], lz[i % lz.length]], goal: 60, test: false, holiday: false, note: '' };
      i += 1;
    }
  });
  return plan;
}

export function weekLabel(monday) {
  const d = new Date(`${monday}T12:00:00`);
  const e = new Date(`${addDays(monday, 4)}T12:00:00`);
  const f = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
  return `${f.format(d)} – ${f.format(e)}`;
}

export const QUESTION_TYPES = {
  mc: 'meerkeuze',
  input: 'invullen',
};
