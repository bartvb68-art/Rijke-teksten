import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { setStudentState, go, schoolLogoHtml } from '../app.js';

export default function studentLogin(root) {
  let cls = null; let students = null; let chosen = null;
  const remembered = (() => { try { return localStorage.getItem('bd_code') || ''; } catch { return ''; } })();
  const box = (html) => { root.innerHTML = `<div class="center-page"><div class="card login-box">${html}</div></div>`; };

  function stepCode(error = '') {
    box(`<p style="text-align:left"><a href="#/" class="muted">${icon('back')} Terug</a></p>
      ${schoolLogoHtml({ size: 56, withName: true })}
      <img src="/img/basislab-doorstroom-logo.png" alt="Basislab Doorstroom" width="180" height="180" style="margin:0 auto">
      <h1>Klaar voor de klim?</h1>
      <p class="muted">Typ de <b>klascode</b> van je inlogkaart.</p>
      <form>
        <input class="input code-input" name="code" autocomplete="off" spellcheck="false" maxlength="12" placeholder="BERG-42K" value="${esc(remembered)}" aria-label="Klascode" required>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn btn-primary btn-big" type="submit">Verder ${icon('next')}</button>
      </form>`);
    const form = root.querySelector('form');
    form.code.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = form.code.value.trim().toUpperCase();
      try {
        const r = await api('POST', '/api/auth/student/class', { code });
        cls = r.class; students = r.students;
        try { localStorage.setItem('bd_code', code); } catch { /* privémodus */ }
        stepName();
      } catch (err) { stepCode(err.message); }
    });
  }

  function stepName() {
    if (!students) { stepPassword(); return; }
    box(`<p style="text-align:left"><button class="btn btn-ghost btn-sm" data-back>${icon('back')} Andere klascode</button></p>
      <h1>Wie ben jij?</h1><p class="muted">${esc(cls.name)}</p>
      <div class="name-grid">${students.map((s) => `<button class="name-tile" data-id="${s.id}">${esc(s.name)}</button>`).join('')}</div>
      ${students.length ? '' : '<p class="muted">Er staan nog geen leerlingen in deze klas.</p>'}`);
    root.querySelector('[data-back]').addEventListener('click', () => stepCode());
    root.querySelectorAll('.name-tile').forEach((b) => b.addEventListener('click', () => { chosen = students.find((s) => s.id === Number(b.dataset.id)); stepPassword(); }));
    root.querySelector('.name-tile')?.focus();
  }

  function stepPassword(error = '') {
    box(`<p style="text-align:left"><button class="btn btn-ghost btn-sm" data-back>${icon('back')} Terug</button></p>
      <h1>${chosen ? `Hoi ${esc(chosen.name)}!` : 'Inloggen'}</h1>
      <form>
        ${chosen ? '' : '<input class="input pw-input" name="naam" placeholder="Je naam" autocomplete="username" required style="margin-bottom:12px">'}
        <p class="muted">Typ je wachtwoord.</p>
        <input class="input pw-input" name="password" type="password" autocomplete="current-password" spellcheck="false" aria-label="Wachtwoord" required>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn btn-primary btn-big" type="submit">Inloggen ${icon('mountain')}</button>
      </form>`);
    root.querySelector('[data-back]').addEventListener('click', () => (students ? stepName() : stepCode()));
    const form = root.querySelector('form');
    (form.elements.naam || form.elements.password).focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await api('POST', '/api/auth/student/login', { code: cls.code, studentId: chosen?.id, name: form.elements.naam?.value, password: form.elements.password.value });
        setStudentState(r.state);
        go('#/start');
      } catch (err) { stepPassword(err.message); }
    });
  }
  stepCode();
}
