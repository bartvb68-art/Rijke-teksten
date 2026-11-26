import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

async function setup({ now } = {}) {
  const db = openDb(':memory:');
  const server = http.createServer(createApp({ db, now }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    return async (method, path, body) => {
      const res = await fetch(base + path, {
        method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'basislab-doorstroom', cookie },
        body: body ? JSON.stringify(body) : undefined,
      });
      const sc = res.headers.get('set-cookie');
      if (sc) cookie = sc.split(';')[0];
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      return { status: res.status, data };
    };
  };
  return { db, server, client, close: () => server.close() };
}

async function classWithStudent(env) {
  const t = env.client();
  assert.equal((await t('POST', '/api/auth/teacher/register', { name: 'Juf Ilse', email: 'ilse@school.nl', password: 'geheim123', school: 'De Klimop' })).status, 200);
  const cls = (await t('POST', '/api/teacher/classes', { name: 'Groep 8a', groep: 8 })).data;
  const st = (await t('POST', `/api/teacher/classes/${cls.id}/students`, { names: ['Noor', 'Sem'] })).data.created;
  const s = env.client();
  const login = await s('POST', '/api/auth/student/login', { code: cls.code, studentId: st[0].id, password: st[0].password });
  assert.equal(login.status, 200);
  return { t, s, cls, students: st };
}

test('leerkracht, klas, leerling en oefenen', async () => {
  const env = await setup();
  try {
    const { t, s, cls, students } = await classWithStudent(env);
    const state = (await s('GET', '/api/student/state')).data;
    assert.equal(state.student.name, 'Noor');
    assert.ok(state.route.length > 0, 'weekroute aanwezig');

    // 30 opgaven in de weektaak, steeds het goede antwoord via de database (zoals een sterke leerling)
    for (let i = 0; i < 30; i++) {
      const n = await s('POST', '/api/student/next', { mode: 'week' });
      assert.equal(n.status, 200, JSON.stringify(n.data));
      assert.equal(n.data.item.answer, undefined, 'antwoord niet naar de browser');
      const item = JSON.parse(env.db.prepare('SELECT item FROM pending WHERE id = ?').get(n.data.pendingId).item);
      const a = await s('POST', '/api/student/answer', { pendingId: n.data.pendingId, answer: item.answer, ms: 8000 });
      assert.equal(a.status, 200, JSON.stringify(a.data));
      assert.equal(a.data.correct, true, `goed antwoord moet goed zijn: ${item.prompt} -> ${item.answer}`);
    }
    // dubbel antwoorden kan niet
    const n = await s('POST', '/api/student/next', { mode: 'skill:tv-ww' });
    await s('POST', '/api/student/answer', { pendingId: n.data.pendingId, answer: 'fout', ms: 3000 });
    assert.equal((await s('POST', '/api/student/answer', { pendingId: n.data.pendingId, answer: 'fout', ms: 3000 })).status, 409);

    const res = (await s('GET', '/api/student/results')).data;
    assert.equal(res.domains.length, 3);
    const ov = (await t('GET', `/api/teacher/classes/${cls.id}`)).data;
    assert.equal(ov.students.length, 2);
    const noor = ov.students.find((x) => x.name === 'Noor');
    assert.equal(noor.week.done, 31);
    const det = (await t('GET', `/api/teacher/students/${students[0].id}`)).data;
    assert.equal(det.recent.length, 31);
    assert.ok(det.skills.some((x) => x.n > 0));
    const csv = await t('GET', `/api/teacher/classes/${cls.id}/export.csv`);
    assert.match(csv.data, /Noor/);

    // leerling ziet geen gegevens van de leraar
    assert.equal((await s('GET', `/api/teacher/classes/${cls.id}`)).status, 401);
  } finally { env.close(); }
});

