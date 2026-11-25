// Leerlijn van Basislab Typen. Dit bestand wordt gedeeld door server en browser.
import { WORDS, SENTENCES, NUMBER_SENTENCES, TEXTS } from './words.js';

// ---------- Toetsenbord (QWERTY / US-International, standaard op Nederlandse scholen) ----------

export const FINGERS = {
  lp: { name: 'linker pink', hand: 'links' },
  lr: { name: 'linker ringvinger', hand: 'links' },
  lm: { name: 'linker middelvinger', hand: 'links' },
  li: { name: 'linker wijsvinger', hand: 'links' },
  th: { name: 'duim', hand: 'beide' },
  ri: { name: 'rechter wijsvinger', hand: 'rechts' },
  rm: { name: 'rechter middelvinger', hand: 'rechts' },
  rr: { name: 'rechter ringvinger', hand: 'rechts' },
  rp: { name: 'rechter pink', hand: 'rechts' },
};

// Elke rij: [toets, shift-teken, vinger, breedte]
export const KEY_ROWS = [
  [['`', '~', 'lp'], ['1', '!', 'lp'], ['2', '@', 'lr'], ['3', '#', 'lm'], ['4', '$', 'li'], ['5', '%', 'li'],
    ['6', '^', 'ri'], ['7', '&', 'ri'], ['8', '*', 'rm'], ['9', '(', 'rr'], ['0', ')', 'rp'], ['-', '_', 'rp'],
    ['=', '+', 'rp'], ['Backspace', '', 'rp', 2]],
  [['Tab', '', 'lp', 1.5], ['q', 'Q', 'lp'], ['w', 'W', 'lr'], ['e', 'E', 'lm'], ['r', 'R', 'li'], ['t', 'T', 'li'],
    ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'], ['[', '{', 'rp'],
    [']', '}', 'rp'], ['\\', '|', 'rp', 1.5]],
  [['CapsLock', '', 'lp', 1.8], ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'],
    ['g', 'G', 'li'], ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], [';', ':', 'rp'],
    ["'", '"', 'rp'], ['Enter', '', 'rp', 2.2]],
  [['ShiftLeft', '', 'lp', 2.3], ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'],
    ['b', 'B', 'li'], ['n', 'N', 'ri'], ['m', 'M', 'ri'], [',', '<', 'rm'], ['.', '>', 'rr'], ['/', '?', 'rp'],
    ['ShiftRight', '', 'rp', 2.7]],
  [[' ', '', 'th', 6.5]],
];

// Opzoektabel: teken -> { key, shift, finger }
export const CHAR_INFO = {};
for (const row of KEY_ROWS) {
  for (const [key, shifted, finger] of row) {
    if (key.length === 1) CHAR_INFO[key] = { key, shift: false, finger };
    if (shifted && shifted.length === 1) CHAR_INFO[shifted] = { key, shift: true, finger };
  }
}

export const HOME_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

/** Welke shift-toets hoort bij een teken (andere hand dan de letter). */
export function shiftKeyFor(char) {
  const info = CHAR_INFO[char];
  if (!info || !info.shift) return null;
  return FINGERS[info.finger].hand === 'links' ? 'ShiftRight' : 'ShiftLeft';
}

/** Leesbare naam van een toets, voor uitleg aan kinderen. */
export function keyLabel(char) {
  if (char === ' ') return 'spatie';
  if (char === ';') return 'puntkomma (;)';
  if (char === ',') return 'komma (,)';
  if (char === '.') return 'punt (.)';
  if (char === '?') return 'vraagteken (?)';
  if (char === '!') return 'uitroepteken (!)';
  if (char === ':') return 'dubbele punt (:)';
  if (char === 'Shift') return 'Shift';
  return char.toUpperCase();
}

// ---------- Planeten en lessen ----------

export const PLANETS = [
  { id: 1, name: 'Thuisbasis', color: '#3987e5', desc: 'De thuisrij: hier rusten je vingers altijd.' },
  { id: 2, name: 'Planeet Klinker', color: '#1baf7a', desc: 'Omhoog en omlaag reiken vanaf de thuisrij.' },
  { id: 3, name: 'Komeetkust', color: '#eda100', desc: 'De onderste rij en de zeldzame letters.' },
  { id: 4, name: 'Hoofdletterhaven', color: '#e87ba4', desc: 'Hoofdletters met Shift en leestekens.' },
  { id: 5, name: 'Cijferkomeet', color: '#eb6834', desc: 'De cijfers op de bovenste rij.' },
  { id: 6, name: 'Meesterster', color: '#9085e9', desc: 'Lange teksten en het typediploma.' },
];

// type: 'letters' (nieuwe toetsen), 'shift', 'punct', 'numbers', 'text', 'exam'
export const LESSONS = [
  { id: 1, planet: 1, type: 'letters', title: 'F en J', newKeys: ['f', 'j'],
    tip: 'Leg je wijsvingers op de F en de J. Voel je de bultjes? Daar beginnen je vingers altijd.' },
  { id: 2, planet: 1, type: 'letters', title: 'D en K', newKeys: ['d', 'k'],
    tip: 'Je middelvingers liggen naast je wijsvingers: links op de D, rechts op de K.' },
  { id: 3, planet: 1, type: 'letters', title: 'S en L', newKeys: ['s', 'l'],
    tip: 'Je ringvingers liggen op de S en de L. Houd je polsen ontspannen.' },
  { id: 4, planet: 1, type: 'letters', title: 'A en ;', newKeys: ['a', ';'],
    tip: 'Je pinken liggen op de A en de puntkomma. Nu liggen al je vingers op de thuisrij!' },
  { id: 5, planet: 1, type: 'letters', title: 'G en H', newKeys: ['g', 'h'],
    tip: 'Schuif je wijsvinger een stapje naar het midden voor de G en de H. Daarna terug naar huis!' },
  { id: 6, planet: 2, type: 'letters', title: 'E en I', newKeys: ['e', 'i'],
    tip: 'Je middelvingers reiken schuin omhoog naar de E en de I.' },
  { id: 7, planet: 2, type: 'letters', title: 'R en U', newKeys: ['r', 'u'],
    tip: 'Je wijsvingers reiken omhoog naar de R en de U.' },
  { id: 8, planet: 2, type: 'letters', title: 'T en N', newKeys: ['t', 'n'],
    tip: 'Links reik je omhoog naar de T, rechts omlaag naar de N. Allebei met je wijsvinger.' },
  { id: 9, planet: 2, type: 'letters', title: 'O en W', newKeys: ['o', 'w'],
    tip: 'Je ringvingers reiken omhoog naar de W en de O.' },
  { id: 10, planet: 3, type: 'letters', title: 'V en M', newKeys: ['v', 'm'],
    tip: 'Je wijsvingers reiken omlaag: links naar de V, rechts naar de M.' },
  { id: 11, planet: 3, type: 'letters', title: 'P en B', newKeys: ['p', 'b'],
    tip: 'De P typ je met je rechter pink omhoog. De B is een flinke stap voor je linker wijsvinger.' },
  { id: 12, planet: 3, type: 'letters', title: 'C en de komma', newKeys: ['c', ','],
    tip: 'Je middelvingers reiken omlaag: links naar de C, rechts naar de komma.' },
  { id: 13, planet: 3, type: 'letters', title: 'Z en de punt', newKeys: ['z', '.'],
    tip: 'De Z typ je met je linker pink omlaag, de punt met je rechter ringvinger.' },
  { id: 14, planet: 3, type: 'letters', title: 'Y, Q en X', newKeys: ['y', 'q', 'x'],
    tip: 'Deze letters zie je niet vaak. Y: rechter wijsvinger, Q: linker pink, X: linker ringvinger.' },
  { id: 15, planet: 4, type: 'shift', title: 'Hoofdletters', newKeys: ['Shift'],
    tip: 'Voor een hoofdletter houd je Shift ingedrukt met je pink van de andere hand.' },
  { id: 16, planet: 4, type: 'punct', title: 'Vraagteken, uitroepteken en dubbele punt', newKeys: ['?', '!', ':'],
    tip: 'Deze tekens maak je met Shift. Het vraagteken zit op de toets met de schuine streep.' },
  { id: 17, planet: 5, type: 'numbers', title: 'Cijfers 1 tot en met 5', newKeys: ['1', '2', '3', '4', '5'],
    tip: 'Je linkerhand reikt naar de bovenste rij. Ga na elk cijfer terug naar de thuisrij.' },
  { id: 18, planet: 5, type: 'numbers', title: 'Cijfers 6 tot en met 0', newKeys: ['6', '7', '8', '9', '0'],
    tip: 'Nu is je rechterhand aan de beurt. De 6 en de 7 typ je met je rechter wijsvinger.' },
  { id: 19, planet: 6, type: 'text', title: 'Lange teksten', newKeys: [],
    tip: 'Kijk naar het scherm, niet naar je handen. Rustig en netjes gaat het snelst!' },
  { id: 20, planet: 6, type: 'exam', title: 'Typediploma', newKeys: [],
    tip: 'Dit is je examen. Haal minimaal 2 sterren en je verdient het Basislab Typen-diploma!' },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

/** Alle tekens die een leerling kent na het afronden van les `lessonId` (inclusief die les). */
export function charsUpTo(lessonId) {
  const chars = new Set([' ']);
  let shift = false;
  for (const l of LESSONS) {
    if (l.id > lessonId) break;
    for (const k of l.newKeys) {
      if (k === 'Shift') shift = true;
      else chars.add(k);
    }
  }
  if (shift) {
    for (const c of [...chars]) if (/[a-z]/.test(c)) chars.add(c.toUpperCase());
  }
  return chars;
}

export function lettersUpTo(lessonId) {
  return [...charsUpTo(lessonId)].filter((c) => /[a-z]/.test(c));
}

// ---------- Doelen en sterren ----------

export const GROEPEN = [6, 7, 8];
const START_APM = { 6: 25, 7: 30, 8: 35 };
const FINAL_APM = { 6: 80, 7: 100, 8: 120 };

/** Doelsnelheid in aanslagen per minuut voor 3 sterren. */
export function targetApm(lessonId, groep = 7, speedFactor = 1) {
  const g = GROEPEN.includes(Number(groep)) ? Number(groep) : 7;
  const idx = Math.max(0, Math.min(LESSONS.length - 1, lessonId - 1));
  const t = idx / (LESSONS.length - 1);
  let apm = START_APM[g] + (FINAL_APM[g] - START_APM[g]) * Math.pow(t, 0.85);
  const type = LESSON_BY_ID[lessonId]?.type;
  if (type === 'numbers') apm *= 0.8;
  if (type === 'shift' || type === 'punct') apm *= 0.9;
  return Math.max(10, Math.round(apm * (Number(speedFactor) || 1)));
}

export const STAR_RULES = { one: 85, two: 92, three: 96, twoSpeed: 0.75 };

/** Sterren (0-3) op basis van nauwkeurigheid (%) en snelheid (aanslagen per minuut). */
export function starsFor(accuracy, apm, target) {
  if (!(accuracy >= STAR_RULES.one)) return 0;
  if (accuracy >= STAR_RULES.three && apm >= target) return 3;
  if (accuracy >= STAR_RULES.two && apm >= target * STAR_RULES.twoSpeed) return 2;
  return 1;
}

export const EXAM_LESSON_ID = 20;
export const EXAM_PASS_STARS = 2;

// ---------- Rangen ----------

export const RANKS = [
  { xp: 0, name: 'Cadet' },
  { xp: 300, name: 'Piloot' },
  { xp: 1000, name: 'Navigator' },
  { xp: 2500, name: 'Kapitein' },
  { xp: 5000, name: 'Commandant' },
  { xp: 9000, name: 'Sterrenadmiraal' },
];

export function rankFor(xp) {
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) { current = RANKS[i]; next = RANKS[i + 1] || null; }
  }
  return { ...current, level: RANKS.indexOf(current) + 1, next };
}

