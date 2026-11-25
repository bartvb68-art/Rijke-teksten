// Leerlijn van Basislab Ontleden. Dit bestand wordt gedeeld door server en browser.
import { ZINNEN, NAMES } from './zinnen.js';

// ---------- Zinsdelen ----------

export const LABELS = {
  pv: { name: 'Persoonsvorm', short: 'pv', color: '#e34948' },
  ow: { name: 'Onderwerp', short: 'ow', color: '#3987e5' },
  wg: { name: 'Werkwoordelijk gezegde', short: 'wg', color: '#eb6834' },
  lv: { name: 'Lijdend voorwerp', short: 'lv', color: '#1baf7a' },
  mv: { name: 'Meewerkend voorwerp', short: 'mv', color: '#9085e9' },
  bwb: { name: 'Bijwoordelijke bepaling', short: 'bwb', color: '#eda100' },
  ng: { name: 'Naamwoordelijk gezegde', short: 'ng', color: '#e87ba4' },
  rest: { name: 'Ander zinsdeel', short: '?', color: '#8a93b8' },
  knip: { name: 'Zinsdelen knippen', short: 'knip', color: '#4fb8d8' },
};

/** Volgorde waarin zinsdelen worden getoond (knoppen, grafieken). */
export const LABEL_ORDER = ['pv', 'ow', 'wg', 'lv', 'mv', 'bwb', 'ng'];
export const SKILL_ORDER = ['knip', ...LABEL_ORDER];

export const BWB_KINDS = {
  tijd: { name: 'Tijd', q: 'Wanneer?' },
  plaats: { name: 'Plaats', q: 'Waar?' },
  manier: { name: 'Manier', q: 'Hoe?' },
  reden: { name: 'Reden', q: 'Waarom?' },
};

/** De proef of vraag waarmee je een zinsdeel vindt. */
export const PROEVEN = {
  knip: 'Verschuifproef: maak met dezelfde woorden een nieuwe, goede zin. Woorden die steeds bij elkaar blijven, vormen samen één zinsdeel.',
  pv: 'Tijdproef: zet de zin in een andere tijd. Het werkwoord dat verandert, is de persoonsvorm. Of de vraagproef: maak er een vraag van; de persoonsvorm komt dan vooraan.',
  ow: 'Vraag: wie of wat + gezegde? Het onderwerp hoort bij de persoonsvorm: maak je het onderwerp meervoud, dan verandert de persoonsvorm mee.',
  wg: 'Het werkwoordelijk gezegde zijn alle werkwoorden in de zin: de persoonsvorm en de andere werkwoorden. Ook een los stukje van een werkwoord (zoals "mee" of "op") hoort erbij.',
  lv: 'Vraag: wie of wat + onderwerp + gezegde? Niet elke zin heeft een lijdend voorwerp.',
  mv: 'Vraag: aan of voor wie + onderwerp + gezegde + lijdend voorwerp? Vaak kun je er "aan" of "voor" voor zetten.',
  bwb: 'Vraag: waar, wanneer, hoe of waarom? De bijwoordelijke bepaling vertelt iets over de plaats, de tijd, de manier of de reden.',
  ng: 'Is de persoonsvorm een koppelwerkwoord (zijn, worden, blijven, lijken, schijnen, blijken of heten) en zegt de zin wat het onderwerp is of wordt? Dan is het gezegde een naamwoordelijk gezegde: het koppelwerkwoord + het naamwoordelijk deel.',
};

// ---------- Zinnen ----------

function labelOf(role, ng) {
  if (role === 'wg') return ng ? 'ng' : 'wg';
  if (role === 'nd') return 'ng';
  return role;
}

export function parseSentence(line, id = 0) {
  const sep = line.indexOf('|');
  const level = Number(line.slice(0, sep));
  const body = line.slice(sep + 1);
  const re = /\[(\w+)(?::(\w+))?\s([^\]]+)\]/g;
  const chunks = [];
  let m;
  while ((m = re.exec(body))) {
    let text = m[3];
    let alt = null;
    if (m[1] === 'pv' && text.includes('|')) [text, alt] = text.split('|');
    chunks.push({ i: chunks.length, role: m[1], kind: m[2] || null, text, alt });
  }
  const ng = chunks.some((c) => c.role === 'nd');
  for (const c of chunks) c.label = labelOf(c.role, ng);
  const end = body.slice(body.lastIndexOf(']') + 1).trim();
  return { id, level, chunks, end, ng, text: chunks.map((c) => c.text).join(' ') + end };
}

