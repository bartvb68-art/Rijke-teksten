import { api, esc, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { rocketSvg } from '../avatar.js';
import { session, setStudentState, go } from '../app.js';
import { raceText, targetApm } from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import { TypingEngine, TextView, charFromEvent } from '../typing.js';
import { sfx } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';

const BOTS = [
  { name: 'Komeet Kees', factor: 0.85, avatar: { body: 'oranje', pattern: 'strepen', window: 'blauw', flame: 'vuur' } },
  { name: 'Nova', factor: 1.0, avatar: { body: 'roze', pattern: 'stippen', window: 'groen', flame: 'paars' } },
  { name: 'Pulsar', factor: 1.12, avatar: { body: 'paars', pattern: 'bliksem', window: 'goud', flame: 'neon' } },
];

export default async function race(root) {
  if (!session.state) setStudentState(await api('GET', '/api/student/state'));
  const st = session.state;
  if (!st.gamesUnlocked) { toast('De spellen zijn nog op slot.'); go('#/kaart'); return undefined; }
  const myApm = Math.max(25, st.stats.recentApm || targetApm(st.unlocked, st.class.groep, st.student.settings.speedFactor) * 0.75);

  root.innerHTML = `${hudHtml('kaart')}
  <div class="game-page">
    <div class="game-hud">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1 style="margin:0;font-size:1.5rem">Raketrace</h1>
      <span class="spacer"></span>
      <span class="hud-pill">${icon('bolt')} <b data-apm>0</b> aanslagen/min</span>
      <span class="hud-pill">${icon('target')} <b data-acc>100%</b> goed</span>
    </div>
    <div class="typing-card" style="margin-bottom:14px">
      <div class="textview" data-text style="--fs:1.8rem"></div>
    </div>
    <div class="game-stage">
      <div class="race-track" data-track></div>
      <div class="game-overlay" data-overlay></div>
    </div>
  </div>`;
  bindHud(root);
  const $ = (s) => root.querySelector(s);
  const overlay = $('[data-overlay]');

  let engine;
  let view;
  let state = 'intro';
  let bots;
  let startAt = 0;
  let raf = 0;
  let finishOrder = [];
  let myPlace = null;
  let timers = [];

  function setup() {
    const text = raceText(st.unlocked, Date.now());
    engine = new TypingEngine(text);
    view = new TextView($('[data-text]'), text);
    view.update(engine);
    bots = BOTS.map((b) => ({ ...b, apm: myApm * b.factor * (0.95 + Math.random() * 0.1), progress: 0, done: false, wobble: Math.random() * 10 }));
    finishOrder = [];
    myPlace = null;
    const lanes = [{ name: `${st.student.name} (jij)`, avatar: st.student.avatar, me: true }, ...bots];
    $('[data-track]').innerHTML = lanes.map((l, i) => `<div class="lane ${l.me ? 'me' : ''}" data-lane="${i}">
      <span class="racer-name">${esc(l.name)}</span>
      <span class="racer">${rocketSvg(l.avatar, { size: 52 })}</span>
      <span class="place" data-place></span>
      <span class="finish"></span></div>`).join('');
    render();
  }

  function laneEl(i) { return $(`[data-lane="${i}"]`); }

  function render() {
    const track = $('[data-track]');
    const width = track.clientWidth - 36 - 70;
    const set = (i, p) => { laneEl(i).querySelector('.racer').style.left = `${Math.max(0, Math.min(1, p)) * width}px`; };
    set(0, engine.progress);
    bots.forEach((b, i) => set(i + 1, b.progress));
    $('[data-apm]').textContent = Math.round(engine.apm);
    $('[data-acc]').textContent = `${Math.round(engine.accuracy)}%`;
  }

  function placeLabel(i, place) {
    const el = laneEl(i).querySelector('[data-place]');
    el.textContent = `${place}e`;
    el.style.color = ['#ffc23d', '#dfe6ff', '#e0a46a', '#aab3d6'][place - 1];
  }

  let lastTick = performance.now();
  function tick(now = performance.now()) {
    const dt = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;
    if (state === 'race' || state === 'finishing') {
      const elapsed = (performance.now() - startAt) / 1000;
      bots.forEach((b, i) => {
        if (b.done) return;
        const wob = 1 + 0.12 * Math.sin(elapsed * 0.9 + b.wobble);
        b.progress += ((b.apm / 60) * wob * dt) / engine.text.length;
        if (b.progress >= 1) {
          b.progress = 1;
          b.done = true;
          finishOrder.push(`bot${i}`);
          placeLabel(i + 1, finishOrder.length);
        }
      });
      render();
      if (state === 'finishing' && bots.every((b) => b.done)) state = 'done';
    }
    raf = requestAnimationFrame(tick);
  }

  function showIntro() {
    state = 'intro';
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card">
      <h2>Raketrace</h2>
      <p>Race tegen Komeet Kees, Nova en Pulsar! Hoe sneller en netter je typt, hoe harder je raket vliegt. Bij een fout moet je eerst de goede toets typen.</p>
      <p class="muted">De andere raketten passen zich aan jouw snelheid aan, dus het blijft spannend.</p>
      <button class="btn btn-primary btn-big" data-go>${icon('play')} Start (spatie)</button>
    </div>`;
    overlay.querySelector('[data-go]').addEventListener('click', countdown);
  }

  function countdown() {
    if (state !== 'intro' && state !== 'result') return;
    setup();
    state = 'countdown';
    overlay.hidden = false;
    let n = 3;
    const show = () => {
      overlay.innerHTML = `<div class="countdown">${n > 0 ? n : 'START!'}</div>`;
      if (n > 0) sfx.count(); else sfx.go();
      if (n === 0) {
        timers.push(setTimeout(() => {
          overlay.hidden = true;
          state = 'race';
          startAt = performance.now();
        }, 450));
        return;
      }
      n -= 1;
      timers.push(setTimeout(show, 800));
    };
    show();
  }

  async function finish() {
    state = 'finishing';
    finishOrder.push('me');
    myPlace = finishOrder.length;
    placeLabel(0, myPlace);
    if (myPlace === 1) sfx.fanfare(); else sfx.step();
    const res = engine.result();
    let saved = null;
    try {
      saved = await api('POST', '/api/student/attempt', { kind: 'game', game: 'race', ...res, score: Math.round(res.apm * (res.accuracy / 100) * 10), extra: { place: myPlace } });
      setStudentState(saved.state);
    } catch (err) {
      toast(`Resultaat niet opgeslagen: ${err.message}`, 'error');
    }
    timers.push(setTimeout(() => showResult(res, saved), 1200));
  }

  function showResult(res, saved) {
    state = 'result';
    const medals = { 1: 'Goud!', 2: 'Zilver!', 3: 'Brons!' };
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card result">
      <h2>${myPlace === 1 ? 'Gewonnen!' : `${myPlace}e plaats`} ${medals[myPlace] ? `· ${medals[myPlace]}` : ''}</h2>
      <div class="result-stats">
        <div class="stat"><b>${myPlace}e</b><span>plaats</span></div>
        <div class="stat"><b>${res.apm}</b><span>aanslagen per minuut</span></div>
        <div class="stat"><b>${Math.round(res.accuracy)}%</b><span>goed getypt</span></div>
      </div>
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('coin')} +${saved.coins} sterrenstof</span>` : ''}</div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn btn-primary" data-again>${icon('play')} Nieuwe race (Enter)</button><a class="btn btn-ghost" href="#/kaart">${icon('map')} Kaart</a></div>
    </div>`;
    overlay.querySelector('[data-again]').addEventListener('click', countdown);
    if (saved?.newBadges?.length) {
      modal({
        title: 'Nieuwe badge!',
        body: `<div class="badge-grid">${saved.newBadges.map((id) => BADGE_BY_ID[id]).filter(Boolean).map((b) => `<div class="badge-card"><span class="badge-icon earned">${icon(b.icon)}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`).join('')}</div>`,
        actions: [{ label: 'Hoera!', value: true, primary: true }],
      });
    }
  }

  function onKey(e) {
    if (document.querySelector('.modal-backdrop')) return;
    if (state === 'intro' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); countdown(); return; }
    if (state === 'result' && e.key === 'Enter') { e.preventDefault(); countdown(); return; }
    if (state !== 'race') return;
    const ch = charFromEvent(e);
    if (ch == null) return;
    e.preventDefault();
    const r = engine.input(ch);
    if (r === 'wrong') { sfx.error(); view.shake(); } else if (r === 'correct') sfx.key();
    view.update(engine);
    if (engine.done) finish();
  }

  window.addEventListener('keydown', onKey);
  setup();
  showIntro();
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
  };
}
