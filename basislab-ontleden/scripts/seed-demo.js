// Vult de database met een demoschool: leerkrachten, vier klassen en enkele weken oefengeschiedenis.
// Gebruik: npm run demo            (voegt de demo toe als die nog niet bestaat)
//          npm run demo -- --reset (verwijdert eerst de bestaande demo)
import http from 'node:http';
import fs from 'node:fs';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth.js';
import {
  generateItems, lessonSteps, checkAnswer, cutGaps, selectTargets, expectedLabels, makeRng, gameLabels, gameSentences,
} from '../public/js/shared/curriculum.js';

const DB_FILE = process.env.DB_FILE || './data/basislab-ontleden.db';
const EMAIL = 'demo@basislab.nl';
const PASSWORD = 'basislab-ontleden';
const reset = process.argv.includes('--reset');
const DAY = 24 * 60 * 60 * 1000;

const db = openDb(DB_FILE);
const existing = db.prepare('SELECT id FROM teachers WHERE email = ?').get(EMAIL);
if (existing && !reset) {
  console.log('De demo bestaat al. Gebruik --reset om hem opnieuw aan te maken.');
  process.exit(0);
}
if (existing) {
  db.prepare("DELETE FROM teachers WHERE email IN (?, 'ahmed@basislab.nl', 'lotte@basislab.nl', 'mirjam@basislab.nl')").run(EMAIL);
}

let clock = Date.now();
const realNow = Date.now();
const server = http.createServer(createApp({ db, now: () => clock }));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'basislab-ontleden', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const data = await res.json();
    if (!res.ok) throw new Error(`${method} ${path}: ${data.error}`);
    return data;
  };
}

const rng = makeRng(20261121);
const rand = (a, b) => a + rng() * (b - a);

const teacher = client();
clock = realNow - 45 * DAY;
await teacher('POST', '/api/auth/teacher/register', { name: 'Juf Sanne de Vries', email: EMAIL, password: PASSWORD, school: 'Basisschool De Sterrenwacht' });
{
  const logo = fs.readFileSync(new URL('./demo-logo.png', import.meta.url)).toString('base64');
  await teacher('POST', '/api/admin/logo', { dataUrl: `data:image/png;base64,${logo}` });
}

const CLASSES = [
  { name: 'Groep 7b', groep: 7, unlock: 5, cap: 16, names: ['Emma', 'Noah', 'Daan', 'Sara', 'Liam', 'Julia', 'Sem', 'Tess', 'Finn', 'Zoë', 'Lucas', 'Mila', 'Levi', 'Nora', 'Milan', 'Yara', 'Jesse', 'Fleur', 'Bram', 'Lotte', 'Ravi', 'Anouk', 'Mohammed', 'Isa'] },
  { name: 'Groep 5a', groep: 5, unlock: 0, cap: 7, teacher: { name: 'Juf Mirjam Kok', email: 'mirjam@basislab.nl' }, names: ['Ilse', 'Jens', 'Sofia', 'Owen', 'Mees', 'Lena', 'Ali', 'Puck', 'Teun', 'Nina'] },
  { name: 'Groep 6a', groep: 6, unlock: 0, cap: 10, teacher: { name: 'Meester Ahmed Yilmaz', email: 'ahmed@basislab.nl' }, names: ['Sophie', 'Thijs', 'Eva', 'Ruben', 'Lina', 'Max', 'Sanne', 'Gijs', 'Amira', 'Joep', 'Hanna', 'Stijn'] },
  { name: 'Groep 8', groep: 8, unlock: 9, cap: 20, teacher: { name: 'Juf Lotte Bakker', email: 'lotte@basislab.nl' }, names: ['Lars', 'Femke', 'Jayden', 'Romy', 'Thomas', 'Lieke', 'Tim', 'Maud', 'Koen', 'Iris'] },
];

// Bijzondere profielen voor een realistisch klassenbeeld
const SPECIAL = {
  Emma: { skill: 0.9, perWeek: 3 },
  Daan: { skill: 0.96, perWeek: 4, sec: 9 },
  Noah: { skill: 0.62, perWeek: 4, confuse: ['lv', 'ow'] },
  Sem: { skill: 0.8, perWeek: 3, untilDaysAgo: 12 },
  Mila: { skill: 0.78, perWeek: 2, untilDaysAgo: 9 },
  Bram: { skill: 0.86, perWeek: 3, dropping: true },
  Julia: { skill: 0.55, perWeek: 4, stuck: true },
  Isa: { never: true },
  Lars: { skill: 0.97, perWeek: 5, sec: 10 },
  Femke: { skill: 0.88, perWeek: 4, confuse: ['mv', 'lv'] },
};

