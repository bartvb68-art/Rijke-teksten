import { esc, api, modal } from '../lib.js';
import { icon } from '../icons.js';
import { session, logout, schoolLogoHtml, setStudentState } from '../app.js';
import { canSpeak } from '../speak.js';

export function studentShell(root, content, { active = '' } = {}) {
  const st = session.state;
  root.innerHTML = `<header class="s-top">
      <a class="brand" href="#/start"><img src="/img/icon.svg" alt="">Basislab Doorstroom</a>
      ${schoolLogoHtml({ size: 30 })}
      <span class="spacer"></span>
      <nav class="row" aria-label="Menu" style="gap:6px">
        <a class="btn btn-ghost btn-sm ${active === 'start' ? 'active' : ''}" href="#/start">${icon('home')} Start</a>
        <a class="btn btn-ghost btn-sm ${active === 'niveau' ? 'active' : ''}" href="#/niveau">${icon('chart')} Mijn niveau</a>
        <button class="btn btn-ghost btn-sm" data-prefs title="Weergave en voorlezen">Aa</button>
      </nav>
      <span class="who"><span class="xp" title="Dagen achter elkaar geoefend">${icon('flame')} ${st?.streak || 0}</span><span class="xp" title="Punten">${icon('star')} ${st?.student.xp || 0}</span>${esc(st?.student.name || '')}</span>
      <button class="btn btn-ghost btn-sm" data-logout>${icon('logout')} Uitloggen</button>
    </header>
    <main class="s-main">${content}</main>`;
  root.querySelector('[data-logout]').addEventListener('click', () => logout());
  root.querySelector('[data-prefs]').addEventListener('click', () => prefsDialog(root));
  return root.querySelector('.s-main');
}

async function prefsDialog() {
  const s = session.state.student.settings;
  const res = await modal({
    title: 'Weergave',
    body: `<form>
      <label class="check"><input type="checkbox" name="largeText" ${s.largeText ? 'checked' : ''}><span>Grotere letters</span></label>
      <label class="check"><input type="checkbox" name="dyslexia" ${s.dyslexia ? 'checked' : ''}><span>Meer ruimte tussen letters en regels</span></label>
      ${canSpeak() ? `<label class="check"><input type="checkbox" name="readAloud" ${s.readAloud ? 'checked' : ''}><span>Knop om opgaven en teksten te laten voorlezen</span></label>` : ''}
    </form>`,
    actions: [{ label: 'Annuleren', value: false }, { label: 'Opslaan', value: true, primary: true }],
    withData: true,
  });
  if (!res?.value) return;
  const st = await api('POST', '/api/student/settings', { largeText: !!res.data.largeText, dyslexia: !!res.data.dyslexia, readAloud: !!res.data.readAloud });
  setStudentState(st);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
