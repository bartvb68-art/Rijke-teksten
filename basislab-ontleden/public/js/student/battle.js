import { api, esc, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { session, setStudentState, go } from '../app.js';
import { LABELS, gameLabels, gameSentences, makeRng } from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import { sfx } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';
import { mergeStats, mergeCounts } from '../ontleed-ui.js';

const FINISH = 10;
const BANDS = [
  { name: 'De Notenkrakers', avatar: { body: 'groen', pattern: 'stippen', guard: 'zwart', waves: 'aqua' }, factor: 0.85 },
  { name: 'Beat Brigade', avatar: { body: 'paars', pattern: 'strepen', guard: 'wit', waves: 'neon' }, factor: 1.05 },
  { name: 'De Valse Snaren', avatar: { body: 'oranje', pattern: 'geen', guard: 'parel', waves: 'plasma' }, factor: 1.35 },
];

export default async function battle(root) {
  setStudentState(await api('GET', '/api/student/state'));
  if (!session.state.gamesUnlocked) {
    toast('De spellen zijn nog op slot.');
    go('#/kaart');
    return undefined;
  }
  const labels = gameLabels(session.state.unlocked).filter((l) => l !== 'rest');
  const pool = gameSentences(session.state.unlocked).filter((s) => s.chunks.some((c) => labels.includes(c.label)));
  const rng = makeRng(Date.now());
  // tempo van de andere bands past zich aan aan de leerling
  const base = Math.max(3.5, Math.min(12, (session.state.stats.recentSec || 14) * 0.5));
  let timers = [];
  let g = null;

  root.innerHTML = `${hudHtml('kaart')}
  <div class="game-page">
    <div class="game-hud">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1 style="margin:0;font-size:1.5rem">Bandbattle</h1>
      <span class="spacer"></span>
      <span class="hud-pill">Goed: <b data-good>0</b> / ${FINISH}</span>
    </div>
    <div class="game-stage">
      <div class="race-track" data-track></div>
      <div class="game-overlay" data-overlay></div>
    </div>
    <div class="card task-card battle-q" data-q style="min-height:0"></div>
  </div>`;
  bindHud(root);
  const $ = (s) => root.querySelector(s);
  const overlay = $('[data-overlay]');

  const racers = () => [{ name: session.state.student.name, avatar: session.state.student.avatar, me: true }, ...BANDS];

  function renderTrack() {
    $('[data-track]').innerHTML = racers().map((r, i) => `<div class="lane ${r.me ? 'me' : ''}">
      <span class="racer-name">${esc(r.me ? `${r.name} (jij)` : r.name)}</span>
      <span class="racer" data-racer="${i}">${guitarSvg(r.avatar, { size: 52 })}</span>
      <span class="finish"></span><span class="place" data-place="${i}"></span></div>`).join('');
  }

  function moveRacer(i, pos) {
    const lane = $('[data-track] .lane');
    const el = root.querySelector(`[data-racer="${i}"]`);
    if (!lane || !el) return;
    const w = lane.clientWidth - 90;
    el.style.left = `${8 + (Math.min(pos, FINISH) / FINISH) * w}px`;
  }

  function intro() {
    renderTrack();
    $('[data-q]').hidden = true;
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card">
      <h2>Bandbattle</h2>
      <p>Welke band speelt het eerst ${FINISH} nummers? Bij elk goed antwoord komt jouw band een stap verder.</p>
      <p class="muted">Een fout antwoord? Dan sta je even stil. De andere bands spelen in jouw tempo.</p>
      <button class="btn btn-primary btn-big" data-go>${icon('play')} Start</button>
    </div>`;
    overlay.querySelector('[data-go]').addEventListener('click', countdown);
    overlay.querySelector('[data-go]').focus();
  }

  function countdown() {
    renderTrack();
    let n = 3;
    overlay.innerHTML = `<div class="countdown" data-count>${n}</div>`;
    sfx.count();
    const iv = setInterval(() => {
      n -= 1;
      if (n > 0) { overlay.querySelector('[data-count]').textContent = n; sfx.count(); return; }
      clearInterval(iv);
      sfx.go();
      overlay.hidden = true;
      begin();
    }, 800);
    timers.push(iv);
  }

  function begin() {
    g = { pos: [0, 0, 0, 0], done: [], items: 0, correct: 0, stats: {}, confusions: {}, started: Date.now(), running: true, locked: false };
    racers().forEach((_, i) => moveRacer(i, 0));
    BANDS.forEach((b, k) => scheduleBand(k + 1, b));
    $('[data-q]').hidden = false;
    nextQuestion();
  }

  function scheduleBand(i, band) {
    const t = setTimeout(() => {
      if (!g?.running) return;
      g.pos[i] += 1;
      moveRacer(i, g.pos[i]);
      if (g.pos[i] >= FINISH) { arrive(i); return; }
      scheduleBand(i, band);
    }, base * band.factor * (0.75 + rng() * 0.5) * 1000);
    timers.push(t);
  }

  function arrive(i) {
    if (g.done.includes(i)) return;
    g.done.push(i);
    const el = root.querySelector(`[data-place="${i}"]`);
    if (el) el.textContent = `${g.done.length}e`;
    if (i === 0 || g.done.filter((x) => x !== 0).length === BANDS.length) finish();
  }

  function nextQuestion() {
    const s = pool[Math.floor(rng() * pool.length)];
    const options = s.chunks.filter((c) => labels.includes(c.label));
    const chunk = options[Math.floor(rng() * options.length)];
    g.q = { s, chunk };
    g.locked = false;
    $('[data-q]').innerHTML = `<div class="task-prompt"><h2>Welk zinsdeel is gemarkeerd?</h2></div>
      <div class="zin">${s.chunks.map((c) => `<span class="chunk static ${c === chunk ? 'mark' : ''}">${esc(c.text)}</span>`).join('')}<span class="end">${esc(s.end)}</span></div>
      <div class="pads">${labels.map((l, i) => `<button class="pad" style="--lc:${LABELS[l].color}" data-pad="${l}"><span>${esc(LABELS[l].short)} <kbd>${i + 1}</kbd></span><small>${esc(LABELS[l].name)}</small></button>`).join('')}</div>`;
    root.querySelectorAll('[data-pad]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.pad)));
  }

  function answer(label) {
    if (!g?.running || g.locked) return;
    const exp = g.q.chunk.label;
    const ok = label === exp;
    g.items += 1;
    mergeStats(g.stats, { [exp]: ok ? [1, 0] : [0, 1] });
    if (!ok) mergeCounts(g.confusions, { [`${exp}>${label}`]: 1 });
    root.querySelectorAll('[data-pad]').forEach((b) => {
      b.disabled = true;
      if (b.dataset.pad === exp) b.style.outline = '3px solid #7be0a0';
    });
    if (ok) {
      g.correct += 1;
      g.pos[0] += 1;
      moveRacer(0, g.pos[0]);
      $('[data-good]').textContent = g.correct;
      sfx.note(g.correct);
      if (g.pos[0] >= FINISH) { arrive(0); return; }
      g.locked = true;
      timers.push(setTimeout(() => g.running && nextQuestion(), 350));
    } else {
      sfx.miss();
      g.locked = true;
      timers.push(setTimeout(() => g.running && nextQuestion(), 2000));
    }
  }

  async function finish() {
    if (!g.running) return;
    g.running = false;
    timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    timers = [];
    const place = g.done.includes(0) ? g.done.indexOf(0) + 1 : 4;
    $('[data-q]').hidden = true;
    let saved = null;
    if (g.items >= 1) {
      try {
        saved = await api('POST', '/api/student/attempt', {
          kind: 'game', game: 'battle', items: g.items, correct: g.correct, durationMs: Math.max(1000, Date.now() - g.started),
          score: g.correct * 100, skillStats: g.stats, confusions: g.confusions, extra: { place },
        });
        setStudentState(saved.state);
      } catch (err) { toast(err.message, 'error'); }
    }
    if (place === 1) sfx.fanfare(); else sfx.step();
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card result">
      <h2>${place === 1 ? 'Jullie winnen de battle!' : `Je werd ${place}e`}</h2>
      <div class="result-stats">
        <div class="stat"><b>${place}e</b><span>plaats</span></div>
        <div class="stat"><b>${g.correct} / ${g.items}</b><span>goed</span></div>
        <div class="stat"><b>${Math.round((Date.now() - g.started) / 1000)} s</b><span>speeltijd</span></div>
      </div>
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('note')} +${saved.coins} muzieknoten</span>` : ''}</div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn btn-primary" data-again>${icon('play')} Nog een battle</button><a class="btn btn-ghost" href="#/kaart">${icon('map')} Naar de kaart</a></div>
    </div>`;
    overlay.querySelector('[data-again]').addEventListener('click', countdown);
    overlay.querySelector('[data-again]').focus();
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
    if (!g?.running) {
      if (e.key === 'Enter' && !overlay.hidden) { const b = overlay.querySelector('[data-go], [data-again]'); if (b) { e.preventDefault(); b.click(); } }
      return;
    }
    const n = Number(e.key);
    if (Number.isInteger(n) && labels[n - 1]) { e.preventDefault(); answer(labels[n - 1]); }
  }
  window.addEventListener('keydown', onKey);
  intro();

  return () => {
    if (g) g.running = false;
    timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    window.removeEventListener('keydown', onKey);
  };
}
