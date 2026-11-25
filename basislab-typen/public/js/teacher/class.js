import { api, esc, modal, toast, timeAgo, fmtDay } from '../lib.js';
import { icon } from '../icons.js';
import { rocketSvg } from '../avatar.js';
import { go } from '../app.js';
import { shell } from './shell.js';
import { barChart, keyHeatmap, worstKeys, SERIES } from './charts.js';
import { LESSONS } from '../shared/curriculum.js';

export function alertChip(a) {
  const ic = a.level === 'good' ? 'check' : a.level === 'serious' ? 'alert' : 'info';
  return `<span class="chip ${a.level}">${icon(ic)} ${esc(a.text)}</span>`;
}

export function rememberCards(classId, list) {
  try {
    sessionStorage.setItem(`st_cards_${classId}`, JSON.stringify(list));
  } catch { /* privémodus */ }
}

export async function addStudentsDialog(classId) {
  const r = await modal({
    title: 'Leerlingen toevoegen',
    withData: true,
    body: `<form><div class="field"><label for="s-names">Namen (één per regel)</label>
      <textarea id="s-names" name="names" rows="10" class="note-box" placeholder="Emma\nNoah\nSara de V."></textarea>
      <span class="hint">Gebruik alleen een voornaam (eventueel met eerste letter van de achternaam). Iedere leerling krijgt automatisch een eigen wachtwoord.</span></div></form>`,
    actions: [{ label: 'Annuleren', value: false }, { label: 'Toevoegen', value: true, primary: true }],
  });
  if (!r.value) return false;
  const names = String(r.data.names || '').split(/\r?\n/).map((n) => n.trim()).filter(Boolean);
  if (!names.length) return false;
  try {
    const res = await api('POST', `/api/teacher/classes/${classId}/students`, { names });
    rememberCards(classId, res.created);
    const choice = await modal({
      title: `${res.created.length} ${res.created.length === 1 ? 'leerling' : 'leerlingen'} toegevoegd`,
      body: `${res.skipped.length ? `<p>Al in de klas (overgeslagen): ${res.skipped.map(esc).join(', ')}</p>` : ''}
        <p>Print nu de inlogkaarten. De wachtwoorden worden versleuteld opgeslagen en zijn later niet meer te zien (je kunt ze wel opnieuw instellen).</p>
        <div class="table-wrap"><table class="table"><thead><tr><th>Naam</th><th>Wachtwoord</th></tr></thead><tbody>${res.created.map((s) => `<tr><td>${esc(s.name)}</td><td><code>${esc(s.password)}</code></td></tr>`).join('')}</tbody></table></div>`,
      actions: [{ label: 'Sluiten', value: false }, { label: 'Inlogkaarten printen', value: true, primary: true }],
    });
    if (choice) go(`#/klas/${classId}/kaarten`);
    return true;
  } catch (err) {
    toast(err.message, 'error');
    return false;
  }
}

