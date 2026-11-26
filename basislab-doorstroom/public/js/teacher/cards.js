import { api, esc, modal } from '../lib.js';
import { icon } from '../icons.js';
import { rememberCards } from './class.js';
import { session } from '../app.js';

export default async function cards(root, params) {
  const classId = Number(params.classId);
  const data = await api('GET', `/api/teacher/classes/${classId}`);
  const c = data.class;
  let list = [];
  try { list = JSON.parse(sessionStorage.getItem(`bd_cards_${classId}`) || '[]'); } catch { list = []; }
  const url = `${location.origin}/`;
  const logo = session.school?.logo ? `<img src="/api/school/logo?v=${encodeURIComponent(session.school.logo)}" alt="" style="width:64px;height:64px;object-fit:contain">` : '<img src="/img/basislab-doorstroom-logo.png" alt="" width="72" height="72">';

  function render() {
    root.innerHTML = `<div class="print-page">
      <div class="print-bar no-print">
        <a class="btn" href="#/klas/${classId}/leerlingen">${icon('back')} Terug naar ${esc(c.name)}</a>
        ${list.length ? `<button class="btn btn-primary" data-print>${icon('print')} Afdrukken</button>` : ''}
        <button class="btn" data-reset>${icon('key')} Nieuwe wachtwoorden voor de hele klas</button>
      </div>
      ${list.length ? `<div class="cards-grid">${list.map((s) => `<div class="login-card">${logo}
          <div><h3>${esc(s.name)}</h3><dl>
            <dt>Website</dt><dd>${esc(url)}</dd><dt>Klascode</dt><dd>${esc(c.code)}</dd><dt>Naam</dt><dd>${esc(s.name)}</dd><dt>Wachtwoord</dt><dd>${esc(s.password)}</dd>
          </dl></div></div>`).join('')}</div>`
        : `<div class="card"><h1 style="font-size:1.4rem">Inlogkaarten</h1>
          <p>Wachtwoorden worden versleuteld opgeslagen en zijn daarom niet meer op te vragen. Maak nieuwe wachtwoorden voor de hele klas, of voor één leerling op de leerlingpagina.</p>
          <p>Klascode: <b>${esc(c.code)}</b> · website: <b>${esc(url)}</b></p></div>`}
    </div>`;
    root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    root.querySelector('[data-reset]').addEventListener('click', async () => {
      const ok = await modal({ title: 'Nieuwe wachtwoorden?', body: `<p>Alle ${c.students} leerlingen van ${esc(c.name)} krijgen een nieuw wachtwoord. De oude werken daarna niet meer.</p>`,
        actions: [{ label: 'Annuleren', value: false }, { label: 'Ja, nieuwe wachtwoorden', value: true, primary: true }] });
      if (!ok) return;
      const r = await api('POST', `/api/teacher/classes/${classId}/reset-passwords`);
      list = r.students; rememberCards(classId, list); render();
    });
  }
  render();
}
