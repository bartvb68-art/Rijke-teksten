// Berekeningen voor voortgang en het volgsysteem.
import { LESSONS, PODIA, EXAM_LESSON_ID, EXAM_PASS_STARS, LABELS } from '../public/js/shared/curriculum.js';

export const TIME_ZONE = process.env.TZ_SCHOOL || 'Europe/Amsterdam';
const DAY = 24 * 60 * 60 * 1000;

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

/** "2026-11-17" in de tijdzone van de school. */
export function dayKey(ts) {
  return dayFmt.format(new Date(ts));
}

const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function localParts(ts) {
  const parts = Object.fromEntries(partsFmt.formatToParts(new Date(ts)).map((p) => [p.type, p.value]));
  return { weekday: WEEKDAYS[parts.weekday], hour: Number(parts.hour) % 24, minute: Number(parts.minute) };
}

/** Dagsleutel van de maandag van deze week. */
export function weekStartKey(now = Date.now()) {
  const { weekday } = localParts(now);
  return dayKey(now - (weekday - 1) * DAY);
}

export function inSchoolHours(ts) {
  const { weekday, hour, minute } = localParts(ts);
  const t = hour * 60 + minute;
  return weekday <= 5 && t >= 8 * 60 + 15 && t <= 15 * 60 + 15;
}

/** Waar/wanneer: op basis van IP-adressen van de school (als ingesteld), anders schooltijd. */
export function placeLabel(attempt) {
  if (attempt.location === 'school') return 'school';
  if (attempt.location === 'thuis') return 'thuis';
  return inSchoolHours(attempt.created_at) ? 'schooltijd' : 'buiten schooltijd';
}

export function streakDays(dayKeys, now = Date.now()) {
  const set = new Set(dayKeys);
  let d = now;
  if (!set.has(dayKey(d))) d -= DAY; // vandaag nog niet geoefend telt niet als breuk
  let n = 0;
  while (set.has(dayKey(d))) { n++; d -= DAY; }
  return n;
}

export const DEFAULT_CLASS_SETTINGS = {
  weeklyGoalMinutes: 45,
  mastery: 1,
  leaderboard: true,
  gamesEnabled: true,
  showNames: true,
  schoolIps: [],
};

export const DEFAULT_STUDENT_SETTINGS = {
  levelShift: 0,
  unlockUpTo: 0,
  dyslexia: false,
  largeText: false,
  sound: true,
  readAloud: true,
};

export function unlockedLesson(progressMap, mastery = 1, unlockUpTo = 0) {
  let unlocked = 1;
  for (const l of LESSONS) {
    const p = progressMap[l.id];
    if (!p || p.best_stars < mastery) break;
    unlocked = Math.min(LESSONS.length, l.id + 1);
  }
  return Math.max(unlocked, Math.min(LESSONS.length, Number(unlockUpTo) || 0));
}

/** Pogingen die iets zeggen over hoe goed een leerling ontleedt. */
const isScored = (a) => a.items >= 3 && (a.kind === 'lesson' ? a.step_kind !== 'intro' : a.game === 'battle');
const isTimed = (a) => a.kind === 'lesson' && ['oefen', 'mix', 'test'].includes(a.step_kind) && a.items >= 3;

function avg(list) {
  return list.length ? list.reduce((s, x) => s + x, 0) / list.length : null;
}

const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

/** Goed/fout per zinsdeel en verwarringen uit een lijst pogingen. */
export function skillStats(attempts) {
  const skills = {};
  const confusions = {};
  for (const a of attempts) {
    for (const [k, v] of Object.entries(a.skill_stats || {})) {
      if (!Array.isArray(v)) continue;
      const e = skills[k] || (skills[k] = { hits: 0, misses: 0 });
      e.hits += Number(v[0]) || 0;
      e.misses += Number(v[1]) || 0;
    }
    for (const [k, n] of Object.entries(a.confusions || {})) confusions[k] = (confusions[k] || 0) + (Number(n) || 0);
  }
  const top = Object.entries(confusions).map(([k, n]) => {
    const [real, given] = k.split('>');
    return { real, given, n };
  }).sort((a, b) => b.n - a.n);
  return { skills, confusions: top };
}

export function confusionText(c) {
  const name = (x) => {
    if (x.startsWith('bwb-')) return `bwb van ${x.slice(4)}`;
    return LABELS[x]?.short || x;
  };
  return `${name(c.real)} aangezien voor ${name(c.given)}`;
}