export const SENTENCES = ZINNEN.map((z, i) => parseSentence(z, i));

const KOPPEL_FORMS = new Set(['is', 'was', 'zijn', 'waren', 'ben', 'bent', 'wordt', 'werd', 'worden', 'werden', 'blijft', 'bleef', 'blijven',
  'lijkt', 'leek', 'schijnt', 'scheen', 'blijkt', 'bleek', 'heet', 'heette']);

/** Woorden van een zin met het nummer van het zinsdeel waar ze bij horen. */
export function sentenceWords(s) {
  const words = [];
  for (const c of s.chunks) for (const w of c.text.split(' ')) words.push({ w, chunk: c.i });
  return words;
}

const VERBAL = new Set(['pv', 'wg']);
/**
 * Knipplekken tussen woorden: 'must' (hier begint een nieuw zinsdeel), 'may' (tussen twee delen van het gezegde:
 * knippen mag, hoeft niet) of 'no' (binnen een zinsdeel).
 */
export function cutGaps(s) {
  const words = sentenceWords(s);
  const gaps = [];
  for (let i = 0; i < words.length - 1; i++) {
    const a = s.chunks[words[i].chunk];
    const b = s.chunks[words[i + 1].chunk];
    if (a === b) gaps.push('no');
    else if ((VERBAL.has(a.role) && VERBAL.has(b.role)) || (a.role === 'nd' && b.role === 'wg') || (a.role === 'wg' && b.role === 'nd')) gaps.push('may');
    else gaps.push('must');
  }
  return gaps;
}

