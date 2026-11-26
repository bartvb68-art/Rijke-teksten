import { api, esc, modal, toast, timeAgo, fmtDay, fmtDate } from '../lib.js';
import { icon } from '../icons.js';
import { go } from '../app.js';
import { shell } from './shell.js';
import { DOMAINS, SKILLS, SKILL_BY_ID, skillsOf, weekLabel, niveauFor, NIVEAU_COLORS } from '../shared/skills.js';
import { barChart, stackBar } from '../charts.js';
import { nivChip, skillLabel, niveauLegend, thetaFmt, nivFromTheta } from '../ui.js';

const TABS = [
  ['overzicht', 'Overzicht'], ['leerlingen', 'Leerlingen'], ['vaardigheden', 'Vaardigheden'], ['groepjes', 'Instructiegroepjes'],
  ['planning', 'Weekplanning'], ['proeftoetsen', 'Proeftoetsen'], ['instellingen', 'Instellingen'],
];

export function rememberCards(classId, list) {
  try { sessionStorage.setItem(`bd_cards_${classId}`, JSON.stringify(list)); } catch { /* privémodus */ }
}

const alertChips = (alerts, max = 3) => alerts.slice(0, max).map((a) => `<span class="chip ${a.level === 'good' ? 'good' : a.level === 'serious' ? 'serious' : 'warning'}">${esc(a.text)}</span>`).join(' ') + (alerts.length > max ? ` <span class="chip">+${alerts.length - max}</span>` : '');

export default async function classView(root, { classId, tab = 'overzicht' }) {
  const id = Number(classId);
  if (!TABS.some(([t]) => t === tab)) tab = 'overzicht';
  const data = await api('GET', `/api/teacher/classes/${id}`);
  const c = data.class;
  const main = shell(root, 'dashboard', `
    <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> › ${esc(c.name)}</div>
    <div class="page-head"><h1>${esc(c.name)}</h1><span class="chip">klascode <b>${esc(c.code)}</b></span><span class="spacer"></span>
      <a class="btn btn-sm" href="/api/teacher/classes/${id}/export.csv" download>${icon('download')} Excel (CSV)</a>
      <button class="btn btn-sm" data-cards>${icon('print')} Inlogkaarten</button></div>
    <div class="tabs" role="tablist">${TABS.map(([t, l]) => `<a role="tab" href="#/klas/${id}/${t}" class="${t === tab ? 'active' : ''}" aria-selected="${t === tab}">${l}</a>`).join('')}</div>
    <div data-body></div>`);
  main.querySelector('[data-cards]').addEventListener('click', () => go(`#/klas/${id}/kaarten/print`));
  const body = main.querySelector('[data-body]');
  const views = { overzicht, leerlingen, vaardigheden, groepjes, planning, proeftoetsen, instellingen };
  await views[tab](body, data, id);
}

