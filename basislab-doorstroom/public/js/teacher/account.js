import { api, esc, toast } from '../lib.js';
import { session, refreshMe, go } from '../app.js';
import { shell } from './shell.js';

export default function account(root) {
  const t = session.teacher;
  const first = !!t.must_change;
  const main = shell(root, 'account', `<div style="max-width:520px">
    <h1>Mijn account</h1>
    ${first ? '<div class="card" style="border-color:var(--warning);margin-bottom:16px"><b>Welkom!</b> Je bent ingelogd met een tijdelijk wachtwoord. Kies hieronder een eigen wachtwoord om verder te gaan.</div>' : ''}
    <form class="card" data-form>
      <div class="field"><label for="a-name">Naam</label><input id="a-name" name="naam" value="${esc(t.name)}" required></div>
      <div class="field"><label>E-mailadres</label><input value="${esc(t.email)}" disabled></div>
      <h2 style="font-size:1.05rem;margin-top:18px">${first ? 'Kies je eigen wachtwoord' : 'Wachtwoord wijzigen'}</h2>
      <div class="field"><label for="a-old">${first ? 'Tijdelijk wachtwoord' : 'Huidig wachtwoord'}</label><input id="a-old" name="oud" type="password" autocomplete="current-password" ${first ? 'required' : ''}></div>
      <div class="field"><label for="a-new">Nieuw wachtwoord</label><input id="a-new" name="nieuw" type="password" autocomplete="new-password" minlength="8" ${first ? 'required' : ''}><span class="hint">Minimaal 8 tekens.</span></div>
      <div class="field"><label for="a-new2">Nieuw wachtwoord herhalen</label><input id="a-new2" name="nieuw2" type="password" autocomplete="new-password" ${first ? 'required' : ''}></div>
      <p class="form-error" role="alert" data-error></p>
      <button class="btn btn-primary" type="submit">Opslaan</button>
    </form></div>`);
  const form = main.querySelector('[data-form]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const err = main.querySelector('[data-error]');
    err.textContent = '';
    if (f.nieuw.value || first) {
      if (f.nieuw.value.length < 8) { err.textContent = 'Het nieuwe wachtwoord moet minimaal 8 tekens hebben.'; return; }
      if (f.nieuw.value !== f.nieuw2.value) { err.textContent = 'De twee nieuwe wachtwoorden zijn niet gelijk.'; return; }
    }
    try {
      await api('PATCH', '/api/teacher/me', { name: f.naam.value, ...(f.nieuw.value ? { password: f.oud.value, newPassword: f.nieuw.value } : {}) });
      await refreshMe();
      toast('Opgeslagen', 'good');
      if (first) go('#/dashboard');
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
}