function lowerFirst(text) {
  if (NAMES.some((n) => text.startsWith(n))) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
const show = (c) => (c.i === 0 ? lowerFirst(c.text) : c.text);
const byLabel = (s, ...labels) => s.chunks.filter((c) => labels.includes(c.label) || labels.includes(c.role));
const join = (list) => list.map(show).join(' ');

function verbsRest(s) {
  return s.chunks.filter((c) => c.role === 'wg').map(show).join(' ');
}

/** Lijdend en meewerkend voorwerp in een natuurlijke volgorde ("de fans een cd", "een lied voor de juf"). */
function objects(s) {
  const mv = join(byLabel(s, 'mv'));
  const lv = join(byLabel(s, 'lv'));
  return (/^(aan|voor) /.test(mv) ? [lv, mv] : [mv, lv]).filter(Boolean).join(' ');
}

/** Hulpvraag om een zinsdeel te vinden, ingevuld met de woorden van de zin. */
export function questionFor(s, label, kind = null) {
  const pv = byLabel(s, 'pv')[0];
  const ow = join(byLabel(s, 'ow'));
  const rest = verbsRest(s);
  const nd = join(s.chunks.filter((c) => c.role === 'nd'));
  const tail = (...parts) => parts.filter(Boolean).join(' ');
  if (label === 'ow') return `Wie of wat ${tail(show(pv), objects(s), nd, rest)}?`;
  if (label === 'lv') return `Wie of wat ${tail(show(pv), ow, rest)}?`;
  if (label === 'mv') return `Aan of voor wie ${tail(show(pv), ow, join(byLabel(s, 'lv')), rest)}?`;
  if (label === 'bwb') return `${(BWB_KINDS[kind] || BWB_KINDS.tijd).q.slice(0, -1)} ${tail(show(pv), ow, objects(s), nd, rest)}?`;
  return '';
}

/** Uitleg bij een zinsdeel in deze zin (voor feedback na een antwoord). */
export function explainLabel(s, label) {
  const pv = byLabel(s, 'pv')[0];
  if (label === 'pv') return pv.alt ? `Tijdproef: "${show(pv)}" wordt "${pv.alt.toLowerCase()}". Dus "${show(pv)}" is de persoonsvorm.` : `"${show(pv)}" is de persoonsvorm.`;
  if (label === 'wg') return `Alle werkwoorden samen: ${join(byLabel(s, 'pv', 'wg'))}. Dat is het werkwoordelijk gezegde.`;
  if (label === 'ng') return `"${show(pv)}" is hier een koppelwerkwoord. Het naamwoordelijk gezegde is: ${join(s.chunks.filter((c) => ['pv', 'wg', 'nd'].includes(c.role)))}.`;
  if (label === 'bwb') {
    const b = byLabel(s, 'bwb');
    return b.map((c) => `${questionFor(s, 'bwb', c.kind)} Antwoord: ${show(c)} (${BWB_KINDS[c.kind]?.name.toLowerCase() || 'bepaling'}).`).join(' ');
  }
  const parts = byLabel(s, label);
  if (!parts.length) return `Deze zin heeft geen ${LABELS[label].name.toLowerCase()}.`;
  return `${questionFor(s, label)} Antwoord: ${join(parts)}.`;
}

export function splitText(s) {
  return s.chunks.map((c) => c.text).join(' | ') + s.end;
}

// ---------- Podia en lessen ----------

export const PODIA = [
  { id: 1, name: 'Oefenhok', color: '#a68be3', desc: 'Zinsdelen knippen, de persoonsvorm en het onderwerp.' },
  { id: 2, name: 'Repetitieruimte', color: '#9475dc', desc: 'Het werkwoordelijk gezegde.' },
  { id: 3, name: 'Clubpodium', color: '#815dd5', desc: 'Het lijdend voorwerp.' },
  { id: 4, name: 'Festivaltent', color: '#6a3fc8', desc: 'Het meewerkend voorwerp.' },
  { id: 5, name: 'Hoofdpodium', color: '#5a32b0', desc: 'Bijwoordelijke bepalingen: waar, wanneer, hoe en waarom.' },
  { id: 6, name: 'Stadion', color: '#472490', desc: 'Het naamwoordelijk gezegde en het ontleeddiploma.' },
];

// mode: split | select | label | quiz
export const LESSONS = [
  { id: 1, podium: 1, title: 'Zinnen knippen', mode: 'split', teaches: 'knip',
    tip: 'Een zin bestaat uit zinsdelen. Gooi de zin om (de verschuifproef): woorden die steeds bij elkaar blijven, horen bij hetzelfde zinsdeel. Knip de zin tussen de zinsdelen.' },
  { id: 2, podium: 1, title: 'De persoonsvorm', mode: 'select', target: 'pv', teaches: 'pv',
    tip: 'De persoonsvorm is een werkwoord. Zet de zin in een andere tijd: het werkwoord dat verandert, is de persoonsvorm. Bij een vraag staat de persoonsvorm vooraan.' },
  { id: 3, podium: 1, title: 'Het onderwerp', mode: 'select', target: 'ow', teaches: 'ow',
    tip: 'Vraag: wie of wat + gezegde? Het antwoord is het onderwerp. Het onderwerp en de persoonsvorm horen bij elkaar: is het onderwerp meervoud, dan is de persoonsvorm het ook.' },
  { id: 4, podium: 1, title: 'Pv en onderwerp', mode: 'label', teaches: null,
    tip: 'Geef elk zinsdeel een etiket: persoonsvorm, onderwerp of "ander zinsdeel". Zoek altijd eerst de persoonsvorm, dan het onderwerp.' },
  { id: 5, podium: 2, title: 'Het werkwoordelijk gezegde', mode: 'select', target: 'wg', teaches: 'wg',
    tip: 'Het werkwoordelijk gezegde zijn álle werkwoorden in de zin: de persoonsvorm en de andere werkwoorden. Ook een los stukje zoals "mee" (meezingen) of "op" (optreden) hoort erbij.' },
  { id: 6, podium: 2, title: 'Pv, onderwerp en gezegde', mode: 'label', teaches: null,
    tip: 'Eerst de persoonsvorm, dan het onderwerp, dan de andere werkwoorden. Kies bij de persoonsvorm "pv"; de andere werkwoorden zijn "wg".' },
  { id: 7, podium: 2, title: 'Lange zinnen knippen', mode: 'split', minLevel: 2, teaches: null,
    tip: 'Lange zinnen hebben meer zinsdelen. Een zinsdeel kan best lang zijn, zoals "de luidste trompettist van de fanfare". Gebruik de verschuifproef.' },
  { id: 8, podium: 3, title: 'Het lijdend voorwerp', mode: 'select', target: 'lv', teaches: 'lv',
    tip: 'Vraag: wie of wat + onderwerp + gezegde? Bijvoorbeeld: "Wie of wat stemt de gitarist?" Antwoord: zijn gitaar. Dat is het lijdend voorwerp.' },
  { id: 9, podium: 3, title: 'Ontleden met lv', mode: 'label', teaches: null,
    tip: 'Werk in vaste stappen: 1. persoonsvorm, 2. onderwerp, 3. de rest van het werkwoordelijk gezegde, 4. het lijdend voorwerp.' },
  { id: 10, podium: 3, title: 'Onderwerp of lv?', mode: 'quiz', quiz: 'rol', quizLabels: ['ow', 'lv'], teaches: null,
    tip: 'Het onderwerp doet iets, het lijdend voorwerp ondergaat het. Twijfel je? Maak het zinsdeel meervoud: verandert de persoonsvorm mee, dan is het het onderwerp.' },
  { id: 11, podium: 4, title: 'Het meewerkend voorwerp', mode: 'select', target: 'mv', teaches: 'mv',
    tip: 'Vraag: aan of voor wie + onderwerp + gezegde + lijdend voorwerp? "Aan of voor wie geeft de zanger een handtekening?" Antwoord: de fans.' },
  { id: 12, podium: 4, title: 'Welke vraag stel je?', mode: 'quiz', quiz: 'vraag', quizLabels: ['ow', 'lv', 'mv'], teaches: null,
    tip: 'Elk zinsdeel heeft een eigen vraag. Onderwerp: wie of wat + gezegde. Lijdend voorwerp: wie of wat + onderwerp + gezegde. Meewerkend voorwerp: aan of voor wie?' },
  { id: 13, podium: 4, title: 'Ontleden met mv', mode: 'label', teaches: null,
    tip: 'Stappen: pv, onderwerp, werkwoordelijk gezegde, lijdend voorwerp, meewerkend voorwerp. Een meewerkend voorwerp komt bijna altijd samen met een lijdend voorwerp voor.' },
  { id: 14, podium: 5, title: 'De bijwoordelijke bepaling', mode: 'select', target: 'bwb', teaches: 'bwb',
    tip: 'Vraag: waar, wanneer, hoe of waarom? Een zin kan meer dan één bijwoordelijke bepaling hebben. Kies ze allemaal.' },
  { id: 15, podium: 5, title: 'Waar, wanneer, hoe, waarom?', mode: 'quiz', quiz: 'bwbsoort', teaches: null,
    tip: 'Tijd: wanneer? Plaats: waar? Manier: hoe? Reden: waarom?' },
  { id: 16, podium: 5, title: 'Alles ontleden', mode: 'label', teaches: null,
    tip: 'Nu ken je bijna alle zinsdelen. Begin altijd met de persoonsvorm en het onderwerp. Wat overblijft is vaak een lijdend voorwerp, meewerkend voorwerp of bijwoordelijke bepaling.' },
  { id: 17, podium: 6, title: 'Het naamwoordelijk gezegde', mode: 'select', target: 'ng', teaches: 'ng',
    tip: 'Koppelwerkwoorden: zijn, worden, blijven, lijken, schijnen, blijken, heten. Zegt de zin wat het onderwerp is of wordt ("De zanger is zenuwachtig")? Dan vormen het koppelwerkwoord en "zenuwachtig" samen het naamwoordelijk gezegde.' },
  { id: 18, podium: 6, title: 'Wg of ng?', mode: 'quiz', quiz: 'gezegde', teaches: null,
    tip: '"Zijn" en "worden" kunnen ook een hulpwerkwoord zijn: "De zangeres is gevallen" heeft een werkwoordelijk gezegde. "De zangeres is moe" heeft een naamwoordelijk gezegde.' },
  { id: 19, podium: 6, title: 'Meesterontleder', mode: 'label', teaches: null,
    tip: 'Alle zinsdelen door elkaar. Kijk bij de persoonsvorm goed: is het een koppelwerkwoord? Dan krijgen de andere werkwoorden en het naamwoordelijk deel het etiket "ng".' },
  { id: 20, podium: 6, title: 'Ontleeddiploma', mode: 'label', exam: true, teaches: null,
    tip: 'Het examen: ontleed twaalf zinnen helemaal. Met twee sterren haal je je ontleeddiploma!' },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const EXAM_LESSON_ID = 20;
export const EXAM_PASS_STARS = 2;
export const GAMES_UNLOCK_LESSON = 3;

/** Etiketten die een leerling tot en met deze les heeft geleerd (zonder 'knip'). */
export function knownLabels(lessonId) {
  const set = [];
  for (const l of LESSONS) if (l.id <= lessonId && l.teaches && l.teaches !== 'knip') set.push(l.teaches);
  return LABEL_ORDER.filter((x) => set.includes(x));
}

/** Etiketknoppen bij het ontleden in deze les. */
export function labelChoices(lessonId) {
  const known = knownLabels(lessonId);
  return known.length < LABEL_ORDER.length ? [...known, 'rest'] : known;
}

// ---------- Niveaus en sterren ----------

export const GROEPEN = [5, 6, 7, 8];
// Kans op zinnen van niveau 1, 2 en 3 per (groep + niveau-aanpassing van de leerling).
const LEVEL_WEIGHTS = {
  4: [1, 0.15, 0.02], 5: [1, 0.5, 0.05], 6: [0.7, 1, 0.25], 7: [0.4, 1, 0.7], 8: [0.2, 0.8, 1], 9: [0.05, 0.5, 1],
};
export const LEVEL_SHIFTS = [[-1, 'Makkelijker'], [0, 'Normaal'], [1, 'Uitdaging']];

export function levelWeights(groep = 6, shift = 0) {
  const g = Math.max(4, Math.min(9, (GROEPEN.includes(Number(groep)) ? Number(groep) : 6) + (Number(shift) || 0)));
  return LEVEL_WEIGHTS[g];
}

export const STAR_RULES = { one: 60, two: 80, three: 90 };

/** Sterren (0-3) op basis van het percentage goed beantwoorde zinnen. */
export function starsFor(accuracy) {
  if (accuracy >= STAR_RULES.three) return 3;
  if (accuracy >= STAR_RULES.two) return 2;
  if (accuracy >= STAR_RULES.one) return 1;
  return 0;
}

// ---------- Rangen ----------

export const RANKS = [
  { xp: 0, name: 'Straatmuzikant' },
  { xp: 300, name: 'Bandlid' },
  { xp: 1000, name: 'Podiumtalent' },
  { xp: 2500, name: 'Headliner' },
  { xp: 5000, name: 'Rockster' },
  { xp: 9000, name: 'Legende' },
];

export function rankFor(xp) {
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) { current = RANKS[i]; next = RANKS[i + 1] || null; }
  }
  return { ...current, level: RANKS.indexOf(current) + 1, next };
}