// ---------- Overzicht ----------
function overzicht(body, data, id) {
  const s = data.summary; const wk = data.week;
  const flagged = data.students.filter((st) => st.alerts.some((a) => a.level !== 'good'));
  body.innerHTML = `
    <div class="grid4" style="margin-bottom:16px">
      <div class="stat"><small>Leerlingen</small><strong>${s.count}</strong><span>${s.activeWeek} actief deze week</span></div>
      <div class="stat"><small>Weektaak af</small><strong>${s.weekDone}</strong><span>van de ${s.count}</span></div>
      <div class="stat"><small>Opgaven deze week</small><strong>${s.answersWeek}</strong><span>${s.pctWeek != null ? `${s.pctWeek}% goed` : 'nog niets gemaakt'}</span></div>
      <div class="stat"><small>Toets over</small><strong>${wk.daysToToets > 0 ? wk.daysToToets : 0}</strong><span>dagen (${esc(new Date(`${wk.toets}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }))})</span></div>
    </div>
    <div class="grid2">
      <section class="card stack">
        <div class="card-head"><h2>Deze week</h2><span class="muted">${wk.index >= 0 ? `week ${wk.index + 1} van ${wk.total} · ${esc(weekLabel(wk.week))}` : ''}</span><span class="spacer"></span><a class="btn btn-sm" href="#/klas/${id}/werkblad/huiswerk">${icon('print')} Huiswerkpakket</a><a class="btn btn-sm" href="#/klas/${id}/planning">${icon('edit')} Planning</a></div>
        <div class="focus-chips">${wk.holiday ? '<span class="chip">vakantie</span>' : ''}${wk.test ? `<span class="chip good">${icon('test')} proeftoets staat open</span>` : ''}${wk.homework ? `<span class="chip good">${icon('print')} huiswerkpakket aan</span>` : ''}${(wk.focus || []).map(skillLabel).join('')}</div>
        <p style="margin:0">Weekdoel: <b>${wk.goal || 0} opgaven</b> per leerling${wk.note ? ` · <i>${esc(wk.note)}</i>` : ''}</p>
        <div class="table-wrap"><table class="list"><thead><tr><th>Leerling</th><th>Weektaak</th><th class="r">% goed</th></tr></thead><tbody>
          ${data.students.slice().sort((a, b) => a.week.done / (a.week.goal || 1) - b.week.done / (b.week.goal || 1)).map((st) => `<tr><td><a class="name" href="#/leerling/${st.id}">${esc(st.name)}</a></td>
            <td style="min-width:160px"><div class="row" style="flex-wrap:nowrap;gap:8px"><div class="bar ${st.week.goal && st.week.done >= st.week.goal ? 'done' : ''}" style="flex:1"><i style="width:${st.week.goal ? Math.min(100, (st.week.done / st.week.goal) * 100) : 0}%"></i></div><span class="num muted" style="font-size:.85rem">${st.week.done}/${st.week.goal}</span></div></td>
            <td class="r num">${st.week.pct != null ? `${st.week.pct}%` : '–'}</td></tr>`).join('')}
        </tbody></table></div>
      </section>
      <div class="stack">
        <section class="card"><h2>Niveauverdeling</h2><p class="muted">Hoeveel leerlingen nu op welk niveau oefenen, per vakgebied.</p>
          <div class="stack" style="gap:12px">${DOMAINS.map((d) => {
            const cnt = data.distribution[d.id];
            return `<div><div class="row" style="justify-content:space-between;margin-bottom:4px"><b class="dom"><i style="background:var(--${d.id})"></i>${esc(d.name)}</b>
              <span class="muted" style="font-size:.85rem">${cnt.onder} &lt;1F · ${cnt['1F']} 1F · ${cnt['1F+']} 1F→ · ${cnt['2F']} ${d.streef}${cnt.onbekend ? ` · ${cnt.onbekend} onbekend` : ''}</span></div>${stackBar(cnt)}</div>`;
          }).join('')}</div><div style="margin-top:12px">${niveauLegend()}</div></section>
        <section class="card"><h2>Signalen</h2>${flagged.length ? `<div class="stack" style="gap:8px">${flagged.map((st) => `<div><a class="name" href="#/leerling/${st.id}" style="font-weight:600">${esc(st.name)}</a> <div class="alert-list" style="margin-top:3px">${alertChips(st.alerts.filter((a) => a.level !== 'good'))}</div></div>`).join('')}</div>` : '<p class="muted">Geen bijzonderheden.</p>'}</section>
      </div>
    </div>
    <section class="card" style="margin-top:16px"><h2>Opgaven per dag</h2><p class="muted">Laatste 14 dagen, hele klas. Beweeg over een staaf voor het aantal leerlingen.</p><div data-daily></div></section>`;
  barChart(body.querySelector('[data-daily]'), { data: data.daily.map((d) => ({ label: fmtDay(d.day), value: d.answers, tip: `<b>${fmtDay(d.day)}</b><br>${d.answers} opgaven · ${d.active} leerlingen` })) });
}

// ---------- Leerlingen ----------
function leerlingen(body, data, id) {
  let sort = { key: 'name', dir: 1 };
  const val = (st, key) => {
    if (key === 'name') return st.name.toLowerCase();
    if (DOMAINS.some((d) => d.id === key)) return st.domains[key].theta ?? -1;
    if (key === 'week') return st.week.goal ? st.week.done / st.week.goal : st.week.done;
    if (key === 'pct') return st.week.pct ?? -1;
    if (key === 'last') return st.lastActive || 0;
    if (key === 'alerts') return st.alerts.filter((a) => a.level !== 'good').length;
    return 0;
  };
  function render() {
    const rows = data.students.slice().sort((a, b) => (val(a, sort.key) > val(b, sort.key) ? 1 : val(a, sort.key) < val(b, sort.key) ? -1 : 0) * sort.dir);
    const th = (key, label, cls = '') => `<th class="${cls}"><button data-sort="${key}">${label}${sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
    body.innerHTML = `<div class="row" style="margin-bottom:12px"><button class="btn btn-primary" data-add>${icon('plus')} Leerlingen toevoegen</button><span class="spacer"></span>${niveauLegend()}</div>
      ${rows.length ? `<div class="card"><div class="table-wrap"><table class="list"><thead><tr>${th('name', 'Leerling')}${DOMAINS.map((d) => th(d.id, d.name)).join('')}${th('week', 'Weektaak')}${th('pct', '% goed (week)', 'r')}${th('last', 'Laatst actief')}${th('alerts', 'Signalen')}</tr></thead>
        <tbody>${rows.map((st) => `<tr><td><a class="name" href="#/leerling/${st.id}">${esc(st.name)}</a></td>
          ${DOMAINS.map((d) => `<td>${nivChip(st.domains[d.id].niveau, { title: `score ${thetaFmt(st.domains[d.id].theta)} · ${st.domains[d.id].n} opgaven` })} <span class="muted num" style="font-size:.8rem">${thetaFmt(st.domains[d.id].theta)}</span></td>`).join('')}
          <td style="min-width:140px"><div class="row" style="flex-wrap:nowrap;gap:8px"><div class="bar ${st.week.goal && st.week.done >= st.week.goal ? 'done' : ''}" style="flex:1"><i style="width:${st.week.goal ? Math.min(100, (st.week.done / st.week.goal) * 100) : 0}%"></i></div><span class="num muted" style="font-size:.85rem">${st.week.done}/${st.week.goal}</span></div></td>
          <td class="r num">${st.week.pct != null ? `${st.week.pct}%` : '–'}</td><td>${esc(timeAgo(st.lastActive))}</td><td><div class="alert-list">${alertChips(st.alerts)}</div></td></tr>`).join('')}</tbody></table></div></div>
        <p class="muted" style="font-size:.88rem">De score loopt van 1 tot 5 (2 = grens 1F, 3,7 = grens 2F/1S). Het niveau verschijnt na ongeveer 8 opgaven per vakgebied.</p>`
        : '<div class="card"><p>Er staan nog geen leerlingen in deze klas.</p></div>'}`;
    body.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.sort; sort = { key: k, dir: sort.key === k ? -sort.dir : (k === 'name' ? 1 : -1) }; render(); }));
    body.querySelector('[data-add]').addEventListener('click', () => addStudents(id));
  }
  render();
}

