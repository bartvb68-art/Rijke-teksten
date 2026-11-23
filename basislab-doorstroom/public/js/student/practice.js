import { api, esc, toast } from '../lib.js';
import { icon } from '../icons.js';
import { session, refreshState } from '../app.js';
import { studentShell } from './shell.js';
import { renderQuestion, showFeedback } from './question.js';
import { SKILL_BY_ID, DOMAIN_BY_ID, niveauFor } from '../shared/skills.js';
import { nivChip } from '../ui.js';

const ROUND = 10;

function title(mode) {
  if (mode === 'week') return 'Weektaak';
  if (mode === 'mix') return 'Alles door elkaar';
  if (mode.startsWith('skill:')) return SKILL_BY_ID[mode.slice(6)]?.name || 'Oefenen';
  if (mode.startsWith('domain:')) return DOMAIN_BY_ID[mode.slice(7)]?.name || 'Oefenen';
  return 'Oefenen';
}

export default async function practice(root, { mode }) {
  if (!session.state) await refreshState();
  const main = studentShell(root, `<div class="practice">
    <div class="p-top"><a class="btn btn-ghost btn-sm" href="#/start">${icon('back')} Stoppen</a><h2 style="margin:0">${esc(title(mode))}</h2>
      <div class="p-progress" aria-hidden="true"><i style="width:0"></i></div><span class="muted num" data-count></span></div>
    <div data-q></div></div>`);
  const qEl = main.querySelector('[data-q]');
  const bar = main.querySelector('.p-progress i');
  const count = main.querySelector('[data-count]');
  let n = 0; let good = 0; let disposeQ = null; let alive = true;
  const changes = {};
  const weekProgress = { done: session.state.progress.done, goal: session.state.progress.goal };

  const setBar = () => {
    bar.style.width = `${(n / ROUND) * 100}%`;
    count.textContent = mode === 'week' && weekProgress.goal ? `weektaak ${weekProgress.done}/${weekProgress.goal}` : `${n}/${ROUND}`;
  };

  async function next() {
    if (!alive) return;
    if (n >= ROUND) { endRound(); return; }
    let data;
    try { data = await api('POST', '/api/student/next', { mode }); } catch (err) { qEl.innerHTML = `<div class="card"><p>${esc(err.message)}</p><a class="btn" href="#/start">Terug</a></div>`; return; }
    if (!alive) return;
    disposeQ?.();
    disposeQ = renderQuestion(qEl, data.item, {
      readAloud: session.state.student.settings.readAloud,
      onAnswer: async (value, ms) => {
        let res;
        try { res = await api('POST', '/api/student/answer', { pendingId: data.pendingId, answer: value, ms }); } catch (err) { toast(err.message, 'error'); next(); return; }
        n += 1;
        if (res.correct) good += 1;
        weekProgress.done = res.week.done;
        const sk = res.skill;
        changes[sk.id] = { ...(changes[sk.id] || { first: sk.theta - sk.change }), theta: sk.theta };
        setBar();
        showFeedback(qEl, data.item, value, res);
        if (res.weekDone) toast('Je weektaak is af! +50 punten', 'good');
        const act = document.createElement('div');
        act.className = 'p-actions';
        act.innerHTML = `<button class="btn btn-primary btn-big" data-next>${n >= ROUND ? 'Bekijk je ronde' : 'Volgende'} ${icon('next')}</button><span class="muted">of druk op Enter</span>`;
        qEl.querySelector('.fb').appendChild(act);
        const btn = act.querySelector('[data-next]');
        btn.focus();
        btn.addEventListener('click', () => next(), { once: true });
      },
    });
    setBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function endRound() {
    disposeQ?.(); disposeQ = null;
    const rows = Object.entries(changes).map(([id, c]) => {
      const s = SKILL_BY_ID[id];
      const d = c.theta - c.first;
      return `<tr><td>${esc(s.name)}</td><td>${nivChip(niveauFor(c.theta, s.domain))}</td><td class="r">${d > 0.05 ? `<span style="color:var(--good)">▲ omhoog</span>` : d < -0.05 ? '<span class="muted">▼ iets omlaag</span>' : '<span class="muted">gelijk</span>'}</td></tr>`;
    }).join('');
    qEl.innerHTML = `<div class="card round-end">
      <p class="muted" style="margin:0">Ronde klaar</p>
      <div class="big">${good} / ${ROUND}</div>
      <p>${good >= 8 ? 'Super gedaan! De opgaven worden nu wat pittiger.' : good >= 5 ? 'Goed bezig! Lees de uitleg bij foute antwoorden nog eens.' : 'Dat was lastig. Je krijgt nu opgaven die beter bij je passen.'}</p>
      ${mode === 'week' && weekProgress.goal ? `<p><b>Weektaak:</b> ${weekProgress.done} van de ${weekProgress.goal} opgaven${weekProgress.done >= weekProgress.goal ? ' — af!' : ''}</p>` : ''}
      <div class="table-wrap" style="width:min(520px,100%)"><table class="list"><thead><tr><th>Onderdeel</th><th>Niveau</th><th class="r">Deze ronde</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="big-actions" style="justify-content:center"><button class="btn btn-primary btn-big" data-again>${icon('play')} Nog een ronde</button><a class="btn btn-big" href="#/start">${icon('home')} Naar start</a></div>
    </div>`;
    qEl.querySelector('[data-again]').addEventListener('click', () => { n = 0; good = 0; for (const k of Object.keys(changes)) delete changes[k]; next(); });
    qEl.querySelector('[data-again]').focus();
  }

  next();
  return () => { alive = false; disposeQ?.(); };
}
