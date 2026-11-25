// Vult de database met een demoschool: een leerkracht, drie klassen en enkele weken oefengeschiedenis.
// Gebruik: npm run demo            (voegt de demo toe als die nog niet bestaat)
//          npm run demo -- --reset (verwijdert eerst de bestaande demo)
import http from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { generateText, lessonSteps, CHAR_INFO, makeRng } from '../public/js/shared/curriculum.js';

const DB_FILE = process.env.DB_FILE || './data/basislab-typen.db';
const EMAIL = 'demo@basislab.nl';
const PASSWORD = 'basislab-typen';
const reset = process.argv.includes('--reset');
const DAY = 24 * 60 * 60 * 1000;

const db = openDb(DB_FILE);
const existing = db.prepare('SELECT id FROM teachers WHERE email = ?').get(EMAIL);
if (existing && !reset) {
  console.log('De demo bestaat al. Gebruik --reset om hem opnieuw aan te maken.');
  process.exit(0);
}
if (existing) db.prepare('DELETE FROM teachers WHERE id = ?').run(existing.id);

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
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'basislab-typen', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const data = await res.json();
    if (!res.ok) throw new Error(`${method} ${path}: ${data.error}`);
    return data;
  };
}

const rng = makeRng(20261117);
const rand = (a, b) => a + rng() * (b - a);

const teacher = client();
clock = realNow - 45 * DAY;
await teacher('POST', '/api/auth/teacher/register', { name: 'Juf Sanne de Vries', email: EMAIL, password: PASSWORD, school: 'Basisschool De Sterrenwacht' });
{
  const fs = await import('node:fs');
  const logo = fs.readFileSync(new URL('./demo-logo.png', import.meta.url)).toString('base64');
  await teacher('POST', '/api/admin/logo', { dataUrl: `data:image/png;base64,${logo}` });
}

const CLASSES = [
  { name: 'Groep 7b', groep: 7, names: ['Emma', 'Noah', 'Daan', 'Sara', 'Liam', 'Julia', 'Sem', 'Tess', 'Finn', 'Zoë', 'Lucas', 'Mila', 'Levi', 'Nora', 'Milan', 'Yara', 'Jesse', 'Fleur', 'Bram', 'Lotte', 'Ravi', 'Anouk', 'Mohammed', 'Isa'] },
  { name: 'Groep 6a', groep: 6, teacher: { name: 'Meester Ahmed Yilmaz', email: 'ahmed@basislab.nl' }, names: ['Sophie', 'Thijs', 'Eva', 'Ruben', 'Lina', 'Max', 'Sanne', 'Gijs', 'Amira', 'Joep', 'Hanna', 'Stijn'] },
  { name: 'Groep 8', groep: 8, teacher: { name: 'Juf Lotte Bakker', email: 'lotte@basislab.nl' }, names: ['Lars', 'Femke', 'Jayden', 'Romy', 'Thomas', 'Lieke', 'Tim', 'Maud', 'Koen', 'Iris'] },
];

// Bijzondere profielen voor een realistisch klassenbeeld
const SPECIAL = {
  Emma: { apm0: 34, growth: 0.9, acc: 95, perWeek: 4, startDaysAgo: 40, untilDaysAgo: 0, stopAtLesson: 6 },
  Daan: { apm0: 70, growth: 1.6, acc: 97, perWeek: 7, startDaysAgo: 42, untilDaysAgo: 0 },
  Noah: { apm0: 26, growth: 0.4, acc: 86.5, perWeek: 4, startDaysAgo: 38, untilDaysAgo: 1, weak: ['e', 'r'] },
  Sem: { apm0: 30, growth: 0.6, acc: 93, perWeek: 3, startDaysAgo: 40, untilDaysAgo: 12 },
  Mila: { apm0: 28, growth: 0.5, acc: 94, perWeek: 2, startDaysAgo: 30, untilDaysAgo: 9 },
  Bram: { apm0: 45, growth: 1.0, acc: 89, perWeek: 5, startDaysAgo: 40, untilDaysAgo: 0, dropping: true },
  Isa: { never: true },
};

const ALL_KEYS = Object.keys(CHAR_INFO);

function makeProfile(name) {
  const sp = SPECIAL[name] || {};
  const weakPool = ['p', 'q', 'z', 'x', 'b', 'y', 'w', 'o', 'c', 'v', 'g', 'h', 't'];
  return {
    apm0: sp.apm0 ?? rand(22, 48),
    growth: sp.growth ?? rand(0.5, 1.3),
    acc: sp.acc ?? rand(90, 97.5),
    perWeek: sp.perWeek ?? rand(1.8, 3.6),
    startDaysAgo: sp.startDaysAgo ?? Math.round(rand(30, 42)),
    untilDaysAgo: sp.untilDaysAgo ?? (rng() < 0.85 ? 0 : Math.round(rand(2, 6))),
    weak: sp.weak ?? [weakPool[Math.floor(rng() * weakPool.length)], weakPool[Math.floor(rng() * weakPool.length)]],
    never: !!sp.never,
    stopAtLesson: sp.stopAtLesson ?? 99,
    dropping: !!sp.dropping,
  };
}

function keyStatsFor(text, accuracy, weak) {
  const ks = {};
  let correct = 0;
  let errors = 0;
  for (const ch of text) {
    const info = CHAR_INFO[ch];
    let p = (100 - accuracy) / 100;
    if (weak.includes(ch.toLowerCase())) p *= 3;
    if (info && ['lp', 'rp'].includes(info.finger)) p *= 1.5;
    if (ch === ' ') p *= 0.3;
    const e = ks[ch] || (ks[ch] = [0, 0]);
    e[0] += 1;
    correct += 1;
    while (rng() < Math.min(0.6, p)) { e[1] += 1; errors += 1; p *= 0.3; }
  }
  return { ks, correct, errors };
}