async function addStudents(id) {
  const r = await modal({
    title: 'Leerlingen toevoegen', withData: true,
    body: `<form><div class="field"><label for="s-names">Voornamen, één per regel</label><textarea id="s-names" name="names" rows="10" placeholder="Noor\nSem\nYara" required></textarea>
      <span class="hint">Gebruik alleen een voornaam (eventueel met een letter erachter). Iedere leerling krijgt een eigen wachtwoord.</span></div></form>`,
    actions: [{ label: 'Annuleren', value: false }, { label: 'Toevoegen', value: true, primary: true }],
  });
  if (!r?.value) return;
  try {
    const res = await api('POST', `/api/teacher/classes/${id}/students`, { names: r.data.names.split(/\n|,/) });
    rememberCards(id, res.created.map((s) => ({ name: s.name, password: s.password })));
    const print = await modal({
      title: `${res.created.length} leerlingen toegevoegd`,
      body: `${res.skipped.length ? `<p>Al in de klas (overgeslagen): ${res.skipped.map(esc).join(', ')}</p>` : ''}<p>De wachtwoorden zijn alleen nu te zien. Print meteen de inlogkaarten.</p>
        <div class="table-wrap"><table class="list"><thead><tr><th>Naam</th><th>Wachtwoord</th></tr></thead><tbody>${res.created.map((s) => `<tr><td>${esc(s.name)}</td><td><code>${esc(s.password)}</code></td></tr>`).join('')}</tbody></table></div>`,
      actions: [{ label: 'Sluiten', value: false }, { label: 'Inlogkaarten printen', value: true, primary: true }],
    });
    if (print) go(`#/klas/${id}/kaarten/print`);
    else go(`#/klas/${id}/leerlingen`);
  } catch (err) { toast(err.message, 'error'); }
}

