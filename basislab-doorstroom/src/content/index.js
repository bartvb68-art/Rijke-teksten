// Opgaven maken en nakijken voor alle onderdelen.
import crypto from 'node:crypto';
import { REKENEN } from './rekenen.js';
import { TAAL } from './taal.js';
import { LEZEN } from './lezen.js';
import { pick, gcd } from './util.js';
import { SKILL_BY_ID } from '../../public/js/shared/skills.js';

const hash = (s) => crypto.createHash('sha1').update(s).digest('base64url').slice(0, 10);

function fromTemplates(templates, target) {
  const near = templates.filter((t) => Math.abs(t.level - target) <= 0.75);
  const pool = near.length ? near : [...templates].sort((a, b) => Math.abs(a.level - target) - Math.abs(b.level - target)).slice(0, 2);
  const t = pick(pool);
  return { level: t.level, ...t.make() };
}

/**
 * Maak een opgave voor een onderdeel rond de gewenste moeilijkheid.
 * seen: Set met sleutels van opgaven die de leerling al heeft gehad (voor de banken en teksten).
 */
export function generate(skillId, target, seen = new Set(), ctx = {}) {
  if (!SKILL_BY_ID[skillId]) throw new Error(`Onbekend onderdeel: ${skillId}`);
  let item;
  for (let tries = 0; tries < 6; tries++) {
    if (REKENEN[skillId]) item = fromTemplates(REKENEN[skillId], target);
    else if (TAAL[skillId]) item = TAAL[skillId](target, seen);
    else item = LEZEN[skillId](target, seen, ctx);
    item.key = item.key || `${skillId}:${hash(item.prompt + (item.figure || ''))}`;
    if (!seen.has(item.key)) break;
  }
  item.skill = skillId;
  item.type = item.type || 'input';
  return item;
}

/** Wat de leerling te zien krijgt: zonder antwoord en uitleg. */
export function publicItem(item) {
  const { answer, explain, check, ...rest } = item;
  return { ...rest, check: check === 'fraction-simple' ? 'fraction' : check };
}

// ---------- nakijken ----------
const clean = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

export function parseNumber(input) {
  let s = clean(input).replace(/[€%°]/g, '').replace(/−|–/g, '-').replace(/[a-zA-Z²³/]+\.?$/g, '').replace(/,-$/, '').trim();
  s = s.replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}

export function parseTime(input) {
  const s = clean(input).replace(/\s*uur$/, '');
  let m = /^(\d{1,2})[:.](\d{2})$/.exec(s);
  if (!m) m = /^(\d{1,2})(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]); const mi = Number(m[2]);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

export function parseFraction(input) {
  const s = clean(input).replace(/−/g, '-');
  let m = /^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return { n: Number(m[1]) * Number(m[3]) + Number(m[2]), d: Number(m[3]), mixed: true };
  m = /^(-?\d+)\s*\/\s*(\d+)$/.exec(s);
  if (m) return { n: Number(m[1]), d: Number(m[2]) };
  const v = parseNumber(s);
  if (v != null) return { n: v, d: 1, decimal: true };
  return null;
}

export function grade(item, given) {
  const g = clean(given);
  if (!g) return false;
  switch (item.type === 'mc' ? 'mc' : item.check) {
    case 'mc': return g === item.answer;
    case 'number': {
      const a = parseNumber(item.answer); const b = parseNumber(g);
      return b != null && Math.abs(a - b) < 1e-6;
    }
    case 'time': return parseTime(g) != null && parseTime(g) === parseTime(item.answer);
    case 'fraction':
    case 'fraction-simple': {
      const a = parseFraction(item.answer); const b = parseFraction(g);
      if (!b || !b.d) return false;
      const equal = Math.abs(a.n / a.d - b.n / b.d) < 1e-9;
      if (item.check === 'fraction-simple') return equal && !b.decimal && gcd(b.n, b.d) === 1;
      return equal;
    }
    default:
      return g.toLowerCase().replace(/[.!?]$/, '') === String(item.answer).toLowerCase();
  }
}
