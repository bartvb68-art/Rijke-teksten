import { api, esc, modal, toast } from '../lib.js';
import { icon } from '../icons.js';
import { go } from '../app.js';
import { shell } from './shell.js';

export default async function dashboard(root) {
  const { classes } = await api('GET', '/api/teacher/classes');
  const main = shell(root, 'dashboard', `
    <div class="row" style="margin-bottom:8px"><h1 style="margin:0">Mijn klassen</h1><span class="spacer"></span>
      <button class="btn btn-primary" data-new>${icon('plus')} Nieuwe klas</button></div>
    ${classes.length ? `<div class="class-cards">${classes.map((c) => `
      <a class="class-card" href="#/klas/${c.id}" data-class="${c.id}">
        <div class="row"><h2>${esc(c.name)}</h2><span class="spacer"></span><span class="chip">groep ${c.groep}</span></div>
        <div class="row"><span class="code-chip" title="Klascode">${esc(c.code)}</span>${c.alerts ? `<span class="chip warning">${icon('alert')} ${c.alerts} ${c.alerts === 1 ? 'signaal' : 'signalen'}</span>` : '<span class="chip good">' + icon('check') + ' geen signalen</span>'}</div>
        <div class="meta">
          <div><b>${c.summary.count}</b>leerlingen</div>
          <div><b>${c.summary.activeWeek}</b>actief deze week</div>
          <div><b>${c.summary.goalReached}</b>weekdoel gehaald</div>
          <div><b>${c.summary.avgApm ?? '–'}</b>gem. aanslagen/min</div>
          <div><b>${c.summary.avgAcc != null ? `${c.summary.avgAcc}%` : '–'}</b>gem. nauwkeurig</div>
          <div><b>${c.summary.diplomas}</b>diploma's</div>
        </div>
      </a>`).join('')}</div>`
    : `<div class="card empty">${icon('users')}<h2>Nog geen klassen</h2>
        <p>Maak een klas aan, voeg leerlingen toe en print de inlogkaarten. Leerlingen loggen in met de klascode, hun naam en een eigen wachtwoord, op school én thuis.</p>
        <button class="btn btn-primary" data-new>${icon('plus')} Eerste klas maken</button></div>`}
  `);

  main.querySelectorAll('[data-new]').forEach((b) => b.addEventListener('click', newClass));

  async function newClass() {
    const r = await modal({
      title: 'Nieuwe klas',
      withData: true,
      body: `<form><div class="field"><label for="c-name">Naam van de klas</label><input id="c-name" name="cname" placeholder="Groep 7b" required></div>
        <div class="field"><label for="c-groep">Groep</label><select id="c-groep" name="groep"><option value="6">Groep 6</option><option value="7" selected>Groep 7</option><option value="8">Groep 8</option></select>
        <span class="hint">De groep bepaalt de doelsnelheid voor de sterren.</span></div>
        <div class="field"><label for="c-goal">Weekdoel (minuten oefenen)</label><input id="c-goal" name="goal" type="number" min="0" max="600" value="60"></div>
        <button type="submit" hidden></button></form>`,
      actions: [{ label: 'Annuleren', value: false }, { label: 'Klas maken', value: true, primary: true }],
    });
    if (!r.value) return;
    const v = r.data;
    try {
      const c = await api('POST', '/api/teacher/classes', { name: v.cname || 'Mijn klas', groep: Number(v.groep), settings: { weeklyGoalMinutes: Number(v.goal) || 60 } });
      toast('Klas gemaakt', 'good');
      go(`#/klas/${c.id}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }
}