// ---------- Vaardigheden (heatmap) ----------
function vaardigheden(body, data, id) {
  const focus = new Set(data.week.focus || []);
  const color = (v, domain) => (v ? NIVEAU_COLORS[niveauFor(v.theta, domain).id] : null);
  body.innerHTML = `<div class="card">
    <h2>Niveau per onderdeel</h2>
    <p class="muted">Elke cel is het geschatte niveau van een leerling op een onderdeel (na minstens 3 opgaven). Onderdelen met een blauwe rand zijn de focus van deze week. Klik op een naam voor de details.</p>
    <div class="table-wrap"><table class="heat">
      <thead><tr><th></th>${SKILLS.map((s) => `<th title="${esc(s.desc)}"><span class="dom"><i style="background:var(--${s.domain})"></i>${esc(s.name)}</span></th>`).join('')}</tr></thead>
      <tbody>${data.heat.map((h) => `<tr><th><a class="name" href="#/leerling/${h.id}" style="text-decoration:none;color:inherit">${esc(h.name)}</a></th>${SKILLS.map((s) => {
        const v = h.skills[s.id];
        return v ? `<td class="${focus.has(s.id) ? 'focus-col' : ''}" style="background:${color(v, s.domain)}" title="${esc(h.name)} · ${esc(s.name)}: ${thetaFmt(v.theta)} (${v.n} opgaven)">${thetaFmt(v.theta)}</td>` : `<td class="none ${focus.has(s.id) ? 'focus-col' : ''}" title="nog te weinig gegevens"></td>`;
      }).join('')}</tr>`).join('')}
      <tr><th>Gemiddeld</th>${SKILLS.map((s) => { const v = data.skillAvg[s.id]; return v == null ? '<td class="none"></td>' : `<td style="background:${NIVEAU_COLORS[niveauFor(v, s.domain).id]}">${thetaFmt(v)}</td>`; }).join('')}</tr></tbody>
    </table></div>
    <div style="margin-top:12px">${niveauLegend()}</div></div>`;
}

