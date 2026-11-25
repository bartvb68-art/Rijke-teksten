import { api, esc, modal, toast, timeAgo, fmtDateTime, fmtDate, minutesLabel, starsHtml } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { go, session } from '../app.js';
import { shell } from './shell.js';
import { lineChart, skillBars, confusionList, worstSkills, calendar, SERIES } from './charts.js';
import { alertChip, rememberCards } from './class.js';
import { LESSONS, PODIA, LABELS, LEVEL_SHIFTS, STAR_RULES } from '../shared/curriculum.js';
import { BADGES } from '../shared/rewards.js';

const STEP_NAMES = { intro: 'soundcheck', oefen: 'repetitie', mix: 'jamsessie', test: 'optreden' };

function activityLabel(a) {
  if (a.kind === 'game') return a.game === 'battle' ? `Bandbattle${a.extra?.place ? ` (${a.extra.place}e)` : ''}` : `Notenregen${a.score != null ? ` (${a.score} p)` : ''}`;
  return `Les ${a.lessonId} · ${STEP_NAMES[a.stepKind] || a.stepKind}`;
}

// Les waarin een zinsdeel wordt aangeleerd, voor gericht advies.
const LESSON_FOR = { knip: 1, pv: 2, ow: 3, wg: 5, lv: 8, mv: 11, bwb: 14, ng: 17 };

/** Adviezen op basis van de gegevens, zodat de leerkracht direct weet wat te doen. */
function advice(d) {
  const out = [];
  const s = d.summary;
  const worst = worstSkills(d.skills.skills, 2, 8).filter((w) => w.rate >= 0.2);
  for (const w of worst) {
    const les = LESSON_FOR[w.key];
    out.push(`<b>${esc(LABELS[w.key].name)}</b> gaat vaak fout (${Math.round(w.rate * 100)}%).${les && les <= s.currentLesson ? ` Laat les ${les} nog eens doen.` : ''}`);
  }
  const conf = d.skills.confusions[0];
  if (conf && conf.n >= 3) {
    const tips = {
      'lv>ow': 'Oefen de vraag "wie of wat + gezegde?" en de proef: maak het zinsdeel meervoud; verandert de pv mee, dan is het het onderwerp (les 10).',
      'ow>lv': 'Oefen de vraag "wie of wat + gezegde?" en de proef: maak het zinsdeel meervoud; verandert de pv mee, dan is het het onderwerp (les 10).',
      'mv>lv': 'Laat de leerling "aan" of "voor" voor het zinsdeel zetten: past dat, dan is het een meewerkend voorwerp (les 12).',
      'lv>mv': 'Eerst het lijdend voorwerp zoeken (wie of wat + ow + gezegde?), dan pas het meewerkend voorwerp (les 12).',
      'ng>wg': 'Herhaal de koppelwerkwoorden (zijn, worden, blijven, lijken, schijnen, blijken, heten) met les 18.',
      'wg>ng': '"Zijn" en "worden" kunnen ook hulpwerkwoord zijn. Les 18 oefent precies dit verschil.',
      'pv>wg': 'De persoonsvorm krijgt bij etiketten het etiket "pv", de andere werkwoorden "wg".',
    };
    const key = `${conf.real}>${conf.given}`;
    out.push(`Verwart vaak <b>${esc(conf.real.replace('bwb-', 'bwb '))}</b> met <b>${esc(conf.given.replace('bwb-', 'bwb '))}</b> (${conf.n}×). ${tips[key] || ''}`);
  }
  if (s.recentScore != null && s.recentScore < 60) out.push('De score is laag. Zet het niveau van de zinnen op "Makkelijker" en zet voorlezen aan.');
  if (s.recentScore != null && s.recentScore >= 92) out.push('Ontleedt heel goed. Niveau "Uitdaging" (langere zinnen) kan motiverend zijn.');
  if (s.recentSec != null && s.recentSec > 30) out.push(`Werkt traag (${s.recentSec} seconden per zin). Lezen kost misschien veel moeite: voorlezen kan helpen.`);
  if (s.minutesWeek < s.weeklyGoal / 2) out.push(`Heeft deze week ${s.minutesWeek} van de ${s.weeklyGoal} minuten geoefend.`);
  const ph = s.places;
  if ((ph.thuis || 0) + (ph['buiten schooltijd'] || 0) > 0) out.push(`Oefent ook thuis of buiten schooltijd (${minutesLabel((ph.thuis || 0) + (ph['buiten schooltijd'] || 0))} in totaal).`);
  return out;
}

