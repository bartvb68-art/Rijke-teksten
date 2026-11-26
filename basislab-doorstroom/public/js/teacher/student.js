import { api, esc, modal, toast, timeAgo, fmtDateTime, fmtDate } from '../lib.js';
import { icon } from '../icons.js';
import { go } from '../app.js';
import { shell } from './shell.js';
import { DOMAINS, SKILLS, SKILL_BY_ID, skillsOf, START_LEVELS, weekLabel, niveauFor } from '../shared/skills.js';
import { levelChart, barChart } from '../charts.js';
import { nivChip, levelMeter, thetaFmt, niveauLegend } from '../ui.js';
import { rememberCards } from './class.js';

function advice(d) {
  const tried = d.skills.filter((s) => s.n >= 5 && s.theta != null);
  if (tried.length < 3) return 'Er zijn nog te weinig gegevens voor een advies. Laat de leerling eerst een paar rondes oefenen.';
  const weak = tried.slice().sort((a, b) => a.theta - b.theta).slice(0, 2);
  const strong = tried.slice().sort((a, b) => b.theta - a.theta)[0];
  const parts = [];
  parts.push(`Het lastigst zijn nu <b>${weak.map((s) => esc(SKILL_BY_ID[s.id].name.toLowerCase())).join('</b> en <b>')}</b>. Overweeg deze als eigen leerdoel toe te voegen of de leerling in een instructiegroepje te zetten.`);
  if (strong.theta >= 3.7) parts.push(`Sterk in <b>${esc(SKILL_BY_ID[strong.id].name.toLowerCase())}</b> (2F/1S).`);
  const s = d.summary;
  if (s.week.goal && s.week.done < s.week.goal / 2) parts.push(`De weektaak loopt achter (${s.week.done} van ${s.week.goal}).`);
  const fast = s.alerts.find((a) => a.text.startsWith('Klikt snel'));
  if (fast) parts.push('Let op: de leerling antwoordt vaak binnen enkele seconden en maakt dan veel fouten. Bespreek rustig lezen; zet eventueel de rustige modus aan.');
  return parts.join(' ');
}