function makeProfile(name) {
  const sp = SPECIAL[name] || {};
  const pairs = [['lv', 'ow'], ['mv', 'lv'], ['bwb', 'lv'], ['ow', 'lv'], ['wg', 'pv']];
  return {
    skill: sp.skill ?? rand(0.7, 0.93),
    perWeek: sp.perWeek ?? rand(1.2, 2.6),
    sec: sp.sec ?? rand(12, 24),
    startDaysAgo: Math.round(rand(30, 42)),
    untilDaysAgo: sp.untilDaysAgo ?? (rng() < 0.85 ? 0 : Math.round(rand(2, 6))),
    confuse: sp.confuse ?? pairs[Math.floor(rng() * pairs.length)],
    never: !!sp.never,
    dropping: !!sp.dropping,
    stuck: !!sp.stuck,
  };
}

/** Een geloofwaardig fout antwoord, met de typische verwarring van deze leerling. */
function wrongAnswer(item, prof) {
  const [real, given] = prof.confuse;
  if (item.mode === 'split') {
    const must = cutGaps(item.s).map((g, i) => (g === 'must' ? i : null)).filter((x) => x != null);
    return must.slice(1);
  }
  if (item.mode === 'select') {
    const t = new Set(selectTargets(item));
    const other = item.s.chunks.find((c) => !t.has(c.i) && (c.label === real || c.label === given)) || item.s.chunks.find((c) => !t.has(c.i));
    return other ? [other.i] : [];
  }
  if (item.mode === 'label') {
    const exp = [...expectedLabels(item)];
    const i = exp.findIndex((l) => l === real);
    if (i >= 0 && item.choices.includes(given)) exp[i] = given;
    else {
      const j = exp.findIndex((l) => l !== 'rest');
      const alt = item.choices.find((c) => c !== exp[j] && c !== 'rest') || 'rest';
      exp[j] = alt;
    }
    return exp;
  }
  const wrong = item.options.filter((o) => o.value !== item.answer);
  return (wrong.find((o) => o.value === given) || wrong[0]).value;
}

function rightAnswer(item) {
  if (item.mode === 'split') return cutGaps(item.s).map((g, i) => (g === 'must' ? i : null)).filter((x) => x != null);
  if (item.mode === 'select') return selectTargets(item);
  if (item.mode === 'label') return expectedLabels(item);
  return item.answer;
}

function simulate(items, prof, p) {
  const stats = {};
  const confusions = {};
  let correct = 0;
  for (const it of items) {
    const level = it.s.level;
    const ok = rng() < Math.max(0.15, Math.min(0.995, p - (level - 2) * 0.05));
    const r = checkAnswer(it, ok ? rightAnswer(it) : wrongAnswer(it, prof));
    if (r.correct) correct += 1;
    for (const [k, v] of Object.entries(r.stats)) { const e = stats[k] || (stats[k] = [0, 0]); e[0] += v[0]; e[1] += v[1]; }
    for (const [k, n] of Object.entries(r.confusions)) confusions[k] = (confusions[k] || 0) + n;
  }
  return { correct, stats, confusions };
}

