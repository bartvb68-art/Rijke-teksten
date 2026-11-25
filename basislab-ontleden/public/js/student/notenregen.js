import { api, esc, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { session, setStudentState, go } from '../app.js';
import { LABELS, gameLabels, gameSentences, makeRng } from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import * as band from '../band.js';
import { burst } from '../fx.js';
import { hudHtml, bindHud } from './hud.js';
import { mergeStats, mergeCounts } from '../ontleed-ui.js';

const LIVES = 3;

export default async function notenregen(root) {
  setStudentState(await api('GET', '/api/student/state'));
  if (!session.state.gamesUnlocked) {
    toast('De spellen zijn nog op slot.');
    go('#/kaart');
    return undefined;
  }
  const labels = gameLabels(session.state.unlocked);
  const pool = gameSentences(session.state.unlocked);
  const rng = makeRng(Date.now());
  let running = false;
  let raf = 0;
  let g = null;

  root.innerHTML = `${hudHtml('kaart')}
  <div class="game-page">
    <div class="game-hud">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1 style="margin:0;font-size:1.5rem">Notenregen</h1>
      <span class="spacer"></span>
      <span class="hud-pill">Punten: <b data-score>0</b></span>
      <span class="hud-pill">Combo: <b data-combo>0</b></span>
      <span class="hud-pill">Level <b data-level>1</b></span>
      <span class="hud-pill lives" data-lives aria-label="Levens"></span>
    </div>
    <div class="game-stage">
      <div class="rain" data-rain>
        <div class="rain-sentence" data-sentence></div>
        <div class="rain-line"></div>
      </div>
      <div class="game-overlay" data-overlay></div>
    </div>
    <div class="pads" data-pads>${labels.map((l, i) => `<button class="pad" style="--lc:${LABELS[l].color}" data-pad="${l}">
      <span>${esc(LABELS[l].short)} <kbd>${i + 1}</kbd></span><small>${esc(LABELS[l].name)}</small></button>`).join('')}</div>
  </div>`;
  bindHud(root);
  const $ = (s) => root.querySelector(s);
  const rain = $('[data-rain]');
  const overlay = $('[data-overlay]');

  function intro() {
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card">
      <h2>Notenregen</h2>
      <p>De zinsdelen vallen als noten naar beneden. Kies het goede etiket <b>voordat de noot de gele lijn raakt</b>.</p>
      <p class="muted">Klik op een etiket of druk op het cijfer. Elke goede noot geeft punten; met een combo verdien je dubbel of driedubbel. Je hebt ${LIVES} levens.</p>
      <p class="legend-pills" style="justify-content:center">${labels.map((l) => `<span class="lbl" style="--lc:${LABELS[l].color}">${esc(LABELS[l].short)}</span>`).join('')}</p>
      <button class="btn btn-primary btn-big" data-go>${icon('play')} Start</button>
    </div>`;
    overlay.querySelector('[data-go]').addEventListener('click', begin);
    overlay.querySelector('[data-go]').focus();
  }

  function begin() {
    overlay.hidden = true;
    g = {
      score: 0, combo: 0, maxCombo: 0, lives: LIVES, level: 1, sentences: 0, items: 0, correct: 0,
      stats: {}, confusions: {}, started: Date.now(), s: null, idx: 0, note: null, y: 0, last: 0, locked: false,
    };
    running = true;
    band.setLevel(3);
    nextSentence();
    g.last = performance.now();
    raf = requestAnimationFrame(tick);
    updateHud();
  }

  const expected = (c) => (labels.includes(c.label) ? c.label : 'rest');
  const fallMs = () => Math.max(2600, 7000 - (g.level - 1) * 450);

  function nextSentence() {
    g.s = pool[Math.floor(rng() * pool.length)];
    g.idx = 0;
    g.sentences += 1;
    g.level = 1 + Math.floor((g.sentences - 1) / 2);
    if (g.level >= 3) band.setLevel(4);
    g.answers = g.s.chunks.map(() => null);
    spawn();
  }

  function renderSentence() {
    $('[data-sentence]').innerHTML = g.s.chunks.map((c, i) => {
      const a = g.answers[i];
      const tag = a ? `<span class="tag set" style="--lc:${LABELS[a.label].color}">${esc(LABELS[a.label].short)}</span>` : '';
      return `<span class="chunk static ${i === g.idx ? 'mark' : ''} ${a ? (a.ok ? 'ok' : 'bad') : ''}">${esc(c.text)}${tag}</span>`;
    }).join('') + esc(g.s.end);
  }

  function spawn() {
    renderSentence();
    g.note?.remove();
    const el = document.createElement('div');
    el.className = 'rain-note';
    el.textContent = g.s.chunks[g.idx].text;
    rain.appendChild(el);
    g.note = el;
    g.y = 70;
    g.locked = false;
    place();
  }

  function place() {
    if (g.note) g.note.style.top = `${g.y}px`;
  }

  function tick(t) {
    if (!running) return;
    const dt = Math.min(80, t - g.last);
    g.last = t;
    if (g.note && !g.locked) {
      const lineY = rain.clientHeight - 64 - 22;
      g.y += ((lineY - 70) / fallMs()) * dt;
      place();
      if (g.y >= lineY) answer(null);
    }
    raf = requestAnimationFrame(tick);
  }

  function pop(text, color) {
    const p = document.createElement('div');
    p.className = 'rain-pop';
    p.style.top = `${Math.max(80, g.y - 30)}px`;
    p.style.color = color;
    p.textContent = text;
    rain.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }

  function answer(label) {
    if (!running || g.locked) return;
    g.locked = true;
    const c = g.s.chunks[g.idx];
    const exp = expected(c);
    const ok = label === exp;
    g.items += 1;
    if (exp !== 'rest') mergeStats(g.stats, { [exp]: ok ? [1, 0] : [0, 1] });
    if (!ok && label && exp !== 'rest' && label !== 'rest') mergeCounts(g.confusions, { [`${exp}>${label}`]: 1 });
    g.answers[g.idx] = { label: exp, ok };
    if (ok) {
      g.correct += 1;
      g.combo += 1;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      const mult = 1 + Math.min(2, Math.floor(g.combo / 5));
      const pts = 100 * mult + Math.round(Math.max(0, 1 - g.y / rain.clientHeight) * 50);
      g.score += pts;
      band.note(g.combo + 1);
      if (g.combo % 5 === 0) { band.strum(); burst(g.note, 12); }
      pop(`+${pts}${mult > 1 ? ` ×${mult}` : ''}`, '#7be0a0');
    } else {
      g.combo = 0;
      g.lives -= 1;
      band.bonk();
      band.setLevel(3);
      pop(label ? `Dat was ${LABELS[exp].short}` : `Te laat! ${LABELS[exp].short}`, '#ff8f8f');
      rain.animate?.([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 });
    }
    updateHud();
    renderSentence();
    g.note?.remove();
    g.note = null;
    if (g.lives <= 0) { setTimeout(gameOver, 500); return; }
    setTimeout(() => {
      if (!running) return;
      g.idx += 1;
      if (g.idx >= g.s.chunks.length) { band.riff(2); setTimeout(() => running && nextSentence(), 450); } else spawn();
    }, ok ? 220 : 700);
  }

  function updateHud() {
    $('[data-score]').textContent = g.score;
    $('[data-combo]').textContent = g.combo;
    $('[data-level]').textContent = g.level;
    $('[data-lives]').innerHTML = Array.from({ length: LIVES }, (_, i) => icon('heart', i < g.lives ? '' : 'off')).join('');
  }

  async function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    band.setLevel(2);
    band.crash();
    let saved = null;
    if (g.items >= 1) {
      try {
        saved = await api('POST', '/api/student/attempt', {
          kind: 'game', game: 'notenregen', items: g.items, correct: g.correct, durationMs: Math.max(1000, Date.now() - g.started),
          score: g.score, skillStats: g.stats, confusions: g.confusions, extra: { combo: g.maxCombo, level: g.level },
        });
        setStudentState(saved.state);
      } catch (err) { toast(err.message, 'error'); }
    }
    const record = session.state.stats.notenregenRecord;
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card result">
      <h2>${g.score >= record && g.score > 0 ? 'Nieuw record!' : 'Einde van het nummer'}</h2>
      <div class="result-stats">
        <div class="stat"><b>${g.score}</b><span>punten</span></div>
        <div class="stat"><b>${g.correct} / ${g.items}</b><span>zinsdelen goed</span></div>
        <div class="stat"><b>${g.maxCombo}</b><span>langste combo</span></div>
      </div>
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('note')} +${saved.coins} muzieknoten</span>` : ''}</div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn btn-primary" data-again>${icon('play')} Nog een keer</button><a class="btn btn-ghost" href="#/kaart">${icon('map')} Naar de kaart</a></div>
    </div>`;
    overlay.querySelector('[data-again]').addEventListener('click', begin);
    overlay.querySelector('[data-again]').focus();
    if (saved?.newBadges?.length) {
      modal({
        title: 'Nieuwe badge!',
        body: `<div class="badge-grid">${saved.newBadges.map((id) => BADGE_BY_ID[id]).filter(Boolean).map((b) => `<div class="badge-card"><span class="badge-icon earned">${icon(b.icon)}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`).join('')}</div>`,
        actions: [{ label: 'Hoera!', value: true, primary: true }],
      });
    }
  }

  root.querySelectorAll('[data-pad]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.pad)));
  function onKey(e) {
    if (document.querySelector('.modal-backdrop')) return;
    if (!running) {
      if (e.key === 'Enter' && !overlay.hidden) { e.preventDefault(); overlay.querySelector('[data-go], [data-again]')?.click(); }
      return;
    }
    const n = Number(e.key);
    if (Number.isInteger(n) && labels[n - 1]) { e.preventDefault(); answer(labels[n - 1]); }
  }
  window.addEventListener('keydown', onKey);
  intro();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
  };
}