export default async function studentView(root, { studentId }) {
  const id = Number(studentId);
  let d = await api('GET', `/api/teacher/students/${id}`);
  let filter = { onlyWrong: false, skill: '' };
  let limit = 25;

  function render() {
    const st = d.student; const s = d.summary; const c = d.class;
    const main = shell(root, 'dashboard', `
      <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> › <a href="#/klas/${c.id}/leerlingen">${esc(c.name)}</a> › ${esc(st.name)}</div>
      <div class="page-head"><h1>${esc(st.name)}</h1><div class="alert-list">${s.alerts.map((a) => `<span class="chip ${a.level === 'good' ? 'good' : a.level === 'serious' ? 'serious' : 'warning'}">${esc(a.text)}</span>`).join('')}</div>
        <span class="spacer"></span><span class="muted">laatst actief ${esc(timeAgo(s.lastActive))}</span></div>

      <div class="grid3">${DOMAINS.map((dm) => {
        const x = s.domains[dm.id];
        return `<section class="card stack" style="border-top:5px solid var(--${dm.id});gap:10px">
          <div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(dm.name)}</h2>${nivChip(x.niveau)}</div>
          ${levelMeter(x.n >= 8 ? x.theta : null, dm.id)}
          <p class="muted" style="margin:0;font-size:.88rem">Score ${thetaFmt(x.theta)} · ${x.n} opgaven · start: ${esc(START_LEVELS.find((l) => l.id === st.settings.start[dm.id])?.name || 'automatisch')}</p>
        </section>`;
      }).join('')}</div>

      <section class="card" style="margin-top:16px"><h2>Advies</h2><p style="margin:0">${advice(d)}</p></section>

      <div class="grid2" style="margin-top:16px">
        <section class="card"><h2>Groei per week</h2><div data-growth></div></section>
        <section class="card"><h2>Weektaak per week</h2><div data-weeks></div>
          <p class="muted" style="font-size:.85rem;margin:6px 0 0">${d.where.school + d.where.home ? `Op school: ${d.where.school} · thuis: ${d.where.home} opgaven. ` : ''}Onder schooltijd: ${d.where.inSchoolTime} · buiten schooltijd: ${d.where.outSchoolTime} opgaven.</p></section>
      </div>

      <section class="card" style="margin-top:16px"><div class="card-head"><h2>Per onderdeel</h2><span class="spacer"></span>${niveauLegend()}</div>
        <div class="table-wrap"><table class="list"><thead><tr><th>Onderdeel</th><th>Niveau</th><th class="r">Score</th><th class="r">Opgaven</th><th class="r">% goed</th><th>Afgelopen 2 weken</th><th>Laatst geoefend</th></tr></thead><tbody>
        ${DOMAINS.map((dm) => `<tr><th colspan="7" style="padding-top:14px"><span class="dom"><i style="background:var(--${dm.id})"></i>${esc(dm.name)}</span></th></tr>${skillsOf(dm.id).map((sk) => {
          const x = d.skills.find((y) => y.id === sk.id);
          return `<tr><td>${esc(sk.name)}${st.settings.extraFocus.includes(sk.id) ? ' <span class="chip">eigen leerdoel</span>' : ''}</td><td>${nivChip(x.niveau)}</td><td class="r num">${thetaFmt(x.theta)}</td><td class="r num">${x.n}</td><td class="r num">${x.pct != null ? `${x.pct}%` : '–'}</td>
            <td>${x.trend == null ? '<span class="muted">–</span>' : x.trend > 0.15 ? `<span style="color:var(--good)">▲ +${thetaFmt(x.trend)}</span>` : x.trend < -0.15 ? `<span style="color:var(--serious)">▼ ${thetaFmt(x.trend)}</span>` : '<span class="muted">stabiel</span>'}</td>
            <td>${x.last ? esc(timeAgo(x.last)) : '<span class="muted">nog niet</span>'}</td></tr>`;
        }).join('')}`).join('')}</tbody></table></div></section>

      ${d.tests.length ? `<section class="card" style="margin-top:16px"><h2>Proeftoetsen</h2><div class="table-wrap"><table class="list"><thead><tr><th>Week</th><th>Status</th>${DOMAINS.map((dm) => `<th>${esc(dm.name)}</th>`).join('')}<th class="r">Goed</th></tr></thead><tbody>
        ${d.tests.slice().reverse().map((t) => `<tr><td>${esc(weekLabel(t.week))}</td><td>${t.finishedAt ? `klaar ${esc(fmtDate(t.finishedAt))}` : `bezig ${t.pos}/${t.total}`}</td>
          ${DOMAINS.map((dm) => `<td>${t.result ? `${nivChip(niveauFor(t.result.domains[dm.id].theta, dm.id))} <span class="muted" style="font-size:.8rem">${t.result.domains[dm.id].correct}/${t.result.domains[dm.id].total}</span>` : ''}</td>`).join('')}
          <td class="r num">${t.result ? `${t.result.correct}/${t.result.total}` : ''}</td></tr>`).join('')}</tbody></table></div></section>` : ''}

      <section class="card" style="margin-top:16px"><div class="card-head"><h2>Antwoorden</h2><span class="muted">foutenanalyse: wat heeft de leerling precies gedaan?</span><span class="spacer"></span>
          <select data-fskill style="width:auto;min-height:36px"><option value="">Alle onderdelen</option>${SKILLS.map((sk) => `<option value="${sk.id}" ${filter.skill === sk.id ? 'selected' : ''}>${esc(sk.name)}</option>`).join('')}</select>
          <label class="check" style="padding:0"><input type="checkbox" data-fwrong ${filter.onlyWrong ? 'checked' : ''}><span>Alleen fout</span></label></div>
        <div class="table-wrap"><table class="list answers-list"><thead><tr><th>Wanneer</th><th>Onderdeel</th><th>Opgave</th><th>Antwoord</th><th>Goed antwoord</th><th class="r">Moeilijkheid</th><th class="r">Tijd</th></tr></thead><tbody data-answers></tbody></table></div><p data-more-wrap style="margin:10px 0 0"><button class="btn btn-sm" data-more>Meer tonen</button></p></section>

      <div class="grid2" style="margin-top:16px">
        <form class="card" data-settings>
          <h2>Differentiatie en hulp</h2>
          <p class="muted">Het systeem past de moeilijkheid zelf aan. Met een startniveau begint een leerling meteen op de goede plek; met eigen leerdoelen komen extra onderdelen in de weektaak.</p>
          <div class="grid3">${DOMAINS.map((dm) => `<div class="field"><label for="st-${dm.id}">Start ${esc(dm.name.toLowerCase())}</label><select id="st-${dm.id}" name="start_${dm.id}">${START_LEVELS.map((l) => `<option value="${l.id}" ${st.settings.start[dm.id] === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></div>`).join('')}</div>
          <div class="field"><label for="st-goal">Weekdoel</label><select id="st-goal" name="goalFactor">${[[0.5, '50% van het klassendoel'], [0.75, '75%'], [1, '100% (zoals de klas)'], [1.25, '125%'], [1.5, '150%']].map(([v, l]) => `<option value="${v}" ${Number(st.settings.goalFactor) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <fieldset class="skill-picker" style="border:0;padding:0;margin:0 0 12px"><div class="label" style="margin-bottom:6px">Eigen leerdoelen (komen extra in de weektaak)</div>
            ${DOMAINS.map((dm) => `<div class="opts" style="display:flex;flex-wrap:wrap;gap:2px 14px">${skillsOf(dm.id).map((sk) => `<label class="check"><input type="checkbox" name="focus_${sk.id}" ${st.settings.extraFocus.includes(sk.id) ? 'checked' : ''}><span>${esc(sk.name)}</span></label>`).join('')}</div>`).join('')}</fieldset>
          <label class="check"><input type="checkbox" name="readAloud" ${st.settings.readAloud ? 'checked' : ''}><span>Voorleesknop bij opgaven en teksten</span></label>
          <label class="check"><input type="checkbox" name="dyslexia" ${st.settings.dyslexia ? 'checked' : ''}><span>Extra ruimte tussen letters en regels</span></label>
          <label class="check"><input type="checkbox" name="largeText" ${st.settings.largeText ? 'checked' : ''}><span>Grotere letters</span></label>
          <label class="check"><input type="checkbox" name="calm" ${st.settings.calm ? 'checked' : ''}><span>Rustige modus: iets makkelijkere opgaven, meer succeservaringen</span></label>
          <div class="field" style="margin-top:12px"><label for="st-note">Notitie (alleen voor leerkrachten)</label><textarea id="st-note" name="note">${esc(st.note)}</textarea></div>
          <button class="btn btn-primary" type="submit">Opslaan</button>
        </form>
        <section class="card stack">
          <h2>Account</h2>
          <form data-rename class="row"><input name="name" value="${esc(st.name)}" aria-label="Naam" style="flex:1"><button class="btn" type="submit">Naam wijzigen</button></form>
          <div class="row"><a class="btn" href="#/klas/${c.id}/werkblad/huiswerk?leerlingen=${st.id}">${icon('print')} Werkblad op eigen niveau</a></div>
          <div class="row"><button class="btn" data-pw>${icon('key')} Nieuw wachtwoord</button><button class="btn" data-card>${icon('print')} Inlogkaart</button></div>
          <div><div class="label">Niveau opnieuw laten bepalen</div><p class="muted" style="margin:4px 0 8px;font-size:.88rem">Gebruik dit als het startniveau duidelijk niet klopte. De score gaat terug naar het startniveau; de antwoorden blijven bewaard.</p>
            <div class="row">${DOMAINS.map((dm) => `<button class="btn btn-sm" data-relevel="${dm.id}">${esc(dm.name)}</button>`).join('')}</div></div>
          <div><button class="btn btn-danger" data-del>${icon('trash')} Leerling verwijderen</button></div>
        </section>
      </div>`);

    const weeks = d.series;
    levelChart(main.querySelector('[data-growth]'), { labels: weeks.map((w) => weekLabel(w.week).split(' – ')[0]), series: DOMAINS.map((dm) => ({ id: dm.id, name: dm.name, color: `var(--${dm.id})`, values: weeks.map((w) => w[dm.id]) })) });
    barChart(main.querySelector('[data-weeks]'), {
      data: d.weeks.map((w) => ({ label: weekLabel(w.week).split(' – ')[0], value: w.done, color: w.goal && w.done >= w.goal ? 'var(--good)' : 'var(--accent)', tip: `<b>${esc(weekLabel(w.week))}</b><br>${w.done} van ${w.goal} opgaven${w.done ? ` · ${Math.round((w.correct / w.done) * 100)}% goed` : ''}${w.holiday ? ' · vakantie' : ''}` })),
      goal: d.weeks.find((w) => !w.holiday)?.goal ?? null, goalLabel: 'weekdoel',
    });

    const renderAnswers = () => {
      const all = d.recent.filter((a) => (!filter.onlyWrong || !a.correct) && (!filter.skill || a.skill === filter.skill));
      const rows = all.slice(0, limit);
      main.querySelector('[data-more-wrap]').hidden = all.length <= limit;
      main.querySelector('[data-answers]').innerHTML = rows.length ? rows.map((a) => `<tr><td style="white-space:nowrap">${esc(fmtDateTime(a.at))}${a.mode === 'toets' ? ' <span class="chip">toets</span>' : ''}</td><td>${esc(SKILL_BY_ID[a.skill].name)}</td>
        <td class="prompt">${esc(a.prompt)}</td><td class="${a.correct ? 'ok' : 'nok'}">${a.correct ? '✓ ' : '✗ '}${esc(a.given)}</td><td>${a.correct ? '' : esc(a.answer)}</td><td class="r num">${thetaFmt(a.difficulty)}</td><td class="r num">${a.sec}s</td></tr>`).join('')
        : '<tr><td colspan="7" class="muted">Geen antwoorden.</td></tr>';
    };
    renderAnswers();
    main.querySelector('[data-more]').addEventListener('click', () => { limit += 50; renderAnswers(); });
    main.querySelector('[data-fskill]').addEventListener('change', (e) => { filter.skill = e.target.value; renderAnswers(); });
    main.querySelector('[data-fwrong]').addEventListener('change', (e) => { filter.onlyWrong = e.target.checked; renderAnswers(); });

    main.querySelector('[data-settings]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const settings = {
        start: Object.fromEntries(DOMAINS.map((dm) => [dm.id, f.get(`start_${dm.id}`)])),
        goalFactor: Number(f.get('goalFactor')), extraFocus: SKILLS.map((sk) => sk.id).filter((sid) => f.get(`focus_${sid}`)),
        readAloud: !!f.get('readAloud'), dyslexia: !!f.get('dyslexia'), largeText: !!f.get('largeText'), calm: !!f.get('calm'),
      };
      try { d = await api('PATCH', `/api/teacher/students/${id}`, { settings, note: f.get('note') }); toast('Opgeslagen', 'good'); render(); } catch (err) { toast(err.message, 'error'); }
    });
    main.querySelector('[data-rename]').addEventListener('submit', async (e) => {
      e.preventDefault();
      try { d = await api('PATCH', `/api/teacher/students/${id}`, { name: e.target.elements.name.value }); toast('Naam gewijzigd', 'good'); render(); } catch (err) { toast(err.message, 'error'); }
    });
    const newPw = async (thenCard) => {
      const ok = await modal({ title: `Nieuw wachtwoord voor ${st.name}?`, body: '<p>Het oude wachtwoord werkt daarna niet meer.</p>', actions: [{ label: 'Annuleren', value: false }, { label: 'Nieuw wachtwoord', value: true, primary: true }] });
      if (!ok) return;
      const r = await api('POST', `/api/teacher/students/${id}/reset-password`);
      rememberCards(c.id, [{ name: r.name, password: r.password }]);
      if (thenCard) { go(`#/klas/${c.id}/kaarten/print`); return; }
      await modal({ title: 'Nieuw wachtwoord', body: `<p>${esc(r.name)}: <b style="font-size:1.3rem;font-family:ui-monospace,monospace">${esc(r.password)}</b></p><p class="muted">Klascode: ${esc(c.code)}</p>` });
    };
    main.querySelector('[data-pw]').addEventListener('click', () => newPw(false));
    main.querySelector('[data-card]').addEventListener('click', () => newPw(true));
    main.querySelectorAll('[data-relevel]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await modal({ title: 'Niveau opnieuw bepalen?', body: `<p>De score voor ${esc(DOMAINS.find((x) => x.id === b.dataset.relevel).name.toLowerCase())} gaat terug naar het startniveau.</p>`, actions: [{ label: 'Annuleren', value: false }, { label: 'Opnieuw bepalen', value: true, primary: true }] });
      if (!ok) return;
      d = await api('POST', `/api/teacher/students/${id}/reset-level`, { domain: b.dataset.relevel }); toast('Gedaan', 'good'); render();
    }));
    main.querySelector('[data-del]').addEventListener('click', async () => {
      const ok = await modal({ title: `${st.name} verwijderen?`, body: '<p>Alle resultaten van deze leerling worden verwijderd.</p>', actions: [{ label: 'Annuleren', value: false }, { label: 'Verwijderen', value: true, danger: true }] });
      if (!ok) return;
      await api('DELETE', `/api/teacher/students/${id}`); toast('Leerling verwijderd'); go(`#/klas/${c.id}/leerlingen`);
    });
  }
  render();
}