// ---------- Opdrachten maken ----------

/** Eenvoudige voorspelbare random-generator, handig voor tests. */
export function makeRng(seed = Date.now()) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Zinnen die passen bij een les. */
export function poolFor(lesson) {
  const known = new Set(knownLabels(lesson.id));
  return SENTENCES.filter((s) => {
    if (lesson.minLevel && s.level < lesson.minLevel) return false;
    if (s.ng && !known.has('ng') && lesson.mode !== 'split' && !(lesson.mode === 'select' && ['pv', 'ow'].includes(lesson.target))) return false;
    if (lesson.mode === 'select') {
      if (lesson.target === 'wg') return !s.ng;
      if (lesson.target === 'ng') return s.ng;
      if (['lv', 'mv', 'bwb'].includes(lesson.target)) return s.chunks.some((c) => c.label === lesson.target);
      return true;
    }
    if (lesson.mode === 'quiz') {
      if (lesson.quiz === 'rol' || lesson.quiz === 'vraag') return s.chunks.some((c) => lesson.quizLabels.includes(c.label) && c.label !== 'ow');
      if (lesson.quiz === 'bwbsoort') return s.chunks.some((c) => c.label === 'bwb');
      if (lesson.quiz === 'gezegde') {
        const pv = s.chunks.find((c) => c.label === 'pv');
        return s.ng || KOPPEL_FORMS.has(pv.text.toLowerCase());
      }
    }
    return true;
  });
}