// ---------- Tekstgenerator ----------

/** Eenvoudige voorspelbare random-generator, handig voor tests. */
export function makeRng(seed = Date.now()) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Woorden die alleen bekende letters gebruiken. */
export function wordsFor(letters, { focus = [], minLen = 2, maxLen = 12 } = {}) {
  const set = new Set(letters);
  const ok = WORDS.filter((w) => w.length >= minLen && w.length <= maxLen && [...w].every((c) => set.has(c)));
  if (!focus.length) return ok;
  const withFocus = ok.filter((w) => focus.some((f) => w.includes(f)));
  return withFocus.length >= 6 ? withFocus : ok;
}

/** Lettergroepjes zoals "fjf jjf" voor de allereerste lessen. */
function letterGroups(rng, letters, focus, count, size = [2, 4]) {
  const groups = [];
  for (let i = 0; i < count; i++) {
    const len = size[0] + Math.floor(rng() * (size[1] - size[0] + 1));
    let g = '';
    for (let j = 0; j < len; j++) {
      g += rng() < 0.6 && focus.length ? pick(rng, focus) : pick(rng, letters);
    }
    groups.push(g);
  }
  return groups.join(' ');
}

function wordRun(rng, words, targetLen) {
  const out = [];
  let len = 0;
  let last = '';
  let guard = 0;
  while (len < targetLen && guard++ < 500) {
    let w = pick(rng, words);
    if (w === last && words.length > 1) w = pick(rng, words);
    out.push(w);
    last = w;
    len += w.length + 1;
  }
  return out.join(' ');
}