let total = 0;
for (const spec of CLASSES) {
  clock = realNow - 44 * DAY;
  await teacher('POST', '/api/auth/teacher/login', { email: EMAIL, password: PASSWORD });
  let owner = teacher;
  if (spec.teacher) {
    // De beheerder voegt de leerkracht toe; voor de demo krijgt die hetzelfde wachtwoord.
    const t = await teacher('POST', '/api/admin/teachers', spec.teacher);
    db.prepare('UPDATE teachers SET pass_hash = ?, must_change = 0 WHERE id = ?').run(hashPassword(PASSWORD), t.id);
    owner = client();
    await owner('POST', '/api/auth/teacher/login', { email: spec.teacher.email, password: PASSWORD });
  }
  const cls = await owner('POST', '/api/teacher/classes', { name: spec.name, groep: spec.groep, settings: { weeklyGoalMinutes: 45 } });
  const { created } = await owner('POST', `/api/teacher/classes/${cls.id}/students`, { names: spec.names });
  if (spec.unlock) for (const s of created) await owner('PATCH', `/api/teacher/students/${s.id}`, { settings: { unlockUpTo: spec.unlock } });
  for (const s of created) {
    const prof = makeProfile(s.name);
    if (prof.never) continue;
    const kid = client();
    let state = (await kid('POST', '/api/auth/student/login', { code: cls.code, studentId: s.id, password: s.password })).state;
    let skill = prof.skill;
    for (let d = prof.startDaysAgo; d >= prof.untilDaysAgo; d--) {
      const dayStart = new Date(realNow - d * DAY);
      dayStart.setHours(0, 0, 0, 0);
      const wd = dayStart.getDay();
      const weekend = wd === 0 || wd === 6;
      const pDay = (prof.perWeek / 7) * (weekend ? 0.5 : 1.15);
      if (rng() > pDay) continue;
      const atSchool = !weekend && rng() < 0.6;
      const hour = atSchool ? rand(9, 14.5) : rand(16, 19.5);
      clock = dayStart.getTime() + hour * 60 * 60 * 1000;
      if (clock > realNow - 30 * 60 * 1000) clock = realNow - rand(40, 120) * 60 * 1000;
      state = (await kid('POST', '/api/auth/student/login', { code: cls.code, studentId: s.id, password: s.password })).state;
      const sessionMinutes = rand(8, 20);
      let used = 0;
      while (used < sessionMinutes) {
        // ga verder bij de eerste les die nog niet gehaald is
        let lessonId = Math.min(state.unlocked, spec.cap);
        for (let l = 1; l <= lessonId; l++) if (!((state.progress[l]?.stars || 0) >= 1)) { lessonId = l; break; }
        const p = Math.max(0.2, skill - (prof.dropping && d < 8 ? 0.2 : 0) - (prof.stuck && lessonId >= 4 ? 0.25 : 0) + rand(-0.05, 0.05));
        const playGame = state.gamesUnlocked && rng() < 0.25;
        if (playGame) {
          const game = rng() < 0.5 ? 'notenregen' : 'battle';
          const labels = gameLabels(state.unlocked).filter((l) => l !== 'rest');
          const pool = gameSentences(state.unlocked);
          const n = game === 'battle' ? Math.round(rand(11, 16)) : Math.round(rand(8, 30));
          let correct = 0;
          const stats = {};
          const confusions = {};
          for (let i = 0; i < n; i++) {
            const sent = pool[Math.floor(rng() * pool.length)];
            const c = sent.chunks.find((x) => labels.includes(x.label)) || sent.chunks[0];
            const ok = rng() < p;
            const e = stats[c.label] || (stats[c.label] = [0, 0]);
            e[ok ? 0 : 1] += 1;
            if (ok) correct += 1;
            else if (c.label === prof.confuse[0] && labels.includes(prof.confuse[1])) confusions[`${c.label}>${prof.confuse[1]}`] = (confusions[`${c.label}>${prof.confuse[1]}`] || 0) + 1;
          }
          const durationMs = Math.round(n * rand(4, 8) * 1000);
          const r = await kid('POST', '/api/student/attempt', {
            kind: 'game', game, items: n, correct, durationMs, skillStats: stats, confusions,
            score: game === 'notenregen' ? correct * Math.round(rand(110, 180)) : correct * 100,
            extra: game === 'battle' ? { place: p > 0.9 ? 1 : p > 0.8 ? 2 : 3 } : { combo: Math.round(correct * rand(0.3, 0.8)), level: Math.ceil(n / 8) },
          });
          state = r.state;
          used += durationMs / 60000;
          total += 1;
        } else {
          const steps = lessonSteps(lessonId);
          const tests = state.progress[lessonId]?.tests || 0;
          const startStep = tests > 0 ? steps.length - 1 : 0;
          for (let i = startStep; i < steps.length; i++) {
            const items = generateItems(lessonId, i, { groep: spec.groep, seed: Math.floor(rng() * 1e9) });
            const sim = simulate(items, prof, steps[i].kind === 'intro' ? p + 0.08 : p + (tests * 0.04));
            const durationMs = Math.max(3000, Math.round(items.length * prof.sec * rand(0.8, 1.25) * (1.15 - skill * 0.2) * 1000));
            clock += durationMs + 15000;
            const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId, step: i, items: items.length, correct: sim.correct, durationMs, skillStats: sim.stats, confusions: sim.confusions });
            state = r.state;
            used += durationMs / 60000 + 0.25;
            total += 1;
          }
        }
        clock += 20000;
        skill = Math.min(0.99, skill + 0.004);
        if (!playGame && (state.progress[lessonId]?.stars || 0) >= 1 && rng() < 0.85) break; // één les per keer
      }
    }
    if (s.name === 'Emma') db.prepare('UPDATE students SET coins = coins + 150 WHERE id = ?').run(s.id);
    process.stdout.write('.');
  }
  // vaste wachtwoorden voor de demo, zodat de uitleg te volgen is
  if (spec.name === 'Groep 7b') {
    for (const s of created) db.prepare('UPDATE students SET pass_hash = ? WHERE id = ?').run(hashPassword('gitaar12'), s.id);
    db.prepare('UPDATE classes SET code = ? WHERE id = ?').run('DRUM-42K', cls.id);
  }
}
server.close();
console.log(`\nDemo klaar: ${total} oefeningen.`);
console.log(`Beheerder: ${EMAIL} / ${PASSWORD} (ook: ahmed@, lotte@ en mirjam@basislab.nl, zelfde wachtwoord)`);
console.log('Leerlingen Groep 7b: klascode DRUM-42K, wachtwoord gitaar12');
