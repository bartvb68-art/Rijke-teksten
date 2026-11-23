// Adaptieve motor en statistiek: welk onderdeel en welke moeilijkheid, proeftoetsen, signalen en samenvattingen.
import {
  DOMAINS, SKILLS, SKILL_BY_ID, skillsOf, niveauFor, pCorrect, DEFAULT_THETA, START_LEVELS, mondayOf, addDays,
  defaultPlan, weeksBetween, DEFAULT_HOLIDAYS, DEFAULT_TOETS_DAY,
} from '../public/js/shared/skills.js';

export const DAY = 24 * 60 * 60 * 1000;
const TZ = process.env.TZ_SCHOOL || 'Europe/Amsterdam';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false, weekday: 'short' });

export const dayKey = (ts) => dayFmt.format(new Date(ts));
export const weekKey = (ts) => mondayOf(dayKey(ts));
export function lastNDays(n, now) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * DAY));
  return [...new Set(out)];
}
export function duringSchool(ts) {
  const parts = Object.fromEntries(hourFmt.formatToParts(new Date(ts)).map((p) => [p.type, p.value]));
  const h = Number(parts.hour);
  return !['Sat', 'Sun'].includes(parts.weekday) && h >= 8 && h < 15;
}

export const DEFAULT_CLASS_SETTINGS = {
  start: null, // maandag van de eerste week; standaard de week waarin de klas is gemaakt
  toets: DEFAULT_TOETS_DAY,
  holidays: DEFAULT_HOLIDAYS,
  plan: null, // { 'JJJJ-MM-DD': { focus, goal, test, holiday, note } }
  showNames: true,
  testAlways: false,
  leaderboard: false,
  schoolIps: [],
};
export const DEFAULT_STUDENT_SETTINGS = {
  start: { rk: 'auto', tv: 'auto', lz: 'auto' },
  goalFactor: 1,
  readAloud: false,
  dyslexia: false,
  largeText: false,
  calm: false,
  extraFocus: [],
};

export function classPlan(cls, now) {
  const s = cls.settings;
  const start = s.start || mondayOf(dayKey(cls.created_at || now));
  const toets = s.toets || DEFAULT_TOETS_DAY;
  const base = defaultPlan(start, toets, s.holidays || DEFAULT_HOLIDAYS);
  const weeks = weeksBetween(start, toets);
  const plan = {};
  for (const w of weeks) plan[w] = { ...base[w], ...(s.plan?.[w] || {}) };
  return { start, toets, weeks, plan };
}

/** Plan van deze week (of de dichtstbijzijnde week binnen de planning). */
export function currentWeek(cls, now) {
  const { weeks, plan, toets } = classPlan(cls, now);
  const wk = weekKey(now);
  const idx = weeks.indexOf(wk);
  const after = wk > weeks[weeks.length - 1];
  const before = wk < weeks[0];
  const entry = idx >= 0 ? plan[wk] : { focus: [], goal: 50, test: false, holiday: false, note: after ? 'De doorstroomtoets is geweest. Je mag blijven oefenen!' : 'De planning begint binnenkort.' };
  const daysToToets = Math.round((new Date(`${toets}T12:00:00`) - new Date(`${dayKey(now)}T12:00:00`)) / DAY);
  return { week: wk, index: idx, total: weeks.length, before, after, daysToToets, toets, ...entry };
}

export function startTheta(studentSettings, domain) {
  const id = studentSettings?.start?.[domain] || 'auto';
  return (START_LEVELS.find((l) => l.id === id) || START_LEVELS[0]).theta;
}

export function domainTheta(abilities, domain, settings) {
  const rows = skillsOf(domain).map((s) => abilities[s.id]).filter((a) => a && a.n > 0);
  const n = rows.reduce((x, r) => x + r.n, 0);
  if (!rows.length) return { theta: null, n: 0, start: startTheta(settings, domain) };
  // Gewogen gemiddelde; onderdelen zonder gegevens tellen mee als de startwaarde met een klein gewicht.
  const missing = skillsOf(domain).length - rows.length;
  const w = (r) => Math.min(30, r.n) + 2;
  const sum = rows.reduce((x, r) => x + r.theta * w(r), 0) + missing * startTheta(settings, domain) * 1;
  const wt = rows.reduce((x, r) => x + w(r), 0) + missing * 1;
  return { theta: sum / wt, n };
}

// ---------- keuze van de volgende opgave ----------
const rand = (a, b) => a + Math.random() * (b - a);
function weighted(list) {
  const total = list.reduce((x, l) => x + l.w, 0);
  let r = Math.random() * total;
  for (const l of list) { r -= l.w; if (r <= 0) return l.v; }
  return list[list.length - 1].v;
}

export function thetaFor(abilities, skill, settings) {
  return abilities[skill]?.theta ?? startTheta(settings, SKILL_BY_ID[skill].domain);
}