function pick(pool, n, rng, weights) {
  const out = [];
  let bag = [...pool];
  while (out.length < n && pool.length) {
    if (!bag.length) bag = [...pool];
    const total = bag.reduce((x, s) => x + weights[s.level - 1], 0);
    let r = rng() * total;
    let idx = bag.length - 1;
    for (let i = 0; i < bag.length; i++) {
      r -= weights[bag[i].level - 1];
      if (r <= 0) { idx = i; break; }
    }
    out.push(bag[idx]);
    bag.splice(idx, 1);
  }
  return out;
}

/** Eén opdracht voor een les met een gekozen zin. */
export function makeItem(lesson, s, rng) {
  if (lesson.mode === 'split') return { mode: 'split', lessonId: lesson.id, s };
  if (lesson.mode === 'select') return { mode: 'select', lessonId: lesson.id, s, target: lesson.target };
  if (lesson.mode === 'label') return { mode: 'label', lessonId: lesson.id, s, choices: labelChoices(lesson.exam ? 19 : lesson.id) };
  // quiz
  if (lesson.quiz === 'rol' || lesson.quiz === 'vraag') {
    const options = lesson.quizLabels;
    const candidates = s.chunks.filter((c) => options.includes(c.label));
    // vaker het lastigste zinsdeel vragen
    const rarer = candidates.filter((c) => c.label !== 'ow');
    const list = rarer.length && rng() < 0.65 ? rarer : candidates;
    const chunk = list[Math.floor(rng() * list.length)];
    return {
      mode: 'quiz', quiz: lesson.quiz, lessonId: lesson.id, s, chunk: chunk.i, answer: chunk.label,
      question: lesson.quiz === 'rol' ? 'Welk zinsdeel is gemarkeerd?' : 'Met welke vraag vind je het gemarkeerde zinsdeel?',
      options: options.map((o) => ({ value: o, label: lesson.quiz === 'rol' ? LABELS[o].name : QUIZ_QUESTIONS[o] })),
    };
  }
  if (lesson.quiz === 'bwbsoort') {
    const list = s.chunks.filter((c) => c.label === 'bwb');
    const chunk = list[Math.floor(rng() * list.length)];
    return {
      mode: 'quiz', quiz: 'bwbsoort', lessonId: lesson.id, s, chunk: chunk.i, answer: chunk.kind,
      question: 'Wat voor bijwoordelijke bepaling is gemarkeerd?',
      options: Object.entries(BWB_KINDS).map(([k, v]) => ({ value: k, label: `${v.name} (${v.q.toLowerCase()})` })),
    };
  }
  // gezegde: werkwoordelijk of naamwoordelijk
  const pv = s.chunks.find((c) => c.label === 'pv');
  return {
    mode: 'quiz', quiz: 'gezegde', lessonId: lesson.id, s, chunk: pv.i, answer: s.ng ? 'ng' : 'wg',
    question: `Wat voor gezegde heeft deze zin? (de persoonsvorm is "${pv.i === 0 ? lowerFirst(pv.text) : pv.text}")`,
    options: [{ value: 'wg', label: 'Werkwoordelijk gezegde' }, { value: 'ng', label: 'Naamwoordelijk gezegde' }],
  };
}

