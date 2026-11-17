import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let base;
let clock = Date.UTC(2026, 10, 17, 10, 0, 0); // dinsdag 11:00 in Amsterdam

before(async () => {
  const db = openDb(':memory:');
  server = http.createServer(createApp({ db, now: () => clock }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

function client() {
  let cookie = '';
  return async function call(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'sterrentypers', ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : await res.text();
    return { status: res.status, data };
  };
}

const teacher = client();
const kid = client();
let classId;
let code;
let kidPassword;
let kidId;

test('leerkracht kan registreren en een klas maken', async () => {
  let r = await teacher('POST', '/api/auth/teacher/register', { name: 'Juf Test', email: 'juf@school.nl', password: 'geheim123', school: 'De Ster' });
  assert.equal(r.status, 200);
  r = await teacher('GET', '/api/me');
  assert.equal(r.data.role, 'teacher');
  r = await teacher('POST', '/api/teacher/classes', { name: 'Groep 7a', groep: 7 });
  assert.equal(r.status, 200);
  classId = r.data.id;
  code = r.data.code;
  assert.match(code, /^[A-Z]+-\d\d[A-Z]$/);
});

test('dubbel e-mailadres wordt geweigerd', async () => {
  const r = await client()('POST', '/api/auth/teacher/register', { name: 'Ander', email: 'JUF@school.nl', password: 'geheim123' });
  assert.equal(r.status, 409);
});

test('leerlingen toevoegen geeft wachtwoorden', async () => {
  const r = await teacher('POST', `/api/teacher/classes/${classId}/students`, { names: ['Emma', 'Noah', 'emma', ' Sem '] });
  assert.equal(r.status, 200);
  assert.equal(r.data.created.length, 3);
  const emma = r.data.created.find((s) => s.name === 'Emma');
  kidPassword = emma.password;
  kidId = emma.id;
  assert.match(kidPassword, /^[a-z]+\d\d$/);
});

test('verzoek zonder beveiligingsheader wordt geweigerd', async () => {
  const res = await fetch(base + '/api/auth/student/class', { method: 'POST', body: JSON.stringify({ code }) });
  assert.equal(res.status, 403);
});

test('leerling logt in met klascode, naam en wachtwoord', async () => {
  let r = await kid('POST', '/api/auth/student/class', { code: code.toLowerCase() });
  assert.equal(r.status, 200);
  assert.equal(r.data.students.length, 3);
  r = await kid('POST', '/api/auth/student/login', { code, studentId: kidId, password: 'fout' });
  assert.equal(r.status, 401);
  r = await kid('POST', '/api/auth/student/login', { code, studentId: kidId, password: kidPassword.toUpperCase() });
  assert.equal(r.status, 200);
  assert.equal(r.data.state.unlocked, 1);
  assert.equal(r.data.state.gamesUnlocked, false);
});

test('leerling kan geen leraardata zien', async () => {
  const r = await kid('GET', `/api/teacher/classes/${classId}`);
  assert.equal(r.status, 401);
});

test('les op slot kan niet worden ingeleverd', async () => {
  const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 3, step: 4, durationMs: 60000, chars: 100, correct: 100, errors: 0 });
  assert.equal(r.status, 403);
});

test('sterrentest geeft sterren, beloning en ontgrendelt de volgende les', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', {
    kind: 'lesson', lessonId: 1, step: 4, durationMs: 60000, chars: 60, correct: 60, errors: 1, keyStats: { f: [30, 1], j: [30, 0] },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.stars, 3); // 98% en 60 apm > doel 30 voor groep 7
  assert.equal(r.data.unlockedNext, 2);
  assert.ok(r.data.newBadges.includes('eerste-lancering'));
  assert.ok(r.data.newBadges.includes('scherpschutter') === false);
  assert.ok(r.data.state.student.coins >= 30);
});

test('slechte nauwkeurigheid geeft geen sterren', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 2, step: 4, durationMs: 60000, chars: 50, correct: 50, errors: 20 });
  assert.equal(r.data.stars, 0);
  assert.equal(r.data.unlockedNext, null);
});