/**
 * Kies het onderdeel. mode: 'week' (weektaak), 'skill:<id>', 'domain:<id>' of 'mix'.
 * weekCounts: aantal opgaven per onderdeel deze week; recent: laatste oefenmoment per onderdeel.
 */
export function chooseSkill({ mode, week, abilities, settings, weekCounts = {}, lastSkill = null, sticky = null, lastAt = {}, now = Date.now() }) {
  if (sticky) return sticky;
  if (mode.startsWith('skill:')) return mode.slice(6);
  let pool;
  if (mode.startsWith('domain:')) pool = skillsOf(mode.slice(7)).map((s) => s.id);
  else if (mode === 'mix') pool = SKILLS.map((s) => s.id);
  else {
    const focus = [...new Set([...(week.focus || []), ...(settings.extraFocus || [])])].filter((s) => SKILL_BY_ID[s]);
    // 70% focus van de week, 30% herhaling van zwakke of lang niet geoefende onderdelen
    if (focus.length && Math.random() < 0.7) {
      return weighted(focus.map((s) => ({ v: s, w: 1 / (1 + (weekCounts[s] || 0)) + (s === lastSkill ? 0 : 0.15) })));
    }
    pool = SKILLS.map((s) => s.id);
  }
  return weighted(pool.map((s) => {
    const th = thetaFor(abilities, s, settings);
    const n = abilities[s]?.n || 0;
    const stale = lastAt[s] ? Math.min(3, (now - lastAt[s]) / (7 * DAY)) : 2;
    return { v: s, w: (n < 5 ? 2 : 0.6) + Math.max(0, 3.6 - th) * 0.9 + stale * 0.5 + (s === lastSkill ? -0.3 : 0) };
  }).map((x) => ({ ...x, w: Math.max(0.05, x.w) })));
}

/** Moeilijkheid waarbij de kans op goed ongeveer 70-75% is, met wat variatie. */
export function targetDifficulty(theta, { calm = false } = {}) {
  return Math.max(1, Math.min(5.2, theta - 0.55 + rand(-0.45, 0.45) - (calm ? 0.25 : 0)));
}

// ---------- proeftoets ----------
const TEST_LEVELS = [1.8, 2.3, 2.7, 3, 3.3, 3.7, 4, 4.5];
export function testPlan() {
  const plan = [];
  const lv = (i) => TEST_LEVELS[i % TEST_LEVELS.length];
  const rk = skillsOf('rk').map((s) => s.id);
  [...rk, 'rk-procent', 'rk-verhouding', 'rk-meten'].forEach((s, i) => plan.push({ skill: s, level: lv(i * 3 + 1) }));
  const tv = ['tv-ww', 'tv-ww', 'tv-ww', 'tv-spelling', 'tv-spelling', 'tv-spelling', 'tv-interpunctie', 'tv-interpunctie', 'tv-grammatica', 'tv-grammatica', 'tv-zinsbouw', 'tv-zinsbouw'];
  tv.forEach((s, i) => plan.push({ skill: s, level: lv(i * 5 + 2) }));
  const lz = ['lz-woordenschat', 'lz-woordenschat', 'lz-woordenschat', 'lz-verbanden', 'lz-verbanden', 'lz-informatie', 'lz-informatie'];
  lz.forEach((s, i) => plan.push({ skill: s, level: lv(i * 3) }));
  for (let i = 0; i < 5; i++) plan.push({ skill: 'lz-begrijpend', level: 3, text: true });
  // Volgorde zoals in een echte toets: per vakgebied een blok
  return plan;
}

/** Schat de vaardigheid met de meeste aannemelijkheid (rooster van 0,5 tot 5,5). */
export function estimateTheta(items) {
  if (!items.length) return null;
  let best = DEFAULT_THETA; let bestLL = -Infinity;
  for (let t = 0.5; t <= 5.5; t += 0.05) {
    let ll = -((t - DEFAULT_THETA) ** 2) / (2 * 1.5 ** 2); // zachte voorkennis zodat alles goed of alles fout niet ontspoort
    for (const it of items) {
      const p = pCorrect(t, it.difficulty);
      ll += it.correct ? Math.log(p) : Math.log(1 - p);
    }
    if (ll > bestLL) { bestLL = ll; best = t; }
  }
  return Math.round(best * 100) / 100;
}

export function testResult(answers) {
  const out = {};
  for (const d of DOMAINS) {
    const items = answers.filter((a) => a.domain === d.id);
    const theta = estimateTheta(items);
    out[d.id] = { theta, niveau: niveauFor(theta, d.id).id, correct: items.filter((a) => a.correct).length, total: items.length };
  }
  const skills = {};
  for (const a of answers) {
    skills[a.skill] = skills[a.skill] || { correct: 0, total: 0 };
    skills[a.skill].total += 1;
    if (a.correct) skills[a.skill].correct += 1;
  }
  return { domains: out, skills, correct: answers.filter((a) => a.correct).length, total: answers.length };
}

