// Werkbladen om te printen: een huiswerkpakket bij de weektaak, remediërende bladen voor een instructiegroep
// en verrijkingsbladen. Elk blad wordt per leerling op diens eigen niveau samengesteld.
import { generate, publicItem } from './content/index.js';
import { SKILL_BY_ID, SKILLS } from '../public/js/shared/skills.js';
import { UITLEG } from '../public/js/shared/uitleg.js';

export const SOORTEN = {
  huiswerk: { titel: 'Huiswerk', min: -0.75, max: -0.35 },
  remediering: { titel: 'Oefenblad', min: -1.3, max: -0.35 },
  verrijking: { titel: 'Verrijkingsblad', min: 0.1, max: 0.7 },
};

/** Verdeel n opgaven zo gelijk mogelijk over de onderdelen. */
function spread(skills, n) {
  const out = Object.fromEntries(skills.map((s) => [s, Math.floor(n / skills.length)]));
  for (let i = 0; i < n % skills.length; i++) out[skills[i]] += 1;
  return out;
}

/**
 * Stel een werkblad samen.
 * thetaFor(skill) geeft de huidige score van de leerling; seen bevat al gemaakte opgaven.
 */
export function buildSheet({ soort, skills, count, thetaFor, seen = new Set() }) {
  const cfg = SOORTEN[soort];
  const valid = skills.filter((s) => SKILL_BY_ID[s]);
  const per = spread(valid, Math.max(valid.length, count));
  const used = new Set(seen);
  const sections = [];
  for (const skill of valid) {
    const n = per[skill];
    if (!n) continue;
    const theta = thetaFor(skill);
    const items = [];
    if (skill === 'lz-begrijpend') {
      // Eén hele tekst met al zijn vragen
      let first = generate(skill, Math.max(1, theta + (cfg.min + cfg.max) / 2), used, {});
      const textId = first.textId;
      for (let k = 0; k < 8 && first && first.textId === textId; k++) {
        if (used.has(first.key)) break;
        used.add(first.key);
        items.push(first);
        first = generate(skill, theta, used, { lastTextId: textId });
      }
    } else {
      for (let i = 0; i < n; i++) {
        // oplopend: van makkelijk naar moeilijker binnen het onderdeel
        const t = n === 1 ? (cfg.min + cfg.max) / 2 : cfg.min + ((cfg.max - cfg.min) * i) / (n - 1);
        let item;
        for (let tries = 0; tries < 8; tries++) {
          item = generate(skill, Math.max(1, Math.min(5.2, theta + t)), used, {});
          if (!used.has(item.key)) break;
        }
        used.add(item.key);
        items.push(item);
      }
      items.sort((a, b) => a.level - b.level);
    }
    sections.push({
      skill,
      uitleg: soort === 'remediering' ? UITLEG[skill] || null : null,
      passage: items[0]?.passage || null,
      items: items.map((it) => ({
        ...publicItem({ ...it, passage: undefined }),
        answer: it.answer, explain: it.explain, level: it.level,
      })),
    });
  }
  return { soort, titel: cfg.titel, sections };
}

export function defaultSkillsFor(soort, week, settings, abilities) {
  const focus = [...new Set([...(week.focus || []), ...(settings.extraFocus || [])])].filter((s) => SKILL_BY_ID[s]);
  if (focus.length) return focus;
  // Geen focus (bijvoorbeeld een herhalingsweek): de drie zwakste onderdelen van de leerling
  return SKILLS.map((s) => s.id).filter((id) => id !== 'lz-begrijpend')
    .sort((a, b) => (abilities[a]?.theta ?? 2.5) - (abilities[b]?.theta ?? 2.5)).slice(0, 3);
}
