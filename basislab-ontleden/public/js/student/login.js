import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { setStudentState, go, schoolLogoHtml } from '../app.js';

export default function studentLogin(root) {
  let cls = null;
  let students = null;
  let chosen = null;
  const remembered = (() => { try { return localStorage.getItem('bo_code') || ''; } catch { return ''; } })();

  function stepCode(error = '') {
    root.innerHTML = `<div class="center-page"><div class="card login-box">
      <p><a href="#/" class="muted">${icon('back')} Terug</a></p>
      ${schoolLogoHtml({ size: 64, withName: true, cls: 'on-dark stacked' })}
      ${guitarSvg({ body: 'blauw', pattern: 'strepen' }, { size: 90 })}
      <h1>Klaar voor de start?</h1>
      <p class="muted">Typ de <b>klascode</b> van je inlogkaart.</p>
      <form data-form="code">
        <input class="input code-input" name="code" autocomplete="off" spellcheck="false" maxlength="12" placeholder="DRUM-42K" value="${esc(remembered)}" aria-label="Klascode" required>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn btn-primary btn-big" type="submit">Verder ${icon('play')}</button>
      </form>
    </div></div>`;
    const form = root.querySelector('form');
    form.code.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = form.code.value.trim().toUpperCase();
      try {
        const r = await api('POST', '/api/auth/student/class', { code });
        cls = r.class;
        students = r.students;
        try { localStorage.setItem('bo_code', code); } catch { /* privémodus */ }
        stepName();
      } catch (err) {
        stepCode(err.message);
      }
    });
  }

  function stepName() {
    if (!students) { stepPassword(); return; }
    root.innerHTML = `<div class="center-page"><div class="card login-box">
      <p><button class="btn btn-ghost btn-sm" data-back>${icon('back')} Andere klascode</button></p>
      <h1>Wie ben jij?</h1>
      <p class="muted">${esc(cls.name)} · groep ${cls.groep}</p>
      <div class="name-grid">${students.map((s) => `<button class="name-tile" data-id="${s.id}">${guitarSvg(s.avatar, { size: 48, waves: false })}<span>${esc(s.name)}</span></button>`).join('')}</div>
      ${students.length ? '' : '<p class="muted">Er staan nog geen leerlingen in deze klas.</p>'}
    </div></div>`;
    root.querySelector('[data-back]').addEventListener('click', () => stepCode());
    root.querySelectorAll('.name-tile').forEach((b) => b.addEventListener('click', () => {
      chosen = students.find((s) => s.id === Number(b.dataset.id));
      stepPassword();
    }));
    root.querySelector('.name-tile')?.focus();
  }

  function stepPassword(error = '') {
    root.innerHTML = `<div class="center-page"><div class="card login-box">
      <p><button class="btn btn-ghost btn-sm" data-back>${icon('back')} Terug</button></p>
      ${chosen ? guitarSvg(chosen.avatar, { size: 90 }) : ''}
      <h1>${chosen ? `Hoi ${esc(chosen.name)}!` : 'Inloggen'}</h1>
      <form data-form="pw">
        ${chosen ? '' : '<input class="input pw-input" name="naam" placeholder="Je naam" autocomplete="username" required style="margin-bottom:12px">'}
        <p class="muted">Typ je wachtwoord.</p>
        <input class="input pw-input" name="password" type="password" autocomplete="current-password" spellcheck="false" aria-label="Wachtwoord" required>
        <p class="form-error" role="alert">${esc(error)}</p>
        <button class="btn btn-primary btn-big" type="submit">Op het podium! ${icon('note')}</button>
      </form>
    </div></div>`;
    root.querySelector('[data-back]').addEventListener('click', () => (students ? stepName() : stepCode()));
    const form = root.querySelector('form');
    (form.elements.naam || form.elements.password).focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await api('POST', '/api/auth/student/login', {
          code: cls.code, studentId: chosen?.id, name: form.elements.naam?.value, password: form.elements.password.value,
        });
        setStudentState(r.state);
        go('#/kaart');
      } catch (err) {
        stepPassword(err.message);
      }
    });
  }

  stepCode();
}