export default async function studentView(root, params) {
  const sid = Number(params.studentId);
  const classId = Number(params.classId);
  let d = await api('GET', `/api/teacher/students/${sid}`);
  // Klassen waar de leerling naartoe kan: eigen klassen, of voor de beheerder alle klassen.
  let classOptions = [];
  try {
    classOptions = session.teacher?.is_admin
      ? (await api('GET', '/api/admin/overview')).classes.map((c) => ({ id: c.id, name: `${c.name} (${c.teacher})` }))
      : (await api('GET', '/api/teacher/classes')).classes.map((c) => ({ id: c.id, name: c.name }));
  } catch { classOptions = []; }
  let range = 'recent';

  function render() {
    const s = d.summary;
    const st = d.student;
    const lessonCur = LESSONS.find((l) => l.id === s.currentLesson);
    const earned = new Set(d.badges.map((b) => b.badge));
    const ipMode = (d.class.settings.schoolIps || []).length > 0;
    const placeData = ipMode
      ? [['Op school', s.places.school], ['Thuis', s.places.thuis]]
      : [['Onder schooltijd', s.places.schooltijd], ['Buiten schooltijd', s.places['buiten schooltijd']]];
    const levelName = (LEVEL_SHIFTS.find(([v]) => v === (st.settings.levelShift || 0)) || LEVEL_SHIFTS[1])[1];
    const main = shell(root, 'dashboard', `
      <div class="crumbs"><a href="#/dashboard">Mijn klassen</a> / <a href="#/klas/${d.class.id}">${esc(d.class.name)}</a> / ${esc(st.name)}</div>
      <div class="row" style="margin-bottom:6px">
        ${guitarSvg(st.avatar, { size: 54 })}
        <div><h1 style="margin:0">${esc(st.name)}</h1><span class="muted">${esc(st.rank.name)} · ${st.xp} XP · laatst ingelogd ${timeAgo(st.lastLogin)}</span></div>
        <span class="spacer"></span>
        ${s.diploma ? `<a class="btn btn-ghost" href="#/diploma/${st.id}">${icon('diploma')} Diploma</a>` : ''}
        <button class="btn btn-ghost" data-reset>${icon('key')} Nieuw wachtwoord</button>
      </div>
      <div class="row" style="margin-bottom:4px">${s.alerts.map(alertChip).join(' ')}</div>
      <div class="tiles">
        <div class="tile"><div class="label">Huidige les</div><div class="value">${s.currentLesson} <span class="muted" style="font-size:1rem">/ ${LESSONS.length}</span></div><div class="sub">${esc(lessonCur?.title || '')} · ${esc(s.podiumName || '')}</div></div>
        <div class="tile"><div class="label">Sterren</div><div class="value">${s.totalStars}</div><div class="sub">${s.lessonsDone} lessen gehaald</div></div>
        <div class="tile"><div class="label">Score</div><div class="value">${s.recentScore != null ? `${Math.round(s.recentScore)}%` : '–'}</div><div class="sub">zinnen goed${s.scoreTrend != null ? ` · ${s.scoreTrend >= 0 ? '+' : ''}${Math.round(s.scoreTrend)} t.o.v. eerder` : ''}</div></div>
        <div class="tile"><div class="label">Tempo</div><div class="value">${s.recentSec != null ? `${s.recentSec} s` : '–'}</div><div class="sub">per zin (lessen)</div></div>
        <div class="tile"><div class="label">Deze week</div><div class="value">${s.minutesWeek} min</div><div class="sub">weekdoel ${s.weeklyGoal} min</div></div>
        <div class="tile"><div class="label">Totaal geoefend</div><div class="value">${minutesLabel(s.minutesTotal)}</div><div class="sub">${s.itemsTotal} zinnen · ${s.streak} ${s.streak === 1 ? 'dag' : 'dagen'} op rij</div></div>
      </div>
      <div class="panels">
        <section class="panel"><h2>Score</h2><p class="panel-sub">Percentage goed per dag (lessen en Bandbattle, zonder soundcheck). Stippellijn = 3 sterren.</p><div data-score></div></section>
        <section class="panel"><h2>Tempo</h2><p class="panel-sub">Gemiddeld aantal seconden per zin per dag (repetitie, jamsessie en optreden). Lager is sneller.</p><div data-sec></div></section>
        <section class="panel">
          <div class="row"><h2 style="margin:0">Zinsdelen</h2><span class="spacer"></span>
            <div class="seg" role="group" aria-label="Periode"><button class="${range === 'recent' ? 'on' : ''}" data-range="recent">30 dagen</button><button class="${range === 'all' ? 'on' : ''}" data-range="all">Altijd</button></div></div>
          <p class="panel-sub">Waar zitten de struikelblokken?</p>
          <div data-skills></div>
        </section>
        <section class="panel"><h2>Verwarringen</h2><p class="panel-sub">Welk zinsdeel werd aangezien voor welk ander zinsdeel?</p><div data-conf></div></section>
        <section class="panel third"><h2>Advies</h2><div data-advice></div></section>
        <section class="panel third"><h2>Oefenkalender</h2><p class="panel-sub">Minuten per dag, laatste 10 weken</p><div data-cal></div></section>
        <section class="panel third"><h2>Wanneer geoefend</h2><p class="panel-sub">${ipMode ? 'Op basis van het netwerk van de school' : 'Stel IP-adressen van school in voor school/thuis'}</p><div data-place></div></section>
        <section class="panel wide"><h2>Lessen</h2><p class="panel-sub">Beste optreden per les (groep ${d.class.groep}, niveau ${esc(levelName.toLowerCase())}). Sterren: ${STAR_RULES.one}% / ${STAR_RULES.two}% / ${STAR_RULES.three}% goed.</p>
          <div class="lesson-grid">${d.lessons.map((l) => {
            const p = PODIA.find((x) => x.id === l.podium);
            const state = l.id === s.currentLesson ? 'current' : l.stars ? 'done' : l.id > s.currentLesson ? 'locked' : '';
            return `<div class="lesson-cell ${state}" style="--pc:${p.color}"><b>${l.id}. ${esc(l.title)}</b>${starsHtml(l.stars)}
              <div class="muted">${l.bestAcc != null ? `${l.bestAcc}% goed` : 'nog geen optreden'}${l.bestSec != null ? ` · ${l.bestSec} s/zin` : ''}</div>
              <div class="muted">${l.tests ? `${l.tests}× opgetreden` : ''}${l.minutes ? ` · ${l.minutes} min` : ''}</div></div>`;
          }).join('')}</div></section>
        <section class="panel wide"><h2>Recente activiteit</h2>
          <div class="table-wrap" style="max-height:420px;overflow:auto"><table class="table"><thead><tr><th>Wanneer</th><th>Activiteit</th><th class="num">Minuten</th><th class="num">Goed</th><th class="num">Score</th><th class="num">Tempo</th><th>Resultaat</th><th>Waar</th></tr></thead>
          <tbody>${d.recent.length ? d.recent.map((a) => `<tr style="cursor:default"><td>${fmtDateTime(a.at)}</td><td>${esc(activityLabel(a))}</td><td class="num">${a.minutes}</td><td class="num">${a.correct} / ${a.items}</td><td class="num">${a.accuracy}%</td><td class="num">${a.kind === 'lesson' ? `${a.sec} s` : '–'}</td><td>${a.stars != null ? starsHtml(a.stars) : ''}</td><td>${esc(a.place)}</td></tr>`).join('') : '<tr><td colspan="8" class="muted">Nog geen activiteit.</td></tr>'}</tbody></table></div>
        </section>
        <section class="panel wide"><h2>Badges</h2><p class="panel-sub">${earned.size} van ${BADGES.length}</p>
          <div class="row">${BADGES.filter((b) => earned.has(b.id)).map((b) => `<span class="chip good" title="${esc(b.desc)}">${icon(b.icon)} ${esc(b.name)}</span>`).join('') || '<span class="muted">Nog geen badges.</span>'}</div>
        </section>
        <section class="panel wide"><h2>Instellingen en aantekeningen</h2>
          <form data-settings class="settings-grid">
            <div>
              <div class="field"><label for="lvl">Niveau van de zinnen</label>
                <select id="lvl" name="levelShift">${LEVEL_SHIFTS.map(([v, l]) => `<option value="${v}" ${(st.settings.levelShift || 0) === v ? 'selected' : ''}>${l}${v === 0 ? ` (passend bij groep ${d.class.groep})` : v < 0 ? ' (kortere zinnen)' : ' (langere zinnen)'}</option>`).join('')}</select>
                <span class="hint">Past de lengte en moeilijkheid van de zinnen aan, bijvoorbeeld bij een lees- of taalachterstand of juist als extra uitdaging.</span></div>
              <div class="field"><label for="unlock">Lessen vrijgeven tot en met</label>
                <select id="unlock" name="unlockUpTo"><option value="0">Automatisch (na het halen van de vorige les)</option>${LESSONS.map((l) => `<option value="${l.id}" ${st.settings.unlockUpTo === l.id ? 'selected' : ''}>Les ${l.id}: ${esc(l.title)}</option>`).join('')}</select>
                <span class="hint">Handig voor leerlingen die al kunnen ontleden.</span></div>
              <div class="field"><label for="klas">Klas</label>
                <select id="klas" name="klas">${(classOptions.some((c) => c.id === d.class.id) ? classOptions : [{ id: d.class.id, name: d.class.name }, ...classOptions]).map((c) => `<option value="${c.id}" ${c.id === d.class.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
                <span class="hint">Verplaats de leerling naar een andere klas; alle resultaten gaan mee.</span></div>
            </div>
            <div>
              <label class="check"><input type="checkbox" name="readAloud" ${st.settings.readAloud ? 'checked' : ''}> Zinnen voorlezen bij de uitleg</label>
              <label class="check"><input type="checkbox" name="largeText" ${st.settings.largeText ? 'checked' : ''}> Grotere letters</label>
              <label class="check"><input type="checkbox" name="dyslexia" ${st.settings.dyslexia ? 'checked' : ''}> Extra letterafstand (dyslexie)</label>
              <label class="check"><input type="checkbox" name="sound" ${st.settings.sound ? 'checked' : ''}> Geluid</label>
              <label class="check"><input type="checkbox" name="music" ${st.settings.music !== false ? 'checked' : ''}> Achtergrondmuziek (de band speelt mee)</label>
            </div>
            <div class="field"><label for="note">Aantekeningen (alleen zichtbaar voor jou)</label><textarea id="note" name="note" class="note-box">${esc(st.note)}</textarea></div>
            <div class="row" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Opslaan</button><span class="spacer"></span><button class="btn btn-danger" type="button" data-delete>${icon('trash')} Leerling verwijderen</button></div>
          </form>
        </section>
      </div>`);

    // grafieken
    const series = d.series.slice(-30);
    lineChart(main.querySelector('[data-score]'), { points: series.map((x) => ({ day: x.day, value: x.score })), color: SERIES.blue, unit: '% goed', yMax: 100, yMin: 0, target: STAR_RULES.three, targetLabel: `${STAR_RULES.three}% (3 sterren)` });
    lineChart(main.querySelector('[data-sec]'), { points: series.map((x) => ({ day: x.day, value: x.sec })), color: SERIES.aqua, unit: ' s per zin', area: false });
    const sk = range === 'recent' ? d.skills : d.skillsAll;
    skillBars(main.querySelector('[data-skills]'), sk.skills);
    confusionList(main.querySelector('[data-conf]'), sk.confusions);
    calendar(main.querySelector('[data-cal]'), d.calendar);
    const placeMax = Math.max(1, ...placeData.map(([, v]) => v || 0));
    main.querySelector('[data-place]').innerHTML = `<div class="finger-bars">${placeData.map(([label, v]) => `<div class="finger-bar"><span>${label}</span>
      <span class="track"><i style="width:${((v || 0) / placeMax) * 100}%;background:${SERIES.violet}"></i></span><span style="text-align:right">${minutesLabel(v || 0)}</span></div>`).join('')}</div>`;
    const adv = advice(d);
    main.querySelector('[data-advice]').innerHTML = adv.length ? `<ul style="margin:0;padding-left:18px;display:grid;gap:8px">${adv.map((a) => `<li>${a}</li>`).join('')}</ul>` : '<p class="muted">Nog te weinig gegevens voor advies.</p>';

    main.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', () => { range = b.dataset.range; render(); }));

    // instellingen
    const form = main.querySelector('[data-settings]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements;
      try {
        const newClass = Number(f.klas.value);
        d = await api('PATCH', `/api/teacher/students/${sid}`, {
          note: f.note.value,
          classId: newClass,
          settings: {
            levelShift: Number(f.levelShift.value), unlockUpTo: Number(f.unlockUpTo.value), readAloud: f.readAloud.checked,
            largeText: f.largeText.checked, dyslexia: f.dyslexia.checked, sound: f.sound.checked, music: f.music.checked,
          },
        });
        toast('Opgeslagen', 'good');
        if (newClass !== classId) { go(`#/klas/${newClass}/leerling/${sid}`); return; }
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

export { fmtDate };