test('winkel: kopen en avatar aanpassen', async () => {
  let r = await kid('POST', '/api/student/avatar', { body: 'goud' });
  assert.equal(r.status, 403);
  r = await kid('POST', '/api/student/buy', { slot: 'window', id: 'groen' });
  assert.equal(r.status, 200);
  r = await kid('POST', '/api/student/avatar', { window: 'groen' });
  assert.equal(r.data.student.avatar.window, 'groen');
  r = await kid('POST', '/api/student/buy', { slot: 'body', id: 'goud' });
  assert.equal(r.status, 402);
});

test('leraar ziet overzicht, detail en signalen', async () => {
  let r = await teacher('GET', `/api/teacher/classes/${classId}`);
  assert.equal(r.status, 200);
  const emma = r.data.students.find((s) => s.name === 'Emma');
  assert.equal(emma.currentLesson, 2);
  assert.equal(emma.lessonsDone, 1);
  assert.ok(r.data.students.find((s) => s.name === 'Noah').alerts.some((a) => a.type === 'inactive'));
  r = await teacher('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.lessons[0].stars, 3);
  assert.equal(r.data.keys.keys.f.misses, 1);
  assert.equal(r.data.recent.length, 2);
  assert.equal(r.data.recent[0].place, 'schooltijd');
});

test('leraar past tempo aan en geeft lessen vrij', async () => {
  const r = await teacher('PATCH', `/api/teacher/students/${kidId}`, { settings: { speedFactor: 0.8, unlockUpTo: 6 }, note: 'Let op houding' });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.settings.speedFactor, 0.8);
  const s = await kid('GET', '/api/student/state');
  assert.equal(s.data.unlocked, 6);
  assert.equal(s.data.gamesUnlocked, true);
});

test('spelscore wordt opgeslagen en geeft badges', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', { kind: 'game', game: 'meteoren', durationMs: 90000, chars: 150, correct: 150, errors: 5, score: 1200, extra: { wave: 4 } });
  assert.equal(r.status, 200);
  assert.ok(r.data.newBadges.includes('meteoren-1000'));
  const lb = await kid('GET', '/api/student/leaderboard');
  assert.equal(lb.data.rows[0].name, 'Emma');
});

test('locatie via school-IP', async () => {
  await teacher('PATCH', `/api/teacher/classes/${classId}`, { settings: { schoolIps: ['127.0.0.'] } });
  clock += 60_000;
  await kid('POST', '/api/student/attempt', { kind: 'game', game: 'race', durationMs: 60000, chars: 100, correct: 100, errors: 2, score: 0, extra: { place: 1 } });
  const r = await teacher('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r.data.recent[0].place, 'school');
});

test('CSV-export bevat leerlingen', async () => {
  const r = await teacher('GET', `/api/teacher/classes/${classId}/export.csv`);
  assert.equal(r.status, 200);
  assert.match(r.data, /Naam;Groep;Huidige les/);
  assert.match(r.data, /Emma;7;/);
});

test('andere leraar kan klas niet zien', async () => {
  const other = client();
  await other('POST', '/api/auth/teacher/register', { name: 'Meester X', email: 'x@school.nl', password: 'geheim123' });
  const r = await other('GET', `/api/teacher/classes/${classId}`);
  assert.equal(r.status, 404);
  const r2 = await other('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r2.status, 404);
});

test('wachtwoord resetten logt leerling uit', async () => {
  const r = await teacher('POST', `/api/teacher/students/${kidId}/reset-password`);
  assert.equal(r.status, 200);
  const s = await kid('GET', '/api/student/state');
  assert.equal(s.status, 401);
});

test('statische bestanden en pad-traversal', async () => {
  const ok = await fetch(base + '/js/shared/curriculum.js');
  assert.equal(ok.status, 200);
  const evil = await fetch(base + '/..%2f..%2fserver.js');
  assert.notEqual(evil.status, 200);
});
