import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { SKILL_BY_ID, weekLabel } from '../shared/skills.js';
import { sheetsHtml } from '../sheet.js';

const UITLEG = {
  huiswerk: 'Per leerling een huiswerkblad op het eigen niveau, met de onderdelen van de weektaak (en eigen leerdoelen). Elke keer printen geeft nieuwe opgaven.',
  remediering: 'Per leerling in de instructiegroep een oefenblad: eerst een korte uitleg met voorbeeld, daarna opgaven die beginnen onder het eigen niveau en langzaam moeilijker worden.',
  verrijking: 'Per leerling uit de verrijkingsgroep een blad met opgaven boven het eigen niveau.',
};

export default async function werkbladen(root, { classId, soort, skill }) {
  const qs = new URLSearchParams((location.hash.split('?')[1]) || '');
  const students = qs.get('leerlingen') || '';
  let count = soort === 'huiswerk' ? '' : '12';
  let answers = true;

  async function load() {
    root.innerHTML = '<div class="ws-wrap"><p class="muted">Werkbladen worden gemaakt…</p></div>';
    const params = new URLSearchParams({ soort });
    if (skill) params.set('skill', skill);
    if (students) params.set('students', students);
    if (count) params.set('count', count);
    let data;
    try { data = await api('GET', `/api/teacher/classes/${classId}/werkbladen?${params}`); } catch (err) {
      root.innerHTML = `<div class="ws-wrap"><div class="card"><p>${esc(err.message)}</p><a class="btn" href="#/klas/${classId}">${icon('back')} Terug</a></div></div>`; return;
    }
    const subtitle = soort === 'huiswerk' ? `week van ${weekLabel(data.week.week)}` : SKILL_BY_ID[skill]?.name || '';
    root.innerHTML = `<div class="ws-wrap">
      <div class="ws-bar no-print">
        <a class="btn" href="#/klas/${classId}/${soort === 'huiswerk' ? 'overzicht' : 'groepjes'}">${icon('back')} Terug naar ${esc(data.class.name)}</a>
        <button class="btn btn-primary" data-print>${icon('print')} Afdrukken (${data.sheets.length} ${data.sheets.length === 1 ? 'leerling' : 'leerlingen'})</button>
        <label class="row" style="gap:6px">Opgaven per blad <select data-count>${[8, 10, 12, 15, 20, 25, 30].map((v) => `<option ${String(v) === String(count || (data.sheets[0]?.sections.reduce((x, s) => x + s.items.length, 0) || 20)) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="check" style="padding:0"><input type="checkbox" data-key ${answers ? 'checked' : ''}><span>Nakijkblad erbij</span></label>
        <button class="btn btn-ghost btn-sm" data-new>${icon('shuffle')} Nieuwe opgaven</button>
      </div>
      <p class="no-print muted" style="max-width:70ch">${esc(UITLEG[soort])}</p>
      ${data.sheets.length ? sheetsHtml(data, { answers, subtitle }) : '<div class="card"><p>Er zijn (nog) geen leerlingen voor dit werkblad. Een instructie- of verrijkingsgroep ontstaat na minstens 5 opgaven per leerling op dit onderdeel.</p></div>'}
    </div>`;
    root.querySelector('[data-print]').addEventListener('click', () => window.print());
    root.querySelector('[data-count]').addEventListener('change', (e) => { count = e.target.value; load(); });
    root.querySelector('[data-key]').addEventListener('change', (e) => { answers = e.target.checked; root.querySelectorAll('.ws-key').forEach((k) => { k.hidden = !answers; }); });
    root.querySelector('[data-new]').addEventListener('click', () => load());
  }
  await load();
}