// ---------- Instructiegroepjes ----------
function groepjes(body, data, id) {
  const groups = data.groups.slice().sort((a, b) => (b.focus - a.focus) || (b.instructie.length - a.instructie.length));
  const withSomething = groups.filter((g) => g.instructie.length || g.verrijking.length);
  const names = (list) => (list.length ? list.map((s) => `<a class="name-chip" href="#/leerling/${s.id}" title="score ${thetaFmt(s.theta)}">${esc(s.name)}</a>`).join('') : '<span class="muted">–</span>');
  body.innerHTML = `<div class="row no-print" style="margin-bottom:12px"><p class="muted" style="margin:0;max-width:70ch">Voorstellen op basis van het niveau per onderdeel (na minstens 5 opgaven). <b>Instructie</b>: score onder 2,4 (onder of net op 1F). <b>Verrijking</b>: score 3,8 of hoger (2F/1S). De focus van deze week staat bovenaan. Per groep print je een <b>oefenblad</b> met uitleg en opgaven op het niveau van elke leerling.</p><span class="spacer"></span><button class="btn btn-sm" data-print>${icon('print')} Afdrukken</button></div>
    ${withSomething.length ? `<div class="grid3">${withSomething.map((g) => `<div class="card group-card">
      <div class="row">${skillLabel(g.skill)}${g.focus ? '<span class="chip good">focus deze week</span>' : ''}</div>
      <div><div class="label">Extra instructie (${g.instructie.length})</div><div class="names">${names(g.instructie)}</div></div>
      <div><div class="label">Verrijking (${g.verrijking.length})</div><div class="names">${names(g.verrijking)}</div></div>
      <div class="row no-print" style="gap:6px">${g.instructie.length ? `<a class="btn btn-sm btn-primary" href="#/klas/${id}/werkblad/remediering/${g.skill}">${icon('print')} Oefenblad instructiegroep</a>` : ''}${g.verrijking.length ? `<a class="btn btn-sm" href="#/klas/${id}/werkblad/verrijking/${g.skill}">${icon('print')} Verrijkingsblad</a>` : ''}</div>
    </div>`).join('')}</div>` : '<div class="card"><p class="muted">Er zijn nog te weinig gegevens. Zodra leerlingen per onderdeel een paar opgaven hebben gemaakt, verschijnen hier de groepjes.</p></div>'}`;
  body.querySelector('[data-print]').addEventListener('click', () => window.print());
}