test('adaptief: sterke leerling stijgt, zwakke daalt', async () => {
  const env = await setup();
  try {
    const { t, cls } = await classWithStudent(env);
    const st = (await t('POST', `/api/teacher/classes/${cls.id}/students`, { names: ['Sterk', 'Zwak'] })).data.created;
    const thetas = {};
    for (const [who, good] of [[st[0], true], [st[1], false]]) {
      const s = env.client();
      await s('POST', '/api/auth/student/login', { code: cls.code, studentId: who.id, password: who.password });
      for (let i = 0; i < 25; i++) {
        const n = await s('POST', '/api/student/next', { mode: 'skill:rk-procent' });
        const item = JSON.parse(env.db.prepare('SELECT item FROM pending WHERE id = ?').get(n.data.pendingId).item);
        await s('POST', '/api/student/answer', { pendingId: n.data.pendingId, answer: good ? item.answer : 'x', ms: 9000 });
      }
      thetas[who.name] = env.db.prepare("SELECT theta FROM abilities WHERE student_id = ? AND skill = 'rk-procent'").get(who.id).theta;
    }
    assert.ok(thetas.Sterk > 4, `sterk ${thetas.Sterk}`);
    assert.ok(thetas.Zwak < 1.6, `zwak ${thetas.Zwak}`);
    const ov = (await t('GET', `/api/teacher/classes/${cls.id}`)).data;
    const g = ov.groups.find((x) => x.skill === 'rk-procent');
    assert.ok(g.instructie.some((x) => x.name === 'Zwak'));
    assert.ok(g.verrijking.some((x) => x.name === 'Sterk'));
  } finally { env.close(); }
});

test('weekplanning en proeftoets', async () => {
  const env = await setup();
  try {
    const { t, s, cls } = await classWithStudent(env);
    const plan = (await t('GET', `/api/teacher/classes/${cls.id}/plan`)).data;
    assert.ok(plan.weeks.length >= 1);
    const wk = plan.current;
    // proeftoets staat nog niet open in deze week (tenzij de standaardplanning dat zo had)
    const put = await t('PUT', `/api/teacher/classes/${cls.id}/plan`, { weeks: { [wk]: { focus: ['rk-breuk', 'tv-ww'], goal: 40, test: true, note: 'Breuken!' } } });
    assert.equal(put.status, 200, JSON.stringify(put.data));
    const state = (await s('GET', '/api/student/state')).data;
    assert.deepEqual(Object.keys(state.week.focus).sort(), ['rk-breuk', 'tv-ww']);
    assert.equal(state.week.goal, 40);
    assert.equal(state.test.available, true);

    const start = await s('POST', '/api/student/test/start');
    assert.equal(start.status, 200);
    const total = start.data.total;
    let last;
    for (let i = 0; i < total; i++) {
      const n = await s('POST', '/api/student/next', { mode: 'toets' });
      assert.equal(n.status, 200, JSON.stringify(n.data));
      assert.equal(n.data.progress.pos, i + 1);
      const item = JSON.parse(env.db.prepare('SELECT item FROM pending WHERE id = ?').get(n.data.pendingId).item);
      last = await s('POST', '/api/student/answer', { pendingId: n.data.pendingId, answer: i % 3 ? item.answer : 'x', ms: 20000 });
      assert.equal(last.data.correct, undefined, 'geen feedback tijdens de toets');
    }
    assert.equal(last.data.done, true);
    assert.ok(last.data.result.domains.rk.theta != null);
    // nog een keer deze week kan niet
    assert.equal((await s('POST', '/api/student/test/start')).status, 403);
    const tests = (await t('GET', `/api/teacher/classes/${cls.id}/tests`)).data;
    assert.equal(tests.students[0].tests.length, 1);
    // leerkracht kan een toets wissen zodat hij opnieuw kan
    assert.equal((await t('DELETE', `/api/teacher/tests/${tests.students[0].tests[0].id}`)).status, 200);
    assert.equal((await s('POST', '/api/student/test/start')).status, 200);
  } finally { env.close(); }
});

