import { api, esc, toast, modal } from '../lib.js';
import { icon } from '../icons.js';
import { session, setStudentState, go } from '../app.js';
import { gameWords, targetApm } from '../shared/curriculum.js';
import { BADGE_BY_ID } from '../shared/rewards.js';
import { charFromEvent } from '../typing.js';
import { sfx } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';

const W = 1100;
const H = 620;
const GROUND = H - 70;
const MAX_LIVES = 5;

export default async function meteoren(root) {
  if (!session.state) setStudentState(await api('GET', '/api/student/state'));
  const st = session.state;
  if (!st.gamesUnlocked) { toast('De spellen zijn nog op slot.'); go('#/kaart'); return undefined; }

  const words = gameWords(st.unlocked);
  const baseApm = Math.max(30, st.stats.recentApm || targetApm(st.unlocked, st.class.groep, st.student.settings.speedFactor) * 0.8);

  root.innerHTML = `${hudHtml('kaart')}
  <div class="game-page">
    <div class="game-hud">
      <a class="btn btn-ghost btn-sm" href="#/kaart">${icon('back')} Kaart</a>
      <h1 style="margin:0;font-size:1.5rem">Meteorenstorm</h1>
      <span class="spacer"></span>
      <span class="hud-pill">${icon('star')} Score: <b data-score>0</b></span>
      <span class="hud-pill">${icon('meteor')} Golf <b data-wave>1</b></span>
      <span class="hud-pill">${icon('bolt')} Combo <b data-combo>x1</b></span>
      <span class="hud-pill" data-lives aria-label="Schilden"></span>
    </div>
    <div class="game-stage">
      <canvas width="${W}" height="${H}" data-canvas aria-label="Speelveld: typ de woorden op de meteoren"></canvas>
      <div class="game-overlay" data-overlay></div>
    </div>
    <p class="muted" style="margin-top:10px">Typ het woord op een meteoor om hem met je laser te raken. Gouden meteoren geven een extra schild of vertragen de tijd. <kbd>Esc</kbd> = pauze.</p>
  </div>`;
  bindHud(root);

  const canvas = root.querySelector('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  const overlay = root.querySelector('[data-overlay]');
  const $ = (s) => root.querySelector(s);

  const stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, s: Math.random() * 0.4 + 0.1 }));
  let g;

  function reset() {
    g = {
      state: 'intro', score: 0, wave: 1, lives: 3, combo: 0, best: 0,
      meteors: [], lasers: [], particles: [], texts: [],
      spawned: 0, spawnTimer: 1, waveCount: 7, target: null,
      correct: 0, errors: 0, keyStats: {}, words: 0,
      activeMs: 0, slowUntil: 0, shake: 0, bannerUntil: 0, banner: 'Golf 1', time: 0,
      cannonAngle: -Math.PI / 2,
    };
    window.__stGame = g; // alleen-lezen, gebruikt door de automatische demo-opname
    updateHud();
  }

  function updateHud() {
    $('[data-score]').textContent = g.score;
    $('[data-wave]').textContent = g.wave;
    $('[data-combo]').textContent = `x${multiplier().toFixed(1).replace('.0', '')}`;
    $('[data-lives]').innerHTML = Array.from({ length: g.lives }, () => icon('shield')).join('') || '–';
  }

  const multiplier = () => Math.min(3, 1 + Math.floor(g.combo / 5) * 0.5);

  function waveWords() {
    const maxLen = Math.min(9, 3 + g.wave);
    const list = words.filter((w) => w.length <= maxLen && w.length >= Math.min(3, maxLen - 1));
    return list.length >= 6 ? list : words;
  }

  function spawn() {
    const list = waveWords();
    const onScreen = new Set(g.meteors.map((m) => m.word[0]));
    let word = list[Math.floor(Math.random() * list.length)];
    for (let i = 0; i < 20 && onScreen.has(word[0]); i++) word = list[Math.floor(Math.random() * list.length)];
    const needed = (word.length * 60) / baseApm; // seconden om te typen
    const fall = Math.max(needed * 1.35, Math.max(4.2, needed * 2.6) * (1 - 0.07 * (g.wave - 1)));
    const gold = g.spawned > 2 && Math.random() < 0.12;
    g.meteors.push({
      word, typed: 0, x: 90 + Math.random() * (W - 180), y: -30, r: 22 + word.length * 2.2,
      vy: (GROUND + 30) / fall, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 1.5, gold,
    });
    g.spawned += 1;
  }

  function explode(x, y, color, n = 26) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 220;
      g.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.5, max: 1.1, color, r: 1.5 + Math.random() * 3 });
    }
  }

  function destroy(m) {
    const pts = Math.round(10 * m.word.length * multiplier());
    g.score += pts;
    g.combo += 1;
    g.words += 1;
    g.lasers.push({ x: m.x, y: m.y, life: 0.25 });
    explode(m.x, m.y, m.gold ? '#ffd65a' : '#ff9a3c');
    g.texts.push({ x: m.x, y: m.y, text: `+${pts}`, life: 1 });
    sfx.laser();
    setTimeout(() => sfx.boom(), 60);
    if (m.gold) {
      if (g.lives < MAX_LIVES && Math.random() < 0.55) {
        g.lives += 1;
        g.texts.push({ x: m.x, y: m.y - 30, text: 'Extra schild!', life: 1.4, big: true });
      } else {
        g.slowUntil = g.time + 6;
        g.texts.push({ x: m.x, y: m.y - 30, text: 'Tijd vertraagd!', life: 1.4, big: true });
      }
      sfx.power();
    }
    g.meteors = g.meteors.filter((x) => x !== m);
    if (g.target === m) g.target = null;
    updateHud();
  }

  function hitGround(m) {
    g.meteors = g.meteors.filter((x) => x !== m);
    if (g.target === m) g.target = null;
    g.lives -= 1;
    g.combo = 0;
    g.shake = 0.4;
    explode(m.x, GROUND, '#ff5d5d', 40);
    sfx.hit();
    updateHud();
    if (g.lives <= 0) gameOver();
  }

  function stat(ch, ok) {
    const k = g.keyStats[ch] || (g.keyStats[ch] = [0, 0]);
    k[ok ? 0 : 1] += 1;
  }

  function onChar(ch) {
    if (!g.target) {
      const options = g.meteors.filter((m) => m.word[0] === ch && m.y > -10).sort((a, b) => b.y - a.y);
      if (!options.length) {
        g.errors += 1;
        g.combo = 0;
        sfx.error();
        updateHud();
        return;
      }
      g.target = options[0];
    }
    const m = g.target;
    const expected = m.word[m.typed];
    if (ch === expected) {
      m.typed += 1;
      g.correct += 1;
      stat(expected, true);
      sfx.key();
      if (m.typed >= m.word.length) {
        g.correct += 1; // de "spatie" na een woord telt als aanslag
        destroy(m);
      }
    } else {
      g.errors += 1;
      g.combo = 0;
      stat(expected, false);
      sfx.error();
      m.wobble = 0.3;
      updateHud();
    }
  }

  // ---------- tekenen ----------
  function drawBackground(dt) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#060a20');
    grad.addColorStop(1, '#151d4d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      s.y += s.s * dt * 30;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      ctx.fillStyle = `rgba(255,255,255,${0.4 + s.r / 3})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    // planeet aan de horizon
    ctx.fillStyle = 'rgba(144,133,233,.25)';
    ctx.beginPath(); ctx.arc(900, 140, 60, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(900, 140, 95, 20, -0.3, 0, Math.PI * 2); ctx.stroke();
  }

  function drawGround() {
    ctx.fillStyle = '#2b2f63';
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 20);
    ctx.quadraticCurveTo(W / 2, GROUND - 20, W, GROUND + 20);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3f7d';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(60 + i * 130, GROUND + 40 + (i % 2) * 14, 26, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    // basis met kanon
    const bx = W / 2;
    const by = GROUND + 2;
    ctx.save();
    ctx.translate(bx, by - 20);
    ctx.rotate(g.cannonAngle + Math.PI / 2);
    ctx.fillStyle = '#c9d3ff';
    ctx.fillRect(-7, -48, 14, 44);
    ctx.fillStyle = '#ffc23d';
    ctx.fillRect(-9, -52, 18, 8);
    ctx.restore();
    ctx.fillStyle = '#eef1f8';
    ctx.beginPath(); ctx.arc(bx, by, 40, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#86b6ef';
    ctx.beginPath(); ctx.arc(bx, by - 6, 22, Math.PI, 0); ctx.fill();
    // schildkoepel
    if (g.lives > 0) {
      ctx.strokeStyle = `rgba(127,211,255,${0.25 + 0.08 * g.lives})`;
      ctx.lineWidth = 2 + g.lives;
      ctx.beginPath(); ctx.arc(bx, by, 64, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
  }

  function drawMeteor(m) {
    ctx.save();
    let wob = 0;
    if (m.wobble > 0) wob = Math.sin(g.time * 80) * 4;
    ctx.translate(m.x + wob, m.y);
    // staart
    const tail = ctx.createLinearGradient(0, -m.r * 3.5, 0, 0);
    tail.addColorStop(0, 'rgba(255,154,60,0)');
    tail.addColorStop(1, m.gold ? 'rgba(255,214,90,.55)' : 'rgba(255,154,60,.45)');
    ctx.fillStyle = tail;
    ctx.beginPath(); ctx.moveTo(-m.r * 0.8, 0); ctx.lineTo(0, -m.r * 3.6); ctx.lineTo(m.r * 0.8, 0); ctx.closePath(); ctx.fill();
    ctx.rotate(m.rot);
    ctx.fillStyle = m.gold ? '#f2c14e' : '#8a6a5a';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rr = m.r * (0.85 + 0.15 * Math.sin(i * 2.7));
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = m.gold ? '#d39a1c' : '#6b4f42';
    ctx.beginPath(); ctx.arc(m.r * 0.3, -m.r * 0.2, m.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-m.r * 0.35, m.r * 0.3, m.r * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // label
    ctx.font = '600 24px Lexend, sans-serif';
    const tw = ctx.measureText(m.word).width;
    const lx = m.x - tw / 2;
    const ly = m.y + m.r + 26;
    const isTarget = g.target === m;
    ctx.fillStyle = isTarget ? 'rgba(255,194,61,.95)' : 'rgba(9,14,40,.82)';
    roundRect(lx - 10, ly - 22, tw + 20, 32, 9);
    ctx.fill();
    if (!isTarget) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.stroke(); }
    const done = m.word.slice(0, m.typed);
    ctx.fillStyle = isTarget ? '#0f7a3c' : '#7be0a0';
    ctx.fillText(done, lx, ly);
    ctx.fillStyle = isTarget ? '#10173a' : '#fff';
    ctx.fillText(m.word.slice(m.typed), lx + ctx.measureText(done).width, ly);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function frame(dt) {
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 14 * g.shake, (Math.random() - 0.5) * 14 * g.shake);
    drawBackground(dt);
    for (const l of g.lasers) {
      ctx.strokeStyle = `rgba(127,211,255,${l.life * 4})`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(W / 2, GROUND - 40); ctx.lineTo(l.x, l.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${l.life * 4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (const m of g.meteors) drawMeteor(m);
    drawGround();
    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of g.texts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
      ctx.fillStyle = t.big ? '#ffd65a' : '#fff';
      ctx.font = `700 ${t.big ? 26 : 20}px Fredoka, Lexend, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
    if (g.time < g.bannerUntil) {
      ctx.fillStyle = 'rgba(255,194,61,.95)';
      ctx.font = '700 64px Fredoka, Lexend, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.banner, W / 2, H / 2 - 40);
      ctx.textAlign = 'left';
    }
    if (g.time < g.slowUntil) {
      ctx.fillStyle = 'rgba(127,211,255,.12)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function update(dt) {
    g.time += dt;
    const slow = g.time < g.slowUntil ? 0.4 : 1;
    if (g.state === 'play') {
      g.activeMs += dt * 1000;
      if (g.time >= g.bannerUntil) {
        g.spawnTimer -= dt;
        const maxOnScreen = Math.min(6, 2 + Math.ceil(g.wave / 2));
        if (g.spawned < g.waveCount && g.spawnTimer <= 0 && g.meteors.length < maxOnScreen) {
          spawn();
          g.spawnTimer = Math.max(0.8, 2.6 - g.wave * 0.18) * (0.7 + Math.random() * 0.6);
        }
        if (g.spawned >= g.waveCount && !g.meteors.length) {
          const bonus = 50 * g.wave;
          g.score += bonus;
          g.wave += 1;
          g.spawned = 0;
          g.waveCount = 6 + g.wave * 2;
          g.banner = `Golf ${g.wave}`;
          g.bannerUntil = g.time + 2;
          g.texts.push({ x: W / 2, y: H / 2 + 10, text: `Golfbonus +${bonus}`, life: 2, big: true });
          sfx.fanfare();
          updateHud();
        }
      }
      for (const m of [...g.meteors]) {
        m.y += m.vy * dt * slow;
        m.rot += m.vr * dt;
        if (m.wobble > 0) m.wobble -= dt;
        if (m.y + m.r * 0.6 >= GROUND - 10) hitGround(m);
      }
      const aimAt = g.target || g.meteors.reduce((a, b) => (!a || b.y > a.y ? b : a), null);
      const want = aimAt ? Math.atan2(aimAt.y - (GROUND - 20), aimAt.x - W / 2) : -Math.PI / 2;
      g.cannonAngle += (want - g.cannonAngle) * Math.min(1, dt * 10);
    }
    for (const l of g.lasers) l.life -= dt;
    g.lasers = g.lasers.filter((l) => l.life > 0);
    for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; p.life -= dt; }
    g.particles = g.particles.filter((p) => p.life > 0);
    for (const t of g.texts) { t.y -= 40 * dt; t.life -= dt; }
    g.texts = g.texts.filter((t) => t.life > 0);
    if (g.shake > 0) g.shake -= dt;
  }

  let raf = 0;
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (g.state !== 'paused') update(dt);
    frame(g.state === 'paused' ? 0 : dt);
    raf = requestAnimationFrame(loop);
  }

  function showIntro() {
    g.state = 'intro';
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card">
      <h2>Meteorenstorm</h2>
      <p>Meteoren vallen op jouw basis af! Typ het woord op een meteoor en je laser schiet hem kapot. Laat er geen één vallen: je hebt 3 schilden.</p>
      <p class="muted">Je gebruikt alleen letters die je al geleerd hebt. Record: <b>${session.state.stats.meteorenRecord}</b></p>
      <button class="btn btn-primary btn-big" data-go>${icon('play')} Start (spatie)</button>
    </div>`;
    overlay.querySelector('[data-go]').addEventListener('click', play);
  }

  function play() {
    reset();
    g.state = 'play';
    g.bannerUntil = g.time + 1.6;
    overlay.hidden = true;
    canvas.focus?.();
  }

  function pause() {
    if (g.state !== 'play') return;
    g.state = 'paused';
    overlay.hidden = false;
    overlay.innerHTML = `<div class="card"><h2>Pauze</h2><p>Neem even rust. Klaar? Ga verder!</p>
      <div class="row" style="justify-content:center"><button class="btn btn-primary" data-resume>${icon('play')} Verder (spatie)</button><button class="btn btn-ghost" data-stop>Stoppen</button></div></div>`;
    overlay.querySelector('[data-resume]').addEventListener('click', resume);
    overlay.querySelector('[data-stop]').addEventListener('click', gameOver);
  }

  function resume() {
    g.state = 'play';
    overlay.hidden = true;
  }

  async function gameOver() {
    if (g.state === 'over') return;
    g.state = 'over';
    const durationMs = Math.max(1000, Math.round(g.activeMs));
    overlay.hidden = false;
    overlay.innerHTML = '<div class="card"><h2>Game over</h2><p>Score opslaan…</p></div>';
    let saved = null;
    if (g.correct + g.errors > 0) {
      try {
        saved = await api('POST', '/api/student/attempt', {
          kind: 'game', game: 'meteoren', durationMs, chars: g.correct, correct: g.correct, errors: g.errors,
          keyStats: g.keyStats, score: g.score, extra: { wave: g.wave },
        });
        const prevRecord = session.state.stats.meteorenRecord;
        setStudentState(saved.state);
        saved.record = g.score > prevRecord;
      } catch (err) {
        toast(`Score niet opgeslagen: ${err.message}`, 'error');
      }
    }
    const apm = Math.round(g.correct / (durationMs / 60000));
    const acc = g.correct + g.errors ? Math.round((g.correct / (g.correct + g.errors)) * 100) : 0;
    overlay.innerHTML = `<div class="card result">
      <h2>${saved?.record ? 'Nieuw record!' : 'Game over'}</h2>
      <div class="result-stats">
        <div class="stat"><b>${g.score}</b><span>punten</span></div>
        <div class="stat"><b>${g.words}</b><span>meteoren geraakt</span></div>
        <div class="stat"><b>${acc}%</b><span>goed getypt</span></div>
      </div>
      <p class="muted">Golf ${g.wave} · ${apm} aanslagen per minuut</p>
      ${saved ? `<div class="reward-row"><span class="reward">${icon('star')} +${saved.xp} XP</span>${saved.coins ? `<span class="reward">${icon('coin')} +${saved.coins} sterrenstof</span>` : ''}</div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn btn-primary" data-again>${icon('play')} Nog een keer (Enter)</button><a class="btn btn-ghost" href="#/kaart">${icon('map')} Kaart</a></div>
    </div>`;
    overlay.querySelector('[data-again]').addEventListener('click', play);
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
    if (g.state === 'intro' || g.state === 'over') {
      if ((g.state === 'intro' && e.key === ' ') || e.key === 'Enter') { e.preventDefault(); play(); }
      return;
    }
    if (g.state === 'paused') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); resume(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); pause(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); if (g.target) { g.target.typed = 0; g.target = null; } return; }
    const ch = charFromEvent(e);
    if (ch == null) return;
    e.preventDefault();
    if (ch === ' ') return;
    onChar(ch);
  }

  const onBlur = () => pause();
  window.addEventListener('keydown', onKey);
  window.addEventListener('blur', onBlur);
  reset();
  showIntro();
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    delete window.__stGame;
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('blur', onBlur);
  };
}
