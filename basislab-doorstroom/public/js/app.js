import { api, toast } from './lib.js';

export const session = { role: null, state: null, teacher: null, school: { name: '', logo: null, allowSignup: true } };

export function schoolLogoHtml({ size = 40, withName = false, cls = '' } = {}) {
  const sc = session.school || {};
  const safe = (s) => String(s || '').replace(/[<>&"]/g, '');
  const img = sc.logo ? `<img class="school-logo" src="/api/school/logo?v=${encodeURIComponent(sc.logo)}" alt="Logo ${safe(sc.name || 'van de school')}" style="height:${size}px">` : '';
  const name = withName && sc.name ? `<span class="school-name">${safe(sc.name)}</span>` : '';
  return img || name ? `<span class="school-brand ${cls}">${img}${name}</span>` : '';
}

export async function refreshSchool() {
  try { session.school = await api('GET', '/api/school'); } catch { /* offline */ }
  return session.school;
}

export function setStudentState(state) {
  session.role = 'student';
  session.state = state;
  applyStudentPrefs();
}

export function applyStudentPrefs() {
  const s = session.state?.student.settings || {};
  document.body.classList.toggle('dyslexia', session.role === 'student' && !!s.dyslexia);
  document.body.classList.toggle('large-text', session.role === 'student' && !!s.largeText);
}

export async function refreshMe() {
  const me = await api('GET', '/api/me');
  session.role = me.role;
  session.teacher = me.teacher || null;
  session.state = me.state || null;
  if (me.role === 'student') setStudentState(me.state);
  applyStudentPrefs();
  return me;
}

export async function refreshState() {
  const st = await api('GET', '/api/student/state');
  setStudentState(st);
  return st;
}

export async function logout() {
  try { await api('POST', '/api/auth/logout'); } catch { /* al uitgelogd */ }
  session.role = null; session.state = null; session.teacher = null;
  applyStudentPrefs();
  location.hash = '#/';
}

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

const ROUTES = [
  { re: /^\/$/, load: () => import('./landing.js'), theme: 'student' },
  { re: /^\/leerling$/, load: () => import('./student/login.js'), theme: 'student' },
  { re: /^\/leraar$/, load: () => import('./teacher/login.js'), theme: 'teacher' },
  { re: /^\/uitleg$/, load: () => import('./uitleg.js'), theme: 'teacher' },
  { re: /^\/start$/, load: () => import('./student/home.js'), theme: 'student', role: 'student' },
  { re: /^\/oefenen\/(.+)$/, keys: ['mode'], load: () => import('./student/practice.js'), theme: 'student', role: 'student' },
  { re: /^\/proeftoets$/, load: () => import('./student/test.js'), theme: 'student', role: 'student' },
  { re: /^\/niveau$/, load: () => import('./student/results.js'), theme: 'student', role: 'student' },
  { re: /^\/dashboard$/, load: () => import('./teacher/dashboard.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/beheer$/, load: () => import('./teacher/admin.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/account$/, load: () => import('./teacher/account.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)$/, keys: ['classId'], load: () => import('./teacher/class.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)\/(\w+)$/, keys: ['classId', 'tab'], load: () => import('./teacher/class.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)\/werkblad\/(huiswerk|remediering|verrijking)(?:\/([a-z-]+))?$/, keys: ['classId', 'soort', 'skill'], load: () => import('./teacher/werkbladen.js'), theme: 'print', role: 'teacher' },
  { re: /^\/huiswerk$/, load: () => import('./student/huiswerk.js'), theme: 'print', role: 'student' },
  { re: /^\/klas\/(\d+)\/kaarten\/print$/, keys: ['classId'], load: () => import('./teacher/cards.js'), theme: 'print', role: 'teacher' },
  { re: /^\/leerling\/(\d+)$/, keys: ['studentId'], load: () => import('./teacher/student.js'), theme: 'teacher', role: 'teacher' },
];

let cleanup = null;
let renderId = 0;

async function render() {
  const id = ++renderId;
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const route = ROUTES.find((r) => r.re.test(path));
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
  const root = document.getElementById('app');
  document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
  if (!route) { location.hash = '#/'; return; }
  if (route.role && session.role !== route.role) { location.hash = route.role === 'teacher' ? '#/leraar' : '#/leerling'; return; }
  if (session.role === 'teacher' && session.teacher?.must_change && path !== '/account') { location.hash = '#/account'; return; }
  if (path === '/' && session.role) { location.hash = session.role === 'teacher' ? '#/dashboard' : '#/start'; return; }
  const m = route.re.exec(path);
  const params = Object.fromEntries((route.keys || []).map((k, i) => [k, m[i + 1] == null ? undefined : decodeURIComponent(m[i + 1])]));
  document.body.dataset.theme = route.theme;
  try {
    const mod = await route.load();
    if (id !== renderId) return;
    root.innerHTML = '';
    window.scrollTo(0, 0);
    cleanup = await mod.default(root, params);
  } catch (err) {
    console.error(err);
    if (id !== renderId || err.status === 401) return;
    root.innerHTML = `<div class="center-page"><div class="card"><h1>Oeps!</h1><p>${String(err.message || 'Er ging iets mis.').replace(/</g, '&lt;')}</p><p><a class="btn btn-primary" href="#/">Terug naar start</a></p></div></div>`;
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('bd:logged-out', () => {
  if (!session.role) return;
  session.role = null; session.state = null; session.teacher = null;
  toast('Je bent uitgelogd. Log opnieuw in.', 'info');
  location.hash = '#/';
});

(async function boot() {
  try { await Promise.all([refreshMe(), refreshSchool()]); } catch { /* server niet bereikbaar */ }
  render();
})();