// ---------- Weekplanning ----------
async function planning(body, data, id) {
  let p = await api('GET', `/api/teacher/classes/${id}/plan`);
  const edits = {};
  let holidays = new Set(p.holidays || []);
  let dirty = false;

  function render() {
    const weeks = p.weeks;
    body.innerHTML = `
      <div class="card stack" style="margin-bottom:16px">
        <div class="grid3">
          <div class="field" style="margin:0"><label for="p-start">Eerste week</label><input id="p-start" type="date" value="${p.start}"></div>
          <div class="field" style="margin:0"><label for="p-toets">Datum doorstroomtoets</label><input id="p-toets" type="date" value="${p.toets}"><span class="hint">2027: tussen 25 januari en 12 februari (papier: 26 en 27 januari).</span></div>
          <div class="row" style="align-items:flex-end"><button class="btn btn-primary" data-save ${dirty ? '' : 'disabled'}>${icon('check')} Planning opslaan</button><button class="btn btn-ghost btn-sm" data-reset>Standaardplanning</button></div>
        </div>
        <p class="muted" style="margin:0">Per week kies je de onderdelen waar de weektaak zich op richt (70% van de opgaven), het weekdoel en of de proeftoets openstaat. De andere 30% herhaalt automatisch wat voor iedere leerling nog lastig is. Een weekdoel per leerling stel je in bij de leerling. Met <b>Huiswerkpakket</b> kunnen leerlingen die week een werkblad op hun eigen niveau printen; jij kunt ze ook voor de hele klas printen.</p>
      </div>
      <div class="plan-list">${weeks.map((w, i) => {
        const e = { ...p.plan[w], ...(edits[w] || {}) };
        const hol = holidays.has(w);
        return `<div class="plan-week ${w === p.current ? 'current' : ''} ${hol ? 'holiday' : ''} ${w < p.current ? 'past' : ''}" data-w="${w}">
          <div class="wk">Week ${i + 1}<small>${esc(weekLabel(w))}${w === p.current ? ' · nu' : ''}</small></div>
          <div class="stack" style="gap:8px">
            ${hol ? '<span class="muted">Vakantie: leerlingen mogen oefenen, maar er is geen weektaak.</span>' : `<div class="focus-chips">${e.focus.length ? e.focus.map(skillLabel).join('') : '<span class="muted">Geen focus: herhaling van zwakke onderdelen</span>'}</div>
            <div class="row" style="gap:14px"><label class="row" style="gap:6px">Weekdoel <input type="number" min="0" max="500" step="5" value="${e.goal}" data-goal style="width:90px"> opgaven</label>
              <label class="check" style="padding:0"><input type="checkbox" data-test ${e.test ? 'checked' : ''}><span>Proeftoets open</span></label>
              <label class="check" style="padding:0"><input type="checkbox" data-hw ${e.homework ? 'checked' : ''}><span>Huiswerkpakket</span></label>
              ${e.homework ? `<label class="row" style="gap:6px"><input type="number" min="5" max="40" step="1" value="${e.homeworkCount || 15}" data-hwcount style="width:80px"> opgaven</label><a class="btn btn-ghost btn-sm" href="#/klas/${id}/werkblad/huiswerk">${icon('print')} Bekijken</a>` : ''}</div>
            <input data-note placeholder="Bericht voor de leerlingen (optioneel)" value="${esc(e.note || '')}" maxlength="300">`}
          </div>
          <div class="row" style="gap:6px;flex-direction:column;align-items:stretch">
            ${hol ? '' : `<button class="btn btn-sm" data-focus>${icon('edit')} Focus kiezen</button>`}
            <button class="btn btn-ghost btn-sm" data-hol>${hol ? 'Toch plannen' : 'Vakantieweek'}</button>
          </div></div>`;
      }).join('')}</div>`;
    const mark = () => { dirty = true; body.querySelector('[data-save]').disabled = false; };
    body.querySelector('#p-start').addEventListener('change', mark);
    body.querySelector('#p-toets').addEventListener('change', mark);
    body.querySelectorAll('.plan-week').forEach((row) => {
      const w = row.dataset.w;
      const cur = () => ({ ...p.plan[w], ...(edits[w] || {}) });
      row.querySelector('[data-goal]')?.addEventListener('input', (e) => { edits[w] = { ...cur(), goal: Number(e.target.value) || 0 }; mark(); });
      row.querySelector('[data-test]')?.addEventListener('change', (e) => { edits[w] = { ...cur(), test: e.target.checked }; mark(); });
      row.querySelector('[data-hw]')?.addEventListener('change', (e) => { edits[w] = { ...cur(), homework: e.target.checked }; mark(); render(); });
      row.querySelector('[data-hwcount]')?.addEventListener('input', (e) => { edits[w] = { ...cur(), homeworkCount: Number(e.target.value) || 15 }; mark(); });
      row.querySelector('[data-note]')?.addEventListener('input', (e) => { edits[w] = { ...cur(), note: e.target.value }; mark(); });
      row.querySelector('[data-hol]').addEventListener('click', () => {
        if (holidays.has(w)) holidays.delete(w); else holidays.add(w);
        edits[w] = { ...cur(), holiday: holidays.has(w), goal: holidays.has(w) ? cur().goal : (cur().goal || 60) };
        mark(); render();
      });
      row.querySelector('[data-focus]')?.addEventListener('click', async () => {
        const chosen = new Set(cur().focus);
        const r = await modal({
          title: `Focus voor ${weekLabel(w)}`, className: 'wide', withData: true,
          body: `<form class="skill-picker">${DOMAINS.map((d) => `<fieldset><legend>${esc(d.name)}</legend><div class="opts">${skillsOf(d.id).map((s) => `<label class="check"><input type="checkbox" name="${s.id}" ${chosen.has(s.id) ? 'checked' : ''}><span>${esc(s.name)}<br><span class="hint">${esc(s.desc)}</span></span></label>`).join('')}</div></fieldset>`).join('')}
            <p class="hint">Tip: kies 2 tot 4 onderdelen per week, verdeeld over de vakgebieden.</p></form>`,
          actions: [{ label: 'Annuleren', value: false }, { label: 'Kiezen', value: true, primary: true }],
        });
        if (!r?.value) return;
        edits[w] = { ...cur(), focus: SKILLS.map((s) => s.id).filter((sid) => r.data[sid]) };
        mark(); render();
      });
    });
    body.querySelector('[data-save]').addEventListener('click', save);
    body.querySelector('[data-reset]').addEventListener('click', async () => {
      const ok = await modal({ title: 'Standaardplanning herstellen?', body: '<p>Alle aanpassingen per week gaan verloren. De start- en toetsdatum blijven staan.</p>', actions: [{ label: 'Annuleren', value: false }, { label: 'Herstellen', value: true, danger: true }] });
      if (!ok) return;
      p = await api('PUT', `/api/teacher/classes/${id}/plan`, { reset: true, start: p.start, toets: p.toets, holidays: [...holidays] });
      for (const k of Object.keys(edits)) delete edits[k];
      dirty = false; toast('Standaardplanning hersteld', 'good'); render();
    });
  }

  async function save() {
    try {
      const start = body.querySelector('#p-start').value; const toets = body.querySelector('#p-toets').value;
      const weeks = {};
      for (const [w, e] of Object.entries(edits)) weeks[w] = { focus: e.focus, goal: e.goal, test: e.test, homework: !!e.homework, homeworkCount: Math.max(5, Math.min(40, e.homeworkCount || 15)), holiday: holidays.has(w), note: e.note };
      p = await api('PUT', `/api/teacher/classes/${id}/plan`, { start, toets, holidays: [...holidays], weeks });
      for (const k of Object.keys(edits)) delete edits[k];
      holidays = new Set(p.holidays || []);
      dirty = false; toast('Planning opgeslagen', 'good'); render();
    } catch (err) { toast(err.message, 'error'); }
  }
  render();
}