function capitalize(w) {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function sentencesFrom(rng, bank, allowed, targetLen) {
  const ok = bank.filter((s) => [...s].every((c) => allowed.has(c)));
  if (!ok.length) return null;
  const list = shuffle(rng, ok);
  const out = [];
  let len = 0;
  for (let i = 0; len < targetLen; i++) {
    const s = list[i % list.length];
    out.push(s);
    len += s.length + 1;
    if (i > 40) break;
  }
  return out.join(' ');
}

function numberGroups(rng, digits, count) {
  const groups = [];
  for (let i = 0; i < count; i++) {
    const len = 2 + Math.floor(rng() * 3);
    let g = '';
    for (let j = 0; j < len; j++) g += pick(rng, digits);
    groups.push(g);
  }
  return groups.join(' ');
}

/** De stappen van een les. Elke stap is een typeoefening. */
export function lessonSteps(lessonId) {
  const lesson = LESSON_BY_ID[lessonId];
  if (!lesson) return [];
  if (lesson.type === 'exam') {
    return [{ kind: 'test', title: 'Examen', desc: 'Typ de tekst zo netjes en vlot mogelijk.' }];
  }
  if (lesson.type === 'text') {
    return [
      { kind: 'warmup', title: 'Opwarmen', desc: 'Zinnen met alle letters en leestekens.' },
      { kind: 'text', title: 'Tekst 1', desc: 'Een korte tekst.' },
      { kind: 'text', title: 'Tekst 2', desc: 'Nog een tekst.' },
      { kind: 'test', title: 'Sterrentest', desc: 'Laat zien wat je kunt!' },
    ];
  }
  return [
    { kind: 'intro', title: 'Nieuwe toetsen', desc: 'Leer waar de nieuwe toetsen zitten.' },
    { kind: 'drill', title: 'Lettertraining', desc: 'Oefen de nieuwe toetsen met de oude.' },
    { kind: 'words', title: 'Woordentraining', desc: 'Echte woorden typen.' },
    { kind: 'mix', title: 'Ruimtemix', desc: 'Alles door elkaar.' },
    { kind: 'test', title: 'Sterrentest', desc: 'Verdien sterren voor deze les!' },
  ];
}

/** Maak de tekst voor een stap van een les. */
export function generateText(lessonId, stepIndex, seed = Date.now()) {
  const rng = makeRng(seed + lessonId * 7919 + stepIndex * 104729);
  const lesson = LESSON_BY_ID[lessonId];
  const step = lessonSteps(lessonId)[stepIndex];
  if (!lesson || !step) return '';
  const allowed = charsUpTo(lessonId);
  const letters = lettersUpTo(lessonId);
  const lowerLetters = letters.filter((c) => /[a-z]/.test(c));
  const focusKeys = lesson.newKeys.filter((k) => k !== 'Shift');
  const focusLetters = focusKeys.filter((k) => /[a-z]/.test(k));
  const words = wordsFor(lowerLetters, { focus: focusLetters });
  const enoughWords = words.length >= 8;
  const lengthFor = { intro: 40, drill: 120, words: 150, mix: 180, test: 170 };
  const len = lengthFor[step.kind] || 120;

  if (lesson.type === 'exam') {
    return shuffle(rng, TEXTS).slice(0, 2).join(' ');
  }
  if (lesson.type === 'text') {
    if (step.kind === 'warmup') return sentencesFrom(rng, [...SENTENCES, ...NUMBER_SENTENCES], allowed, 140);
    if (step.kind === 'text') return pick(rng, TEXTS);
    return shuffle(rng, TEXTS)[0];
  }

  // Introductie: elke nieuwe toets een paar keer, dan afwisselen.
  if (step.kind === 'intro') {
    if (lesson.type === 'shift') {
      const caps = shuffle(rng, 'fjdkslaghtrueinowvmpbcz'.split('')).slice(0, 10);
      return caps.map((c) => `${c.toUpperCase()}${c} ${c.toUpperCase()}`).join(' ');
    }
    const parts = [];
    for (const k of focusKeys) parts.push(`${k}${k}${k} ${k}${k}${k}`);
    if (focusKeys.length > 1) {
      for (let i = 0; i < 3; i++) parts.push(shuffle(rng, focusKeys).join('') + shuffle(rng, focusKeys).join(''));
    }
    return parts.join(' ');
  }

  if (lesson.type === 'shift') {
    const base = wordsFor(lowerLetters, {});
    if (step.kind === 'drill') return wordRun(rng, base.filter((w) => w.length <= 5).map(capitalize), len);
    if (step.kind === 'words') {
      return wordRun(rng, base, len).split(' ').map((w, i) => (i % 2 === 0 ? capitalize(w) : w)).join(' ');
    }
    return sentencesFrom(rng, SENTENCES.filter((s) => !/[?!:]/.test(s)), allowed, len);
  }

  if (lesson.type === 'punct') {
    if (step.kind === 'drill') {
      const base = wordsFor(lowerLetters, {}).filter((w) => w.length <= 6);
      return Array.from({ length: 10 }, () => capitalize(pick(rng, base)) + pick(rng, ['?', '!', ':', '.', ','])).join(' ');
    }
    const bank = step.kind === 'words' ? SENTENCES.filter((s) => /[?!:]/.test(s)) : SENTENCES;
    return sentencesFrom(rng, bank, allowed, len);
  }

  if (lesson.type === 'numbers') {
    const digits = [...allowed].filter((c) => /[0-9]/.test(c));
    if (step.kind === 'drill') return numberGroups(rng, focusKeys, 14);
    if (step.kind === 'words') return numberGroups(rng, digits, 8) + ' ' + wordRun(rng, wordsFor(lowerLetters), 40);
    return sentencesFrom(rng, NUMBER_SENTENCES, allowed, len) || numberGroups(rng, digits, 20);
  }

  // Letterlessen
  if (step.kind === 'drill' || !enoughWords) {
    const groups = letterGroups(rng, letters.filter((c) => c !== ' '), focusKeys, Math.round(len / 4));
    if (step.kind === 'drill' || step.kind === 'words') return groups.slice(0, len).trim();
    // mix/test zonder genoeg woorden: lettergroepen + de woorden die er zijn
    const extra = words.length ? ' ' + wordRun(rng, words, Math.round(len / 3)) : '';
    return (groups.slice(0, Math.round(len * 0.7)).trim() + extra).trim();
  }
  if (step.kind === 'words') return wordRun(rng, words, len);
  // mix & test: woorden met alle bekende letters, met komma's en punten als die al geleerd zijn
  const all = wordsFor(lowerLetters, {});
  let text = wordRun(rng, shuffle(rng, [...words, ...all]), len);
  if (allowed.has(',') || allowed.has('.')) {
    const ws = text.split(' ');
    text = ws.map((w, i) => {
      if (i > 0 && i % 5 === 4 && i < ws.length - 1) return w + (allowed.has('.') && rng() < 0.5 ? '.' : allowed.has(',') ? ',' : '.');
      return w;
    }).join(' ');
    if (allowed.has('.')) text += '.';
  }
  return text;
}

/** Woorden voor de spellen, passend bij wat de leerling al kan. */
export function gameWords(lessonId, { minLen = 2, maxLen = 9 } = {}) {
  const letters = lettersUpTo(lessonId).filter((c) => /[a-z]/.test(c));
  const words = wordsFor(letters, { minLen, maxLen });
  if (words.length >= 12) return words;
  // Te weinig echte woorden: maak lettergroepjes
  const rng = makeRng(lessonId * 31 + 7);
  const groups = new Set(words);
  const keys = letters.length ? letters : ['f', 'j'];
  for (let tries = 0; groups.size < 30 && tries < 400; tries++) {
    const len = 2 + Math.floor(rng() * 3);
    let g = '';
    for (let i = 0; i < len; i++) g += pick(rng, keys);
    groups.add(g);
  }
  return [...groups];
}

/** Zinnen voor de raketrace. */
export function raceText(lessonId, seed = Date.now()) {
  const rng = makeRng(seed);
  const allowed = charsUpTo(lessonId);
  if (lessonId >= 16) {
    const t = sentencesFrom(rng, SENTENCES, allowed, 130);
    if (t) return t;
  }
  const letters = lettersUpTo(lessonId).filter((c) => /[a-z]/.test(c));
  const words = wordsFor(letters, {});
  if (words.length >= 8) return wordRun(rng, words, 110);
  return gameWords(lessonId).slice(0, 20).join(' ');
}

export const GAMES_UNLOCK_LESSON = 4;
