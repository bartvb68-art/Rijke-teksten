import { api, esc, starsHtml, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { session, setStudentState, go } from '../app.js';
import {
  LESSON_BY_ID, LESSONS, PLANETS, lessonSteps, generateText, targetApm, CHAR_INFO, FINGERS, keyLabel, charsUpTo, STAR_RULES,
} from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import { TypingEngine, TextView, charFromEvent } from '../typing.js';
import { keyboardHtml, handsHtml, highlightNext, flashKey, FINGER_COLORS } from '../keyboard.js';
import { sfx } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';

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
  const planet = PLANETS.find((p) => p.id === lesson.planet);
  const alreadyPassed = (session.state.progress[lessonId]?.stars || 0) >= 1;
  const doneSteps = new Set();
  let stepIndex = 0;
  let engine = null;
  let view = null;
  let phase = 'ready'; // ready | typing | saving | result
  let liveTimer = null;
  let resultActions = [];

  const target = () => targetApm(lessonId, session.state.class.groep, session.state.student.settings.speedFactor);

  root.innerHTML = `${hudHtml('kaart')}
  <div class="lesson-page" style="--pc:${planet.color}">
    <div class="lesson-head">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1>Les ${lessonId}: ${esc(lesson.title)}</h1>
      <span class="spacer"></span>
      <div class="steps" data-steps></div>
    </div>
    <p class="touch-note">Tip: sluit een toetsenbord aan. Typen leer je het best op een echt toetsenbord.</p>
    <div class="typing-card" data-card>
      <div class="typing-stats">
        <span class="progress" aria-label="Voortgang"><i data-progress style="width:0%"></i></span>
        <span>Goed: <b data-acc>100%</b></span>
        <span data-apm-wrap hidden>Snelheid: <b data-apm>0</b> aanslagen/min</span>
      </div>
      <div class="textview" data-text aria-label="Tekst om te typen"></div>
      <div class="press-start" data-overlay></div>
    </div>
    <div class="kb-wrap" data-kbwrap>
      ${keyboardHtml({ known: charsUpTo(lessonId) })}
      ${session.state.student.settings.showHands ? handsHtml() : '<div class="hands"><div class="finger-hint"></div></div>'}
    </div>
  </div>`;
  bindHud(root);

  const $ = (sel) => root.querySelector(sel);
  const overlay = $('[data-overlay]');
  const kbwrap = $('[data-kbwrap]');
  const card = $('[data-card]');

  function showPanel(html) {
    overlay.hidden = false;
    card.classList.add('briefing');
    overlay.innerHTML = html;
  }

  function hidePanel() {
    overlay.hidden = true;
    card.classList.remove('briefing');
    view.update(engine);
  }

  function renderSteps() {
    $('[data-steps]').innerHTML = steps.map((s, i) => {
      const clickable = phase !== 'typing' && (doneSteps.has(i) || alreadyPassed || i <= Math.max(0, ...[...doneSteps].map((d) => d + 1)));
      const cls = `step-pill ${i === stepIndex ? 'active' : ''} ${doneSteps.has(i) ? 'done' : ''}`;
      return clickable && i !== stepIndex
        ? `<button class="${cls}" data-step="${i}">${esc(s.title)}</button>`
        : `<span class="${cls}">${esc(s.title)}</span>`;
    }).join('');
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => loadStep(Number(b.dataset.step))));
  }

  function newKeysHtml() {
    if (lesson.newKeys.includes('Shift')) {
      return `<div class="newkeys"><span class="newkey" style="--fc:${FINGER_COLORS.lp}">Shift<small>pink</small></span><span class="newkey" style="--fc:${FINGER_COLORS.rp}">Shift<small>pink</small></span></div>`;
    }
    return `<div class="newkeys">${lesson.newKeys.map((k) => {
      const info = CHAR_INFO[k];
      return `<span class="newkey" style="--fc:${FINGER_COLORS[info.finger]}">${esc(k === ' ' ? '␣' : k.toUpperCase())}<small>${esc(FINGERS[info.finger].name)}</small></span>`;
    }).join('')}</div>`;
  }

  function loadStep(i) {
    stepIndex = i;
    phase = 'ready';
    clearInterval(liveTimer);
    const step = steps[i];
    const text = generateText(lessonId, i, Date.now());
    engine = new TypingEngine(text);
    view = new TextView($('[data-text]'), text);
    view.update(engine);
    updateLive();
    $('[data-apm-wrap]').hidden = !['test', 'text'].includes(step.kind);
    highlightNext(kbwrap, null);
    renderSteps();
    const t = target();
    showPanel(`<div>
      <p class="muted" style="margin:0">Stap ${i + 1} van ${steps.length}</p>
      <h2>${esc(step.title)}</h2>
      ${step.kind === 'intro' ? `${newKeysHtml()}<p style="max-width:52ch;margin:10px auto">${esc(lesson.tip)}</p>` : `<p>${esc(step.desc)}</p>`}
      ${step.kind === 'test' ? `<p class="target-line">${starsHtml(3)} Doel: minstens ${STAR_RULES.three}% goed en ${t} aanslagen per minuut.<br>Met minstens ${STAR_RULES.one}% goed verdien je al 1 ster.</p>` : ''}
      <p style="margin-top:16px">Leg je vingers op de thuisrij en druk op <kbd>spatie</kbd> om te beginnen</p>
      <button class="btn btn-primary" data-start>${icon('play')} Start</button>
    </div>`);
    overlay.querySelector('[data-start]').addEventListener('click', start);
    if (step.kind === 'intro') {
      const keys = lesson.newKeys.includes('Shift') ? ['ShiftLeft', 'ShiftRight'] : lesson.newKeys;
      keys.forEach((k) => kbwrap.querySelector(`.kb-key[data-key="${CSS.escape(k)}"]`)?.classList.add('next'));
    }
  }

  function start() {
    if (phase !== 'ready') return;
    phase = 'typing';
    hidePanel();
    renderSteps();
    highlightNext(kbwrap, engine.expected);
    liveTimer = setInterval(updateLive, 500);
  }

  function updateLive() {
    if (!engine) return;
    $('[data-progress]').style.width = `${Math.round(engine.progress * 100)}%`;
    $('[data-acc]').textContent = `${Math.round(engine.accuracy)}%`;
    $('[data-apm]').textContent = Math.round(engine.apm);
  }

  async function finish() {
    phase = 'saving';
    clearInterval(liveTimer);
    updateLive();
    highlightNext(kbwrap, null);
    const res = engine.result();
    const step = steps[stepIndex];
    doneSteps.add(stepIndex);
    let saved = null;
    try {
      saved = await api('POST', '/api/student/attempt', { kind: 'lesson', lessonId, step: stepIndex, ...res });
      setStudentState(saved.state);
      const coinsEl = root.querySelector('[data-coins]');
      if (coinsEl) coinsEl.textContent = saved.state.student.coins;
    } catch (err) {
      toast(`Je resultaat kon niet worden opgeslagen: ${err.message}`, 'error');
    }
    showResult(step, res, saved);
  }

  function showResult(step, res, saved) {
    phase = 'result';
    renderSteps();
    const isTest = step.kind === 'test';
    const stars = saved?.stars ?? null;
    const mastery = session.state.class.settings.mastery || 1;
    const passed = isTest && stars != null && stars >= mastery;
    const nextLesson = LESSONS.find((l) => l.id === lessonId + 1);
    const canNext = passed && nextLesson && session.state.unlocked >= nextLesson.id;
    const tricky = engine.trickyKeys(4);
    const last = stepIndex === steps.length - 1;
    let title = 'Goed gedaan!';
    if (isTest) title = stars === 3 ? 'Fantastisch!' : stars === 2 ? 'Super gedaan!' : stars === 1 ? 'Gehaald!' : 'Bijna! Probeer het nog eens';
    else if (res.accuracy < 85) title = 'Rustig aan, netjes is belangrijker dan snel';

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
        <div class="stat"><b>${res.apm}</b><span>aanslagen per minuut</span></div>
        <div class="stat"><b>${Math.round(res.accuracy)}%</b><span>goed getypt</span></div>
        <div class="stat"><b>${res.errors}</b><span>${res.errors === 1 ? 'fout' : 'fouten'}</span></div>
      </div>
      ${isTest ? `<p class="target-line">Doel voor 3 sterren: ${STAR_RULES.three}% goed en ${target()} aanslagen per minuut.</p>` : ''}
      ${tricky.length ? `<p>Let extra op: <span class="tricky">${tricky.map((k) => `<kbd>${esc(k === ' ' ? '␣' : k)}</kbd>`).join('')}</span></p>` : '<p>Geen enkele fout. Knap!</p>'}
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('coin')} +${saved.coins} sterrenstof</span>` : ''}${saved.rankUp ? `<span class="reward">${icon('medal')} Nieuwe rang: ${esc(saved.rankUp)}</span>` : ''}</div>` : ''}
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

  function onKey(e) {
    if (document.querySelector('.modal-backdrop')) return;
    if (phase === 'ready') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        start();
      }
      return;
    }
    if (phase === 'result') {
      if (e.key === 'Enter') {
        e.preventDefault();
        (resultActions.find((a) => a.primary) || resultActions[0])?.fn();
      }
      return;
    }
    if (phase !== 'typing') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      loadStep(stepIndex);
      return;
    }
    const ch = charFromEvent(e);
    if (ch == null) return;
    e.preventDefault();
    const r = engine.input(ch);
    if (r === 'correct') {
      sfx.key();
      flashKey(kbwrap, ch, 'right');
    } else if (r === 'wrong') {
      sfx.error();
      flashKey(kbwrap, ch, 'wrong');
      view.shake();
    }
    view.update(engine);
    updateLive();
    if (engine.done) finish();
    else highlightNext(kbwrap, engine.expected);
  }

  window.addEventListener('keydown', onKey);
  loadStep(0);

  return () => {
    window.removeEventListener('keydown', onKey);
    clearInterval(liveTimer);
  };
}

export { keyLabel };
