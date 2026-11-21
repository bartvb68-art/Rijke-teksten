import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let base;

before(async () => {
  const db = openDb(':memory:');
  server = http.createServer(createApp({ db }));
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
    const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data, type };
  };
}

const admin = client();
const teacher = client();
let teacherId;
let teacherPw;
let teacherClassId;

// 1x1 transparante PNG
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test('eerste leerkracht wordt beheerder en zet de schoolnaam', async () => {
  const r = await admin('POST', '/api/auth/teacher/register', { name: 'Directie', email: 'beheer@school.nl', password: 'geheim123', school: 'De Sterrenwacht' });
  assert.equal(r.status, 200);
  assert.equal(r.data.admin, true);
  const me = await admin('GET', '/api/me');
  assert.equal(me.data.teacher.is_admin, true);
  const school = await admin('GET', '/api/school');
  assert.equal(school.data.name, 'De Sterrenwacht');
  assert.equal(school.data.logo, null);
});

test('beheerder voegt een leerkracht toe met tijdelijk wachtwoord', async () => {
  const r = await admin('POST', '/api/admin/teachers', { name: 'Meester Ahmed', email: 'ahmed@school.nl' });
  assert.equal(r.status, 200);
  teacherId = r.data.id;
  teacherPw = r.data.password;
  assert.ok(teacherPw.length >= 10);
  const login = await teacher('POST', '/api/auth/teacher/login', { email: 'ahmed@school.nl', password: teacherPw });
  assert.equal(login.status, 200);
  const me = await teacher('GET', '/api/me');
  assert.equal(me.data.teacher.is_admin, false);
  assert.equal(me.data.teacher.must_change, true);
  const ch = await teacher('PATCH', '/api/teacher/me', { password: teacherPw, newPassword: 'nieuwwachtwoord' });
  assert.equal(ch.status, 200);
  const me2 = await teacher('GET', '/api/me');
  assert.equal(me2.data.teacher.must_change, false);
});

test('gewone leerkracht kan niet bij beheer', async () => {
  const r = await teacher('GET', '/api/admin/overview');
  assert.equal(r.status, 403);
  const r2 = await teacher('POST', '/api/admin/teachers', { name: 'X', email: 'x@school.nl' });
  assert.equal(r2.status, 403);
});

test('logo uploaden, ophalen en weigeren van een nepbestand', async () => {
  const bad = await admin('POST', '/api/admin/logo', { dataUrl: `data:image/png;base64,${Buffer.from('geen plaatje').toString('base64')}` });
  assert.equal(bad.status, 400);
  const svg = await admin('POST', '/api/admin/logo', { dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' });
  assert.equal(svg.status, 400);
  const ok = await admin('POST', '/api/admin/logo', { dataUrl: `data:image/png;base64,${PNG}` });
  assert.equal(ok.status, 200);
  assert.ok(ok.data.logo);
  const img = await client()('GET', '/api/school/logo');
  assert.equal(img.status, 200);
  assert.equal(img.type, 'image/png');
  assert.equal(img.data.subarray(1, 4).toString(), 'PNG');
});

test('registratie dichtzetten', async () => {
  await admin('PATCH', '/api/admin/settings', { allowSignup: false });
  const r = await client()('POST', '/api/auth/teacher/register', { name: 'Nieuw', email: 'nieuw@school.nl', password: 'geheim123' });
  assert.equal(r.status, 403);
  await admin('PATCH', '/api/admin/settings', { allowSignup: true });
});

test('beheerder ziet gebruik en klassen van andere leerkrachten', async () => {
  const c = await teacher('POST', '/api/teacher/classes', { name: 'Groep 8', groep: 8 });
  teacherClassId = c.data.id;
  await teacher('POST', `/api/teacher/classes/${teacherClassId}/students`, { names: ['Lars', 'Iris'] });
  const o = await admin('GET', '/api/admin/overview');
  assert.equal(o.status, 200);
  assert.equal(o.data.totals.teachers, 2);
  assert.equal(o.data.totals.students, 2);
  assert.equal(o.data.classes[0].teacher, 'Meester Ahmed');
  assert.equal(o.data.daily.length, 30);
  const cls = await admin('GET', `/api/teacher/classes/${teacherClassId}`);
  assert.equal(cls.status, 200);
  const csv = await admin('GET', '/api/admin/export.csv');
  assert.match(csv.data.toString(), /Groep 8;8;Meester Ahmed;2/);
});

test('laatste beheerder kan zijn rol niet kwijtraken; leerkracht verwijderen met overdracht', async () => {
  const me = await admin('GET', '/api/me');
  const r = await admin('PATCH', `/api/admin/teachers/${me.data.teacher.id}`, { isAdmin: false });
  assert.equal(r.status, 400);
  const del = await admin('DELETE', `/api/admin/teachers/${teacherId}`, { transferTo: me.data.teacher.id });
  assert.equal(del.status, 200);
  const o = await admin('GET', '/api/admin/overview');
  assert.equal(o.data.totals.teachers, 1);
  assert.equal(o.data.classes[0].teacher, 'Directie');
  assert.equal(o.data.totals.students, 2);
});
