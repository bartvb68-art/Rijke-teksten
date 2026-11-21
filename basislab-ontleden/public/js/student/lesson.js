import { api, esc, starsHtml, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { session, setStudentState, go } from '../app.js';
import {
  LESSON_BY_ID, LESSONS, PODIA, LABELS, lessonSteps, generateItems, checkAnswer, explainItem, hintFor, STAR_RULES,
} from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import { sfx, speak, canSpeak, stopSpeaking } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';
import { sentenceHtml, solvedHtml, promptFor, labelPill, mergeStats, mergeCounts } from '../ontleed-ui.js';

const PRAISE = ['Goed zo!', 'Helemaal goed!', 'Toppie!', 'Precies!', 'Raak!', 'Wat een ritme!'];

export default async function lessonView(root, params) {
  const lessonId = Number(params.id);
  const lesson = LESSON_BY_ID[lessonId];
  if (!session.state) setStudentState(await api('GET', '/api/student/state'));
  if (!lesson || lessonId > session.state.unlocked) {
    toast('Deze les is nog op slot. Haal eerst de vorige les!');
    go('#/kaart');
    return undefined;
  }
  const steps = lessonSteps(lessonId);
  const podium = PODIA.find((p) => p.id === lesson.podium);
  const alreadyPassed = (session.state.progress[lessonId]?.stars || 0) >= 1;
  const doneSteps = new Set();
  const settings = () => session.state.student.settings;
  let stepIndex = 0;
  let items = [];
  let itemIndex = 0;
  let phase = 'ready'; // ready | task | feedback | saving | result
  let st = {}; // antwoord bij de huidige opdracht
  let tally = null;
  let startedAt = 0;
  let resultActions = [];
  let hintOpen = false;

  root.innerHTML = `${hudHtml('kaart')}
  <div class="lesson-page" style="--pc:${podium.color}">
    <div class="lesson-head">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1>Les ${lessonId}: ${esc(lesson.title)}</h1>
      <span class="spacer"></span>
      <div class="steps" data-steps></div>
    </div>
    <div class="task-card" data-card>
      <div class="press-start" data-overlay></div>
      <div class="task-body">
        <div class="task-top">
          <span class="progress" aria-label="Voortgang"><i data-progress style="width:0%"></i></span>
          <span>Zin <b data-num>1</b> van <b data-total>1</b></span>
          <span>Goed: <b data-good>0</b></span>
        </div>
        <div class="task-prompt" data-prompt></div>
        <div data-zin aria-live="polite"></div>
        <div data-controls></div>
        <div class="hint-box" data-hint hidden></div>
        <div data-feedback></div>
        <div class="task-actions">
          <button class="btn btn-ghost" data-help>${icon('help')} Hulp</button>
          ${canSpeak() ? `<button class="btn btn-ghost read-btn" data-read>${icon('speaker')} Lees voor</button>` : ''}
          <span class="spacer"></span>
          <button class="btn btn-primary" data-go>${icon('check')} Controleer</button>
        </div>
      </div>
    </div>
  </div>`;
  bindHud(root);

  const $ = (sel) => root.querySelector(sel);
  const overlay = $('[data-overlay]');
  const card = $('[data-card]');
  const step = () => steps[stepIndex];
  const item = () => items[itemIndex];

  function showPanel(html) {
    overlay.hidden = false;
    card.classList.add('briefing');
    overlay.innerHTML = html;
  }

  function hidePanel() {
    overlay.hidden = true;
    card.classList.remove('briefing');
  }

  function renderSteps() {
    $('[data-steps]').innerHTML = steps.map((s, i) => {
      const clickable = !['task', 'feedback', 'saving'].includes(phase) && (doneSteps.has(i) || alreadyPassed || i <= Math.max(0, ...[...doneSteps].map((d) => d + 1)));
      const cls = `step-pill ${i === stepIndex ? 'active' : ''} ${doneSteps.has(i) ? 'done' : ''}`;
      return clickable && i !== stepIndex
        ? `<button class="${cls}" data-step="${i}">${esc(s.title)}</button>`
        : `<span class="${cls}">${esc(s.title)}</span>`;
    }).join('');
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => loadStep(Number(b.dataset.step))));
  }

  function loadStep(i) {
    stepIndex = i;
    phase = 'ready';
    stopSpeaking();
    items = generateItems(lessonId, i, { groep: session.state.class.groep, levelShift: settings().levelShift || 0, seed: Date.now() });
    renderSteps();
    const s = step();
    let example = '';
    if (s.kind === 'intro' || (lesson.exam && i === 0)) {
      const ex = generateItems(lessonId, 1, { groep: session.state.class.groep, levelShift: -1, seed: Date.now() + 99 })[0];
      example = `<div class="intro-example"><p class="muted" style="margin:0 0 4px">Voorbeeld</p>${solvedHtml(ex)}
        <p style="margin:8px 0 0">${explainItem(ex).map(esc).join('<br>')}</p></div>`;
    }
    showPanel(`<div>
      <p class="muted" style="margin:0">Stap ${i + 1} van ${steps.length}</p>
      <h2>${esc(s.title)}</h2>
      ${s.kind === 'intro' || lesson.exam ? `<p style="max-width:62ch;margin:10px auto">${esc(lesson.tip)}</p>` : `<p>${esc(s.desc)}</p>`}
      ${lesson.teaches && LABELS[lesson.teaches] && s.kind === 'intro' ? `<p>${labelPill(lesson.teaches, { long: true })}</p>` : ''}
      ${example}
      ${s.kind === 'test' ? `<p class="target-line">${starsHtml(3)} ${s.count} zinnen. 1 ster vanaf ${STAR_RULES.one}% goed, 2 sterren vanaf ${STAR_RULES.two}%, 3 sterren vanaf ${STAR_RULES.three}%.</p>` : ''}
      <p style="margin-top:16px">Druk op <kbd>Enter</kbd> of klik op Start</p>
      <button class="btn btn-primary" data-start>${icon('play')} Start</button>
    </div>`);
    overlay.querySelector('[data-start]').addEventListener('click', start);
  }

  function start() {
    if (phase !== 'ready') return;
    hidePanel();
    tally = { correct: 0, stats: {}, confusions: {} };
    startedAt = Date.now();
    itemIndex = 0;
    phase = 'task';
    renderSteps();
    showItem();
  }

  function showItem() {
    phase = 'task';
    const it = item();
    st = { cuts: new Set(), selected: new Set(), labels: it.s.chunks.map(() => null), active: 0 };
    hintOpen = step().kind === 'intro';
    const p = promptFor(it);
    $('[data-prompt]').innerHTML = `<div><h2>${esc(p.title)}</h2><p class="muted" style="margin:4px 0 0">${esc(p.sub)}</p></div>${p.label ? labelPill(p.label, { long: true }) : ''}`;
    $('[data-num]').textContent = itemIndex + 1;
    $('[data-total]').textContent = items.length;
    $('[data-good]').textContent = tally.correct;
    $('[data-progress]').style.width = `${Math.round((itemIndex / items.length) * 100)}%`;
    $('[data-feedback]').innerHTML = '';
    $('[data-help]').hidden = !step().hints;
    renderZin();
    renderControls();
    renderHint();
    updateGo();
    if (settings().readAloud && canSpeak() && step().kind === 'intro') speak(it.s.text);
  }

  function renderZin(result = null) {
    const it = item();
    $('[data-zin]').innerHTML = sentenceHtml(it, st, { result });
    if (result) return;
    root.querySelectorAll('[data-gap]').forEach((b) => b.addEventListener('click', () => toggleCut(Number(b.dataset.gap))));
    root.querySelectorAll('button[data-chunk]').forEach((b) => b.addEventListener('click', () => clickChunk(Number(b.dataset.chunk))));
  }

  function renderControls(result = null) {
    const it = item();
    const box = $('[data-controls]');
    if (it.mode === 'label') {
      box.innerHTML = `<div class="pads">${it.choices.map((l, i) => `<button class="pad" style="--lc:${LABELS[l].color}" data-pad="${l}" ${result ? 'disabled' : ''}>
        <span>${esc(LABELS[l].short)} <kbd>${i + 1}</kbd></span><small>${esc(LABELS[l].name)}</small></button>`).join('')}</div>`;
      box.querySelectorAll('[data-pad]').forEach((b) => b.addEventListener('click', () => setLabel(b.dataset.pad)));
    } else if (it.mode === 'quiz') {
      box.innerHTML = `<div class="options">${it.options.map((o, i) => {
        const cls = result ? (o.value === it.answer ? 'ok' : o.value === st.quiz ? 'bad' : '') : '';
        return `<button class="option ${cls}" data-opt="${esc(o.value)}" ${result ? 'disabled' : ''}><kbd>${i + 1}</kbd>${esc(o.label)}</button>`;
      }).join('')}</div>`;
      box.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => { st.quiz = b.dataset.opt; check(); }));
    } else {
      box.innerHTML = '';
    }
  }

  function renderHint() {
    const h = $('[data-hint]');
    h.hidden = !(hintOpen && step().hints);
    if (!h.hidden) h.innerHTML = `${icon('help')} ${esc(hintFor(item()))}`;
  }

  function updateGo() {
    const it = item();
    const btn = $('[data-go]');
    if (phase === 'feedback') {
      btn.innerHTML = itemIndex < items.length - 1 ? `Volgende ${icon('play')}` : `Klaar ${icon('check')}`;
      btn.disabled = false;
      btn.hidden = false;
      return;
    }
    btn.innerHTML = `${icon('check')} Controleer`;
    btn.hidden = it.mode === 'quiz';
    btn.disabled = (it.mode === 'label' && st.labels.some((l) => !l)) || (it.mode === 'select' && !st.selected.size);
  }

  function toggleCut(i) {
    if (phase !== 'task') return;
    st.cuts.has(i) ? st.cuts.delete(i) : st.cuts.add(i);
    sfx.tick();
    renderZin();
    updateGo();
    root.querySelector(`[data-gap="${i}"]`)?.focus();
  }

  function clickChunk(i) {
    if (phase !== 'task') return;
    const it = item();
    if (it.mode === 'select') {
      if (st.selected.has(i)) st.selected.delete(i);
      else {
        // bij één zinsdeel (pv, ow, lv, mv) is één keuze genoeg: de vorige keuze vervalt
        if (['pv', 'ow', 'lv', 'mv'].includes(it.target)) st.selected.clear();
        st.selected.add(i);
      }
      sfx.pick();
    } else if (it.mode === 'label') {
      st.active = i;
    }
    renderZin();
    updateGo();
    root.querySelector(`[data-chunk="${i}"]`)?.focus();
  }

  function setLabel(l) {
    if (phase !== 'task') return;
    st.labels[st.active] = l;
    sfx.pick();
    const next = st.labels.findIndex((x, i) => i > st.active && !x);
    const first = st.labels.findIndex((x) => !x);
    st.active = next >= 0 ? next : first >= 0 ? first : st.active;
    renderZin();
    updateGo();
  }

  function answerOf(it) {
    if (it.mode === 'split') return [...st.cuts];
    if (it.mode === 'select') return [...st.selected];
    if (it.mode === 'label') return st.labels;
    return st.quiz;
  }

  function check() {
    if (phase !== 'task') return;
    const it = item();
    if (it.mode === 'label' && st.labels.some((l) => !l)) { toast('Geef eerst elk zinsdeel een etiket.'); return; }
    const r = checkAnswer(it, answerOf(it));
    if (r.correct) tally.correct += 1;
    mergeStats(tally.stats, r.stats);
    mergeCounts(tally.confusions, r.confusions);
    phase = 'feedback';
    stopSpeaking();
    r.correct ? sfx.good() : sfx.error();
    renderZin(r);
    renderControls(r);
    $('[data-good]').textContent = tally.correct;
    $('[data-progress]').style.width = `${Math.round(((itemIndex + 1) / items.length) * 100)}%`;
    $('[data-hint]').hidden = true;
    $('[data-help]').hidden = true;
    const lines = explainItem(it);
    $('[data-feedback]').innerHTML = `<div class="feedback ${r.correct ? 'good' : 'wrong'}" role="status">
      <h3>${r.correct ? esc(PRAISE[Math.floor(Math.random() * PRAISE.length)]) : 'Niet helemaal…'}</h3>
      ${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
    updateGo();
    $('[data-go]').focus();
  }

  function next() {
    if (phase !== 'feedback') return;
    if (itemIndex < items.length - 1) {
      itemIndex += 1;
      showItem();
    } else finish();
  }

  async function finish() {
    phase = 'saving';
    stopSpeaking();
    const s = step();
    doneSteps.add(stepIndex);
    const res = {
      items: items.length, correct: tally.correct, durationMs: Math.max(1000, Date.now() - startedAt),
      skillStats: tally.stats, confusions: tally.confusions,
    };
    let saved = null;
    try {
      saved = await api('POST', '/api/student/attempt', { kind: 'lesson', lessonId, step: stepIndex, ...res });
      setStudentState(saved.state);
      const coinsEl = root.querySelector('[data-coins]');
      if (coinsEl) coinsEl.textContent = saved.state.student.coins;
    } catch (err) {
      toast(`Je resultaat kon niet worden opgeslagen: ${err.message}`, 'error');
    }
    showResult(s, res, saved);
  }

  function weakLabels() {
    return Object.entries(tally.stats).filter(([, v]) => v[1] > 0).sort((a, b) => b[1][1] - a[1][1]).slice(0, 3).map(([k]) => k);
  }

  function showResult(s, res, saved) {
    phase = 'result';
    renderSteps();
    const isTest = s.kind === 'test';
    const stars = saved?.stars ?? null;
    const mastery = session.state.class.settings.mastery || 1;
    const passed = isTest && stars != null && stars >= mastery;
    const nextLesson = LESSONS.find((l) => l.id === lessonId + 1);
    const canNext = passed && nextLesson && session.state.unlocked >= nextLesson.id;
    const last = stepIndex === steps.length - 1;
    const pct = Math.round((res.correct / res.items) * 100);
    const sec = Math.round(res.durationMs / 1000 / res.items);
    let title = pct >= 80 ? 'Goed gedaan!' : 'Blijven oefenen!';
    if (isTest) title = stars === 3 ? 'Wat een optreden!' : stars === 2 ? 'Super gedaan!' : stars === 1 ? 'Gehaald!' : 'Bijna! Probeer het nog eens';
    const weak = weakLabels();

    resultActions = [];
    if (isTest) {
      if (canNext) resultActions.push({ label: `Volgende les: ${nextLesson.title}`, icon: 'play', primary: true, fn: () => go(`#/les/${nextLesson.id}`) });
      if (passed && !nextLesson) resultActions.push({ label: 'Bekijk je diploma', icon: 'diploma', primary: true, fn: () => go('#/diploma') });
      resultActions.push({ label: passed ? 'Nog een keer (meer sterren)' : 'Probeer opnieuw', icon: 'back', primary: !passed, fn: () => loadStep(stepIndex) });
      resultActions.push({ label: 'Naar de kaart', icon: 'map', fn: () => go('#/kaart') });
    } else {
      if (!last) resultActions.push({ label: `Verder: ${steps[stepIndex + 1].title}`, icon: 'play', primary: true, fn: () => loadStep(stepIndex + 1) });
      resultActions.push({ label: 'Nog een keer', icon: 'back', fn: () => loadStep(stepIndex) });
    }

    showPanel(`<div class="result" data-testid="result">
      ${isTest && stars != null ? starsHtml(stars, 3, 'big') : ''}
      <h2>${esc(title)}</h2>
      <div class="result-stats">
        <div class="stat"><b>${res.correct} / ${res.items}</b><span>zinnen goed</span></div>
        <div class="stat"><b>${pct}%</b><span>goed</span></div>
        <div class="stat"><b>${sec} s</b><span>per zin</span></div>
      </div>
      ${isTest ? `<p class="target-line">1 ster vanaf ${STAR_RULES.one}% goed · 2 sterren vanaf ${STAR_RULES.two}% · 3 sterren vanaf ${STAR_RULES.three}%</p>` : ''}
      ${weak.length ? `<p>Let extra op: <span class="legend-pills" style="display:inline-flex">${weak.map((l) => labelPill(l, { long: true })).join('')}</span></p>` : '<p>Geen enkele fout. Knap!</p>'}
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('note')} +${saved.coins} muzieknoten</span>` : ''}${saved.rankUp ? `<span class="reward">${icon('medal')} Nieuwe rang: ${esc(saved.rankUp)}</span>` : ''}</div>` : ''}
      <div class="row" style="justify-content:center">${resultActions.map((a, i) => `<button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" data-act="${i}">${icon(a.icon)} ${esc(a.label)}</button>`).join('')}</div>
      <p class="muted" style="margin-top:12px;font-size:.9rem">Druk op <kbd>Enter</kbd> om verder te gaan</p>
    </div>`);
    overlay.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => resultActions[Number(b.dataset.act)].fn()));
    if (isTest && stars) for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 350 * i + 100);
    else sfx.step();
    if (passed && saved?.unlockedNext) setTimeout(() => sfx.fanfare(), 1300);
    if (saved?.newBadges?.length) {
      setTimeout(() => {
        modal({
          title: saved.newBadges.length > 1 ? 'Nieuwe badges!' : 'Nieuwe badge!',
          body: `<div class="badge-grid">${saved.newBadges.map((id) => {
            const b = BADGE_BY_ID[id];
            return b ? `<div class="badge-card"><span class="badge-icon earned">${icon(b.icon)}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>` : '';
          }).join('')}</div>`,
          actions: [{ label: 'Hoera!', value: true, primary: true }],
        });
        sfx.coin();
      }, isTest ? 1600 : 700);
    }
  }

  $('[data-go]').addEventListener('click', () => (phase === 'feedback' ? next() : check()));
  $('[data-help]').addEventListener('click', () => { hintOpen = !hintOpen; renderHint(); });
  $('[data-read]')?.addEventListener('click', () => {
    const it = item();
    speak(it.mode === 'quiz' ? `${it.s.text} ${it.question}` : it.s.text);
  });

  function onKey(e) {
    if (document.querySelector('.modal-backdrop')) return;
    if (e.target.closest?.('input, textarea, select')) return;
    if (phase === 'ready') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
      return;
    }
    if (phase === 'result') {
      if (e.key === 'Enter') { e.preventDefault(); (resultActions.find((a) => a.primary) || resultActions[0])?.fn(); }
      return;
    }
    // Enter is altijd "Controleer" of "Volgende", behalve op andere knoppen (Hulp, Lees voor, Kaart)
    const a = document.activeElement;
    const otherButton = a?.matches?.('button, a') && !a.matches('.gap, .chunk, .pad, .option, [data-go]');
    if (phase === 'feedback') {
      if (e.key === 'Enter' && !otherButton) { e.preventDefault(); next(); }
      return;
    }
    if (phase !== 'task') return;
    const it = item();
    if (e.key === 'Enter') {
      if (otherButton) return;
      e.preventDefault();
      if (!$('[data-go]').disabled && it.mode !== 'quiz') check();
      return;
    }
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= 9 && e.key.length === 1) {
      if (it.mode === 'label' && it.choices[n - 1]) { e.preventDefault(); setLabel(it.choices[n - 1]); }
      if (it.mode === 'quiz' && it.options[n - 1]) { e.preventDefault(); st.quiz = it.options[n - 1].value; check(); }
      if (it.mode === 'select' && it.s.chunks[n - 1]) { e.preventDefault(); clickChunk(n - 1); }
      return;
    }
    if (it.mode === 'label' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      st.active = Math.max(0, Math.min(it.s.chunks.length - 1, st.active + (e.key === 'ArrowRight' ? 1 : -1)));
      renderZin();
    }
  }

  window.addEventListener('keydown', onKey);
  loadStep(0);

  return () => {
    window.removeEventListener('keydown', onKey);
    stopSpeaking();
  };
}
