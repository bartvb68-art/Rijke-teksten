// Berekeningen voor voortgang en het volgsysteem.
import { LESSONS, PLANETS, EXAM_LESSON_ID, EXAM_PASS_STARS, CHAR_INFO } from '../public/js/shared/curriculum.js';

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
  weeklyGoalMinutes: 60,
  mastery: 1,
  leaderboard: true,
  gamesEnabled: true,
  showNames: true,
  schoolIps: [],
};

export const DEFAULT_STUDENT_SETTINGS = {
  speedFactor: 1,
  unlockUpTo: 0,
  dyslexia: false,
  largeText: false,
  sound: true,
  showHands: true,
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

const isSpeedAttempt = (a) => (a.kind === 'lesson' && (a.step_kind === 'test' || a.step_kind === 'text')) || a.game === 'race';
const isMeaningful = (a) => a.chars >= 20 && a.step_kind !== 'intro';

function avg(list) {
  return list.length ? list.reduce((s, x) => s + x, 0) / list.length : null;
}

const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

/** Samenvatting van één leerling, voor het klasoverzicht. */
export function studentSummary(student, attempts, progressRows, classRow, now = Date.now()) {
  const classSettings = { ...DEFAULT_CLASS_SETTINGS, ...classRow.settings };
  const settings = { ...DEFAULT_STUDENT_SETTINGS, ...student.settings };
  const progress = Object.fromEntries(progressRows.map((p) => [p.lesson_id, p]));
  const current = unlockedLesson(progress, classSettings.mastery, settings.unlockUpTo);
  const sorted = [...attempts].sort((a, b) => a.created_at - b.created_at);
  const speed = sorted.filter(isSpeedAttempt);
  const meaningful = sorted.filter(isMeaningful);
  const recentApm = avg(speed.slice(-5).map((a) => a.apm));
  const prevApm = avg(speed.slice(-10, -5).map((a) => a.apm));
  const recentAcc = avg(meaningful.slice(-8).map((a) => a.accuracy));
  const prevAcc = avg(meaningful.slice(-20, -8).map((a) => a.accuracy));
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

  const alerts = [];
  if (!last) alerts.push({ type: 'inactive', level: 'warning', text: 'Nog nooit geoefend' });
  else if (now - last > 7 * DAY) alerts.push({ type: 'inactive', level: 'warning', text: `${Math.floor((now - last) / DAY)} dagen niet geoefend` });
  const cur = progress[current];
  if (cur && cur.tests >= 4 && cur.best_stars < classSettings.mastery) {
    alerts.push({ type: 'stuck', level: 'serious', text: `Loopt vast bij les ${current} (${cur.tests} pogingen)` });
  }
  if (recentAcc != null && prevAcc != null && meaningful.length >= 12 && recentAcc < prevAcc - 4) {
    alerts.push({ type: 'accuracy-drop', level: 'warning', text: `Nauwkeurigheid daalt (${Math.round(prevAcc)}% → ${Math.round(recentAcc)}%)` });
  } else if (recentAcc != null && meaningful.length >= 5 && recentAcc < 88) {
    alerts.push({ type: 'low-accuracy', level: 'warning', text: `Veel fouten (${Math.round(recentAcc)}% goed): tempo omlaag?` });
  }
  if (minutesWeek >= classSettings.weeklyGoalMinutes) alerts.push({ type: 'goal', level: 'good', text: 'Weekdoel gehaald' });
  if (diploma) alerts.push({ type: 'diploma', level: 'good', text: 'Typediploma gehaald' });

  const lesson = LESSONS.find((l) => l.id === current);
  return {
    id: student.id,
    name: student.name,
    avatar: student.avatar,
    currentLesson: current,
    currentLessonTitle: lesson?.title,
    planet: lesson?.planet,
    planetName: PLANETS.find((p) => p.id === lesson?.planet)?.name,
    lessonsDone,
    totalStars,
    recentApm: round1(recentApm),
    apmTrend: recentApm != null && prevApm != null ? round1(recentApm - prevApm) : null,
    recentAcc: round1(recentAcc),
    minutesWeek: Math.round(minutesWeek),
    minutesTotal: Math.round(minutesTotal),
    weeklyGoal: classSettings.weeklyGoalMinutes,
    lastActive: last,
    lastLogin: student.last_login,
    streak,
    diploma,
    xp: student.xp,
    places: Object.fromEntries(Object.entries(places).map(([k, v]) => [k, Math.round(v)])),
    alerts,
  };
}

/** Fouten per toets (en per vinger) uit een lijst pogingen. */
export function keyStats(attempts) {
  const keys = {};
  for (const a of attempts) {
    const ks = a.key_stats || {};
    for (const [k, v] of Object.entries(ks)) {
      if (!Array.isArray(v)) continue;
      const base = k.length === 1 ? (CHAR_INFO[k]?.key ?? k.toLowerCase()) : k;
      const e = keys[base] || (keys[base] = { hits: 0, misses: 0 });
      e.hits += Number(v[0]) || 0;
      e.misses += Number(v[1]) || 0;
    }
  }
  const fingers = {};
  for (const [k, v] of Object.entries(keys)) {
    const f = CHAR_INFO[k]?.finger;
    if (!f) continue;
    const e = fingers[f] || (fingers[f] = { hits: 0, misses: 0 });
    e.hits += v.hits;
    e.misses += v.misses;
  }
  return { keys, fingers };
}

/** Per dag: snelheid, nauwkeurigheid en minuten. */
export function dailySeries(attempts) {
  const days = new Map();
  for (const a of attempts) {
    const k = dayKey(a.created_at);
    const d = days.get(k) || { day: k, minutes: 0, apmSum: 0, apmN: 0, accW: 0, accChars: 0 };
    d.minutes += a.duration_ms / 60000;
    if (isSpeedAttempt(a)) { d.apmSum += a.apm; d.apmN += 1; }
    if (isMeaningful(a)) { d.accW += a.accuracy * a.chars; d.accChars += a.chars; }
    days.set(k, d);
  }
  return [...days.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).map((d) => ({
    day: d.day,
    minutes: round1(d.minutes),
    apm: d.apmN ? round1(d.apmSum / d.apmN) : null,
    accuracy: d.accChars ? round1(d.accW / d.accChars) : null,
  }));
}

export function lastNDays(n, now = Date.now()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * DAY));
  return [...new Set(out)];
}