// ---------- Proeftoetsen ----------
async function proeftoetsen(body, data, id) {
  const r = await api('GET', `/api/teacher/classes/${id}/tests`);
  const allWeeks = [...new Set(r.students.flatMap((s) => s.tests.map((t) => t.week)))].sort();
  body.innerHTML = `<p class="muted">De proeftoets heeft 36 vragen in de stijl van de doorstroomtoets: 12 rekenen, 12 taalverzorging en 12 lezen (waaronder één tekst). Leerlingen krijgen pas aan het eind hun uitslag. Je zet de proeftoets per week open bij <a href="#/klas/${id}/planning">Weekplanning</a>.</p>
    ${allWeeks.length ? allWeeks.slice().reverse().map((w) => `<section class="card" style="margin-bottom:16px"><h2>Week van ${esc(weekLabel(w))}</h2>
      <div class="table-wrap"><table class="list"><thead><tr><th>Leerling</th><th>Status</th>${DOMAINS.map((d) => `<th>${esc(d.name)}</th>`).join('')}<th class="r">Goed</th><th></th></tr></thead><tbody>
      ${r.students.map((s) => {
        const t = s.tests.find((x) => x.week === w);
        if (!t) return `<tr><td>${esc(s.name)}</td><td class="muted">niet gemaakt</td>${DOMAINS.map(() => '<td></td>').join('')}<td></td><td></td></tr>`;
        return `<tr><td><a class="name" href="#/leerling/${s.id}">${esc(s.name)}</a></td><td>${t.finishedAt ? `klaar ${esc(fmtDate(t.finishedAt))}` : `<span class="chip warning">bezig ${t.pos}/${t.total}</span>`}</td>
          ${DOMAINS.map((d) => `<td>${t.result ? `${nivChip(niveauFor(t.result.domains[d.id].theta, d.id))} <span class="muted" style="font-size:.8rem">${t.result.domains[d.id].correct}/${t.result.domains[d.id].total}</span>` : ''}</td>`).join('')}
          <td class="r num">${t.result ? `${t.result.correct}/${t.result.total}` : ''}</td><td><button class="btn btn-ghost btn-sm" data-del="${t.id}" title="Wissen zodat de leerling hem opnieuw kan maken">${icon('trash')}</button></td></tr>`;
      }).join('')}</tbody></table></div></section>`).join('') : '<div class="card"><p class="muted">Er zijn nog geen proeftoetsen gemaakt.</p></div>'}`;
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    const ok = await modal({ title: 'Proeftoets wissen?', body: '<p>De uitslag verdwijnt en de leerling kan de proeftoets van deze week opnieuw maken. De antwoorden blijven meetellen voor het niveau.</p>', actions: [{ label: 'Annuleren', value: false }, { label: 'Wissen', value: true, danger: true }] });
    if (!ok) return;
    await api('DELETE', `/api/teacher/tests/${b.dataset.del}`);
    toast('Proeftoets gewist'); proeftoetsen(body, data, id);
  }));
}

