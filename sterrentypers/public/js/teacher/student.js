import { api, esc, modal, toast, timeAgo, fmtDateTime, fmtDate, minutesLabel, starsHtml } from '../lib.js';
import { icon } from '../icons.js';
import { rocketSvg } from '../avatar.js';
import { go } from '../app.js';
import { shell } from './shell.js';
import { lineChart, keyHeatmap, fingerBars, calendar, worstKeys, SERIES } from './charts.js';
import { alertChip, rememberCards } from './class.js';
import { LESSONS, PLANETS, CHAR_INFO, FINGERS, targetApm } from '../shared/curriculum.js';
import { BADGES } from '../shared/rewards.js';

const TEMPO = [[0.6, 'Rustig (60%)'], [0.8, 'Iets rustiger (80%)'], [1, 'Normaal'], [1.2, 'Uitdaging (120%)']];

function activityLabel(a) {
  if (a.kind === 'game') return a.game === 'race' ? `Raketrace${a.extra?.place ? ` (${a.extra.place}e)` : ''}` : `Meteorenstorm${a.score != null ? ` (${a.score} p)` : ''}`;
  const names = { intro: 'nieuwe toetsen', drill: 'lettertraining', words: 'woorden', mix: 'ruimtemix', test: 'sterrentest', warmup: 'opwarmen', text: 'tekst' };
  return `Les ${a.lessonId} · ${names[a.stepKind] || a.stepKind}`;
}

/** Adviezen op basis van de gegevens, zodat de leerkracht direct weet wat te doen. */
function advice(d) {
  const out = [];
  const s = d.summary;
  const worst = worstKeys(d.keys.keys, 3, 10);
  if (worst.length) {
    const keys = worst.map((w) => w.key.toUpperCase()).join(', ');
    const lessonsWith = [...new Set(worst.map((w) => LESSONS.find((l) => l.newKeys.includes(w.key))?.id).filter(Boolean))];
    out.push(`Veel fouten bij <b>${esc(keys)}</b>. ${lessonsWith.length ? `Laat les ${lessonsWith.join(' en ')} nog eens oefenen.` : ''}`);
  }
  const fingerRates = Object.entries(d.keys.fingers).filter(([, f]) => f.hits + f.misses >= 30).map(([k, f]) => [k, f.misses / (f.hits + f.misses)]).sort((a, b) => b[1] - a[1]);
  if (fingerRates.length && fingerRates[0][1] > 0.08) out.push(`De <b>${esc(FINGERS[fingerRates[0][0]].name)}</b> maakt de meeste fouten (${Math.round(fingerRates[0][1] * 100)}%). Let op de vingerzetting.`);
  if (s.recentAcc != null && s.recentAcc < 90) out.push('Nauwkeurigheid is laag. Moedig aan om rustiger te typen; eventueel tempo op "Rustig" zetten.');
  if (s.recentAcc != null && s.recentAcc >= 97 && s.recentApm != null) out.push('Typt heel nauwkeurig. Tempo "Uitdaging" kan motiverend zijn.');
  if (s.minutesWeek < s.weeklyGoal / 2) out.push(`Heeft deze week ${s.minutesWeek} van de ${s.weeklyGoal} minuten geoefend.`);
  const ph = s.places;
  if ((ph.thuis || 0) + (ph['buiten schooltijd'] || 0) > 0) out.push(`Oefent ook thuis of buiten schooltijd (${minutesLabel((ph.thuis || 0) + (ph['buiten schooltijd'] || 0))} in totaal).`);
  return out;
}

