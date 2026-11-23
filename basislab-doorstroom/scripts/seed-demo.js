// Demoschool met een groep 8 die al drie weken oefent. Gebruik: npm run demo   (of: npm run demo -- --reset)
// Er worden echte opgaven gemaakt en beantwoord via de app zelf, met een gesimuleerde klok.
import fs from 'node:fs';
import http from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth.js';
import { SKILLS, pCorrect, mondayOf, addDays } from '../public/js/shared/skills.js';
import { dayKey } from '../src/engine.js';

const DB_FILE = process.env.DB_FILE || './data/basislab-doorstroom.db';
if (process.argv.includes('--reset')) for (const f of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`]) if (fs.existsSync(f)) fs.unlinkSync(f);
const db = openDb(DB_FILE);
if (db.prepare('SELECT id FROM teachers LIMIT 1').get()) {
  console.log('Er staan al gegevens in de database. Gebruik --reset om opnieuw te beginnen.');
  process.exit(0);
}

const REAL_NOW = Date.now();
let clock = REAL_NOW;
const server = http.createServer(createApp({ db, now: () => clock }));
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'basislab-doorstroom', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    const data = await res.json();
    if (!res.ok) throw new Error(`${path}: ${data.error}`);
    return data;
  };
}

// Pseudo-willekeur met vaste uitkomst, zodat de demo steeds hetzelfde beeld geeft
let seed = 20261123;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

const thisMonday = mondayOf(dayKey(REAL_NOW));
const start = addDays(thisMonday, -21);
const t = client();
await t('POST', '/api/auth/teacher/register', { name: 'Juf Marieke', email: 'demo@basislab.nl', password: 'basislab-doorstroom', school: 'Basisschool De Klimop' });
const cls = await t('POST', '/api/teacher/classes', { name: 'Groep 8a', groep: 8, settings: { start, toets: '2027-01-26' } });
db.prepare("UPDATE classes SET code = 'BERG-42K', created_at = ? WHERE id = ?").run(REAL_NOW - 25 * 86400000, cls.id);
// Twee weken geleden stond de proeftoets open
await t('PUT', `/api/teacher/classes/${cls.id}/plan`, { weeks: { [addDays(start, 7)]: { focus: ['rk-breuk', 'rk-procent', 'tv-ww', 'lz-begrijpend'], goal: 60, test: true, note: 'Deze week ook de eerste proeftoets!' } } });
db.prepare('INSERT INTO teachers (email, name, school, pass_hash, created_at, is_admin) VALUES (?, ?, ?, ?, ?, 0)').run('ahmed@basislab.nl', 'Meester Ahmed', 'Basisschool De Klimop', hashPassword('basislab-doorstroom'), REAL_NOW);

const NAMES = ['Aya', 'Bram', 'Daan', 'Emma', 'Fatima', 'Finn', 'Isa', 'Jesse', 'Julia', 'Lars', 'Liam', 'Lotte', 'Mehmet', 'Mila', 'Noah', 'Noor', 'Sara', 'Sem', 'Thijs', 'Yara', 'Zoë', 'Luuk', 'Hanna', 'Ravi'];
const { created } = await t('POST', `/api/teacher/classes/${cls.id}/students`, { names: NAMES });
db.prepare("UPDATE students SET pass_hash = ? WHERE class_id = ?").run(hashPassword('kompas12'), cls.id);

// Profielen: werkelijk niveau per onderdeel, ijver en tempo
const profiles = created.map((s, i) => {
  const g = 2.9 + gauss() * 0.8;
  const dom = { rk: g + gauss() * 0.45, tv: g + gauss() * 0.45, lz: g + gauss() * 0.45 };
  const skills = Object.fromEntries(SKILLS.map((sk) => [sk.id, dom[sk.domain] + gauss() * 0.35]));
  const effort = i === 3 ? 0.15 : i === 9 ? 0.35 : 0.6 + rnd() * 0.6;
  return { ...s, skills, effort, fast: i === 14 };
});
// Leerlingen die extra ondersteuning krijgen
const weakest = profiles.slice().sort((a, b) => a.skills['rk-procent'] - b.skills['rk-procent'])[0];
await t('PATCH', `/api/teacher/students/${weakest.id}`, { settings: { start: { rk: 'basis' }, goalFactor: 0.75, readAloud: true, extraFocus: ['rk-breuk'] }, note: 'Krijgt extra ondersteuning bij rekenen (RT op dinsdag).' });

async function practise(p, s, day, n) {
  for (let i = 0; i < n; i++) {
    clock = day + (14 * 60 + i * 1.2) * 60000 + Math.floor(rnd() * 600000);
    const item = await s('POST', '/api/student/next', { mode: rnd() < 0.85 ? 'week' : `skill:${SKILLS[Math.floor(rnd() * SKILLS.length)].id}` });
    const full = JSON.parse(db.prepare('SELECT item FROM pending WHERE id = ?').get(item.pendingId).item);
    const pc = pCorrect(p.skills[full.skill], full.level) * (p.fast ? 0.6 : 1);
    const ok = rnd() < pc;
    const wrong = full.type === 'mc' ? full.options.find((o) => o !== full.answer) : 'weet ik niet';
    await s('POST', '/api/student/answer', { pendingId: item.pendingId, answer: ok ? full.answer : wrong, ms: p.fast ? 2500 + rnd() * 2000 : 12000 + rnd() * 40000 });
  }
}

let total = 0;
for (const p of profiles) {
  const s = client();
  for (let d = 0; d < 24; d++) {
    const day = new Date(`${addDays(start, d)}T00:00:00`).getTime();
    if (day > REAL_NOW - 3600000) break;
    const wd = new Date(day).getDay();
    if (wd === 0 || wd === 6) continue;
    if (rnd() > p.effort * 0.8) continue;
    clock = day + 13.9 * 3600000;
    await s('POST', '/api/auth/student/login', { code: 'BERG-42K', studentId: p.id, password: 'kompas12' });
    const n = 6 + Math.floor(rnd() * 12 * p.effort);
    await practise(p, s, day, Math.min(n, 20));
    total += n;
    // proeftoets in de week waarin hij openstond
    if (d === 9 && rnd() < 0.85) {
      clock = day + 10 * 3600000;
      await s('POST', '/api/student/test/start');
      for (let k = 0; k < 36; k++) {
        clock += 50000;
        const item = await s('POST', '/api/student/next', { mode: 'toets' });
        const full = JSON.parse(db.prepare('SELECT item FROM pending WHERE id = ?').get(item.pendingId).item);
        const ok = rnd() < pCorrect(p.skills[full.skill], full.level);
        await s('POST', '/api/student/answer', { pendingId: item.pendingId, answer: ok ? full.answer : (full.type === 'mc' ? full.options.find((o) => o !== full.answer) : 'x'), ms: 45000 });
      }
    }
  }
  process.stdout.write('.');
}
db.prepare("DELETE FROM sessions WHERE role = 'student'").run();
server.close();
db.close();
console.log(`\nDemoschool klaar (${profiles.length} leerlingen, ruim ${total} opgaven).`);
console.log('Leerkracht: demo@basislab.nl / basislab-doorstroom (ook ahmed@basislab.nl)');
console.log('Leerlingen: klascode BERG-42K, wachtwoord kompas12');