let total = 0;
for (const spec of CLASSES) {
  clock = realNow - 44 * DAY;
  await teacher('POST', '/api/auth/teacher/login', { email: EMAIL, password: PASSWORD });
  let owner = teacher;
  if (spec.teacher) {
    // De beheerder voegt de leerkracht toe; voor de demo krijgt die hetzelfde wachtwoord.
    const t = await teacher('POST', '/api/admin/teachers', spec.teacher);
    const { hashPassword } = await import('../src/auth.js');
    db.prepare('UPDATE teachers SET pass_hash = ?, must_change = 0 WHERE id = ?').run(hashPassword(PASSWORD), t.id);
    owner = client();
    await owner('POST', '/api/auth/teacher/login', { email: spec.teacher.email, password: PASSWORD });
  }
  const cls = await owner('POST', '/api/teacher/classes', { name: spec.name, groep: spec.groep, settings: { weeklyGoalMinutes: 60 } });
  const { created } = await owner('POST', `/api/teacher/classes/${cls.id}/students`, { names: spec.names });
  for (const s of created) {
    const prof = makeProfile(s.name);
    if (prof.never) continue;
    const kid = client();
    let state = (await kid('POST', '/api/auth/student/login', { code: cls.code, studentId: s.id, password: s.password })).state;
    let apm = prof.apm0;
    let acc = prof.acc;
    let sessions = 0;
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
      sessions += 1;
      const sessionMinutes = rand(10, 22);
      let used = 0;
      while (used < sessionMinutes) {
        const lessonId = Math.min(state.unlocked, prof.stopAtLesson);
        const playGame = state.gamesUnlocked && rng() < 0.3;
        const curAcc = Math.max(80, Math.min(99.5, acc + rand(-2.5, 2.5) - (prof.dropping && d < 8 ? 6 : 0)));
        const curApm = Math.max(12, apm * rand(0.88, 1.1) * (lessonId >= 17 && lessonId <= 18 ? 0.8 : 1));
        if (playGame) {
          const game = rng() < 0.5 ? 'meteoren' : 'race';
          const text = generateText(Math.max(4, lessonId - 1), 2, Math.floor(rng() * 1e9)).repeat(game === 'meteoren' ? 2 : 1);
          const { ks, correct, errors } = keyStatsFor(text, curAcc, prof.weak);
          const durationMs = Math.round((correct / curApm) * 60000);
          const place = game === 'race' ? (curAcc > 95 ? 1 : curAcc > 92 ? 2 : 3) : undefined;
          const r = await kid('POST', '/api/student/attempt', {
            kind: 'game', game, durationMs, chars: correct, correct, errors, keyStats: ks,
            score: game === 'meteoren' ? Math.round(correct * 6 * (curAcc / 100) * rand(0.8, 1.4)) : Math.round(curApm * 9), extra: game === 'race' ? { place } : { wave: Math.max(1, Math.round(correct / 50)) },
          });
          state = r.state;
          used += durationMs / 60000;
          total += 1;
        } else {
          const steps = lessonSteps(lessonId);
          const passedBefore = (state.progress[lessonId]?.stars || 0) >= 1;
          const startStep = passedBefore ? steps.length - 1 : 0;
          for (let i = startStep; i < steps.length; i++) {
            const text = generateText(lessonId, i, Math.floor(rng() * 1e9));
            const { ks, correct, errors } = keyStatsFor(text, curAcc, prof.weak);
            const stepApm = steps[i].kind === 'intro' ? curApm * 0.7 : curApm;
            const durationMs = Math.max(1500, Math.round((correct / stepApm) * 60000));
            clock += durationMs + 15000;
            const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId, step: i, durationMs, chars: text.length, correct, errors, keyStats: ks });
            state = r.state;
            used += durationMs / 60000 + 0.25;
            total += 1;
          }
        }
        clock += 20000;
        apm += prof.growth * 0.35;
        if (!playGame && (state.progress[lessonId]?.stars || 0) >= 1 && rng() < 0.8) break; // één les per keer
        acc = Math.min(99, acc + 0.03);
        if (state.unlocked > prof.stopAtLesson && (state.progress[prof.stopAtLesson]?.stars || 0) >= 1) break;
      }
      apm += prof.growth * 0.5;
    }
    // Emma: wat sterrenstof en een mooie raket voor de video
    if (s.name === 'Emma') {
      db.prepare('UPDATE students SET coins = coins + 150 WHERE id = ?').run(s.id);
    }
    process.stdout.write('.');
  }
  // vaste wachtwoorden voor de demo, zodat de uitleg te volgen is
  if (spec.name === 'Groep 7b') {
    const { hashPassword } = await import('../src/auth.js');
    for (const s of created) db.prepare('UPDATE students SET pass_hash = ? WHERE id = ?').run(hashPassword('raket12'), s.id);
    db.prepare('UPDATE classes SET code = ? WHERE id = ?').run('MAAN-42K', cls.id);
  }
}
server.close();
console.log(`\nDemo klaar: ${total} oefeningen.`);
console.log(`Beheerder: ${EMAIL} / ${PASSWORD} (ook: ahmed@basislab.nl en lotte@basislab.nl, zelfde wachtwoord)`);
console.log('Leerlingen Groep 7b: klascode MAAN-42K, wachtwoord raket12');
void ALL_KEYS;
