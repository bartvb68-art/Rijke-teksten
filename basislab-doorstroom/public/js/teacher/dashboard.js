import { api, esc, modal, toast } from '../lib.js';
import { icon } from '../icons.js';
import { go } from '../app.js';
import { shell } from './shell.js';
import { DOMAINS, DEFAULT_TOETS_DAY, weekLabel } from '../shared/skills.js';
import { stackBar } from '../charts.js';
import { skillLabel, niveauLegend } from '../ui.js';

export default async function dashboard(root) {
  const { classes } = await api('GET', '/api/teacher/classes');
  const main = shell(root, 'dashboard', `
    <div class="page-head"><h1>Mijn klassen</h1><span class="spacer"></span><button class="btn btn-primary" data-new>${icon('plus')} Nieuwe klas</button></div>
    ${classes.length ? `<div class="grid2">${classes.map((c) => `<a class="card stack" href="#/klas/${c.id}" style="text-decoration:none;color:inherit" data-class="${c.id}">
      <div class="card-head"><h2>${esc(c.name)}</h2><span class="chip">groep ${c.groep}</span><span class="spacer"></span>${c.summary.alerts ? `<span class="chip warning">${icon('alert')} ${c.summary.alerts} signalen</span>` : ''}</div>
      <div class="grid3">
        <div class="stat"><small>Leerlingen</small><strong>${c.summary.count}</strong><span>${c.summary.activeWeek} actief deze week</span></div>
        <div class="stat"><small>Weektaak af</small><strong>${c.summary.weekDone}</strong><span>van ${c.summary.count}</span></div>
        <div class="stat"><small>Goed deze week</small><strong>${c.summary.pctWeek != null ? `${c.summary.pctWeek}%` : '–'}</strong><span>${c.summary.answersWeek} opgaven</span></div>
      </div>
      <div><div class="label" style="margin-bottom:6px">Deze week${c.week.index >= 0 ? ` (week ${c.week.index + 1} van ${c.week.total}, ${esc(weekLabel(c.week.week))})` : ''}</div>
        <div class="focus-chips">${c.week.holiday ? '<span class="chip">vakantie</span>' : ''}${c.week.test ? `<span class="chip good">${icon('test')} proeftoets</span>` : ''}${(c.week.focus || []).map(skillLabel).join('')}${!c.week.holiday && !(c.week.focus || []).length && !c.week.test ? '<span class="muted">herhaling</span>' : ''}</div></div>
      <div class="stack" style="gap:8px">${DOMAINS.map((d) => `<div class="row" style="flex-wrap:nowrap"><span style="width:120px;flex:none" class="dom"><i style="background:var(--${d.id})"></i>${esc(d.name)}</span><span style="flex:1">${stackBar(c.distribution[d.id])}</span></div>`).join('')}</div>
      <p class="muted" style="margin:0;font-size:.85rem">Klascode <b>${esc(c.code)}</b> · doorstroomtoets ${esc(new Date(`${c.toets}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }))}</p>
    </a>`).join('')}</div>${niveauLegend()}`
    : `<div class="card"><h2>Welkom!</h2><p>Maak eerst een klas. Daarna voeg je leerlingen toe en print je de inlogkaarten. De weekplanning tot de doorstroomtoets staat meteen klaar; je kunt hem per week aanpassen.</p>
       <button class="btn btn-primary" data-new>${icon('plus')} Nieuwe klas maken</button></div>`}
  `);
  main.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', async () => {
    const r = await modal({
      title: 'Nieuwe klas', withData: true,
      body: `<form><div class="field"><label for="c-name">Naam van de klas</label><input id="c-name" name="name" placeholder="Groep 8a" required></div>
        <div class="field"><label for="c-groep">Groep</label><select id="c-groep" name="groep"><option value="8" selected>Groep 8</option><option value="7">Groep 7 (vooruit oefenen)</option></select></div>
        <div class="field"><label for="c-toets">Datum van de doorstroomtoets</label><input id="c-toets" name="toets" type="date" value="${DEFAULT_TOETS_DAY}" required>
          <span class="hint">In 2027 is de afname tussen 25 januari en 12 februari. Je kunt dit later aanpassen.</span></div><button hidden></button></form>`,
      actions: [{ label: 'Annuleren', value: false }, { label: 'Klas maken', value: true, primary: true }],
    });
    if (!r?.value) return;
    try {
      const c = await api('POST', '/api/teacher/classes', { name: r.data.name, groep: Number(r.data.groep), settings: { toets: r.data.toets } });
      toast('Klas gemaakt. Voeg nu leerlingen toe.', 'good');
      go(`#/klas/${c.id}/leerlingen`);
    } catch (err) { toast(err.message, 'error'); }
  }));
}