export const QUIZ_QUESTIONS = {
  ow: 'Wie of wat + gezegde?',
  lv: 'Wie of wat + onderwerp + gezegde?',
  mv: 'Aan of voor wie + onderwerp + gezegde + lv?',
  bwb: 'Waar, wanneer, hoe of waarom?',
};

/** De stappen van een les. */
export function lessonSteps(lessonId) {
  const l = LESSON_BY_ID[lessonId];
  if (l?.exam) {
    return [
      { kind: 'oefen', title: 'Generale repetitie', count: 8, hints: true, desc: 'Oefen het hele ontleden. Je mag de hulpvragen gebruiken.' },
      { kind: 'test', title: 'Examen', count: 12, hints: false, desc: 'Ontleed twaalf zinnen helemaal, zonder hulp. Met twee sterren haal je je ontleeddiploma.' },
    ];
  }
  return [
    { kind: 'intro', title: 'Soundcheck', count: 3, hints: true, desc: 'Uitleg en drie voorbeelden met hulp.' },
    { kind: 'oefen', title: 'Repetitie', count: 6, hints: true, desc: 'Oefen zelf. Kom je er niet uit? Gebruik de hulpvraag.' },
    { kind: 'mix', title: 'Jamsessie', count: 6, hints: true, desc: 'Deze les en eerdere lessen door elkaar.' },
    { kind: 'test', title: 'Optreden', count: 10, hints: false, desc: 'Tien zinnen zonder hulp. Verdien 1 tot 3 sterren!' },
  ];
}

