import { api, esc, modal, toast } from '../lib.js';
import { icon } from '../icons.js';
import { go } from '../app.js';
import { shell } from './shell.js';

export default async function classSettings(root, params) {
  const classId = Number(params.classId);
  const { class: c } = await api('GET', `/api/teacher/classes/${classId}`);
  const s = c.settings;
  const main = shell(root, 'dashboard', `
    <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> / <a href="#/klas/${c.id}">${esc(c.name)}</a> / Instellingen</div>
    <h1>Instellingen van ${esc(c.name)}</h1>
    <form data-form class="settings-grid">
      <div class="card">
        <h2 style="font-size:1.1rem">Algemeen</h2>
        <div class="field"><label for="n">Naam</label><input id="n" name="cname" value="${esc(c.name)}" required></div>
        <div class="field"><label for="g">Groep</label><select id="g" name="groep">${[6, 7, 8].map((g) => `<option value="${g}" ${c.groep === g ? 'selected' : ''}>Groep ${g}</option>`).join('')}</select>
          <span class="hint">Bepaalt de doelsnelheid: aan het eind groep 6 ± 80, groep 7 ± 100, groep 8 ± 120 aanslagen per minuut.</span></div>
        <div class="field"><label for="w">Weekdoel (minuten)</label><input id="w" name="weeklyGoalMinutes" type="number" min="0" max="600" value="${s.weeklyGoalMinutes}"><span class="hint">Bijvoorbeeld 4 × 15 minuten = 60 minuten.</span></div>
      </div>
      <div class="card">
        <h2 style="font-size:1.1rem">Leerlijn en spel</h2>
        <div class="field"><label for="m">Volgende les gaat open bij</label><select id="m" name="mastery">
          ${[[1, '1 ster (minstens 85% goed)'], [2, '2 sterren (92% goed en 75% van de doelsnelheid)'], [3, '3 sterren (96% goed en de doelsnelheid)']].map(([v, l]) => `<option value="${v}" ${s.mastery === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
        <label class="check"><input type="checkbox" name="gamesEnabled" ${s.gamesEnabled ? 'checked' : ''}> Spellen aan (Meteorenstorm en Raketrace)</label>
        <label class="check"><input type="checkbox" name="leaderboard" ${s.leaderboard ? 'checked' : ''}> Ranglijst van de week tonen aan leerlingen</label>
        <label class="check"><input type="checkbox" name="showNames" ${s.showNames ? 'checked' : ''}> Namen tonen bij inloggen (anders typt de leerling zelf de naam)</label>
      </div>
      <div class="card">
        <h2 style="font-size:1.1rem">Op school of thuis?</h2>
        <div class="field"><label for="ip">IP-adressen van de school</label><input id="ip" name="schoolIps" value="${esc((s.schoolIps || []).join(', '))}" placeholder="bijv. 84.123.45.67 of 84.123.45.">
          <span class="hint">Vraag dit na bij je ICT-coördinator. Een adres dat eindigt op een punt geldt voor de hele reeks. Zonder adressen toont het volgsysteem "onder/buiten schooltijd". Het IP-adres zelf wordt niet opgeslagen.</span></div>
      </div>
      <div class="row" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Opslaan</button><a class="btn btn-ghost" href="#/klas/${c.id}">Annuleren</a><span class="spacer"></span>
        <button type="button" class="btn btn-danger" data-delete>${icon('trash')} Klas verwijderen</button></div>
    </form>`);
  const form = main.querySelector('[data-form]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    try {
      await api('PATCH', `/api/teacher/classes/${classId}`, {
        name: f.cname.value, groep: Number(f.groep.value),
        settings: {
          weeklyGoalMinutes: Number(f.weeklyGoalMinutes.value), mastery: Number(f.mastery.value), gamesEnabled: f.gamesEnabled.checked,
          leaderboard: f.leaderboard.checked, showNames: f.showNames.checked, schoolIps: f.schoolIps.value,
        },
      });
      toast('Instellingen opgeslagen', 'good');
      go(`#/klas/${classId}`);
    } catch (err) { toast(err.message, 'error'); }
  });
  main.querySelector('[data-delete]').addEventListener('click', async () => {
    const ok = await modal({
      title: `${c.name} verwijderen?`,
      body: `<p>De klas en alle ${c.students} leerlingen met hun resultaten worden definitief verwijderd.</p>`,
      actions: [{ label: 'Annuleren', value: false }, { label: 'Definitief verwijderen', value: true, danger: true }],
    });
    if (!ok) return;
    await api('DELETE', `/api/teacher/classes/${classId}`);
    toast('Klas verwijderd');
    go('#/dashboard');
  });
}
