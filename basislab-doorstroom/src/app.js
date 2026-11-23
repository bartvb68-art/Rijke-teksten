import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tx, parseJson } from './db.js';
import { hashPassword, verifyPassword, newToken, hashToken, kidPassword, classCode, RateLimiter } from './auth.js';
import {
  DAY, dayKey, weekKey, lastNDays, duringSchool, DEFAULT_CLASS_SETTINGS, DEFAULT_STUDENT_SETTINGS, classPlan, currentWeek,
  startTheta, domainTheta, chooseSkill, targetDifficulty, testPlan, testResult, studentSummary, weeklyDomainSeries, stripHtml, thetaFor,
} from './engine.js';
import { generate, publicItem, grade } from './content/index.js';
import { LEZEN_SIZES } from './content/lezen.js';
import { BANK_SIZES } from './content/taal.js';
import {
  DOMAINS, SKILLS, SKILL_BY_ID, START_LEVELS, niveauFor, updateTheta, weeksBetween, mondayOf,
} from '../public/js/shared/skills.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const STUDENT_SESSION_MS = 12 * 60 * 60 * 1000;
const TEACHER_SESSION_MS = 7 * DAY;
const COOKIE = 'bd_sess';
const XHR = 'basislab-doorstroom';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'self'",
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
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00`).getTime());

export function createApp({ db, now = () => Date.now(), signupCode = process.env.SIGNUP_CODE || '', trustProxy = process.env.TRUST_PROXY === '1', secureCookies = process.env.COOKIE_SECURE === '1' } = {}) {
  const limiter = new RateLimiter({ max: 10 });
  const q = (sql) => db.prepare(sql);

  // ---------- laden ----------
  const loadClass = (id) => {
    const c = q('SELECT * FROM classes WHERE id = ?').get(id);
    if (c) c.settings = { ...DEFAULT_CLASS_SETTINGS, ...parseJson(c.settings, {}) };
    return c;
  };
  const loadStudent = (id) => {
    const s = q('SELECT * FROM students WHERE id = ?').get(id);
    if (s) {
      const raw = parseJson(s.settings, {});
      s.settings = { ...DEFAULT_STUDENT_SETTINGS, ...raw, start: { ...DEFAULT_STUDENT_SETTINGS.start, ...(raw.start || {}) } };
    }
    return s;
  };
  const loadAbilities = (sid) => Object.fromEntries(q('SELECT * FROM abilities WHERE student_id = ?').all(sid).map((a) => [a.skill, a]));
  const loadAnswers = (sid, since = 0) => q('SELECT * FROM answers WHERE student_id = ? AND created_at >= ? ORDER BY created_at, id').all(sid, since);
  const loadTests = (sid) => q('SELECT * FROM tests WHERE student_id = ? ORDER BY started_at').all(sid).map((t) => ({ ...t, plan: parseJson(t.plan, []), result: parseJson(t.result, null) }));

  function clientIp(req) {
    if (trustProxy && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  }
  function locationFor(req, cls) {
    const ips = (cls.settings.schoolIps || []).filter(Boolean);
    if (!ips.length) return null;
    const ip = clientIp(req);
    return ips.some((p) => ip === p || (p.endsWith('*') && ip.startsWith(p.slice(0, -1))) || ((p.endsWith('.') || p.endsWith(':')) && ip.startsWith(p))) ? 'school' : 'thuis';
  }

  // ---------- sessies ----------
  function getSession(req) {
    const cookie = req.headers.cookie || '';
    const m = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
    if (!m) return null;
    const s = q('SELECT * FROM sessions WHERE token_hash = ?').get(hashToken(m.slice(COOKIE.length + 1)));
    if (!s || s.expires_at < now()) return null;
    return s;
  }
  function startSession(res, role, userId) {
    const token = newToken();
    const ttl = role === 'student' ? STUDENT_SESSION_MS : TEACHER_SESSION_MS;
    q('DELETE FROM sessions WHERE expires_at < ?').run(now());
    q('INSERT INTO sessions (token_hash, role, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(hashToken(token), role, userId, now(), now() + ttl);
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(ttl / 1000)}${secureCookies ? '; Secure' : ''}`);
  }
  function requireRole(req, role) {
    const s = getSession(req);
    if (!s || s.role !== role) throw new HttpError(401, 'Je bent niet (meer) ingelogd.');
    return s;
  }
  const isAdmin = (tid) => !!q('SELECT is_admin FROM teachers WHERE id = ?').get(tid)?.is_admin;
  function requireAdmin(req) {
    const s = requireRole(req, 'teacher');
    if (!isAdmin(s.user_id)) throw new HttpError(403, 'Alleen de beheerder kan dit doen.');
    return s;
  }
  function teacherClass(tid, classId) {
    const c = loadClass(classId);
    if (!c || (c.teacher_id !== tid && !isAdmin(tid))) throw new HttpError(404, 'Klas niet gevonden.');
    return c;
  }
  function teacherStudent(tid, sid) {
    const s = loadStudent(sid);
    if (!s) throw new HttpError(404, 'Leerling niet gevonden.');
    return { student: s, cls: teacherClass(tid, s.class_id) };
  }

  // ---------- schoolinstellingen ----------
  const getSetting = (key, fallback) => { const r = q('SELECT value FROM settings WHERE key = ?').get(key); return r ? parseJson(r.value, fallback) : fallback; };
  const setSetting = (key, value) => q('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
  function schoolInfo() {
    const logo = getSetting('logo', null);
    return { name: getSetting('schoolName', ''), logo: logo ? logo.version : null, allowSignup: getSetting('allowSignup', true) };
  }
  const tempPassword = () => `${['Kompas', 'Bergtop', 'Rugzak', 'Uitzicht', 'Gletsjer', 'Route'][Math.floor(Math.random() * 6)]}-${newToken().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;

  // ---------- leerling ----------
  function streakDays(days) {
    const set = new Set(days);
    let d = now();
    if (!set.has(dayKey(d))) d -= DAY;
    let n = 0;
    while (set.has(dayKey(d)) && n < 400) { n += 1; d -= DAY; }
    return n;
  }

  function testAvailability(cls, sid, wk) {
    const tests = loadTests(sid);
    const active = tests.find((t) => !t.finished_at) || null;
    const doneThisWeek = tests.some((t) => t.finished_at && t.week === wk.week);
    const open = !!(wk.test || cls.settings.testAlways);
    return { open, available: open && !doneThisWeek, active: active ? { id: active.id, pos: active.pos, total: active.plan.length } : null, doneThisWeek };
  }

  function studentState(sid) {
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    const abilities = loadAbilities(s.id);
    const answers = loadAnswers(s.id, now() - 70 * DAY);
    const tests = loadTests(s.id);
    const summary = studentSummary({ student: s, cls, abilities, answers, tests, now: now() });
    const wk = currentWeek(cls, now());
    const { weeks, plan } = classPlan(cls, now());
    const counts = {};
    for (const a of answers) { const w = weekKey(a.created_at); counts[w] = (counts[w] || 0) + 1; }
    return {
      student: { id: s.id, name: s.name, xp: s.xp, settings: s.settings },
      class: { id: cls.id, name: cls.name, groep: cls.groep },
      week: { ...wk, focus: summary.week.focus, goal: summary.week.goal },
      progress: summary.week,
      domains: summary.domains,
      streak: streakDays(answers.map((a) => dayKey(a.created_at))),
      test: testAvailability(cls, s.id, wk),
      route: weeks.map((w) => ({ week: w, holiday: !!plan[w].holiday, test: !!plan[w].test, goal: Math.round((plan[w].goal || 0) * (s.settings.goalFactor || 1)), done: counts[w] || 0 })),
      toets: classPlan(cls, now()).toets,
    };
  }

  function nextItem(sid, mode) {
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    const abilities = loadAbilities(sid);
    const recent = loadAnswers(sid, now() - 60 * DAY);
    const seen = new Set(recent.map((a) => a.item_key));
    let item; let testId = null; let progress = null;
    if (mode === 'toets') {
      const t = loadTests(sid).find((x) => !x.finished_at);
      if (!t) throw new HttpError(409, 'Er staat geen proeftoets klaar.');
      const step = t.plan[t.pos];
      if (!step) throw new HttpError(409, 'De proeftoets is al klaar.');
      const lastText = recent.filter((a) => a.test_id === t.id && a.skill === 'lz-begrijpend').pop();
      item = generate(step.skill, step.level, seen, { lastTextId: lastText ? lastText.item_key.split(':')[1] : null });
      testId = t.id;
      progress = { pos: t.pos + 1, total: t.plan.length };
    } else {
      if (!(mode === 'week' || mode === 'mix' || (/^skill:/.test(mode) && SKILL_BY_ID[mode.slice(6)]) || (/^domain:(rk|tv|lz)$/.test(mode)))) throw bad('Onbekende manier van oefenen');
      const wk = currentWeek(cls, now());
      const weekAnswers = recent.filter((a) => weekKey(a.created_at) === wk.week);
      const weekCounts = {};
      for (const a of weekAnswers) weekCounts[a.skill] = (weekCounts[a.skill] || 0) + 1;
      const lastAt = {};
      for (const a of recent) lastAt[a.skill] = a.created_at;
      const last = recent.filter((a) => a.mode !== 'toets').pop();
      // Een tekst lezen we af: zolang er nog vragen bij de tekst zijn, gaat de leerling daarmee verder.
      let sticky = null; let lastTextId = null;
      if (last && last.skill === 'lz-begrijpend' && now() - last.created_at < 30 * 60000) {
        lastTextId = last.item_key.split(':')[1];
        const allowed = mode === 'week' || mode === 'mix' || mode === 'domain:lz' || mode === 'skill:lz-begrijpend';
        const left = generate('lz-begrijpend', 3, seen, { lastTextId });
        if (allowed && left.textId === lastTextId) sticky = 'lz-begrijpend';
      }
      const skill = chooseSkill({ mode, week: wk, abilities, settings: s.settings, weekCounts, lastSkill: last?.skill, sticky, lastAt, now: now() });
      const theta = thetaFor(abilities, skill, s.settings);
      item = generate(skill, targetDifficulty(theta, { calm: s.settings.calm }), seen, { lastTextId });
    }
    const info = tx(db, () => {
      q('DELETE FROM pending WHERE student_id = ? AND (mode = ? OR created_at < ?)').run(sid, mode, now() - DAY);
      return q('INSERT INTO pending (student_id, mode, test_id, item, created_at) VALUES (?, ?, ?, ?, ?)').run(sid, mode, testId, JSON.stringify(item), now());
    });
    return { pendingId: Number(info.lastInsertRowid), item: publicItem(item), progress, mode };
  }

  function answerItem(req, sid, body) {
    const p = q('SELECT * FROM pending WHERE id = ? AND student_id = ?').get(int(body.pendingId, { min: 1, name: 'opgave' }), sid);
    if (!p) throw new HttpError(409, 'Deze opgave is verlopen. Je krijgt een nieuwe.');
    const item = parseJson(p.item, null);
    const given = typeof body.answer === 'string' ? body.answer.slice(0, 200) : '';
    const ms = Math.max(0, Math.min(30 * 60000, Number(body.ms) || 0));
    const correct = grade(item, given);
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    const skill = SKILL_BY_ID[item.skill];
    return tx(db, () => {
      q('DELETE FROM pending WHERE id = ?').run(p.id);
      const ab = q('SELECT * FROM abilities WHERE student_id = ? AND skill = ?').get(sid, item.skill);
      const before = ab ? ab.theta : startTheta(s.settings, skill.domain);
      const n = ab ? ab.n : 0;
      const theta = updateTheta(before, n, item.level, correct);
      if (ab) q('UPDATE abilities SET theta = ?, n = n + 1, correct = correct + ?, updated_at = ? WHERE student_id = ? AND skill = ?').run(theta, correct ? 1 : 0, now(), sid, item.skill);
      else q('INSERT INTO abilities (student_id, skill, theta, n, correct, updated_at) VALUES (?, ?, ?, 1, ?, ?)').run(sid, item.skill, theta, correct ? 1 : 0, now());
      const promptText = (item.passage ? `[${stripHtml(item.passage.match(/<h3>(.*?)<\/h3>/)?.[1] || 'tekst')}] ` : '') + stripHtml(item.prompt);
      q(`INSERT INTO answers (student_id, skill, domain, item_key, difficulty, correct, given, answer, prompt, mode, test_id, ms, theta_after, location, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(sid, item.skill, skill.domain, item.key, item.level, correct ? 1 : 0, given, String(item.answer),
        promptText.slice(0, 400), p.mode === 'toets' ? 'toets' : p.mode.startsWith('week') ? 'week' : 'vrij', p.test_id, Math.round(ms), theta, locationFor(req, cls), now());

      // Weektaak en XP
      const wk = currentWeek(cls, now());
      const goal = Math.round((wk.goal || 0) * (s.settings.goalFactor || 1));
      const doneWeek = loadAnswers(sid, now() - 8 * DAY).filter((a) => weekKey(a.created_at) === wk.week).length;
      let xp = correct ? 10 : 2;
      const weekDone = goal > 0 && doneWeek === goal;
      if (weekDone) xp += 50;
      q('UPDATE students SET xp = xp + ? WHERE id = ?').run(xp, sid);

      if (p.mode === 'toets') {
        const t = loadTests(sid).find((x) => x.id === p.test_id);
        const pos = t.pos + 1;
        let result = null;
        if (pos >= t.plan.length) {
          const rows = q('SELECT * FROM answers WHERE test_id = ? ORDER BY id').all(t.id);
          result = testResult(rows);
          q('UPDATE tests SET pos = ?, finished_at = ?, result = ? WHERE id = ?').run(pos, now(), JSON.stringify(result), t.id);
        } else q('UPDATE tests SET pos = ? WHERE id = ?').run(pos, t.id);
        return { toets: true, pos, total: t.plan.length, done: !!result, result, xp };
      }
      return {
        correct, answer: item.answer, explain: item.explain || '', xp, weekDone,
        skill: { id: skill.id, theta: Math.round(theta * 100) / 100, niveau: niveauFor(theta, skill.domain), change: Math.round((theta - before) * 100) / 100 },
        week: { done: doneWeek, goal },
      };
    });
  }

  function startTest(sid) {
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    const wk = currentWeek(cls, now());
    const av = testAvailability(cls, sid, wk);
    if (av.active) return av.active;
    if (!av.open) throw new HttpError(403, 'Er is deze week geen proeftoets. Je juf of meester zet hem klaar.');
    if (av.doneThisWeek) throw new HttpError(403, 'Je hebt de proeftoets van deze week al gemaakt.');
    const plan = testPlan();
    const info = q('INSERT INTO tests (student_id, week, plan, pos, started_at) VALUES (?, ?, ?, 0, ?)').run(sid, wk.week, JSON.stringify(plan), now());
    return { id: Number(info.lastInsertRowid), pos: 0, total: plan.length };
  }

  function studentResults(sid) {
    const s = loadStudent(sid);
    const cls = loadClass(s.class_id);
    const abilities = loadAbilities(sid);
    const answers = loadAnswers(sid, 0);
    const { weeks } = classPlan(cls, now());
    return {
      domains: DOMAINS.map((d) => {
        const dt = domainTheta(abilities, d.id, s.settings);
        return { id: d.id, theta: dt.theta, n: dt.n, niveau: niveauFor(dt.n >= 8 ? dt.theta : null, d.id) };
      }),
      skills: SKILLS.map((sk) => {
        const a = abilities[sk.id];
        return { id: sk.id, theta: a ? Math.round(a.theta * 100) / 100 : null, n: a?.n || 0, pct: a?.n ? Math.round((a.correct / a.n) * 100) : null, niveau: niveauFor(a && a.n >= 5 ? a.theta : null, sk.domain) };
      }),
      series: weeklyDomainSeries(answers, weeks, s.settings, now()),
      tests: loadTests(sid).filter((t) => t.finished_at).map((t) => ({ id: t.id, week: t.week, at: t.finished_at, result: t.result })),
      mistakes: answers.filter((a) => !a.correct && a.mode !== 'toets').slice(-12).reverse().map((a) => ({ at: a.created_at, skill: a.skill, prompt: a.prompt, given: a.given, answer: a.answer })),
    };
  }

  // ---------- leerkracht ----------
  function publicClass(cls) {
    const count = q('SELECT COUNT(*) AS n FROM students WHERE class_id = ?').get(cls.id).n;
    const pl = classPlan(cls, now());
    return { id: cls.id, name: cls.name, groep: cls.groep, code: cls.code, settings: { ...cls.settings, plan: undefined }, students: count, createdAt: cls.created_at, start: pl.start, toets: pl.toets };
  }

  function classOverview(cls) {
    const students = q('SELECT id FROM students WHERE class_id = ? ORDER BY name').all(cls.id).map((r) => loadStudent(r.id));
    const rows = [];
    const heat = [];
    const all = [];
    for (const s of students) {
      const abilities = loadAbilities(s.id);
      const answers = loadAnswers(s.id, now() - 90 * DAY);
      all.push(...answers);
      rows.push(studentSummary({ student: s, cls, abilities, answers, tests: loadTests(s.id), now: now() }));
      heat.push({ id: s.id, name: s.name, skills: Object.fromEntries(SKILLS.map((sk) => [sk.id, abilities[sk.id] && abilities[sk.id].n >= 3 ? { theta: Math.round(abilities[sk.id].theta * 100) / 100, n: abilities[sk.id].n } : null])) });
    }
    const wk = currentWeek(cls, now());
    const days = lastNDays(14, now());
    const perDay = Object.fromEntries(days.map((d) => [d, { n: 0, students: new Set() }]));
    for (const a of all) { const k = dayKey(a.created_at); if (perDay[k]) { perDay[k].n += 1; perDay[k].students.add(a.student_id); } }
    const distribution = Object.fromEntries(DOMAINS.map((d) => {
      const c = { onbekend: 0, onder: 0, '1F': 0, '1F+': 0, '2F': 0 };
      for (const r of rows) c[r.domains[d.id].niveau.id] += 1;
      return [d.id, c];
    }));
    // Instructiegroepjes per onderdeel: wie heeft extra instructie nodig, wie kan verrijking aan
    const groups = SKILLS.map((sk) => {
      const instr = []; const verrijk = [];
      for (const h of heat) {
        const v = h.skills[sk.id];
        if (!v || v.n < 5) continue;
        if (v.theta < 2.4) instr.push({ id: h.id, name: h.name, theta: v.theta });
        else if (v.theta >= 3.8) verrijk.push({ id: h.id, name: h.name, theta: v.theta });
      }
      return { skill: sk.id, focus: (wk.focus || []).includes(sk.id), instructie: instr.sort((a, b) => a.theta - b.theta), verrijking: verrijk };
    });
    const skillAvg = Object.fromEntries(SKILLS.map((sk) => {
      const v = heat.map((h) => h.skills[sk.id]).filter(Boolean);
      return [sk.id, v.length ? Math.round((v.reduce((x, y) => x + y.theta, 0) / v.length) * 100) / 100 : null];
    }));
    return {
      class: publicClass(cls),
      week: wk,
      students: rows,
      heat,
      skillAvg,
      groups,
      distribution,
      daily: days.map((d) => ({ day: d, answers: perDay[d].n, active: perDay[d].students.size })),
      summary: {
        count: rows.length,
        activeWeek: rows.filter((r) => r.week.done > 0).length,
        weekDone: rows.filter((r) => r.week.goal > 0 && r.week.done >= r.week.goal).length,
        answersWeek: rows.reduce((x, r) => x + r.week.done, 0),
        pctWeek: (() => { const d = rows.reduce((x, r) => x + r.week.done, 0); return d ? Math.round((rows.reduce((x, r) => x + r.week.correct, 0) / d) * 100) : null; })(),
        alerts: rows.reduce((x, r) => x + r.alerts.filter((a) => a.level !== 'good').length, 0),
      },
    };
  }

  function studentDetail(student, cls) {
    const abilities = loadAbilities(student.id);
    const answers = loadAnswers(student.id, 0);
    const tests = loadTests(student.id);
    const summary = studentSummary({ student, cls, abilities, answers, tests, now: now() });
    const { weeks, plan } = classPlan(cls, now());
    const perWeek = {};
    for (const a of answers) { const w = weekKey(a.created_at); perWeek[w] = perWeek[w] || { n: 0, c: 0 }; perWeek[w].n += 1; perWeek[w].c += a.correct; }
    const skills = SKILLS.map((sk) => {
      const a = abilities[sk.id];
      const rows = answers.filter((x) => x.skill === sk.id);
      const old = rows.filter((x) => x.created_at < now() - 14 * DAY).pop();
      return {
        id: sk.id, theta: a ? Math.round(a.theta * 100) / 100 : null, n: a?.n || 0, pct: a?.n ? Math.round((a.correct / a.n) * 100) : null,
        niveau: niveauFor(a && a.n >= 5 ? a.theta : null, sk.domain), last: rows.length ? rows[rows.length - 1].created_at : null,
        trend: a && old ? Math.round((a.theta - old.theta_after) * 100) / 100 : null,
      };
    });
    const school = answers.filter((a) => a.location === 'school').length;
    const home = answers.filter((a) => a.location === 'thuis').length;
    const inSchoolTime = answers.filter((a) => duringSchool(a.created_at)).length;
    return {
      student: { id: student.id, name: student.name, settings: student.settings, note: student.note, xp: student.xp, createdAt: student.created_at, lastLogin: student.last_login },
      class: publicClass(cls),
      summary,
      skills,
      series: weeklyDomainSeries(answers, weeks, student.settings, now()),
      weeks: weeks.map((w) => ({ week: w, goal: Math.round((plan[w].goal || 0) * (student.settings.goalFactor || 1)), holiday: !!plan[w].holiday, done: perWeek[w]?.n || 0, correct: perWeek[w]?.c || 0 })),
      tests: tests.map((t) => ({ id: t.id, week: t.week, startedAt: t.started_at, finishedAt: t.finished_at, pos: t.pos, total: t.plan.length, result: t.result })),
      where: { school, home, unknown: answers.length - school - home, inSchoolTime, outSchoolTime: answers.length - inSchoolTime },
      recent: answers.slice(-150).reverse().map((a) => ({
        id: a.id, at: a.created_at, skill: a.skill, prompt: a.prompt, given: a.given, answer: a.answer, correct: !!a.correct,
        difficulty: Math.round(a.difficulty * 10) / 10, mode: a.mode, sec: Math.round(a.ms / 1000),
      })),
    };
  }

  const csvEsc = (v) => {
    const s = v == null ? '' : String(v);
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const nlNum = (v) => (v == null ? '' : String(v).replace('.', ','));
  function csvExport(cls) {
    const o = classOverview(cls);
    const header = ['Naam', 'Rekenen niveau', 'Rekenen score', 'Taalverzorging niveau', 'Taalverzorging score', 'Lezen niveau', 'Lezen score',
      'Opgaven deze week', 'Weekdoel', '% goed deze week', 'Opgaven totaal', '% goed totaal', 'Laatst actief', 'Signalen', ...SKILLS.map((s) => s.name)];
    const lines = [header.join(';')];
    for (const r of o.students) {
      const h = o.heat.find((x) => x.id === r.id);
      lines.push([r.name, ...DOMAINS.flatMap((d) => [r.domains[d.id].niveau.name, nlNum(r.domains[d.id].theta)]), r.week.done, r.week.goal, r.week.pct ?? '', r.total, r.pctAll ?? '',
        r.lastActive ? new Date(r.lastActive).toISOString().slice(0, 16).replace('T', ' ') : '', r.alerts.map((a) => a.text).join(' | '),
        ...SKILLS.map((s) => nlNum(h.skills[s.id]?.theta))].map(csvEsc).join(';'));
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
    const created = []; const skipped = [];
    tx(db, () => {
      for (const name of clean) {
        if (existing.has(name.toLowerCase())) { skipped.push(name); continue; }
        const password = kidPassword();
        const info = q('INSERT INTO students (class_id, name, pass_hash, created_at) VALUES (?, ?, ?, ?)').run(cls.id, name, hashPassword(password), now());
        created.push({ id: Number(info.lastInsertRowid), name, password });
        existing.add(name.toLowerCase());
      }
    });
    return { created, skipped };
  }

  function cleanClassSettings(input, current) {
    const s = { ...current };
    for (const k of ['showNames', 'testAlways', 'leaderboard']) if (input[k] != null) s[k] = !!input[k];
    if (input.start != null) { if (!isDay(input.start)) throw bad('Startdatum is ongeldig'); s.start = mondayOf(input.start); }
    if (input.toets != null) { if (!isDay(input.toets)) throw bad('Toetsdatum is ongeldig'); s.toets = input.toets; }
    if (s.start && s.toets && s.toets < s.start) throw bad('De toetsdatum ligt voor de startdatum.');
    if (s.start && s.toets && weeksBetween(s.start, s.toets).length > 45) throw bad('De planning mag hoogstens 45 weken duren.');
    if (input.holidays != null) {
      if (!Array.isArray(input.holidays)) throw bad('Vakanties zijn ongeldig');
      s.holidays = [...new Set(input.holidays.filter(isDay).map(mondayOf))].slice(0, 30);
    }
    if (input.schoolIps != null) {
      const list = Array.isArray(input.schoolIps) ? input.schoolIps : String(input.schoolIps).split(/[\s,]+/);
      s.schoolIps = list.map((x) => String(x).trim()).filter((x) => /^[0-9a-fA-F.:*]{2,45}$/.test(x)).slice(0, 20);
    }
    return s;
  }

  function cleanWeekPlan(input) {
    if (!input || typeof input !== 'object') throw bad('Planning is ongeldig');
    const out = {};
    for (const [w, v] of Object.entries(input).slice(0, 60)) {
      if (!isDay(w) || !v || typeof v !== 'object') continue;
      out[mondayOf(w)] = {
        focus: Array.isArray(v.focus) ? [...new Set(v.focus.filter((x) => SKILL_BY_ID[x]))].slice(0, 8) : [],
        goal: int(v.goal ?? 0, { min: 0, max: 500, name: 'weekdoel' }),
        test: !!v.test,
        holiday: !!v.holiday,
        note: typeof v.note === 'string' ? v.note.trim().slice(0, 300) : '',
      };
    }
    return out;
  }

  function cleanStudentSettings(input, current, { teacher }) {
    const s = { ...current, start: { ...current.start } };
    for (const k of ['dyslexia', 'largeText', 'readAloud']) if (input[k] != null) s[k] = !!input[k];
    if (teacher) {
      if (input.calm != null) s.calm = !!input.calm;
      if (input.goalFactor != null) {
        const f = Number(input.goalFactor);
        if (!(f >= 0.25 && f <= 2)) throw bad('Weekdoel-factor is ongeldig');
        s.goalFactor = Math.round(f * 100) / 100;
      }
      if (input.start && typeof input.start === 'object') {
        for (const d of DOMAINS) if (input.start[d.id] != null) {
          if (!START_LEVELS.some((l) => l.id === input.start[d.id])) throw bad('Startniveau is ongeldig');
          s.start[d.id] = input.start[d.id];
        }
      }
      if (input.extraFocus != null) {
        if (!Array.isArray(input.extraFocus)) throw bad('Eigen leerdoelen zijn ongeldig');
        s.extraFocus = [...new Set(input.extraFocus.filter((x) => SKILL_BY_ID[x]))].slice(0, 6);
      }
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
  route('GET', '/api/meta', () => ({
    domains: DOMAINS, skills: SKILLS, startLevels: START_LEVELS, signupCode: !!signupCode,
    content: { ...LEZEN_SIZES, ...BANK_SIZES },
  }));
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

  route('POST', '/api/auth/teacher/register', ({ res, body }) => {
    const firstTeacher = !q('SELECT id FROM teachers LIMIT 1').get();
    if (!firstTeacher && !getSetting('allowSignup', true)) throw new HttpError(403, 'Zelf een account maken staat uit. Vraag de beheerder van de school om een account.');
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
    if (!t || !verifyPassword(String(body.password || ''), t.pass_hash)) { limiter.fail(key); throw new HttpError(401, 'E-mailadres of wachtwoord klopt niet.'); }
    limiter.clear(key);
    q('UPDATE teachers SET last_login = ? WHERE id = ?').run(now(), t.id);
    startSession(res, 'teacher', t.id);
    return { ok: true };
  });
  route('POST', '/api/auth/student/class', ({ req, body }) => {
    const code = String(body.code || '').trim().toUpperCase();
    const key = `c:${clientIp(req)}`;
    if (limiter.blocked(key)) throw new HttpError(429, 'Te veel pogingen. Vraag je juf of meester om hulp.');
    const row = q('SELECT id FROM classes WHERE code = ?').get(code);
    if (!row) { limiter.fail(key); throw new HttpError(404, 'Deze klascode bestaat niet. Kijk goed op je inlogkaart.'); }
    const c = loadClass(row.id);
    const students = c.settings.showNames ? q('SELECT id, name FROM students WHERE class_id = ? ORDER BY name').all(c.id).map((s) => ({ id: s.id, name: s.name })) : null;
    return { class: { name: c.name, groep: c.groep, code: c.code }, students };
  });
  route('POST', '/api/auth/student/login', ({ req, res, body }) => {
    const code = String(body.code || '').trim().toUpperCase();
    const cls = q('SELECT id FROM classes WHERE code = ?').get(code);
    if (!cls) throw new HttpError(404, 'Deze klascode bestaat niet.');
    const st = body.studentId != null
      ? q('SELECT * FROM students WHERE id = ? AND class_id = ?').get(Number(body.studentId), cls.id)
      : q('SELECT * FROM students WHERE name = ? AND class_id = ?').get(String(body.name || '').trim(), cls.id);
    const key = `s:${clientIp(req)}:${cls.id}:${st?.id ?? body.name}`;
    if (limiter.blocked(key)) throw new HttpError(429, 'Te veel pogingen. Vraag je juf of meester om hulp.');
    if (!st || !verifyPassword(String(body.password || '').trim().toLowerCase(), st.pass_hash)) { limiter.fail(key); throw new HttpError(401, 'Dat wachtwoord klopt niet. Probeer het nog eens!'); }
    limiter.clear(key);
    q('UPDATE students SET last_login = ? WHERE id = ?').run(now(), st.id);
    startSession(res, 'student', st.id);
    return { ok: true, state: studentState(st.id) };
  });

  // Leerling
  route('GET', '/api/student/state', ({ req }) => studentState(requireRole(req, 'student').user_id));
  route('POST', '/api/student/next', ({ req, body }) => nextItem(requireRole(req, 'student').user_id, String(body.mode || 'week')));
  route('POST', '/api/student/answer', ({ req, body }) => answerItem(req, requireRole(req, 'student').user_id, body));
  route('POST', '/api/student/test/start', ({ req }) => startTest(requireRole(req, 'student').user_id));
  route('GET', '/api/student/results', ({ req }) => studentResults(requireRole(req, 'student').user_id));
  route('POST', '/api/student/settings', ({ req, body }) => {
    const sid = requireRole(req, 'student').user_id;
    const s = loadStudent(sid);
    q('UPDATE students SET settings = ? WHERE id = ?').run(JSON.stringify(cleanStudentSettings(body, s.settings, { teacher: false })), sid);
    return studentState(sid);
  });
  route('GET', '/api/student/leaderboard', ({ req }) => {
    const sid = requireRole(req, 'student').user_id;
    const cls = loadClass(loadStudent(sid).class_id);
    if (!cls.settings.leaderboard) return { enabled: false, rows: [] };
    const wk = currentWeek(cls, now()).week;
    const rows = q('SELECT id, name FROM students WHERE class_id = ?').all(cls.id).map((st) => {
      const n = loadAnswers(st.id, now() - 8 * DAY).filter((a) => weekKey(a.created_at) === wk).length;
      return { name: st.name, n, me: st.id === sid };
    }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return { enabled: true, rows };
  });

  // Leerkracht
  route('GET', '/api/teacher/classes', ({ req }) => {
    const tid = requireRole(req, 'teacher').user_id;
    return {
      classes: q('SELECT id FROM classes WHERE teacher_id = ? ORDER BY created_at').all(tid).map((c) => loadClass(c.id)).map((c) => {
        const o = classOverview(c);
        return { ...o.class, summary: o.summary, week: o.week, distribution: o.distribution };
      }),
    };
  });
  route('POST', '/api/teacher/classes', ({ req, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const name = str(body.name, { min: 1, max: 60, name: 'Klasnaam' });
    const groep = int(body.groep ?? 8, { min: 7, max: 8, name: 'Groep' });
    let code;
    for (let i = 0; i < 30; i++) { code = classCode(); if (!q('SELECT id FROM classes WHERE code = ?').get(code)) break; }
    const settings = cleanClassSettings(body.settings || {}, { ...DEFAULT_CLASS_SETTINGS, start: mondayOf(dayKey(now())) });
    const info = q('INSERT INTO classes (teacher_id, name, groep, code, settings, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(tid, name, groep, code, JSON.stringify(settings), now());
    return publicClass(loadClass(Number(info.lastInsertRowid)));
  });
  route('GET', '/api/teacher/classes/:id', ({ req, params }) => classOverview(teacherClass(requireRole(req, 'teacher').user_id, Number(params.id))));
  route('PATCH', '/api/teacher/classes/:id', ({ req, params, body }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    const name = body.name != null ? str(body.name, { min: 1, max: 60, name: 'Klasnaam' }) : cls.name;
    const groep = body.groep != null ? int(body.groep, { min: 7, max: 8, name: 'Groep' }) : cls.groep;
    const settings = cleanClassSettings(body.settings || {}, cls.settings);
    q('UPDATE classes SET name = ?, groep = ?, settings = ? WHERE id = ?').run(name, groep, JSON.stringify(settings), cls.id);
    return publicClass(loadClass(cls.id));
  });
  route('DELETE', '/api/teacher/classes/:id', ({ req, params }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    q('DELETE FROM classes WHERE id = ?').run(cls.id);
    return { ok: true };
  });
  route('GET', '/api/teacher/classes/:id/plan', ({ req, params }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    const p = classPlan(cls, now());
    return { ...p, holidays: cls.settings.holidays, current: weekKey(now()), custom: Object.keys(cls.settings.plan || {}) };
  });
  route('PUT', '/api/teacher/classes/:id/plan', ({ req, params, body }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    const settings = cleanClassSettings({ start: body.start, toets: body.toets, holidays: body.holidays }, cls.settings);
    settings.plan = body.reset ? null : { ...(cls.settings.plan || {}), ...cleanWeekPlan(body.weeks || {}) };
    q('UPDATE classes SET settings = ? WHERE id = ?').run(JSON.stringify(settings), cls.id);
    const c = loadClass(cls.id);
    return { ...classPlan(c, now()), holidays: c.settings.holidays, current: weekKey(now()), custom: Object.keys(c.settings.plan || {}) };
  });
  route('POST', '/api/teacher/classes/:id/students', ({ req, params, body }) => createStudents(teacherClass(requireRole(req, 'teacher').user_id, Number(params.id)), body.names));
  route('POST', '/api/teacher/classes/:id/reset-passwords', ({ req, params }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
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
  route('GET', '/api/teacher/classes/:id/export.csv', ({ req, params }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    return { __raw: csvExport(cls), type: 'text/csv; charset=utf-8', filename: `basislab-doorstroom-${cls.name.replace(/[^a-z0-9-]+/gi, '_')}-${dayKey(now())}.csv` };
  });
  route('GET', '/api/teacher/classes/:id/tests', ({ req, params }) => {
    const cls = teacherClass(requireRole(req, 'teacher').user_id, Number(params.id));
    return {
      students: q('SELECT id, name FROM students WHERE class_id = ? ORDER BY name').all(cls.id).map((s) => ({
        id: s.id, name: s.name, tests: loadTests(s.id).map((t) => ({ id: t.id, week: t.week, finishedAt: t.finished_at, pos: t.pos, total: t.plan.length, result: t.result })),
      })),
    };
  });
  route('GET', '/api/teacher/students/:id', ({ req, params }) => {
    const { student, cls } = teacherStudent(requireRole(req, 'teacher').user_id, Number(params.id));
    return studentDetail(student, cls);
  });
  route('PATCH', '/api/teacher/students/:id', ({ req, params, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const { student, cls } = teacherStudent(tid, Number(params.id));
    const name = body.name != null ? str(body.name, { min: 1, max: 40, name: 'Naam' }) : student.name;
    if (name.toLowerCase() !== student.name.toLowerCase() && q('SELECT id FROM students WHERE class_id = ? AND name = ?').get(cls.id, name)) throw new HttpError(409, 'Er zit al een leerling met deze naam in de klas.');
    const note = body.note != null ? String(body.note).slice(0, 4000) : student.note;
    const settings = cleanStudentSettings(body.settings || {}, student.settings, { teacher: true });
    let classId = student.class_id;
    if (body.classId != null && Number(body.classId) !== student.class_id) {
      const target = teacherClass(tid, Number(body.classId));
      if (q('SELECT id FROM students WHERE class_id = ? AND name = ?').get(target.id, name)) throw new HttpError(409, 'In die klas zit al een leerling met deze naam.');
      classId = target.id;
    }
    q('UPDATE students SET name = ?, note = ?, settings = ?, class_id = ? WHERE id = ?').run(name, note, JSON.stringify(settings), classId, student.id);
    // Nieuw startniveau: onderdelen zonder gegevens beginnen daar
    const s2 = loadStudent(student.id);
    return studentDetail(s2, loadClass(s2.class_id));
  });
  route('POST', '/api/teacher/students/:id/reset-password', ({ req, params }) => {
    const { student } = teacherStudent(requireRole(req, 'teacher').user_id, Number(params.id));
    const password = kidPassword();
    q('UPDATE students SET pass_hash = ? WHERE id = ?').run(hashPassword(password), student.id);
    q("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(student.id);
    return { id: student.id, name: student.name, password };
  });
  route('POST', '/api/teacher/students/:id/reset-level', ({ req, params, body }) => {
    const { student } = teacherStudent(requireRole(req, 'teacher').user_id, Number(params.id));
    const domain = String(body.domain || '');
    if (!DOMAINS.some((d) => d.id === domain)) throw bad('Onbekend vakgebied');
    const th = startTheta(student.settings, domain);
    const ids = SKILLS.filter((s) => s.domain === domain).map((s) => s.id);
    tx(db, () => { for (const id of ids) q('UPDATE abilities SET theta = ?, n = MIN(n, 3) WHERE student_id = ? AND skill = ?').run(th, student.id, id); });
    return studentDetail(loadStudent(student.id), loadClass(student.class_id));
  });
  route('DELETE', '/api/teacher/tests/:id', ({ req, params }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const t = q('SELECT * FROM tests WHERE id = ?').get(Number(params.id));
    if (!t) throw new HttpError(404, 'Proeftoets niet gevonden.');
    teacherStudent(tid, t.student_id);
    tx(db, () => {
      q('UPDATE answers SET test_id = NULL WHERE test_id = ?').run(t.id);
      q('DELETE FROM pending WHERE test_id = ?').run(t.id);
      q('DELETE FROM tests WHERE id = ?').run(t.id);
    });
    return { ok: true };
  });
  route('DELETE', '/api/teacher/students/:id', ({ req, params }) => {
    const { student } = teacherStudent(requireRole(req, 'teacher').user_id, Number(params.id));
    q('DELETE FROM students WHERE id = ?').run(student.id);
    q("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(student.id);
    return { ok: true };
  });
  route('PATCH', '/api/teacher/me', ({ req, body }) => {
    const tid = requireRole(req, 'teacher').user_id;
    const t = q('SELECT * FROM teachers WHERE id = ?').get(tid);
    const name = body.name != null ? str(body.name, { min: 2, max: 80, name: 'Naam' }) : t.name;
    const school = body.school != null ? String(body.school).trim().slice(0, 120) : t.school;
    if (body.newPassword) {
      if (!verifyPassword(String(body.password || ''), t.pass_hash)) throw new HttpError(401, 'Je huidige wachtwoord klopt niet.');
      q('UPDATE teachers SET pass_hash = ?, must_change = 0 WHERE id = ?').run(hashPassword(str(body.newPassword, { min: 8, max: 200, name: 'Nieuw wachtwoord' })), tid);
    }
    q('UPDATE teachers SET name = ?, school = ? WHERE id = ?').run(name, school, tid);
    return { ok: true };
  });

  // Beheerder
  route('GET', '/api/admin/overview', ({ req }) => {
    requireAdmin(req);
    const teachers = q('SELECT id, name, email, is_admin, must_change, created_at, last_login FROM teachers ORDER BY name').all();
    const teacherName = Object.fromEntries(teachers.map((t) => [t.id, t.name]));
    const rows = q('SELECT id FROM classes ORDER BY name').all().map((c) => loadClass(c.id)).map((c) => {
      const o = classOverview(c);
      const avg = (d) => { const v = o.students.map((s) => s.domains[d].theta).filter((x) => x != null); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null; };
      return { id: c.id, name: c.name, groep: c.groep, code: c.code, teacherId: c.teacher_id, teacher: teacherName[c.teacher_id] || '', ...o.summary, rk: avg('rk'), tv: avg('tv'), lz: avg('lz'), distribution: o.distribution };
    });
    const days = lastNDays(30, now());
    const perDay = Object.fromEntries(days.map((d) => [d, { n: 0, s: new Set() }]));
    for (const a of q('SELECT student_id, created_at FROM answers WHERE created_at >= ?').all(now() - 31 * DAY)) {
      const k = dayKey(a.created_at); if (perDay[k]) { perDay[k].n += 1; perDay[k].s.add(a.student_id); }
    }
    const sum = (k) => rows.reduce((x, r) => x + (r[k] || 0), 0);
    return {
      school: schoolInfo(),
      totals: { teachers: teachers.length, classes: rows.length, students: sum('count'), activeWeek: sum('activeWeek'), weekDone: sum('weekDone'), answersWeek: sum('answersWeek') },
      daily: days.map((d) => ({ day: d, answers: perDay[d].n, active: perDay[d].s.size })),
      classes: rows,
      teachers: teachers.map((t) => ({ id: t.id, name: t.name, email: t.email, isAdmin: !!t.is_admin, mustChange: !!t.must_change, createdAt: t.created_at, lastLogin: t.last_login, classes: rows.filter((r) => r.teacherId === t.id).length })),
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
    const magic = {
      'image/png': buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
      'image/jpeg': buf[0] === 0xff && buf[1] === 0xd8,
      'image/webp': buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP',
    };
    if (!magic[m[1]]) throw bad('Dit bestand is geen geldige afbeelding.');
    setSetting('logo', { mime: m[1], data: buf.toString('base64'), version: now() });
    return schoolInfo();
  }, { maxBody: 1024 * 1024 });
  route('DELETE', '/api/admin/logo', ({ req }) => { requireAdmin(req); q("DELETE FROM settings WHERE key = 'logo'").run(); return schoolInfo(); });
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

  // ---------- request-afhandeling ----------
  async function readBody(req, maxBody) {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBody) throw new HttpError(413, 'Verzoek te groot');
      chunks.push(chunk);
    }
    if (!chunks.length) return {};
    try {
      const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      return v && typeof v === 'object' ? v : {};
    } catch { throw bad('Ongeldige gegevens'); }
  }
  function sendJson(res, status, data) {
    res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  }
  function serveStatic(req, res, urlPath) {
    let rel;
    try { rel = decodeURIComponent(urlPath); } catch { res.writeHead(400); res.end(); return; }
    if (rel === '/' || !path.extname(rel)) rel = '/index.html';
    const file = path.resolve(PUBLIC_DIR, '.' + rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Niet gevonden'); return; }
      const ext = path.extname(file);
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.woff2' ? 'public, max-age=604800' : 'no-cache', 'Content-Length': st.size });
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
      if (req.method !== 'GET' && req.headers['x-requested-with'] !== XHR) throw new HttpError(403, 'Verzoek geweigerd');
      const m = r.re.exec(url.pathname);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      const body = req.method === 'GET' ? {} : await readBody(req, r.maxBody);
      const result = await r.handler({ req, res, params, body, query: url.searchParams });
      if (result && result.__raw != null) {
        res.writeHead(200, {
          ...SECURITY_HEADERS, 'Content-Type': result.type, 'Cache-Control': result.inline ? 'public, max-age=300' : 'no-store',
          'Content-Disposition': result.inline ? 'inline' : `attachment; filename="${result.filename}"`,
        });
        res.end(result.__raw);
        return;
      }
      sendJson(res, 200, result ?? { ok: true });
    } catch (err) {
      if (err instanceof HttpError) sendJson(res, err.status, { error: err.message });
      else { console.error(err); sendJson(res, 500, { error: 'Er ging iets mis op de server.' }); }
    }
  };
}
