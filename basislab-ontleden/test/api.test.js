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
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'basislab-ontleden', ...(cookie ? { Cookie: cookie } : {}) },
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
  r = await teacher('POST', '/api/teacher/classes', { name: 'Groep 6a', groep: 6 });
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
  const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 3, step: 3, durationMs: 60000, items: 10, correct: 10 });
  assert.equal(r.status, 403);
});

test('verkeerd aantal zinnen wordt geweigerd', async () => {
  const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 1, step: 3, durationMs: 60000, items: 3, correct: 3 });
  assert.equal(r.status, 400);
});

test('optreden geeft sterren, beloning en ontgrendelt de volgende les', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', {
    kind: 'lesson', lessonId: 1, step: 3, durationMs: 100_000, items: 10, correct: 9, skillStats: { knip: [25, 1], hack: [1, 1] },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.stars, 3); // 90% goed
  assert.equal(r.data.accuracy, 90);
  assert.equal(r.data.secPerItem, 10);
  assert.equal(r.data.unlockedNext, 2);
  assert.ok(r.data.newBadges.includes('eerste-noot'));
  assert.ok(r.data.newBadges.includes('vlot'));
  assert.ok(!r.data.newBadges.includes('foutloos'));
  assert.ok(r.data.state.student.coins >= 30);
});

test('lage score geeft geen sterren', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', {
    kind: 'lesson', lessonId: 2, step: 3, durationMs: 200_000, items: 10, correct: 5, skillStats: { pv: [5, 5], ow: [0, 3] }, confusions: { 'ow>pv': 3 },
  });
  assert.equal(r.data.stars, 0);
  assert.equal(r.data.unlockedNext, null);
});

test('meer goed dan zinnen kan niet', async () => {
  const r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 1, step: 1, durationMs: 60000, items: 6, correct: 7 });
  assert.equal(r.status, 400);
});

test('winkel: kopen en avatar aanpassen', async () => {
  let r = await kid('POST', '/api/student/avatar', { body: 'goud' });
  assert.equal(r.status, 403);
  r = await kid('POST', '/api/student/buy', { slot: 'guard', id: 'zwart' });
  assert.equal(r.status, 200);
  r = await kid('POST', '/api/student/avatar', { guard: 'zwart' });
  assert.equal(r.data.student.avatar.guard, 'zwart');
  r = await kid('POST', '/api/student/buy', { slot: 'body', id: 'goud' });
  assert.equal(r.status, 402);
});