/** Maak de opdrachten voor een stap van een les. */
export function generateItems(lessonId, stepIndex, { groep = 6, levelShift = 0, seed = Date.now() } = {}) {
  const lesson = LESSON_BY_ID[lessonId];
  const step = lessonSteps(lessonId)[stepIndex];
  const rng = makeRng(seed);
  const weights = levelWeights(groep, levelShift);
  const items = [];
  if (step.kind === 'mix' && lessonId > 1) {
    const earlier = LESSONS.filter((l) => l.id < lessonId && !l.exam);
    const own = Math.ceil(step.count / 2);
    for (const s of pick(poolFor(lesson), own, rng, weights)) items.push(makeItem(lesson, s, rng));
    while (items.length < step.count) {
      // recente lessen vaker herhalen
      const idx = Math.max(0, earlier.length - 1 - Math.floor(Math.pow(rng(), 1.6) * earlier.length));
      const other = earlier[idx];
      const [s] = pick(poolFor(other), 1, rng, weights);
      if (s) items.push(makeItem(other, s, rng));
    }
    return shuffle(items, rng);
  }
  for (const s of pick(poolFor(lesson), step.count, rng, weights)) items.push(makeItem(lesson, s, rng));
  return items;
}

// ---------- Nakijken ----------

function addStat(stats, key, ok) {
  const e = stats[key] || (stats[key] = [0, 0]);
  e[ok ? 0 : 1] += 1;
}

/** De zinsdelen die bij 'select' gekozen moeten worden. */
export function selectTargets(item) {
  const { s, target } = item;
  if (target === 'wg') return s.chunks.filter((c) => c.label === 'pv' || c.label === 'wg').map((c) => c.i);
  if (target === 'ng') return s.chunks.filter((c) => c.label === 'pv' || c.label === 'ng').map((c) => c.i);
  return s.chunks.filter((c) => c.label === target).map((c) => c.i);
}

/** Verwacht etiket per zinsdeel bij 'label'. */
export function expectedLabels(item) {
  return item.s.chunks.map((c) => (item.choices.includes(c.label) ? c.label : 'rest'));
}

/**
 * Kijk een antwoord na.
 * split: answer = lijst van woordposities waarna geknipt is
 * select: answer = lijst van gekozen zinsdelen
 * label: answer = etiket per zinsdeel
 * quiz: answer = gekozen waarde
 * Geeft { correct, stats: { onderdeel: [goed, fout] }, confusions: { 'echt>gekozen': n } }.
 */
