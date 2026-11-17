import { api, toast } from './lib.js';
import { setSoundEnabled } from './sound.js';

// Gedeelde sessiestatus
export const session = { role: null, state: null, teacher: null };

export function setStudentState(state) {
  session.role = 'student';
  session.state = state;
  setSoundEnabled(state.student.settings.sound);
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

export async function logout() {
  try { await api('POST', '/api/auth/logout'); } catch { /* al uitgelogd */ }
  session.role = null;
  session.state = null;
  session.teacher = null;
  applyStudentPrefs();
  location.hash = '#/';
}

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

const ROUTES = [
  { re: /^\/$/, load: () => import('./landing.js'), theme: 'space' },
  { re: /^\/leerling$/, load: () => import('./student/login.js'), theme: 'space' },
  { re: /^\/leraar$/, load: () => import('./teacher/login.js'), theme: 'teacher' },
  { re: /^\/uitleg$/, load: () => import('./uitleg.js'), theme: 'teacher' },
  { re: /^\/kaart$/, load: () => import('./student/map.js'), theme: 'space', role: 'student' },
  { re: /^\/les\/(\d+)$/, keys: ['id'], load: () => import('./student/lesson.js'), theme: 'space', role: 'student' },
  { re: /^\/spel\/meteoren$/, load: () => import('./student/meteoren.js'), theme: 'space', role: 'student' },
  { re: /^\/spel\/race$/, load: () => import('./student/race.js'), theme: 'space', role: 'student' },
  { re: /^\/hangar$/, load: () => import('./student/hangar.js'), theme: 'space', role: 'student' },
  { re: /^\/erekast$/, load: () => import('./student/trophies.js'), theme: 'space', role: 'student' },
  { re: /^\/diploma$/, load: () => import('./diploma.js'), theme: 'print', role: 'student' },
  { re: /^\/dashboard$/, load: () => import('./teacher/dashboard.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)$/, keys: ['classId'], load: () => import('./teacher/class.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)\/instellingen$/, keys: ['classId'], load: () => import('./teacher/class-settings.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/klas\/(\d+)\/kaarten$/, keys: ['classId'], load: () => import('./teacher/cards.js'), theme: 'print', role: 'teacher' },
  { re: /^\/klas\/(\d+)\/leerling\/(\d+)$/, keys: ['classId', 'studentId'], load: () => import('./teacher/student.js'), theme: 'teacher', role: 'teacher' },
  { re: /^\/diploma\/(\d+)$/, keys: ['studentId'], load: () => import('./diploma.js'), theme: 'print', role: 'teacher' },
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
  if (route.role && session.role !== route.role) {
    location.hash = route.role === 'teacher' ? '#/leraar' : '#/leerling';
    return;
  }
  if (path === '/' && session.role) {
    location.hash = session.role === 'teacher' ? '#/dashboard' : '#/kaart';
    return;
  }
  const m = route.re.exec(path);
  const params = Object.fromEntries((route.keys || []).map((k, i) => [k, m[i + 1]]));
  document.body.dataset.theme = route.theme;
  try {
    const mod = await route.load();
    if (id !== renderId) return;
    root.innerHTML = '';
    window.scrollTo(0, 0);
    cleanup = await mod.default(root, params);
  } catch (err) {
    console.error(err);
    if (id !== renderId) return;
    if (err.status === 401) return;
    root.innerHTML = `<div class="center-page"><div class="card"><h1>Oeps!</h1><p>${String(err.message || 'Er ging iets mis.')
      .replace(/</g, '&lt;')}</p><p><a class="btn btn-primary" href="#/">Terug naar start</a></p></div></div>`;
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('st:logged-out', () => {
  if (!session.role) return;
  session.role = null;
  session.state = null;
  session.teacher = null;
  toast('Je bent uitgelogd. Log opnieuw in.', 'info');
  location.hash = '#/';
});

(async function boot() {
  try {
    await refreshMe();
  } catch {
    /* offline of server niet bereikbaar */
  }
  render();
})();
