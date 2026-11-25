import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tx, parseJson } from './db.js';
import { hashPassword, verifyPassword, newToken, hashToken, kidPassword, classCode, RateLimiter } from './auth.js';
import {
  studentSummary, skillStats, dailySeries, lastNDays, dayKey, weekStartKey, streakDays, placeLabel,
  unlockedLesson, DEFAULT_CLASS_SETTINGS, DEFAULT_STUDENT_SETTINGS,
} from './stats.js';
import {
  LESSONS, PODIA, lessonSteps, starsFor, GROEPEN, rankFor, GAMES_UNLOCK_LESSON, SKILL_ORDER, EXAM_LESSON_ID, EXAM_PASS_STARS,
} from '../public/js/shared/curriculum.js';
import { SHOP, DEFAULT_AVATAR, shopItem, BADGES } from '../public/js/shared/rewards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const DAY = 24 * 60 * 60 * 1000;
const STUDENT_SESSION_MS = 12 * 60 * 60 * 1000;
const TEACHER_SESSION_MS = 7 * DAY;
const COOKIE = 'bo_sess';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; media-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const bad = (msg) => new HttpError(400, msg);

function str(v, { min = 1, max = 200, name = 'veld' } = {}) {
  if (typeof v !== 'string') throw bad(`${name} ontbreekt`);
  const s = v.trim();
  if (s.length < min) throw bad(`${name} is te kort`);
  if (s.length > max) throw bad(`${name} is te lang`);
  return s;
}