// ---------- Instellingen ----------
function instellingen(body, data, id) {
  const c = data.class; const s = c.settings;
  body.innerHTML = `<div class="grid2">
    <form class="card" data-form>
      <h2>Klas</h2>
      <div class="field"><label for="i-name">Naam</label><input id="i-name" name="name" value="${esc(c.name)}" required></div>
      <div class="field"><label for="i-groep">Groep</label><select id="i-groep" name="groep"><option value="8" ${c.groep === 8 ? 'selected' : ''}>Groep 8</option><option value="7" ${c.groep === 7 ? 'selected' : ''}>Groep 7</option></select></div>
      <label class="check"><input type="checkbox" name="showNames" ${s.showNames ? 'checked' : ''}><span>Leerlingen kiezen hun naam uit een lijst bij het inloggen<br><span class="hint">Uit: ze typen hun naam zelf.</span></span></label>
      <label class="check"><input type="checkbox" name="testAlways" ${s.testAlways ? 'checked' : ''}><span>Proeftoets elke week beschikbaar (één keer per week)<br><span class="hint">Uit: alleen in weken waarin je hem openzet.</span></span></label>
      <div class="field" style="margin-top:10px"><label for="i-ips">Publiek IP-adres van de school (optioneel)</label><input id="i-ips" name="schoolIps" value="${esc((s.schoolIps || []).join(', '))}" placeholder="bijv. 145.12.34.56">
        <span class="hint">Dan zie je bij elke leerling hoeveel er op school en thuis is geoefend. Het IP-adres van leerlingen wordt niet opgeslagen.</span></div>
      <button class="btn btn-primary" type="submit">Opslaan</button>
    </form>
    <div class="stack">
      <section class="card"><h2>Inloggen</h2><p>Leerlingen gaan naar <b>${esc(location.origin)}</b>, kiezen <i>Ik ben leerling</i> en typen de klascode <b>${esc(c.code)}</b>.</p>
        <a class="btn" href="#/klas/${id}/kaarten/print">${icon('print')} Inlogkaarten printen</a></section>
      <section class="card"><h2>Klas verwijderen</h2><p class="muted">Alle leerlingen en hun resultaten worden verwijderd. Dit kan niet ongedaan worden gemaakt.</p><button class="btn btn-danger" data-del>${icon('trash')} Klas verwijderen</button></section>
    </div></div>`;
  body.querySelector('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target.elements;
    try {
      await api('PATCH', `/api/teacher/classes/${id}`, { name: f.name.value, groep: Number(f.groep.value), settings: { showNames: f.showNames.checked, testAlways: f.testAlways.checked, schoolIps: f.schoolIps.value } });
      toast('Opgeslagen', 'good');
      go(`#/klas/${id}/instellingen`);
    } catch (err) { toast(err.message, 'error'); }
  });
  body.querySelector('[data-del]').addEventListener('click', async () => {
    const ok = await modal({ title: `${c.name} verwijderen?`, body: `<p>${c.students} leerlingen en al hun resultaten worden verwijderd.</p>`, actions: [{ label: 'Annuleren', value: false }, { label: 'Verwijderen', value: true, danger: true }] });
    if (!ok) return;
    await api('DELETE', `/api/teacher/classes/${id}`);
    toast('Klas verwijderd'); go('#/dashboard');
  });
}

export { nivFromTheta };