test('differentiatie: startniveau en weekdoel per leerling', async () => {
  const env = await setup();
  try {
    const { t, s, students } = await classWithStudent(env);
    const r = await t('PATCH', `/api/teacher/students/${students[0].id}`, { settings: { start: { rk: 'basis' }, goalFactor: 0.5, readAloud: true, extraFocus: ['rk-meten'] } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.student.settings.start.rk, 'basis');
    const st = (await s('GET', '/api/student/state')).data;
    assert.equal(st.student.settings.readAloud, true);
    assert.ok('rk-meten' in st.week.focus);
    const n = await s('POST', '/api/student/next', { mode: 'skill:rk-getal' });
    const item = JSON.parse(env.db.prepare('SELECT item FROM pending WHERE id = ?').get(n.data.pendingId).item);
    assert.ok(item.level <= 2.5, `basisniveau krijgt makkelijke opgaven (${item.level})`);
    assert.equal((await t('PATCH', `/api/teacher/students/${students[0].id}`, { settings: { goalFactor: 9 } })).status, 400);
  } finally { env.close(); }
});

test('beveiliging: zonder header geweigerd, andere leerkracht ziet klas niet', async () => {
  const env = await setup();
  try {
    const { cls } = await classWithStudent(env);
    const res = await fetch(`http://127.0.0.1:${env.server.address().port}/api/auth/teacher/login`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    assert.equal(res.status, 403);
    const t2 = env.client();
    await t2('POST', '/api/auth/teacher/register', { name: 'Meester Bram', email: 'bram@school.nl', password: 'geheim123' });
    assert.equal((await t2('GET', `/api/teacher/classes/${cls.id}`)).status, 404);
  } finally { env.close(); }
});

test('werkbladen: huiswerk, remediëring en leerlingversie zonder antwoorden', async () => {
  const env = await setup();
  try {
    const { t, s, cls, students } = await classWithStudent(env);
    // zonder huiswerkoptie kan de leerling niets printen
    assert.equal((await s('GET', '/api/student/huiswerk')).status, 404);
    const plan = (await t('GET', `/api/teacher/classes/${cls.id}/plan`)).data;
    const put = await t('PUT', `/api/teacher/classes/${cls.id}/plan`, { weeks: { [plan.current]: { focus: ['rk-procent', 'tv-ww', 'lz-begrijpend'], goal: 60, homework: true, homeworkCount: 15 } } });
    assert.equal(put.status, 200, JSON.stringify(put.data));
    const hw = await t('GET', `/api/teacher/classes/${cls.id}/werkbladen?soort=huiswerk`);
    assert.equal(hw.status, 200, JSON.stringify(hw.data));
    assert.equal(hw.data.sheets.length, 2);
    const sh = hw.data.sheets[0];
    assert.deepEqual(sh.sections.map((x) => x.skill), ['rk-procent', 'tv-ww', 'lz-begrijpend']);
    assert.ok(sh.sections[2].passage, 'leestekst staat op het blad');
    assert.ok(sh.sections[0].items.every((it) => it.answer != null), 'leerkracht krijgt antwoorden');
    const keys = sh.sections.flatMap((x) => x.items.map((it) => it.prompt + (it.figure || '')));
    assert.equal(new Set(keys).size, keys.length, 'geen dubbele opgaven');
    const mine = await s('GET', '/api/student/huiswerk');
    assert.equal(mine.status, 200);
    assert.ok(mine.data.sheets[0].sections.every((x) => x.items.every((it) => it.answer === undefined && it.explain === undefined)), 'leerling krijgt geen antwoorden');
    // remediëring voor één leerling met uitleg, opgaven oplopend
    const rem = await t('GET', `/api/teacher/classes/${cls.id}/werkbladen?soort=remediering&skill=rk-breuk&students=${students[0].id}&count=10`);
    assert.equal(rem.status, 200, JSON.stringify(rem.data));
    const sec = rem.data.sheets[0].sections[0];
    assert.ok(sec.uitleg && sec.uitleg.stappen.length);
    assert.equal(sec.items.length, 10);
    const lv = sec.items.map((it) => it.level);
    assert.deepEqual(lv, [...lv].sort((a, b) => a - b));
    assert.equal((await t('GET', `/api/teacher/classes/${cls.id}/werkbladen?soort=remediering`)).status, 400);
    assert.equal((await s('GET', `/api/teacher/classes/${cls.id}/werkbladen?soort=huiswerk`)).status, 401);
  } finally { env.close(); }
});