function int(v, { min = 0, max = Number.MAX_SAFE_INTEGER, name = 'getal' } = {}) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${name} is ongeldig`);
  return n;
}

export function createApp({ db, now = () => Date.now(), signupCode = process.env.SIGNUP_CODE || '', trustProxy = process.env.TRUST_PROXY === '1', secureCookies = process.env.COOKIE_SECURE === '1' } = {}) {
  const limiter = new RateLimiter({ max: 10 });
  const q = (sql) => db.prepare(sql);

  // ---------- helpers ----------
  const loadClass = (id) => {
    const c = q('SELECT * FROM classes WHERE id = ?').get(id);
    if (c) c.settings = { ...DEFAULT_CLASS_SETTINGS, ...parseJson(c.settings, {}) };
    return c;
  };
  const loadStudent = (id) => {
    const s = q('SELECT * FROM students WHERE id = ?').get(id);
    if (s) {
      s.settings = { ...DEFAULT_STUDENT_SETTINGS, ...parseJson(s.settings, {}) };
      s.avatar = { ...DEFAULT_AVATAR, ...parseJson(s.avatar, {}) };
      s.owned = parseJson(s.owned, []);
    }
    return s;
  };
  const loadAttempts = (studentId, since = 0) => q('SELECT * FROM attempts WHERE student_id = ? AND created_at >= ? ORDER BY created_at')
    .all(studentId, since).map((a) => ({ ...a, skill_stats: parseJson(a.skill_stats, {}), confusions: parseJson(a.confusions, {}), extra: parseJson(a.extra, {}) }));
  const loadProgress = (studentId) => q('SELECT * FROM progress WHERE student_id = ? ORDER BY lesson_id').all(studentId);

  function clientIp(req) {
    if (trustProxy && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  }

  function locationFor(req, cls) {
    const ips = (cls.settings.schoolIps || []).filter(Boolean);
    if (!ips.length) return null;
    const ip = clientIp(req);
    return ips.some((p) => ip === p || (p.endsWith('.') || p.endsWith(':') ? ip.startsWith(p) : false) || (p.endsWith('*') && ip.startsWith(p.slice(0, -1)))) ? 'school' : 'thuis';
  }

  function getSession(req) {
    const cookie = req.headers.cookie || '';
    const m = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
    if (!m) return null;
    const token = m.slice(COOKIE.length + 1);
    const s = q('SELECT * FROM sessions WHERE token_hash = ?').get(hashToken(token));
    if (!s || s.expires_at < now()) return null;
    return s;
  }

  function startSession(res, role, userId) {
    const token = newToken();
    const ttl = role === 'student' ? STUDENT_SESSION_MS : TEACHER_SESSION_MS;
    q('DELETE FROM sessions WHERE expires_at < ?').run(now());
    q('INSERT INTO sessions (token_hash, role, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(hashToken(token), role, userId, now(), now() + ttl);
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(ttl / 1000)}${secureCookies ? '; Secure' : ''}`);
  }

  function requireRole(req, role) {
    const s = getSession(req);
    if (!s || s.role !== role) throw new HttpError(401, 'Je bent niet (meer) ingelogd.');
    return s;
  }

  function requireAdmin(req) {
    const s = requireRole(req, 'teacher');
    const t = q('SELECT is_admin FROM teachers WHERE id = ?').get(s.user_id);
    if (!t || !t.is_admin) throw new HttpError(403, 'Alleen de beheerder kan dit doen.');
    return s;
  }

  const isAdmin = (teacherId) => !!q('SELECT is_admin FROM teachers WHERE id = ?').get(teacherId)?.is_admin;

  // Een leerkracht ziet de eigen klassen; de beheerder ziet alle klassen van de school.
  function teacherClass(teacherId, classId) {
    const c = loadClass(classId);
    if (!c || (c.teacher_id !== teacherId && !isAdmin(teacherId))) throw new HttpError(404, 'Klas niet gevonden.');
    return c;
  }

  // ---------- schoolinstellingen ----------
  const getSetting = (key, fallback) => {
    const r = q('SELECT value FROM settings WHERE key = ?').get(key);
    return r ? parseJson(r.value, fallback) : fallback;
  };
  const setSetting = (key, value) => q('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));

  function schoolInfo() {
    const logo = getSetting('logo', null);
    return {
      name: getSetting('schoolName', ''),
      logo: logo ? logo.version : null,
      allowSignup: getSetting('allowSignup', true),
    };
  }

  function tempPassword() {
    const words = ['Gitaar', 'Trompet', 'Refrein', 'Melodie', 'Akkoord', 'Podium'];
    return `${words[Math.floor(Math.random() * words.length)]}-${newToken().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
  }

  function teacherStudent(teacherId, studentId) {
    const s = loadStudent(studentId);
    if (!s) throw new HttpError(404, 'Leerling niet gevonden.');
    const c = teacherClass(teacherId, s.class_id);
    return { student: s, cls: c };
  }

  // ---------- leerling-status ----------
  function studentState(studentId) {
    const s = loadStudent(studentId);
    const cls = loadClass(s.class_id);
    const progressRows = loadProgress(s.id);
    const progress = Object.fromEntries(progressRows.map((p) => [p.lesson_id, {
      stars: p.best_stars, bestAcc: Math.round(p.best_acc), bestSec: p.best_sec != null ? Math.round(p.best_sec * 10) / 10 : null, tests: p.tests,
    }]));
    const unlocked = unlockedLesson(Object.fromEntries(progressRows.map((p) => [p.lesson_id, p])), cls.settings.mastery, s.settings.unlockUpTo);
    const attempts = loadAttempts(s.id, now() - 60 * DAY);
    const weekKey = weekStartKey(now());
    const week = attempts.filter((a) => dayKey(a.created_at) >= weekKey);
    const minutesWeek = week.reduce((x, a) => x + a.duration_ms, 0) / 60000;
    const timed = attempts.filter((a) => a.kind === 'lesson' && ['oefen', 'mix', 'test'].includes(a.step_kind) && a.items >= 3);
    const recentSec = timed.length ? timed.slice(-6).reduce((x, a) => x + a.sec_per_item, 0) / Math.min(6, timed.length) : 0;
    const scored = attempts.filter((a) => a.items >= 3 && a.step_kind !== 'intro');
    const recentScore = scored.length ? scored.slice(-8).reduce((x, a) => x + a.accuracy, 0) / Math.min(8, scored.length) : 0;
    const badges = q('SELECT badge, earned_at FROM badges WHERE student_id = ? ORDER BY earned_at').all(s.id);
    const best = q("SELECT MAX(score) AS m FROM attempts WHERE student_id = ? AND game = 'notenregen'").get(s.id).m || 0;
    const itemsCorrect = q('SELECT COALESCE(SUM(correct), 0) AS n FROM attempts WHERE student_id = ?').get(s.id).n;
    return {
      student: { id: s.id, name: s.name, avatar: s.avatar, owned: s.owned, xp: s.xp, coins: s.coins, settings: s.settings, rank: rankFor(s.xp) },
      class: {
        id: cls.id, name: cls.name, groep: cls.groep,
        settings: {
          weeklyGoalMinutes: cls.settings.weeklyGoalMinutes, leaderboard: cls.settings.leaderboard,
          gamesEnabled: cls.settings.gamesEnabled, mastery: cls.settings.mastery,
        },
      },
      progress,
      unlocked,
      gamesUnlocked: cls.settings.gamesEnabled && unlocked > GAMES_UNLOCK_LESSON,
      stats: {
        minutesWeek: Math.round(minutesWeek),
        streak: streakDays(attempts.map((a) => dayKey(a.created_at)), now()),
        recentSec: Math.round(recentSec * 10) / 10,
        recentScore: Math.round(recentScore),
        notenregenRecord: best,
        itemsCorrect,
      },
      badges,
    };
  }

  function awardBadges(studentId, context) {
    const have = new Set(q('SELECT badge FROM badges WHERE student_id = ?').all(studentId).map((b) => b.badge));
    const earned = [];
    const give = (id) => {
      if (have.has(id)) return;
      q('INSERT OR IGNORE INTO badges (student_id, badge, earned_at) VALUES (?, ?, ?)').run(studentId, id, now());
      have.add(id);
      earned.push(id);
    };
    const { attempt, progress, cls, streak, minutesWeek, itemsCorrect } = context;
    give('eerste-noot');
    if (attempt.step_kind === 'test' && attempt.items >= 10 && attempt.errors === 0) give('foutloos');
    if (attempt.step_kind === 'test' && attempt.accuracy >= 90 && attempt.sec_per_item < 12) give('vlot');
    if (itemsCorrect >= 100) give('proefkoning');
    for (const p of PODIA.filter((pd) => pd.id <= 5)) {
      const ids = LESSONS.filter((l) => l.podium === p.id).map((l) => l.id);
      if (ids.every((id) => (progress[id]?.best_stars || 0) >= 1)) give(`podium-${p.id}`);
    }
    if ((progress[EXAM_LESSON_ID]?.best_stars || 0) >= EXAM_PASS_STARS) give('diploma');
    if (Object.values(progress).filter((p) => p.best_stars >= 3).length >= 5) give('drie-sterren-5');
    if (streak >= 3) give('reeks-3');
    if (streak >= 7) give('reeks-7');
    if (minutesWeek >= cls.settings.weeklyGoalMinutes) give('weekdoel');
    if (attempt.game === 'notenregen' && attempt.score >= 1000) give('notenregen-1000');
    if (attempt.game === 'notenregen' && attempt.score >= 5000) give('notenregen-5000');
    if (attempt.game === 'notenregen' && (attempt.extra?.combo || 0) >= 15) give('combo-15');
    if (attempt.game === 'battle' && attempt.extra?.place === 1) give('battle-winnaar');
    return earned;
  }

  function cleanCounts(input, { maxKeys = 40, keyRe }) {
    const out = {};
    if (!input || typeof input !== 'object') return out;
    for (const [k, v] of Object.entries(input).slice(0, maxKeys)) {
      if (!keyRe.test(k)) continue;
      if (Array.isArray(v)) out[k] = [Math.max(0, Math.min(10000, Number(v[0]) | 0)), Math.max(0, Math.min(10000, Number(v[1]) | 0))];
      else out[k] = Math.max(0, Math.min(10000, Number(v) | 0));
    }
    return out;
  }

  function recordAttempt(req, studentId, body) {
    const s = loadStudent(studentId);
    const cls = loadClass(s.class_id);
    const kind = body.kind === 'game' ? 'game' : body.kind === 'lesson' ? 'lesson' : null;
    if (!kind) throw bad('Onbekend soort oefening');
    const durationMs = int(Math.round(body.durationMs), { min: 1000, max: 60 * 60 * 1000, name: 'duur' });
    const items = int(body.items, { min: 0, max: 1000, name: 'zinnen' });
    const correct = int(body.correct, { min: 0, max: items, name: 'goed' });
    const errors = items - correct;
    const skillStatsIn = cleanCounts(body.skillStats, { keyRe: new RegExp(`^(${SKILL_ORDER.join('|')})$`) });
    for (const k of Object.keys(skillStatsIn)) if (!Array.isArray(skillStatsIn[k])) delete skillStatsIn[k];
    const confusionsIn = cleanCounts(body.confusions, { keyRe: /^[a-z-]{2,14}>[a-z-]{2,14}$/ });
    for (const k of Object.keys(confusionsIn)) if (Array.isArray(confusionsIn[k])) delete confusionsIn[k];
    const accuracy = items > 0 ? (correct / items) * 100 : 0;
    const secPerItem = items > 0 ? Math.min(600, durationMs / 1000 / items) : 0;
    const state = studentState(studentId);

    let lessonId = null; let step = null; let stepKind = null; let game = null; let stars = null; let score = null;
    const extra = {};
    if (kind === 'lesson') {
      lessonId = int(body.lessonId, { min: 1, max: LESSONS.length, name: 'les' });
      if (lessonId > state.unlocked) throw new HttpError(403, 'Deze les is nog op slot.');
      const steps = lessonSteps(lessonId);
      step = int(body.step, { min: 0, max: steps.length - 1, name: 'stap' });
      stepKind = steps[step].kind;
      if (items !== steps[step].count) throw bad('Het aantal zinnen klopt niet');
      if (stepKind === 'test') stars = starsFor(accuracy);
    } else {
      game = ['notenregen', 'battle'].includes(body.game) ? body.game : null;
      if (!game) throw bad('Onbekend spel');
      if (!state.gamesUnlocked) throw new HttpError(403, 'De spellen zijn nog op slot.');
      score = int(Math.round(body.score || 0), { min: 0, max: 10_000_000, name: 'score' });
      if (body.extra && typeof body.extra === 'object') {
        if (Number.isInteger(body.extra.place)) extra.place = Math.max(1, Math.min(4, body.extra.place));
        if (Number.isInteger(body.extra.combo)) extra.combo = Math.max(0, Math.min(9999, body.extra.combo));
        if (Number.isInteger(body.extra.level)) extra.level = Math.max(1, Math.min(999, body.extra.level));
      }
    }

    return tx(db, () => {
      let xp = correct * 4;
      let coins = 0;
      let newStars = 0;
      const progressRow = lessonId ? q('SELECT * FROM progress WHERE student_id = ? AND lesson_id = ?').get(s.id, lessonId) : null;
      if (lessonId && stepKind === 'test') {
        const prevStars = progressRow?.best_stars || 0;
        newStars = Math.max(0, stars - prevStars);
        if (progressRow) {
          q(`UPDATE progress SET best_stars = MAX(best_stars, ?), best_acc = MAX(best_acc, ?),
             best_sec = CASE WHEN ? >= 1 AND (best_sec IS NULL OR ? < best_sec) THEN ? ELSE best_sec END,
             tests = tests + 1, completed_at = COALESCE(completed_at, CASE WHEN ? >= 1 THEN ? END), updated_at = ?
             WHERE student_id = ? AND lesson_id = ?`).run(stars, accuracy, stars, secPerItem, secPerItem, stars, now(), now(), s.id, lessonId);
        } else {
          q(`INSERT INTO progress (student_id, lesson_id, best_stars, best_acc, best_sec, tests, completed_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`).run(s.id, lessonId, stars, accuracy, stars >= 1 ? secPerItem : null, stars >= 1 ? now() : null, now());
        }
        xp += 25 + newStars * 20;
        coins += newStars * 10;
      } else if (lessonId) {
        xp += 5;
      }
      if (game === 'notenregen') { xp += Math.min(150, Math.round(score / 40)); coins += Math.min(25, Math.floor(score / 300)); }
      if (game === 'battle') { xp += 20; coins += { 1: 12, 2: 7, 3: 4 }[extra.place] || 2; }
      const today = dayKey(now());
      const practisedToday = q('SELECT created_at FROM attempts WHERE student_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 50')
        .all(s.id, now() - 2 * DAY).some((a) => dayKey(a.created_at) === today);
      if (!practisedToday) coins += 5; // dagbonus

      const location = locationFor(req, cls);
      const info = q(`INSERT INTO attempts (student_id, kind, lesson_id, step, step_kind, game, created_at, duration_ms, items, correct, errors,
        accuracy, sec_per_item, stars, score, xp, location, skill_stats, confusions, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(s.id, kind, lessonId, step, stepKind, game, now(), durationMs, items, correct, errors, accuracy, secPerItem, stars, score, xp,
          location, JSON.stringify(skillStatsIn), JSON.stringify(confusionsIn), JSON.stringify(extra));
      q('UPDATE students SET xp = xp + ?, coins = coins + ? WHERE id = ?').run(xp, coins, s.id);

      const progressAll = Object.fromEntries(loadProgress(s.id).map((p) => [p.lesson_id, p]));
      const recent = loadAttempts(s.id, now() - 60 * DAY);
      const weekKey = weekStartKey(now());
      const minutesWeek = recent.filter((a) => dayKey(a.created_at) >= weekKey).reduce((x, a) => x + a.duration_ms, 0) / 60000;
      const itemsCorrect = q('SELECT COALESCE(SUM(correct), 0) AS n FROM attempts WHERE student_id = ?').get(s.id).n;
      const newBadges = awardBadges(s.id, {
        attempt: { items, errors, accuracy, sec_per_item: secPerItem, step_kind: stepKind, game, score, extra },
        progress: progressAll, cls, minutesWeek, itemsCorrect,
        streak: streakDays(recent.map((a) => dayKey(a.created_at)), now()),
      });
      const before = state.unlocked;
      const after = studentState(s.id);
      return {
        attemptId: Number(info.lastInsertRowid),
        accuracy: Math.round(accuracy), secPerItem: Math.round(secPerItem * 10) / 10, stars, xp, coins, newBadges,
        unlockedNext: after.unlocked > before ? after.unlocked : null,
        rankUp: after.student.rank.level > state.student.rank.level ? after.student.rank.name : null,
        state: after,
      };
    });
  }

  // ---------- leraar: klasoverzicht ----------
  function classOverview(cls) {
    const students = q('SELECT id FROM students WHERE class_id = ? ORDER BY name').all(cls.id).map((r) => loadStudent(r.id));
    const since = now() - 120 * DAY;
    const rows = [];
    const allAttempts = [];
    for (const s of students) {
      const attempts = loadAttempts(s.id, since);
      allAttempts.push(...attempts);
      rows.push(studentSummary(s, attempts, loadProgress(s.id), cls, now()));
    }
    const days = lastNDays(14, now());
    const minutesPerDay = Object.fromEntries(days.map((d) => [d, 0]));
    const activePerDay = Object.fromEntries(days.map((d) => [d, new Set()]));
    for (const a of allAttempts) {
      const k = dayKey(a.created_at);
      if (k in minutesPerDay) { minutesPerDay[k] += a.duration_ms / 60000; activePerDay[k].add(a.student_id); }
    }
    const podia = PODIA.map((p) => ({ id: p.id, name: p.name, count: rows.filter((r) => r.podium === p.id && !r.diploma).length }));
    const withScore = rows.filter((r) => r.recentScore != null);
    const withSec = rows.filter((r) => r.recentSec != null);
    return {
      class: publicClass(cls),
      students: rows,
      summary: {
        count: rows.length,
        avgScore: withScore.length ? Math.round(withScore.reduce((x, r) => x + r.recentScore, 0) / withScore.length) : null,
        avgSec: withSec.length ? Math.round((withSec.reduce((x, r) => x + r.recentSec, 0) / withSec.length) * 10) / 10 : null,
        goalReached: rows.filter((r) => r.minutesWeek >= r.weeklyGoal).length,
        activeWeek: rows.filter((r) => r.minutesWeek > 0).length,
        diplomas: rows.filter((r) => r.diploma).length,
        minutesWeek: rows.reduce((x, r) => x + r.minutesWeek, 0),
      },
      daily: days.map((d) => ({ day: d, minutes: Math.round(minutesPerDay[d]), active: activePerDay[d].size })),
      podia,
      skills: skillStats(allAttempts.filter((a) => a.created_at >= now() - 30 * DAY)),
    };
  }

  function publicClass(cls) {
    const count = q('SELECT COUNT(*) AS n FROM students WHERE class_id = ?').get(cls.id).n;
    return { id: cls.id, name: cls.name, groep: cls.groep, code: cls.code, settings: cls.settings, students: count, createdAt: cls.created_at };
  }

  function studentDetail(student, cls) {
    const attempts = loadAttempts(student.id, 0);
    const progressRows = loadProgress(student.id);
    const summary = studentSummary(student, attempts, progressRows, cls, now());
    const recentRange = now() - 30 * DAY;
    const lessons = LESSONS.map((l) => {
      const p = progressRows.find((r) => r.lesson_id === l.id);
      const la = attempts.filter((a) => a.lesson_id === l.id);
      return {
        id: l.id, title: l.title, podium: l.podium,
        stars: p?.best_stars || 0, bestAcc: p ? Math.round(p.best_acc) : null, bestSec: p?.best_sec != null ? Math.round(p.best_sec * 10) / 10 : null,
        tests: p?.tests || 0, minutes: Math.round(la.reduce((x, a) => x + a.duration_ms, 0) / 60000),
        completedAt: p?.completed_at || null, lastAt: la.length ? la[la.length - 1].created_at : null,
      };
    });
    const days = lastNDays(70, now());
    const series = dailySeries(attempts);
    const minutesByDay = Object.fromEntries(series.map((d) => [d.day, d.minutes]));
    return {
      student: {
        id: student.id, name: student.name, avatar: student.avatar, settings: student.settings, note: student.note,
        xp: student.xp, coins: student.coins, rank: rankFor(student.xp), createdAt: student.created_at, lastLogin: student.last_login,
      },
      class: publicClass(cls),
      summary,
      lessons,
      series: series.filter((d) => d.day >= days[0]),
      calendar: days.map((d) => ({ day: d, minutes: minutesByDay[d] || 0 })),
      skills: skillStats(attempts.filter((a) => a.created_at >= recentRange)),
      skillsAll: skillStats(attempts),
      badges: q('SELECT badge, earned_at FROM badges WHERE student_id = ? ORDER BY earned_at').all(student.id),
      recent: attempts.slice(-60).reverse().map((a) => ({
        id: a.id, at: a.created_at, kind: a.kind, lessonId: a.lesson_id, stepKind: a.step_kind, game: a.game,
        minutes: Math.round((a.duration_ms / 60000) * 10) / 10, items: a.items, correct: a.correct, accuracy: Math.round(a.accuracy),
        sec: Math.round(a.sec_per_item * 10) / 10, stars: a.stars, score: a.score, place: placeLabel(a), extra: a.extra,
      })),
    };
  }

  function csvExport(cls) {
    const o = classOverview(cls);
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
      return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const header = ['Naam', 'Groep', 'Huidige les', 'Lessen gehaald', 'Sterren', 'Score % goed', 'Seconden per zin', 'Minuten deze week',
      'Weekdoel', 'Minuten totaal', 'Zinnen geoefend', 'Laatst actief', 'Dagen op rij', 'Diploma', 'Signalen'];
    const lines = [header.join(';')];
    for (const r of o.students) {
      lines.push([r.name, cls.groep, `${r.currentLesson} ${r.currentLessonTitle}`, r.lessonsDone, r.totalStars, r.recentScore ?? '',
        r.recentSec ?? '', r.minutesWeek, r.weeklyGoal, r.minutesTotal, r.itemsTotal, r.lastActive ? new Date(r.lastActive).toISOString().slice(0, 16).replace('T', ' ') : '',
        r.streak, r.diploma ? 'ja' : 'nee', r.alerts.map((a) => a.text).join(' | ')].map(esc).join(';'));
    }
    return '﻿' + lines.join('\r\n');
  }

  function createStudents(cls, names) {
    if (!Array.isArray(names)) throw bad('Geef een lijst met namen');
    const clean = [...new Set(names.map((n) => String(n).trim().replace(/\s+/g, ' ')).filter(Boolean))];
    if (!clean.length) throw bad('Geen namen opgegeven');
    if (clean.length > 60) throw bad('Maximaal 60 leerlingen tegelijk');
    for (const n of clean) if (n.length > 40) throw bad(`Naam te lang: ${n.slice(0, 40)}…`);
    const existing = new Set(q('SELECT name FROM students WHERE class_id = ?').all(cls.id).map((r) => r.name.toLowerCase()));
    const created = [];
    const skipped = [];
    tx(db, () => {
      for (const name of clean) {
        if (existing.has(name.toLowerCase())) { skipped.push(name); continue; }
        const password = kidPassword();
        const info = q('INSERT INTO students (class_id, name, pass_hash, avatar, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(cls.id, name, hashPassword(password), JSON.stringify(DEFAULT_AVATAR), now());
        created.push({ id: Number(info.lastInsertRowid), name, password });
        existing.add(name.toLowerCase());
      }
    });
    return { created, skipped };
  }

  function cleanClassSettings(input, current) {
    const s = { ...current };
    if (input.weeklyGoalMinutes != null) s.weeklyGoalMinutes = int(input.weeklyGoalMinutes, { min: 0, max: 600, name: 'weekdoel' });
    if (input.mastery != null) s.mastery = int(input.mastery, { min: 1, max: 3, name: 'beheersing' });
    for (const k of ['leaderboard', 'gamesEnabled', 'showNames']) if (input[k] != null) s[k] = !!input[k];
    if (input.schoolIps != null) {
      const list = Array.isArray(input.schoolIps) ? input.schoolIps : String(input.schoolIps).split(/[\s,]+/);
      s.schoolIps = list.map((x) => String(x).trim()).filter((x) => /^[0-9a-fA-F.:*]{2,45}$/.test(x)).slice(0, 20);
    }
    return s;
  }

  function cleanStudentSettings(input, current, { teacher }) {
    const s = { ...current };
    for (const k of ['dyslexia', 'largeText', 'sound', 'music', 'readAloud']) if (input[k] != null) s[k] = !!input[k];
    if (teacher) {
      if (input.levelShift != null) s.levelShift = int(input.levelShift, { min: -1, max: 1, name: 'niveau' });
      if (input.unlockUpTo != null) s.unlockUpTo = int(input.unlockUpTo, { min: 0, max: LESSONS.length, name: 'vrijgeven' });
    }
    return s;
  }

  // ---------- routes ----------
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, handler, maxBody: opts.maxBody || 256 * 1024 });
  };

  route('GET', '/api/health', () => ({ ok: true }));
  route('GET', '/api/meta', () => ({ lessons: LESSONS.length, groepen: GROEPEN, shop: SHOP, badges: BADGES, signupCode: !!signupCode }));

  route('GET', '/api/me', ({ req }) => {
    const s = getSession(req);
    if (!s) return { role: null };
    if (s.role === 'teacher') {
      const t = q('SELECT id, name, email, school, is_admin, must_change FROM teachers WHERE id = ?').get(s.user_id);
      return t ? { role: 'teacher', teacher: { ...t, is_admin: !!t.is_admin, must_change: !!t.must_change } } : { role: null };
    }
    const st = q('SELECT id FROM students WHERE id = ?').get(s.user_id);
    return st ? { role: 'student', state: studentState(st.id) } : { role: null };
  });

  route('POST', '/api/auth/logout', ({ req, res }) => {
    const s = getSession(req);
    if (s) q('DELETE FROM sessions WHERE token_hash = ?').run(s.token_hash);
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    return { ok: true };
  });

  route('GET', '/api/school', () => schoolInfo());

  route('GET', '/api/school/logo', () => {
    const logo = getSetting('logo', null);
    if (!logo) throw new HttpError(404, 'Geen logo ingesteld.');
    return { __raw: Buffer.from(logo.data, 'base64'), type: logo.mime, inline: true };
  });

  route('POST', '/api/auth/teacher/register', ({ req, res, body }) => {
    const firstTeacher = !q('SELECT id FROM teachers LIMIT 1').get();
    if (!firstTeacher && !getSetting('allowSignup', true)) {
      throw new HttpError(403, 'Zelf een account maken staat uit. Vraag de beheerder van de school om een account.');
    }
    if (signupCode && body.signupCode !== signupCode) throw new HttpError(403, 'De registratiecode voor leerkrachten klopt niet.');
    const name = str(body.name, { min: 2, max: 80, name: 'Naam' });
    const email = str(body.email, { min: 5, max: 120, name: 'E-mailadres' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Dat e-mailadres klopt niet.');
    const password = str(body.password, { min: 8, max: 200, name: 'Wachtwoord' });
    const school = typeof body.school === 'string' ? body.school.trim().slice(0, 120) : '';
    if (q('SELECT id FROM teachers WHERE email = ?').get(email)) throw new HttpError(409, 'Er is al een account met dit e-mailadres.');
    const info = q('INSERT INTO teachers (email, name, school, pass_hash, created_at, last_login, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(email, name, school, hashPassword(password), now(), now(), firstTeacher ? 1 : 0);
    if (firstTeacher && school && !getSetting('schoolName', '')) setSetting('schoolName', school);
    startSession(res, 'teacher', Number(info.lastInsertRowid));
    return { ok: true, admin: firstTeacher };
  });

  route('POST', '/api/auth/teacher/login', ({ req, res, body }) => {
    const email = String(body.email || '').trim().toLowerCase();
    const key = `t:${clientIp(req)}:${email}`;
    if (limiter.blocked(key)) throw new HttpError(429, 'Te veel pogingen. Probeer het over een kwartier opnieuw.');
    const t = q('SELECT * FROM teachers WHERE email = ?').get(email);
    if (!t || !verifyPassword(String(body.password || ''), t.pass_hash)) {
      limiter.fail(key);
      throw new HttpError(401, 'E-mailadres of wachtwoord klopt niet.');
    }
    limiter.clear(key);
    q('UPDATE teachers SET last_login = ? WHERE id = ?').run(now(), t.id);
    startSession(res, 'teacher', t.id);
    return { ok: true };
  });

  route('POST', '/api/auth/student/class', ({ req, body }) => {
    const code = String(body.code || '').trim().toUpperCase();
    const key = `c:${clientIp(req)}`;
    if (limiter.blocked(key)) throw new HttpError(429, 'Te veel pogingen. Vraag je juf of meester om hulp.');
    const cls = q('SELECT id FROM classes WHERE code = ?').get(code);
    if (!cls) {
      limiter.fail(key);
      throw new HttpError(404, 'Deze klascode bestaat niet. Kijk goed op je inlogkaart.');
    }
    const c = loadClass(cls.id);
    const students = c.settings.showNames
      ? q('SELECT id, name, avatar FROM students WHERE class_id = ? ORDER BY name').all(c.id).map((s) => ({ id: s.id, name: s.name, avatar: { ...DEFAULT_AVATAR, ...parseJson(s.avatar, {}) } }))
      : null;
    return { class: { name: c.name, groep: c.groep, code: c.code }, students };
  });

  route('POST', '/api/auth/student/login', ({ req, res, body }) => {
    const code = String(body.code || '').trim().toUpperCase();
    const cls = q('SELECT id FROM classes WHERE code = ?').get(code);
    if (!cls) throw new HttpError(404, 'Deze klascode bestaat niet.');
    let st;
    if (body.studentId != null) st = q('SELECT * FROM students WHERE id = ? AND class_id = ?').get(Number(body.studentId), cls.id);
    else st = q('SELECT * FROM students WHERE name = ? AND class_id = ?').get(String(body.name || '').trim(), cls.id);
    const key = `s:${clientIp(req)}:${cls.id}:${st?.id ?? body.name}`;
    if (limiter.blocked(key)) throw new HttpError(429, 'Te veel pogingen. Vraag je juf of meester om hulp.');
    if (!st || !verifyPassword(String(body.password || '').trim().toLowerCase(), st.pass_hash)) {
      limiter.fail(key);
      throw new HttpError(401, 'Dat wachtwoord klopt niet. Probeer het nog eens!');
    }
    limiter.clear(key);
    q('UPDATE students SET last_login = ? WHERE id = ?').run(now(), st.id);
    startSession(res, 'student', st.id);
    return { ok: true, state: studentState(st.id) };
  });

  // Leerling
  route('GET', '/api/student/state', ({ req }) => studentState(requireRole(req, 'student').user_id));

  route('POST', '/api/student/attempt', ({ req, body }) => recordAttempt(req, requireRole(req, 'student').user_id, body));

  route('POST', '/api/student/settings', ({ req, body }) => {
    const sid = requireRole(req, 'student').user_id;
    const s = loadStudent(sid);
    const settings = cleanStudentSettings(body, s.settings, { teacher: false });
    q('UPDATE students SET settings = ? WHERE id = ?').run(JSON.stringify(settings), sid);
    return studentState(sid);
  });

  route('POST', '/api/student/avatar', ({ req, body }) => {
    const sid = requireRole(req, 'student').user_id;
    const s = loadStudent(sid);
    const avatar = { ...s.avatar };
    for (const slot of Object.keys(SHOP)) {
      if (body[slot] == null) continue;
      const item = shopItem(slot, body[slot]);
      if (!item) throw bad('Onbekend onderdeel');
      if (item.price > 0 && !s.owned.includes(`${slot}:${item.id}`)) throw new HttpError(403, 'Dit onderdeel heb je nog niet gekocht.');
      avatar[slot] = item.id;
    }
    q('UPDATE students SET avatar = ? WHERE id = ?').run(JSON.stringify(avatar), sid);
    return studentState(sid);
  });

  route('POST', '/api/student/buy', ({ req, body }) => {
    const sid = requireRole(req, 'student').user_id;
    return tx(db, () => {
      const s = loadStudent(sid);
      const item = shopItem(body.slot, body.id);
      if (!item) throw bad('Onbekend onderdeel');
      const key = `${body.slot}:${item.id}`;
      if (item.price === 0 || s.owned.includes(key)) throw bad('Dit heb je al.');
      if (s.coins < item.price) throw new HttpError(402, 'Je hebt nog niet genoeg muzieknoten.');
      q('UPDATE students SET coins = coins - ?, owned = ? WHERE id = ?').run(item.price, JSON.stringify([...s.owned, key]), sid);
      return studentState(sid);
    });
  });

  route('GET', '/api/student/leaderboard', ({ req }) => {
    const sid = requireRole(req, 'student').user_id;
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    if (!cls.settings.leaderboard) return { enabled: false, rows: [] };
    const weekKey = weekStartKey(now());
    const since = now() - 8 * DAY;
    const rows = q('SELECT id, name, avatar FROM students WHERE class_id = ?').all(cls.id).map((st) => {
      const xp = q('SELECT created_at, xp FROM attempts WHERE student_id = ? AND created_at >= ?').all(st.id, since)
        .filter((a) => dayKey(a.created_at) >= weekKey).reduce((x, a) => x + a.xp, 0);
      return { id: st.id, name: st.name, avatar: { ...DEFAULT_AVATAR, ...parseJson(st.avatar, {}) }, xp, me: st.id === sid };
    }).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
    return { enabled: true, rows: rows.slice(0, 50) };
  });

  route('GET', '/api/student/diploma', ({ req }) => {
    const sid = requireRole(req, 'student').user_id;
    return diplomaData(loadStudent(sid));
  });

  function diplomaData(s) {
    const cls = loadClass(s.class_id);
    const exam = q('SELECT * FROM progress WHERE student_id = ? AND lesson_id = ?').get(s.id, EXAM_LESSON_ID);
    if (!exam || exam.best_stars < EXAM_PASS_STARS) throw new HttpError(404, 'Het ontleeddiploma is nog niet gehaald.');
    const teacher = q('SELECT name, school FROM teachers WHERE id = ?').get(cls.teacher_id);
    return {
      name: s.name, className: cls.name, groep: cls.groep, school: getSetting('schoolName', '') || teacher.school, teacher: teacher.name,
      accuracy: Math.round(exam.best_acc), sec: exam.best_sec != null ? Math.round(exam.best_sec * 10) / 10 : null, stars: exam.best_stars,
      date: q('SELECT MIN(created_at) AS t FROM attempts WHERE student_id = ? AND lesson_id = ? AND stars >= ?').get(s.id, EXAM_LESSON_ID, EXAM_PASS_STARS).t || exam.completed_at,
    };
  }

  // Leraar
  route('GET', '/api/teacher/classes', ({ req }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const classes = q('SELECT id FROM classes WHERE teacher_id = ? ORDER BY created_at').all(tid).map((c) => loadClass(c.id));
    return {
      classes: classes.map((c) => {
        const o = classOverview(c);
        return { ...o.class, summary: o.summary, alerts: o.students.reduce((x, s) => x + s.alerts.filter((a) => a.level !== 'good').length, 0) };
      }),
    };
  });

  route('POST', '/api/teacher/classes', ({ req, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const name = str(body.name, { min: 1, max: 60, name: 'Klasnaam' });
    const groep = int(body.groep, { min: 5, max: 8, name: 'Groep' });
    let code;
    for (let i = 0; i < 20; i++) {
      code = classCode();
      if (!q('SELECT id FROM classes WHERE code = ?').get(code)) break;
    }
    const settings = cleanClassSettings(body.settings || {}, { ...DEFAULT_CLASS_SETTINGS });
    const info = q('INSERT INTO classes (teacher_id, name, groep, code, settings, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(tid, name, groep, code, JSON.stringify(settings), now());
    return publicClass(loadClass(Number(info.lastInsertRowid)));
  });

  route('GET', '/api/teacher/classes/:id', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    return classOverview(teacherClass(tid, Number(params.id)));
  });

  route('PATCH', '/api/teacher/classes/:id', ({ req, params, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const cls = teacherClass(tid, Number(params.id));
    const name = body.name != null ? str(body.name, { min: 1, max: 60, name: 'Klasnaam' }) : cls.name;
    const groep = body.groep != null ? int(body.groep, { min: 5, max: 8, name: 'Groep' }) : cls.groep;
    const settings = cleanClassSettings(body.settings || {}, cls.settings);
    q('UPDATE classes SET name = ?, groep = ?, settings = ? WHERE id = ?').run(name, groep, JSON.stringify(settings), cls.id);
    return publicClass(loadClass(cls.id));
  });

  route('DELETE', '/api/teacher/classes/:id', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const cls = teacherClass(tid, Number(params.id));
    q('DELETE FROM classes WHERE id = ?').run(cls.id);
    return { ok: true };
  });

  route('POST', '/api/teacher/classes/:id/students', ({ req, params, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    return createStudents(teacherClass(tid, Number(params.id)), body.names);
  });

  route('POST', '/api/teacher/classes/:id/reset-passwords', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const cls = teacherClass(tid, Number(params.id));
    const out = [];
    tx(db, () => {
      for (const s of q('SELECT id, name FROM students WHERE class_id = ? ORDER BY name').all(cls.id)) {
        const password = kidPassword();
        q('UPDATE students SET pass_hash = ? WHERE id = ?').run(hashPassword(password), s.id);
        out.push({ id: s.id, name: s.name, password });
      }
    });
    return { students: out };
  });

  route('GET', '/api/teacher/classes/:id/export.csv', ({ req, res, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const cls = teacherClass(tid, Number(params.id));
    const safeName = cls.name.replace(/[^a-z0-9-]+/gi, '_');
    return { __raw: csvExport(cls), type: 'text/csv; charset=utf-8', filename: `basislab-ontleden-${safeName}-${dayKey(now())}.csv` };
  });

  route('GET', '/api/teacher/students/:id', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student, cls } = teacherStudent(tid, Number(params.id));
    return studentDetail(student, cls);
  });

  route('PATCH', '/api/teacher/students/:id', ({ req, params, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student, cls } = teacherStudent(tid, Number(params.id));
    const name = body.name != null ? str(body.name, { min: 1, max: 40, name: 'Naam' }) : student.name;
    if (name.toLowerCase() !== student.name.toLowerCase() && q('SELECT id FROM students WHERE class_id = ? AND name = ?').get(cls.id, name)) {
      throw new HttpError(409, 'Er zit al een leerling met deze naam in de klas.');
    }
    const note = body.note != null ? String(body.note).slice(0, 2000) : student.note;
    const settings = cleanStudentSettings(body.settings || {}, student.settings, { teacher: true });
    let classId = student.class_id;
    if (body.classId != null && Number(body.classId) !== student.class_id) {
      const target = teacherClass(tid, Number(body.classId));
      if (q('SELECT id FROM students WHERE class_id = ? AND name = ?').get(target.id, name)) throw new HttpError(409, 'In die klas zit al een leerling met deze naam.');
      classId = target.id;
    }
    q('UPDATE students SET name = ?, note = ?, settings = ?, class_id = ? WHERE id = ?').run(name, note, JSON.stringify(settings), classId, student.id);
    const updated = loadStudent(student.id);
    return studentDetail(updated, loadClass(updated.class_id));
  });

  route('POST', '/api/teacher/students/:id/reset-password', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student } = teacherStudent(tid, Number(params.id));
    const password = kidPassword();
    q('UPDATE students SET pass_hash = ? WHERE id = ?').run(hashPassword(password), student.id);
    q("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(student.id);
    return { id: student.id, name: student.name, password };
  });

  route('DELETE', '/api/teacher/students/:id', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student } = teacherStudent(tid, Number(params.id));
    q('DELETE FROM students WHERE id = ?').run(student.id);
    q("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(student.id);
    return { ok: true };
  });

  route('GET', '/api/teacher/students/:id/diploma', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student } = teacherStudent(tid, Number(params.id));
    return diplomaData(student);
  });

  route('PATCH', '/api/teacher/me', ({ req, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const t = q('SELECT * FROM teachers WHERE id = ?').get(tid);
    const name = body.name != null ? str(body.name, { min: 2, max: 80, name: 'Naam' }) : t.name;
    const school = body.school != null ? String(body.school).trim().slice(0, 120) : t.school;
    if (body.newPassword) {
      if (!verifyPassword(String(body.password || ''), t.pass_hash)) throw new HttpError(401, 'Je huidige wachtwoord klopt niet.');
      const pw = str(body.newPassword, { min: 8, max: 200, name: 'Nieuw wachtwoord' });
      q('UPDATE teachers SET pass_hash = ?, must_change = 0 WHERE id = ?').run(hashPassword(pw), tid);
    }
    q('UPDATE teachers SET name = ?, school = ? WHERE id = ?').run(name, school, tid);
    return { ok: true };
  });

  // ---------- beheerder ----------
  route('GET', '/api/admin/overview', ({ req }) => {
    requireAdmin(req);
    const teachers = q('SELECT id, name, email, is_admin, must_change, created_at, last_login FROM teachers ORDER BY name').all();
    const classes = q('SELECT id FROM classes ORDER BY name').all().map((c) => loadClass(c.id));
    const teacherName = Object.fromEntries(teachers.map((t) => [t.id, t.name]));
    const days = lastNDays(30, now());
    const minutesPerDay = Object.fromEntries(days.map((d) => [d, 0]));
    const activePerDay = Object.fromEntries(days.map((d) => [d, new Set()]));
    const since = now() - 31 * DAY;
    const rows = classes.map((c) => {
      const o = classOverview(c);
      return {
        id: c.id, name: c.name, groep: c.groep, code: c.code, teacherId: c.teacher_id, teacher: teacherName[c.teacher_id] || '',
        students: o.summary.count, activeWeek: o.summary.activeWeek, minutesWeek: o.summary.minutesWeek,
        goalReached: o.summary.goalReached, avgScore: o.summary.avgScore, avgSec: o.summary.avgSec, diplomas: o.summary.diplomas,
        alerts: o.students.reduce((x, s) => x + s.alerts.filter((a) => a.level !== 'good').length, 0),
      };
    });
    for (const a of q('SELECT a.student_id, a.created_at, a.duration_ms FROM attempts a WHERE a.created_at >= ?').all(since)) {
      const k = dayKey(a.created_at);
      if (k in minutesPerDay) { minutesPerDay[k] += a.duration_ms / 60000; activePerDay[k].add(a.student_id); }
    }
    const sum = (key) => rows.reduce((x, r) => x + (r[key] || 0), 0);
    const withScore = rows.filter((r) => r.avgScore != null && r.students);
    return {
      school: schoolInfo(),
      totals: {
        teachers: teachers.length, classes: rows.length, students: sum('students'), activeWeek: sum('activeWeek'),
        minutesWeek: sum('minutesWeek'), diplomas: sum('diplomas'), goalReached: sum('goalReached'),
        avgScore: withScore.length ? Math.round(withScore.reduce((x, r) => x + r.avgScore * r.students, 0) / withScore.reduce((x, r) => x + r.students, 0)) : null,
      },
      daily: days.map((d) => ({ day: d, minutes: Math.round(minutesPerDay[d]), active: activePerDay[d].size })),
      classes: rows,
      teachers: teachers.map((t) => ({
        id: t.id, name: t.name, email: t.email, isAdmin: !!t.is_admin, mustChange: !!t.must_change,
        createdAt: t.created_at, lastLogin: t.last_login, classes: rows.filter((r) => r.teacherId === t.id).length,
      })),
    };
  });

  route('PATCH', '/api/admin/settings', ({ req, body }) => {
    requireAdmin(req);
    if (body.schoolName != null) setSetting('schoolName', String(body.schoolName).trim().slice(0, 80));
    if (body.allowSignup != null) setSetting('allowSignup', !!body.allowSignup);
    return schoolInfo();
  });

  route('POST', '/api/admin/logo', ({ req, body }) => {
    requireAdmin(req);
    const m = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.dataUrl || ''));
    if (!m) throw bad('Kies een afbeelding in PNG, JPG of WebP.');
    const buf = Buffer.from(m[3], 'base64');
    if (buf.length > 600 * 1024) throw bad('Het logo is te groot (maximaal 600 kB).');
    const magic = { 'image/png': buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
      'image/jpeg': buf[0] === 0xff && buf[1] === 0xd8,
      'image/webp': buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP' };
    if (!magic[m[1]]) throw bad('Dit bestand is geen geldige afbeelding.');
    setSetting('logo', { mime: m[1], data: buf.toString('base64'), version: now() });
    return schoolInfo();
  }, { maxBody: 1024 * 1024 });

  route('DELETE', '/api/admin/logo', ({ req }) => {
    requireAdmin(req);
    q("DELETE FROM settings WHERE key = 'logo'").run();
    return schoolInfo();
  });

  route('POST', '/api/admin/teachers', ({ req, body }) => {
    requireAdmin(req);
    const name = str(body.name, { min: 2, max: 80, name: 'Naam' });
    const email = str(body.email, { min: 5, max: 120, name: 'E-mailadres' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Dat e-mailadres klopt niet.');
    if (q('SELECT id FROM teachers WHERE email = ?').get(email)) throw new HttpError(409, 'Er is al een account met dit e-mailadres.');
    const password = tempPassword();
    const info = q('INSERT INTO teachers (email, name, school, pass_hash, created_at, is_admin, must_change) VALUES (?, ?, ?, ?, ?, ?, 1)')
      .run(email, name, getSetting('schoolName', ''), hashPassword(password), now(), body.isAdmin ? 1 : 0);
    return { id: Number(info.lastInsertRowid), name, email, password };
  });

  route('POST', '/api/admin/teachers/:id/reset-password', ({ req, params }) => {
    requireAdmin(req);
    const t = q('SELECT id, name, email FROM teachers WHERE id = ?').get(Number(params.id));
    if (!t) throw new HttpError(404, 'Leerkracht niet gevonden.');
    const password = tempPassword();
    q('UPDATE teachers SET pass_hash = ?, must_change = 1 WHERE id = ?').run(hashPassword(password), t.id);
    q("DELETE FROM sessions WHERE role = 'teacher' AND user_id = ?").run(t.id);
    return { ...t, password };
  });

  route('PATCH', '/api/admin/teachers/:id', ({ req, params, body }) => {
    const me = requireAdmin(req).user_id;
    const t = q('SELECT id, is_admin FROM teachers WHERE id = ?').get(Number(params.id));
    if (!t) throw new HttpError(404, 'Leerkracht niet gevonden.');
    if (body.isAdmin != null) {
      const admins = q('SELECT COUNT(*) AS n FROM teachers WHERE is_admin = 1').get().n;
      if (!body.isAdmin && t.is_admin && admins <= 1) throw bad('Er moet minstens één beheerder blijven.');
      q('UPDATE teachers SET is_admin = ? WHERE id = ?').run(body.isAdmin ? 1 : 0, t.id);
    }
    if (body.name != null) q('UPDATE teachers SET name = ? WHERE id = ?').run(str(body.name, { min: 2, max: 80, name: 'Naam' }), t.id);
    return { ok: true, self: t.id === me };
  });

  route('DELETE', '/api/admin/teachers/:id', ({ req, params, body }) => {
    const me = requireAdmin(req).user_id;
    const t = q('SELECT id FROM teachers WHERE id = ?').get(Number(params.id));
    if (!t) throw new HttpError(404, 'Leerkracht niet gevonden.');
    if (t.id === me) throw bad('Je kunt je eigen account niet verwijderen.');
    const target = body.transferTo != null ? q('SELECT id FROM teachers WHERE id = ?').get(Number(body.transferTo)) : null;
    if (body.transferTo != null && (!target || target.id === t.id)) throw bad('Kies een andere leerkracht om de klassen aan over te dragen.');
    tx(db, () => {
      if (target) q('UPDATE classes SET teacher_id = ? WHERE teacher_id = ?').run(target.id, t.id);
      q("DELETE FROM sessions WHERE role = 'teacher' AND user_id = ?").run(t.id);
      q('DELETE FROM teachers WHERE id = ?').run(t.id);
    });
    return { ok: true };
  });

  route('GET', '/api/admin/export.csv', ({ req }) => {
    requireAdmin(req);
    const esc = (v) => {
      const str0 = v == null ? '' : String(v);
      const safe = /^[=+\-@]/.test(str0) ? `'${str0}` : str0;
      return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const lines = [['Klas', 'Groep', 'Leerkracht', 'Leerlingen', 'Actief deze week', 'Minuten deze week', 'Weekdoel gehaald',
      'Gem. score % goed', 'Gem. seconden per zin', "Diploma's", 'Signalen'].join(';')];
    const teachers = Object.fromEntries(q('SELECT id, name FROM teachers').all().map((t) => [t.id, t.name]));
    for (const c of q('SELECT id FROM classes ORDER BY name').all().map((r) => loadClass(r.id))) {
      const o = classOverview(c);
      lines.push([c.name, c.groep, teachers[c.teacher_id], o.summary.count, o.summary.activeWeek, o.summary.minutesWeek, o.summary.goalReached,
        o.summary.avgScore ?? '', o.summary.avgSec ?? '', o.summary.diplomas,
        o.students.reduce((x, st) => x + st.alerts.filter((a) => a.level !== 'good').length, 0)].map(esc).join(';'));
    }
    return { __raw: '﻿' + lines.join('\r\n'), type: 'text/csv; charset=utf-8', filename: `basislab-ontleden-gebruik-${dayKey(now())}.csv` };
  });

  // ---------- request-afhandeling ----------
  async function readBody(req, maxBody = 256 * 1024) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBody) throw new HttpError(413, 'Verzoek te groot');
      chunks.push(chunk);
    }
    if (!chunks.length) return {};
    try {
      const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      return v && typeof v === 'object' ? v : {};
    } catch {
      throw bad('Ongeldige gegevens');
    }
  }

  function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
  }

  function serveStatic(req, res, urlPath) {
    let rel = decodeURIComponent(urlPath);
    if (rel === '/' || !path.extname(rel)) rel = '/index.html';
    const file = path.resolve(PUBLIC_DIR, '.' + rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Niet gevonden');
        return;
      }
      const ext = path.extname(file);
      const headers = {
        ...SECURITY_HEADERS,
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.woff2' || ext === '.mp4' ? 'public, max-age=604800' : 'no-cache',
        'Content-Length': st.size,
      };
      if (ext === '.mp4' && req.headers.range) {
        const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range);
        const start = m && m[1] ? Number(m[1]) : 0;
        const end = m && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { ...headers, 'Accept-Ranges': ext === '.mp4' ? 'bytes' : 'none' });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    });
  }

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      serveStatic(req, res, url.pathname);
      return;
    }
    try {
      const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
      if (!r) throw new HttpError(404, 'Onbekende API-route');
      if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'basislab-ontleden') {
        throw new HttpError(403, 'Verzoek geweigerd');
      }
      const m = r.re.exec(url.pathname);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      const body = req.method === 'GET' ? {} : await readBody(req, r.maxBody);
      const result = await r.handler({ req, res, params, body, query: url.searchParams });
      if (result && result.__raw != null) {
        res.writeHead(200, {
          ...SECURITY_HEADERS, 'Content-Type': result.type,
          'Cache-Control': result.inline ? 'public, max-age=300' : 'no-store',
          'Content-Disposition': result.inline ? 'inline' : `attachment; filename="${result.filename}"`,
        });
        res.end(result.__raw);
        return;
      }
      sendJson(res, 200, result ?? { ok: true });
    } catch (err) {
      if (err instanceof HttpError) sendJson(res, err.status, { error: err.message });
      else {
        console.error(err);
        sendJson(res, 500, { error: 'Er ging iets mis op de server.' });
      }
    }
  };
}
