import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { session, refreshState } from '../app.js';
import { studentShell } from './shell.js';
import { renderQuestion } from './question.js';
import { DOMAINS } from '../shared/skills.js';
import { levelMeter, nivChip } from '../ui.js';
import { niveauFor } from '../shared/skills.js';

export function resultHtml(result) {
  return `<div class="grid3">${DOMAINS.map((d) => {
    const r = result.domains[d.id];
    return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(d.name)}</h3>${nivChip(niveauFor(r.theta, d.id))}</div>
      <p class="muted">${r.correct} van de ${r.total} goed</p>${levelMeter(r.theta, d.id)}</div>`;
  }).join('')}</div>`;
}

export default async function test(root) {
  const st = await refreshState();
  const main = studentShell(root, '<div class="practice" data-t></div>');
  const el = main.querySelector('[data-t]');
  let dispose = null; let alive = true;

  function intro() {
    if (!st.test.active && !st.test.available) {
      el.innerHTML = `<div class="card"><h1>Proeftoets</h1><p>${st.test.doneThisWeek ? 'Je hebt de proeftoets van deze week al gemaakt. Je uitslag staat bij <a href="#/niveau">Mijn niveau</a>.' : 'Er staat deze week geen proeftoets klaar. Je juf of meester zet hem klaar.'}</p><a class="btn" href="#/start">${icon('back')} Terug</a></div>`;
      return;
    }
    el.innerHTML = `<div class="card stack">
      <h1 style="margin:0">${icon('test')} Proeftoets</h1>
      <p>Deze proeftoets lijkt op de doorstroomtoets. Er zitten vragen in over <b>rekenen</b>, <b>taalverzorging</b> en <b>lezen</b>.</p>
      <ul><li>Je krijgt ${st.test.active?.total || 36} vragen.</li><li>Tijdens de toets zie je niet of je antwoord goed is. Aan het eind krijg je je uitslag.</li>
      <li>Neem rustig de tijd. Je mag stoppen en later verdergaan.</li><li>Gebruik kladpapier voor rekenen. Een rekenmachine mag niet.</li></ul>
      <div class="big-actions"><button class="btn btn-primary btn-big" data-go>${icon('play')} ${st.test.active ? `Verder (vraag ${st.test.active.pos + 1})` : 'Start de proeftoets'}</button><a class="btn btn-big" href="#/start">Later</a></div></div>`;
    el.querySelector('[data-go]').addEventListener('click', async () => { if (!st.test.active) await api('POST', '/api/student/test/start'); next(); });
  }

  async function next() {
    if (!alive) return;
    let data;
    try { data = await api('POST', '/api/student/next', { mode: 'toets' }); } catch (err) { el.innerHTML = `<div class="card"><p>${esc(err.message)}</p><a class="btn" href="#/start">Terug</a></div>`; return; }
    dispose?.();
    el.innerHTML = `<div class="p-top"><a class="btn btn-ghost btn-sm" href="#/start">${icon('back')} Pauze</a><h2 style="margin:0">Proeftoets</h2>
      <div class="p-progress"><i style="width:${((data.progress.pos - 1) / data.progress.total) * 100}%"></i></div><span class="muted num">vraag ${data.progress.pos} van ${data.progress.total}</span></div><div data-q></div>`;
    dispose = renderQuestion(el.querySelector('[data-q]'), data.item, {
      readAloud: session.state.student.settings.readAloud,
      onAnswer: async (value, ms) => {
        const res = await api('POST', '/api/student/answer', { pendingId: data.pendingId, answer: value, ms });
        if (res.done) finish(res.result); else next();
      },
    });
    window.scrollTo({ top: 0 });
  }

  function finish(result) {
    dispose?.(); dispose = null;
    el.innerHTML = `<div class="stack"><div class="card round-end"><p class="muted" style="margin:0">Proeftoets klaar</p><div class="big">${result.correct} / ${result.total}</div>
      <p>Knap gedaan! Hieronder zie je per vakgebied welk niveau je nu ongeveer hebt. In de weektaak oefen je extra met wat nog lastig is.</p></div>
      ${resultHtml(result)}<p><a class="btn btn-primary btn-big" href="#/start">${icon('home')} Naar start</a></p></div>`;
  }

  intro();
  return () => { alive = false; dispose?.(); };
}
