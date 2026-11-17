import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { refreshMe, go } from '../app.js';
import { shell } from './shell.js';

export default async function teacherLogin(root) {
  let mode = 'login';
  const meta = await api('GET', '/api/meta').catch(() => ({}));

  function render(error = '') {
    const main = shell(root, '', `<div style="max-width:440px;margin:40px auto">
      <div class="card">
        <div class="tabs" role="tablist">
          <button role="tab" class="${mode === 'login' ? 'active' : ''}" data-mode="login">Inloggen</button>
          <button role="tab" class="${mode === 'register' ? 'active' : ''}" data-mode="register">Account maken</button>
        </div>
        <h1 style="font-size:1.4rem">${mode === 'login' ? 'Inloggen als leerkracht' : 'Nieuw leerkracht-account'}</h1>
        <form novalidate>
          ${mode === 'register' ? `
            <div class="field"><label for="f-name">Naam</label><input id="f-name" name="naam" autocomplete="name" placeholder="Juf Sanne" required></div>
            <div class="field"><label for="f-school">School</label><input id="f-school" name="school" autocomplete="organization" placeholder="Basisschool De Sterrenwacht"></div>` : ''}
          <div class="field"><label for="f-email">E-mailadres</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="f-pw">Wachtwoord</label><input id="f-pw" name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required>${mode === 'register' ? '<span class="hint">Minimaal 8 tekens.</span>' : ''}</div>
          ${mode === 'register' && meta.signupCode ? '<div class="field"><label for="f-code">Registratiecode van de school</label><input id="f-code" name="signupCode" required><span class="hint">Deze code krijg je van de beheerder.</span></div>' : ''}
          <p class="form-error" role="alert">${esc(error)}</p>
          <button class="btn btn-primary" type="submit" style="width:100%">${mode === 'login' ? 'Inloggen' : 'Account maken'}</button>
        </form>
      </div>
      <p class="muted" style="text-align:center;margin-top:16px"><a href="#/leerling">${icon('rocket')} Naar inloggen voor leerlingen</a></p>
    </div>`);
    main.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
    const form = main.querySelector('form');
    form.querySelector('input').focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements;
      try {
        if (mode === 'login') {
          await api('POST', '/api/auth/teacher/login', { email: f.email.value, password: f.password.value });
        } else {
          await api('POST', '/api/auth/teacher/register', {
            name: f.naam.value, school: f.school.value, email: f.email.value, password: f.password.value, signupCode: f.signupCode?.value,
          });
        }
        await refreshMe();
        go('#/dashboard');
      } catch (err) {
        render(err.message);
      }
    });
  }
  render();
}