export default async function studentView(root, params) {
  const sid = Number(params.studentId);
  const classId = Number(params.classId);
  let d = await api('GET', `/api/teacher/students/${sid}`);
  let keyRange = 'recent';

  function render() {
    const s = d.summary;
    const st = d.student;
    const lessonCur = LESSONS.find((l) => l.id === s.currentLesson);
    const groep = d.class.groep;
    const earned = new Set(d.badges.map((b) => b.badge));
    const ipMode = (d.class.settings.schoolIps || []).length > 0;
    const placeData = ipMode
      ? [['Op school', s.places.school], ['Thuis', s.places.thuis]]
      : [['Onder schooltijd', s.places.schooltijd], ['Buiten schooltijd', s.places['buiten schooltijd']]];
    const main = shell(root, 'dashboard', `
      <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> / <a href="#/klas/${d.class.id}">${esc(d.class.name)}</a> / ${esc(st.name)}</div>
      <div class="row" style="margin-bottom:6px">
        ${rocketSvg(st.avatar, { size: 54 })}
        <div><h1 style="margin:0">${esc(st.name)}</h1><span class="muted">${esc(st.rank.name)} · ${st.xp} XP · laatst ingelogd ${timeAgo(st.lastLogin)}</span></div>
        <span class="spacer"></span>
        ${s.diploma ? `<a class="btn btn-ghost" href="#/diploma/${st.id}">${icon('diploma')} Diploma</a>` : ''}
        <button class="btn btn-ghost" data-reset>${icon('key')} Nieuw wachtwoord</button>
      </div>
      <div class="row" style="margin-bottom:4px">${s.alerts.map(alertChip).join(' ')}</div>
      <div class="tiles">
        <div class="tile"><div class="label">Huidige les</div><div class="value">${s.currentLesson} <span class="muted" style="font-size:1rem">/ ${LESSONS.length}</span></div><div class="sub">${esc(lessonCur?.title || '')} · ${esc(s.planetName || '')}</div></div>
        <div class="tile"><div class="label">Sterren</div><div class="value">${s.totalStars}</div><div class="sub">${s.lessonsDone} lessen gehaald</div></div>
        <div class="tile"><div class="label">Snelheid</div><div class="value">${s.recentApm != null ? Math.round(s.recentApm) : '–'}</div><div class="sub">aanslagen/min${s.apmTrend != null ? ` · ${s.apmTrend >= 0 ? '+' : ''}${s.apmTrend} t.o.v. eerder` : ''}</div></div>
        <div class="tile"><div class="label">Nauwkeurigheid</div><div class="value">${s.recentAcc != null ? `${Math.round(s.recentAcc)}%` : '–'}</div><div class="sub">laatste oefeningen</div></div>
        <div class="tile"><div class="label">Deze week</div><div class="value">${s.minutesWeek} min</div><div class="sub">weekdoel ${s.weeklyGoal} min</div></div>
        <div class="tile"><div class="label">Totaal geoefend</div><div class="value">${minutesLabel(s.minutesTotal)}</div><div class="sub">${s.streak} ${s.streak === 1 ? 'dag' : 'dagen'} op rij</div></div>
      </div>
      <div class="panels">
        <section class="panel"><h2>Snelheid</h2><p class="panel-sub">Gemiddelde aanslagen per minuut per dag (sterrentesten, teksten en races). Stippellijn = doel bij les ${s.currentLesson}.</p><div data-apm></div></section>
        <section class="panel"><h2>Nauwkeurigheid</h2><p class="panel-sub">Percentage goed getypte tekens per dag</p><div data-acc></div></section>
        <section class="panel two-third">
          <div class="row"><h2 style="margin:0">Lastige toetsen</h2><span class="spacer"></span>
            <div class="seg" role="group" aria-label="Periode"><button class="${keyRange === 'recent' ? 'on' : ''}" data-range="recent">30 dagen</button><button class="${keyRange === 'all' ? 'on' : ''}" data-range="all">Altijd</button></div></div>
          <p class="panel-sub">Foutpercentage per toets: waar zitten de struikelblokken?</p>
          <div data-keys></div>
        </section>
        <section class="panel third"><h2>Fouten per vinger</h2><p class="panel-sub">Foutpercentage per vinger</p><div data-fingers></div></section>
        <section class="panel third"><h2>Advies</h2><div data-advice></div></section>
        <section class="panel third"><h2>Oefenkalender</h2><p class="panel-sub">Minuten per dag, laatste 10 weken</p><div data-cal></div></section>
        <section class="panel third"><h2>Wanneer geoefend</h2><p class="panel-sub">${ipMode ? 'Op basis van het netwerk van de school' : 'Stel IP-adressen van school in voor school/thuis'}</p><div data-place></div></section>
        <section class="panel wide"><h2>Lessen</h2><p class="panel-sub">Beste resultaat per les. Doel = aanslagen per minuut voor 3 sterren (groep ${groep}, tempo ${Math.round(st.settings.speedFactor * 100)}%).</p>
          <div class="lesson-grid">${d.lessons.map((l) => {
            const p = PLANETS.find((x) => x.id === l.planet);
            const state = l.id === s.currentLesson ? 'current' : l.stars ? 'done' : l.id > s.currentLesson ? 'locked' : '';
            return `<div class="lesson-cell ${state}" style="--pc:${p.color}"><b>${l.id}. ${esc(l.title)}</b>${starsHtml(l.stars)}
              <div class="muted">${l.bestApm != null ? `${l.bestApm} / ${l.target} apm` : `doel ${l.target} apm`}${l.bestAcc != null ? ` · ${l.bestAcc}%` : ''}</div>
              <div class="muted">${l.tests ? `${l.tests}× getoetst` : ''}${l.minutes ? ` · ${l.minutes} min` : ''}</div></div>`;
          }).join('')}</div></section>
        <section class="panel wide"><h2>Recente activiteit</h2>
          <div class="table-wrap" style="max-height:420px;overflow:auto"><table class="table"><thead><tr><th>Wanneer</th><th>Activiteit</th><th class="num">Minuten</th><th class="num">Aanslagen/min</th><th class="num">Goed</th><th>Resultaat</th><th>Waar</th></tr></thead>
          <tbody>${d.recent.length ? d.recent.map((a) => `<tr style="cursor:default"><td>${fmtDateTime(a.at)}</td><td>${esc(activityLabel(a))}</td><td class="num">${a.minutes}</td><td class="num">${a.apm}</td><td class="num">${a.accuracy}%</td><td>${a.stars != null ? starsHtml(a.stars) : ''}</td><td>${esc(a.place)}</td></tr>`).join('') : '<tr><td colspan="7" class="muted">Nog geen activiteit.</td></tr>'}</tbody></table></div>
        </section>
        <section class="panel wide"><h2>Badges</h2><p class="panel-sub">${earned.size} van ${BADGES.length}</p>
          <div class="row">${BADGES.filter((b) => earned.has(b.id)).map((b) => `<span class="chip good" title="${esc(b.desc)}">${icon(b.icon)} ${esc(b.name)}</span>`).join('') || '<span class="muted">Nog geen badges.</span>'}</div>
        </section>
        <section class="panel wide"><h2>Instellingen en aantekeningen</h2>
          <form data-settings class="settings-grid">
            <div>
              <div class="field"><label>Tempo (doelsnelheid)</label>
                <select name="tempo" aria-label="Tempo">${TEMPO.map(([v, l]) => `<option value="${v}" ${Math.abs(st.settings.speedFactor - v) < 0.01 ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <span class="hint">Past de doelsnelheid voor sterren aan. Bijvoorbeeld bij motorische problemen of juist als extra uitdaging.</span></div>
              <div class="field"><label for="unlock">Lessen vrijgeven tot en met</label>
                <select id="unlock" name="unlockUpTo"><option value="0">Automatisch (na het halen van de vorige les)</option>${LESSONS.map((l) => `<option value="${l.id}" ${st.settings.unlockUpTo === l.id ? 'selected' : ''}>Les ${l.id}: ${esc(l.title)}</option>`).join('')}</select>
                <span class="hint">Handig voor leerlingen die al kunnen typen.</span></div>
            </div>
            <div>
              <label class="check"><input type="checkbox" name="showHands" ${st.settings.showHands ? 'checked' : ''}> Handen tonen bij het typen</label>
              <label class="check"><input type="checkbox" name="largeText" ${st.settings.largeText ? 'checked' : ''}> Grotere letters</label>
              <label class="check"><input type="checkbox" name="dyslexia" ${st.settings.dyslexia ? 'checked' : ''}> Extra letterafstand (dyslexie)</label>
              <label class="check"><input type="checkbox" name="sound" ${st.settings.sound ? 'checked' : ''}> Geluid</label>
            </div>
            <div class="field"><label for="note">Aantekeningen (alleen zichtbaar voor jou)</label><textarea id="note" name="note" class="note-box">${esc(st.note)}</textarea></div>
            <div class="row" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Opslaan</button><span class="spacer"></span><button class="btn btn-danger" type="button" data-delete>${icon('trash')} Leerling verwijderen</button></div>
          </form>
        </section>
      </div>`);

    // grafieken
    const target = targetApm(s.currentLesson, groep, st.settings.speedFactor);
    const series = d.series.slice(-30);
    lineChart(main.querySelector('[data-apm]'), { points: series.map((x) => ({ day: x.day, value: x.apm })), color: SERIES.blue, unit: ' aanslagen/min', target, targetLabel: `doel ${target}` });
    lineChart(main.querySelector('[data-acc]'), { points: series.map((x) => ({ day: x.day, value: x.accuracy })), color: SERIES.aqua, unit: '%', yMax: 100, yMin: 70, area: false, target: 96, targetLabel: '96% (3 sterren)', format: (v) => `${v}` });
    const keyData = keyRange === 'recent' ? d.keys : d.keysAll;
    keyHeatmap(main.querySelector('[data-keys]'), keyData.keys);
    fingerBars(main.querySelector('[data-fingers]'), keyData.fingers);
    calendar(main.querySelector('[data-cal]'), d.calendar);
    const placeMax = Math.max(1, ...placeData.map(([, v]) => v || 0));
    main.querySelector('[data-place]').innerHTML = `<div class="finger-bars">${placeData.map(([label, v]) => `<div class="finger-bar"><span>${label}</span>
      <span class="track"><i style="width:${((v || 0) / placeMax) * 100}%;background:${SERIES.violet}"></i></span><span style="text-align:right">${minutesLabel(v || 0)}</span></div>`).join('')}</div>`;
    const adv = advice(d);
    main.querySelector('[data-advice]').innerHTML = adv.length ? `<ul style="margin:0;padding-left:18px;display:grid;gap:8px">${adv.map((a) => `<li>${a}</li>`).join('')}</ul>` : '<p class="muted">Nog te weinig gegevens voor advies.</p>';

    main.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { keyRange = b.dataset.range; render(); }));

    // instellingen
    const form = main.querySelector('[data-settings]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements;
      try {
        d = await api('PATCH', `/api/teacher/students/${sid}`, {
          note: f.note.value,
          settings: {
            speedFactor: Number(f.tempo.value), unlockUpTo: Number(f.unlockUpTo.value), showHands: f.showHands.checked,
            largeText: f.largeText.checked, dyslexia: f.dyslexia.checked, sound: f.sound.checked,
          },
        });
        toast('Opgeslagen', 'good');
        render();
      } catch (err) { toast(err.message, 'error'); }
    });
    main.querySelector('[data-delete]').addEventListener('click', async () => {
      const ok = await modal({
        title: `${st.name} verwijderen?`,
        body: '<p>Alle resultaten van deze leerling worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.</p>',
        actions: [{ label: 'Annuleren', value: false }, { label: 'Verwijderen', value: true, danger: true }],
      });
      if (!ok) return;
      await api('DELETE', `/api/teacher/students/${sid}`);
      toast('Leerling verwijderd');
      go(`#/klas/${classId}`);
    });
    main.querySelector('[data-reset]').addEventListener('click', async () => {
      const ok = await modal({
        title: 'Nieuw wachtwoord maken?',
        body: `<p>${esc(st.name)} krijgt een nieuw wachtwoord en wordt overal uitgelogd.</p>`,
        actions: [{ label: 'Annuleren', value: false }, { label: 'Nieuw wachtwoord', value: true, primary: true }],
      });
      if (!ok) return;
      const r = await api('POST', `/api/teacher/students/${sid}/reset-password`);
      rememberCards(classId, [r]);
      const print = await modal({
        title: 'Nieuw wachtwoord',
        body: `<p>Het nieuwe wachtwoord van <b>${esc(r.name)}</b> is:</p><p style="font-size:1.8rem;font-weight:700;font-family:monospace">${esc(r.password)}</p>`,
        actions: [{ label: 'Sluiten', value: false }, { label: 'Inlogkaart printen', value: true, primary: true }],
      });
      if (print) go(`#/klas/${classId}/kaarten`);
    });
  }
  render();
}

export { fmtDate, CHAR_INFO };