test('leraar ziet overzicht, detail, verwarringen en signalen', async () => {
  let r = await teacher('GET', `/api/teacher/classes/${classId}`);
  assert.equal(r.status, 200);
  const emma = r.data.students.find((s) => s.name === 'Emma');
  assert.equal(emma.currentLesson, 2);
  assert.equal(emma.lessonsDone, 1);
  assert.equal(emma.recentScore, 70);
  assert.ok(r.data.students.find((s) => s.name === 'Noah').alerts.some((a) => a.type === 'inactive'));
  assert.equal(r.data.skills.skills.pv.misses, 5);
  assert.equal(r.data.skills.skills.hack, undefined); // onbekende onderdelen worden genegeerd
  r = await teacher('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.lessons[0].stars, 3);
  assert.equal(r.data.lessons[0].bestSec, 10);
  assert.equal(r.data.skills.skills.knip.misses, 1);
  assert.deepEqual(r.data.skills.confusions[0], { real: 'ow', given: 'pv', n: 3 });
  assert.equal(r.data.recent.length, 2);
  assert.equal(r.data.recent[0].place, 'schooltijd');
  assert.equal(r.data.series.at(-1).score, 70);
});

test('leraar past niveau aan en geeft lessen vrij', async () => {
  let r = await teacher('PATCH', `/api/teacher/students/${kidId}`, { settings: { levelShift: 2 } });
  assert.equal(r.status, 400);
  r = await teacher('PATCH', `/api/teacher/students/${kidId}`, { settings: { levelShift: -1, unlockUpTo: 6 }, note: 'Voorlezen helpt' });
  assert.equal(r.status, 200);
  assert.equal(r.data.student.settings.levelShift, -1);
  const s = await kid('GET', '/api/student/state');
  assert.equal(s.data.unlocked, 6);
  assert.equal(s.data.gamesUnlocked, true);
});

test('leerling mag niveau niet zelf aanpassen', async () => {
  const s = await kid('POST', '/api/student/settings', { levelShift: 1, readAloud: false });
  assert.equal(s.data.student.settings.levelShift, -1);
  assert.equal(s.data.student.settings.readAloud, false);
});

test('spelscore wordt opgeslagen en geeft badges', async () => {
  clock += 60_000;
  const r = await kid('POST', '/api/student/attempt', {
    kind: 'game', game: 'notenregen', durationMs: 90000, items: 30, correct: 27, score: 5200, extra: { combo: 16, level: 4 }, skillStats: { pv: [10, 1] },
  });
  assert.equal(r.status, 200);
  assert.ok(r.data.newBadges.includes('notenregen-1000'));
  assert.ok(r.data.newBadges.includes('notenregen-5000'));
  assert.ok(r.data.newBadges.includes('combo-15'));
  assert.equal(r.data.state.stats.notenregenRecord, 5200);
  const lb = await kid('GET', '/api/student/leaderboard');
  assert.equal(lb.data.rows[0].name, 'Emma');
});

test('onbekend spel wordt geweigerd', async () => {
  const r = await kid('POST', '/api/student/attempt', { kind: 'game', game: 'tetris', durationMs: 9000, items: 3, correct: 3 });
  assert.equal(r.status, 400);
});

test('locatie via school-IP', async () => {
  await teacher('PATCH', `/api/teacher/classes/${classId}`, { settings: { schoolIps: ['127.0.0.'] } });
  clock += 60_000;
  const g = await kid('POST', '/api/student/attempt', { kind: 'game', game: 'battle', durationMs: 60000, items: 12, correct: 10, score: 1000, extra: { place: 1 } });
  assert.ok(g.data.newBadges.includes('battle-winnaar'));
  const r = await teacher('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r.data.recent[0].place, 'school');
});

test('CSV-export bevat leerlingen', async () => {
  const r = await teacher('GET', `/api/teacher/classes/${classId}/export.csv`);
  assert.equal(r.status, 200);
  assert.match(r.data, /Naam;Groep;Huidige les/);
  assert.match(r.data, /Emma;6;/);
});

test('groep 5 tot en met 8, geen groep 4', async () => {
  let r = await teacher('POST', '/api/teacher/classes', { name: 'Groep 5', groep: 5 });
  assert.equal(r.status, 200);
  r = await teacher('POST', '/api/teacher/classes', { name: 'Groep 4', groep: 4 });
  assert.equal(r.status, 400);
});

test('andere leraar kan klas niet zien', async () => {
  const other = client();
  await other('POST', '/api/auth/teacher/register', { name: 'Meester X', email: 'x@school.nl', password: 'geheim123' });
  const r = await other('GET', `/api/teacher/classes/${classId}`);
  assert.equal(r.status, 404);
  const r2 = await other('GET', `/api/teacher/students/${kidId}`);
  assert.equal(r2.status, 404);
});

test('diploma pas na het examen', async () => {
  let r = await kid('GET', '/api/student/diploma');
  assert.equal(r.status, 404);
  await teacher('PATCH', `/api/teacher/students/${kidId}`, { settings: { unlockUpTo: 20 } });
  clock += 60_000;
  r = await kid('POST', '/api/student/attempt', { kind: 'lesson', lessonId: 20, step: 1, durationMs: 240000, items: 12, correct: 11 });
  assert.equal(r.data.stars, 3);
  assert.ok(r.data.newBadges.includes('diploma'));
  r = await kid('GET', '/api/student/diploma');
  assert.equal(r.status, 200);
  assert.equal(r.data.accuracy, 92);
  assert.equal(r.data.name, 'Emma');
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