export default async function classView(root, params) {
  const classId = Number(params.classId);
  const data = await api('GET', `/api/teacher/classes/${classId}`);
  const c = data.class;
  const sum = data.summary;
  let sortKey = 'name';
  let sortAsc = true;
  let filter = '';
  let onlyAlerts = false;

  const main = shell(root, 'dashboard', `
    <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> / ${esc(c.name)}</div>
    <div class="row" style="margin-bottom:6px">
      <h1 style="margin:0">${esc(c.name)}</h1>
      <span class="chip">groep ${c.groep}</span>
      <span class="code-chip" title="Klascode voor het inloggen">${icon('key')} ${esc(c.code)}</span>
      <span class="spacer"></span>
      <button class="btn btn-primary" data-add>${icon('plus')} Leerlingen toevoegen</button>
      <a class="btn btn-ghost" href="#/klas/${c.id}/kaarten">${icon('print')} Inlogkaarten</a>
      <a class="btn btn-ghost" href="/api/teacher/classes/${c.id}/export.csv" download>${icon('download')} Exporteren</a>
      <a class="btn btn-ghost" href="#/klas/${c.id}/instellingen">${icon('settings')} Instellingen</a>
    </div>
    <div class="tiles">
      <div class="tile"><div class="label">Leerlingen</div><div class="value">${sum.count}</div><div class="sub">${sum.activeWeek} actief deze week</div></div>
      <div class="tile"><div class="label">Weekdoel gehaald</div><div class="value">${sum.goalReached} / ${sum.count}</div><div class="sub">doel: ${c.settings.weeklyGoalMinutes} min per week</div></div>
      <div class="tile"><div class="label">Oefentijd deze week</div><div class="value">${sum.minutesWeek} min</div><div class="sub">hele klas samen</div></div>
      <div class="tile"><div class="label">Gem. snelheid</div><div class="value">${sum.avgApm ?? '–'}</div><div class="sub">aanslagen per minuut</div></div>
      <div class="tile"><div class="label">Gem. nauwkeurigheid</div><div class="value">${sum.avgAcc != null ? `${sum.avgAcc}%` : '–'}</div><div class="sub">laatste oefeningen</div></div>
      <div class="tile"><div class="label">Typediploma</div><div class="value">${sum.diplomas}</div><div class="sub">leerlingen geslaagd</div></div>
    </div>
    <div class="panels">
      <section class="panel third"><h2>Signalen</h2><p class="panel-sub">Wie heeft extra aandacht nodig?</p><div class="alert-list" data-alerts></div></section>
      <section class="panel two-third"><h2>Oefentijd per dag</h2><p class="panel-sub">Minuten geoefend door de hele klas, laatste 14 dagen</p><div data-daily></div></section>
      <section class="panel wide">
        <div class="row" style="margin-bottom:10px"><h2 style="margin:0">Leerlingen</h2><span class="spacer"></span>
          <label class="check" style="margin:0"><input type="checkbox" data-only-alerts> Alleen met signalen</label>
          <input class="input" data-search placeholder="Zoek op naam" style="max-width:220px" aria-label="Zoek leerling"></div>
        <div class="table-wrap" data-table></div>
      </section>
      <section class="panel"><h2>Waar is de klas?</h2><p class="panel-sub">Aantal leerlingen per planeet (huidige les)</p><div data-planets></div></section>
      <section class="panel"><h2>Lastige toetsen in de klas</h2><p class="panel-sub">Foutpercentage per toets, laatste 30 dagen</p><div data-keys></div><div data-worst style="margin-top:10px"></div></section>
    </div>`);

  main.querySelector('[data-add]').addEventListener('click', async () => {
    if (await addStudentsDialog(c.id)) classView(root, params);
  });

  // signalen
  const alerts = data.students.flatMap((s) => s.alerts.map((a) => ({ ...a, s })));
  const order = { serious: 0, warning: 1, good: 2 };
  alerts.sort((a, b) => order[a.level] - order[b.level]);
  main.querySelector('[data-alerts]').innerHTML = alerts.length
    ? alerts.slice(0, 12).map((a) => `<a class="alert-item ${a.level === 'good' ? 'good' : ''}" href="#/klas/${c.id}/leerling/${a.s.id}">${icon(a.level === 'good' ? 'check' : 'alert')}<span><b>${esc(a.s.name)}</b><br><span class="muted">${esc(a.text)}</span></span></a>`).join('')
      + (alerts.length > 12 ? `<p class="muted">en nog ${alerts.length - 12} meer…</p>` : '')
    : `<p class="muted">${data.students.length ? 'Geen signalen. Iedereen is goed bezig!' : 'Voeg eerst leerlingen toe.'}</p>`;

  barChart(main.querySelector('[data-daily]'), {
    data: data.daily.map((d) => ({ label: fmtDay(d.day), value: d.minutes, tip: `<b>${fmtDay(d.day)}</b><br>${d.minutes} minuten · ${d.active} ${d.active === 1 ? 'leerling' : 'leerlingen'}` })),
    unit: ' min',
    height: 300,
  });
  barChart(main.querySelector('[data-planets]'), {
    data: [...data.planets.map((p) => ({ label: p.name.replace('Planeet ', ''), value: p.count, tip: `<b>${esc(p.name)}</b><br>${p.count} leerlingen` })),
      { label: 'Diploma', value: sum.diplomas, tip: `<b>Diploma gehaald</b><br>${sum.diplomas} leerlingen` }],
    color: SERIES.aqua,
    height: 180,
  });
  keyHeatmap(main.querySelector('[data-keys]'), data.keys.keys, { minHits: 15 });
  const worst = worstKeys(data.keys.keys, 5, 15);
  main.querySelector('[data-worst]').innerHTML = worst.length
    ? `<p class="muted" style="margin:0">Meeste fouten: ${worst.map((w) => `<b>${esc(w.key.toUpperCase())}</b> (${Math.round(w.rate * 100)}%)`).join(', ')}</p>` : '';

  // tabel
  const cols = [
    { key: 'name', label: 'Naam' },
    { key: 'currentLesson', label: 'Les', num: true },
    { key: 'totalStars', label: 'Sterren', num: true },
    { key: 'recentApm', label: 'Aanslagen/min', num: true },
    { key: 'recentAcc', label: 'Nauwkeurig', num: true },
    { key: 'minutesWeek', label: 'Deze week', num: true },
    { key: 'lastActive', label: 'Laatst actief', num: true },
    { key: 'alerts', label: 'Signalen' },
  ];

  function renderTable() {
    const rows = data.students
      .filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
      .filter((s) => !onlyAlerts || s.alerts.some((a) => a.level !== 'good'))
      .sort((a, b) => {
        let va = a[sortKey];
        let vb = b[sortKey];
        if (sortKey === 'alerts') { va = a.alerts.filter((x) => x.level !== 'good').length; vb = b.alerts.filter((x) => x.level !== 'good').length; }
        if (va == null) return 1;
        if (vb == null) return -1;
        const r = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
        return sortAsc ? r : -r;
      });
    const tbl = main.querySelector('[data-table]');
    if (!data.students.length) {
      tbl.innerHTML = `<div class="empty">${icon('users')}<p>Nog geen leerlingen in deze klas.</p><button class="btn btn-primary" data-add2>${icon('plus')} Leerlingen toevoegen</button></div>`;
      tbl.querySelector('[data-add2]').addEventListener('click', async () => { if (await addStudentsDialog(c.id)) classView(root, params); });
      return;
    }
    tbl.innerHTML = `<table class="table">
      <thead><tr>${cols.map((col) => `<th class="${col.num ? 'num' : ''} ${sortKey === col.key ? `sorted ${sortAsc ? 'asc' : ''}` : ''}" data-sort="${col.key}" scope="col" aria-sort="${sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : 'none'}">${col.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((s) => {
        const pct = s.weeklyGoal ? Math.min(100, Math.round((s.minutesWeek / s.weeklyGoal) * 100)) : 100;
        const trend = s.apmTrend == null ? '' : s.apmTrend > 1 ? ` <span class="muted" title="stijgend">▲ ${s.apmTrend}</span>` : s.apmTrend < -1 ? ` <span class="muted" title="dalend">▼ ${Math.abs(s.apmTrend)}</span>` : '';
        return `<tr data-student="${s.id}" tabindex="0">
          <td><span class="name-cell">${rocketSvg(s.avatar, { size: 28, flame: false })}${esc(s.name)}${s.diploma ? ` <span class="chip good">${icon('diploma')} diploma</span>` : ''}</span></td>
          <td class="num" title="${esc(s.currentLessonTitle || '')}">${s.currentLesson} <span class="muted">/ ${LESSONS.length}</span></td>
          <td class="num">${s.totalStars}</td>
          <td class="num">${s.recentApm != null ? Math.round(s.recentApm) : '–'}${trend}</td>
          <td class="num">${s.recentAcc != null ? `${Math.round(s.recentAcc)}%` : '–'}</td>
          <td class="num"><span class="meter ${pct >= 100 ? 'full' : ''}"><i style="width:${pct}%"></i></span>${s.minutesWeek} min</td>
          <td class="num">${timeAgo(s.lastActive)}</td>
          <td>${s.alerts.filter((a) => a.level !== 'good').map(alertChip).join(' ') || '<span class="muted">–</span>'}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
    tbl.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
      if (sortKey === th.dataset.sort) sortAsc = !sortAsc;
      else { sortKey = th.dataset.sort; sortAsc = th.dataset.sort === 'name'; }
      renderTable();
    }));
    tbl.querySelectorAll('tr[data-student]').forEach((tr) => {
      const open = () => go(`#/klas/${c.id}/leerling/${tr.dataset.student}`);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  }
  main.querySelector('[data-search]').addEventListener('input', (e) => { filter = e.target.value; renderTable(); });
  main.querySelector('[data-only-alerts]').addEventListener('change', (e) => { onlyAlerts = e.target.checked; renderTable(); });
  renderTable();
}