export function checkAnswer(item, answer) {
  const stats = {};
  const confusions = {};
  const confuse = (real, given) => { const k = `${real}>${given}`; confusions[k] = (confusions[k] || 0) + 1; };
  let correct = true;
  if (item.mode === 'split') {
    const cuts = new Set((answer || []).map(Number));
    cutGaps(item.s).forEach((g, i) => {
      if (g === 'must') { const ok = cuts.has(i); addStat(stats, 'knip', ok); if (!ok) correct = false; }
      if (g === 'no' && cuts.has(i)) { addStat(stats, 'knip', false); correct = false; }
    });
  } else if (item.mode === 'select') {
    const targets = new Set(selectTargets(item));
    const chosen = new Set((answer || []).map(Number));
    for (const c of item.s.chunks) {
      if (targets.has(c.i)) {
        const ok = chosen.has(c.i);
        addStat(stats, item.target, ok);
        if (!ok) correct = false;
      } else if (chosen.has(c.i)) {
        correct = false;
        addStat(stats, c.label, false);
        confuse(c.label, item.target);
      }
    }
  } else if (item.mode === 'label') {
    const exp = expectedLabels(item);
    item.s.chunks.forEach((c, i) => {
      const given = answer?.[i];
      const ok = given === exp[i];
      if (!ok) correct = false;
      if (exp[i] !== 'rest') addStat(stats, exp[i], ok);
      if (!ok && given && exp[i] !== 'rest' && given !== 'rest') confuse(exp[i], given);
    });
  } else if (item.mode === 'quiz') {
    correct = answer === item.answer;
    if (item.quiz === 'bwbsoort') {
      addStat(stats, 'bwb', correct);
      if (!correct && answer) confuse(`bwb-${item.answer}`, `bwb-${answer}`);
    } else {
      addStat(stats, item.answer, correct);
      if (!correct && answer) confuse(item.answer, answer);
    }
  }
  return { correct, stats, confusions };
}

/** Uitleg na het antwoord: korte zinnen. */
export function explainItem(item) {
  const { s } = item;
  if (item.mode === 'split') return [`Zinsdelen: ${splitText(s)}`];
  if (item.mode === 'select') return [explainLabel(s, item.target)];
  if (item.mode === 'label') {
    const out = [];
    for (const l of LABEL_ORDER) {
      if (!item.choices.includes(l)) continue;
      if (l === 'wg' && s.ng) continue;
      if (s.chunks.some((c) => c.label === l)) out.push(explainLabel(s, l));
    }
    return out;
  }
  if (item.quiz === 'bwbsoort') {
    const c = s.chunks[item.chunk];
    return [`${questionFor(s, 'bwb', c.kind)} Antwoord: ${show(c)}. Dat is een bepaling van ${BWB_KINDS[c.kind].name.toLowerCase()}.`];
  }
  if (item.quiz === 'gezegde') {
    return s.ng ? [explainLabel(s, 'ng')] : [`Hier is "${show(s.chunks[item.chunk])}" een hulpwerkwoord. ${explainLabel(s, 'wg')}`];
  }
  return [explainLabel(s, item.answer)];
}

/** Hulp tijdens het oefenen: de proef voor het gevraagde zinsdeel. */
export function hintFor(item) {
  if (item.mode === 'split') return PROEVEN.knip;
  if (item.mode === 'select') {
    const q = ['ow', 'lv', 'mv'].includes(item.target) ? ` Hier: "${questionFor(item.s, item.target)}"` : '';
    return PROEVEN[item.target] + q;
  }
  if (item.mode === 'label') return 'Zoek eerst de persoonsvorm (tijdproef), dan het onderwerp (wie of wat + gezegde?). Daarna de andere werkwoorden en de rest.';
  if (item.quiz === 'bwbsoort') return 'Stel de vragen: wanneer? waar? hoe? waarom? Welke vraag past bij het gemarkeerde zinsdeel?';
  if (item.quiz === 'gezegde') return PROEVEN.ng;
  return `${PROEVEN.ow} ${PROEVEN.lv}${item.options.length > 2 ? ` ${PROEVEN.mv}` : ''}`;
}

// ---------- Spellen ----------

/** Etiketten in de spellen: wat de leerling al geleerd heeft. */
export function gameLabels(unlocked) {
  return labelChoices(Math.max(3, Math.min(19, unlocked - 1)));
}

/** Zinnen voor de spellen, passend bij wat de leerling kent. */
export function gameSentences(unlocked) {
  const known = new Set(knownLabels(Math.max(3, unlocked - 1)));
  return SENTENCES.filter((s) => !s.ng || known.has('ng'));
}