/** Samenvatting van één leerling, voor het klasoverzicht. */
export function studentSummary(student, attempts, progressRows, classRow, now = Date.now()) {
  const classSettings = { ...DEFAULT_CLASS_SETTINGS, ...classRow.settings };
  const settings = { ...DEFAULT_STUDENT_SETTINGS, ...student.settings };
  const progress = Object.fromEntries(progressRows.map((p) => [p.lesson_id, p]));
  const current = unlockedLesson(progress, classSettings.mastery, settings.unlockUpTo);
  const sorted = [...attempts].sort((a, b) => a.created_at - b.created_at);
  const scored = sorted.filter(isScored);
  const timed = sorted.filter(isTimed);
  const recentScore = avg(scored.slice(-8).map((a) => a.accuracy));
  const prevScore = avg(scored.slice(-20, -8).map((a) => a.accuracy));
  const recentSec = avg(timed.slice(-6).map((a) => a.sec_per_item));
  const prevSec = avg(timed.slice(-12, -6).map((a) => a.sec_per_item));
  const weekKey = weekStartKey(now);
  const minutesWeek = sorted.filter((a) => dayKey(a.created_at) >= weekKey).reduce((s, a) => s + a.duration_ms, 0) / 60000;
  const minutesTotal = sorted.reduce((s, a) => s + a.duration_ms, 0) / 60000;
  const last = sorted.length ? sorted[sorted.length - 1].created_at : null;
  const streak = streakDays(sorted.map((a) => dayKey(a.created_at)), now);
  const lessonsDone = progressRows.filter((p) => p.best_stars >= 1).length;
  const totalStars = progressRows.reduce((s, p) => s + p.best_stars, 0);
  const exam = progress[EXAM_LESSON_ID];
  const diploma = !!exam && exam.best_stars >= EXAM_PASS_STARS;
  const places = { school: 0, thuis: 0, schooltijd: 0, 'buiten schooltijd': 0 };
  for (const a of sorted) places[placeLabel(a)] += a.duration_ms / 60000;
  const recentSkills = skillStats(sorted.filter((a) => a.created_at >= now - 30 * DAY));

  const alerts = [];
  if (!last) alerts.push({ type: 'inactive', level: 'warning', text: 'Nog nooit geoefend' });
  else if (now - last > 7 * DAY) alerts.push({ type: 'inactive', level: 'warning', text: `${Math.floor((now - last) / DAY)} dagen niet geoefend` });
  const cur = progress[current];
  if (cur && cur.tests >= 3 && cur.best_stars < classSettings.mastery) {
    alerts.push({ type: 'stuck', level: 'serious', text: `Loopt vast bij les ${current} (${cur.tests} optredens)` });
  }
  if (recentScore != null && prevScore != null && scored.length >= 12 && recentScore < prevScore - 10) {
    alerts.push({ type: 'score-drop', level: 'warning', text: `Score daalt (${Math.round(prevScore)}% → ${Math.round(recentScore)}%)` });
  } else if (recentScore != null && scored.length >= 4 && recentScore < 60) {
    alerts.push({ type: 'low-score', level: 'warning', text: `Veel fouten (${Math.round(recentScore)}% goed): niveau omlaag?` });
  }
  // alleen een signaal als de verwarring vaak voorkomt én een flink deel van dat zinsdeel betreft
  const conf = recentSkills.confusions.find((c) => {
    const sk = recentSkills.skills[c.real.split('-')[0]];
    const total = sk ? sk.hits + sk.misses : 0;
    return c.n >= 6 && total > 0 && c.n / total >= 0.15;
  });
  if (conf) alerts.push({ type: 'confusion', level: 'warning', text: `Verwart vaak: ${confusionText(conf)} (${conf.n}×)` });
  if (minutesWeek >= classSettings.weeklyGoalMinutes) alerts.push({ type: 'goal', level: 'good', text: 'Weekdoel gehaald' });
  if (diploma) alerts.push({ type: 'diploma', level: 'good', text: 'Ontleeddiploma gehaald' });

  const lesson = LESSONS.find((l) => l.id === current);
  return {
    id: student.id,
    name: student.name,
    avatar: student.avatar,
    currentLesson: current,
    currentLessonTitle: lesson?.title,
    podium: lesson?.podium,
    podiumName: PODIA.find((p) => p.id === lesson?.podium)?.name,
    lessonsDone,
    totalStars,
    recentScore: round1(recentScore),
    scoreTrend: recentScore != null && prevScore != null ? round1(recentScore - prevScore) : null,
    recentSec: round1(recentSec),
    secTrend: recentSec != null && prevSec != null ? round1(recentSec - prevSec) : null,
    minutesWeek: Math.round(minutesWeek),
    minutesTotal: Math.round(minutesTotal),
    weeklyGoal: classSettings.weeklyGoalMinutes,
    lastActive: last,
    lastLogin: student.last_login,
    streak,
    diploma,
    xp: student.xp,
    itemsTotal: sorted.reduce((s, a) => s + (a.items || 0), 0),
    places: Object.fromEntries(Object.entries(places).map(([k, v]) => [k, Math.round(v)])),
    alerts,
  };
}

/** Per dag: score, seconden per zin en minuten. */
export function dailySeries(attempts) {
  const days = new Map();
  for (const a of attempts) {
    const k = dayKey(a.created_at);
    const d = days.get(k) || { day: k, minutes: 0, scoreW: 0, scoreN: 0, secSum: 0, secN: 0, items: 0 };
    d.minutes += a.duration_ms / 60000;
    d.items += a.items || 0;
    if (isScored(a)) { d.scoreW += a.accuracy * a.items; d.scoreN += a.items; }
    if (isTimed(a)) { d.secSum += a.sec_per_item; d.secN += 1; }
    days.set(k, d);
  }
  return [...days.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).map((d) => ({
    day: d.day,
    minutes: round1(d.minutes),
    items: d.items,
    score: d.scoreN ? round1(d.scoreW / d.scoreN) : null,
    sec: d.secN ? round1(d.secSum / d.secN) : null,
  }));
}

export function lastNDays(n, now = Date.now()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * DAY));
  return [...new Set(out)];
}