// ---------- samenvatting en signalen per leerling ----------
export function studentSummary({ student, cls, abilities, answers, tests = [], now }) {
  const wk = currentWeek(cls, now);
  const weekAnswers = answers.filter((a) => weekKey(a.created_at) === wk.week);
  const goal = Math.round((wk.goal || 0) * (student.settings.goalFactor || 1));
  const domains = Object.fromEntries(DOMAINS.map((d) => {
    const dt = domainTheta(abilities, d.id, student.settings);
    return [d.id, { theta: dt.theta == null ? null : Math.round(dt.theta * 100) / 100, n: dt.n, niveau: niveauFor(dt.n >= 8 ? dt.theta : null, d.id) }];
  }));
  const focus = [...new Set([...(wk.focus || []), ...(student.settings.extraFocus || [])])];
  const focusCounts = Object.fromEntries(focus.map((s) => [s, weekAnswers.filter((a) => a.skill === s).length]));
  const weekCorrect = weekAnswers.filter((a) => a.correct).length;
  const last = answers.length ? answers[answers.length - 1].created_at : null;
  const minutesWeek = Math.round(weekAnswers.reduce((x, a) => x + Math.min(a.ms, 5 * 60000), 0) / 60000);
  const lastTest = tests.filter((t) => t.finished_at).sort((a, b) => b.finished_at - a.finished_at)[0] || null;

  const alerts = [];
  const weekday = (new Date(`${dayKey(now)}T12:00:00`).getDay() + 6) % 7; // 0 = maandag
  if (!wk.holiday && goal > 0) {
    if (weekAnswers.length >= goal) alerts.push({ level: 'good', text: 'Weektaak af' });
    else if (weekAnswers.length === 0 && weekday >= 2) alerts.push({ level: 'warning', text: 'Deze week nog niet geoefend' });
  }
  for (const d of DOMAINS) {
    const dd = domains[d.id];
    if (dd.n >= 15 && dd.theta < 2) alerts.push({ level: 'serious', text: `${d.name}: onder 1F` });
  }
  for (const s of SKILLS) {
    const recent = answers.filter((a) => a.skill === s.id).slice(-10);
    if (recent.length >= 10 && recent.filter((a) => a.correct).length / recent.length < 0.35) alerts.push({ level: 'warning', text: `Veel fout bij ${s.name.toLowerCase()}`, skill: s.id });
  }
  const last20 = answers.filter((a) => a.mode !== 'toets').slice(-20);
  if (last20.length >= 15) {
    const ms = last20.map((a) => a.ms).sort((a, b) => a - b)[Math.floor(last20.length / 2)];
    const acc = last20.filter((a) => a.correct).length / last20.length;
    if (ms < 6000 && acc < 0.5) alerts.push({ level: 'warning', text: 'Klikt snel door zonder goed te lezen' });
  }
  for (const s of SKILLS) {
    const rows = answers.filter((a) => a.skill === s.id);
    if (rows.length < 12) continue;
    const before = rows.filter((a) => a.created_at < now - 14 * DAY);
    if (before.length < 6) continue;
    const drop = before[before.length - 1].theta_after - rows[rows.length - 1].theta_after;
    if (drop > 0.6) alerts.push({ level: 'warning', text: `Daling bij ${s.name.toLowerCase()}`, skill: s.id });
  }

  return {
    id: student.id, name: student.name, settings: student.settings,
    domains,
    week: { done: weekAnswers.length, goal, correct: weekCorrect, pct: weekAnswers.length ? Math.round((weekCorrect / weekAnswers.length) * 100) : null, minutes: minutesWeek, focus: focusCounts },
    total: answers.length,
    pctAll: answers.length ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : null,
    lastActive: last,
    lastLogin: student.last_login,
    lastTest: lastTest ? { at: lastTest.finished_at, result: lastTest.result } : null,
    alerts,
  };
}

/** Theta per vakgebied aan het eind van elke week (voor de grafiek). */
export function weeklyDomainSeries(answers, weeks, settings, now) {
  const thisWeek = weekKey(now);
  return weeks.filter((w) => w <= thisWeek).map((w) => {
    const end = addDays(w, 7);
    const latest = {};
    for (const a of answers) {
      if (dayKey(a.created_at) >= end) break;
      latest[a.skill] = { theta: a.theta_after, n: (latest[a.skill]?.n || 0) + 1 };
    }
    const row = { week: w };
    for (const d of DOMAINS) {
      const dt = domainTheta(latest, d.id, settings);
      row[d.id] = dt.n >= 5 ? Math.round(dt.theta * 100) / 100 : null;
    }
    return row;
  });
}

export function stripHtml(html) {
  return String(html || '').replace(/<br\s*\/?>/g, ' · ').replace(/<span class="qnum">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
