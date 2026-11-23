import { esc } from '../lib.js';
import { icon } from '../icons.js';
import { refreshState, session } from '../app.js';
import { studentShell } from './shell.js';
import { mountainSvg, mountainLegend } from './mountain.js';
import { DOMAINS, skillsOf, SKILL_BY_ID, weekLabel } from '../shared/skills.js';
import { levelMeter, nivChip, domainIcon } from '../ui.js';

function ring(done, goal) {
  const pct = goal ? Math.min(1, done / goal) : 0;
  const r = 40; const c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--grid)" stroke-width="10"/>
    <circle cx="48" cy="48" r="${r}" fill="none" stroke="${pct >= 1 ? 'var(--good)' : 'var(--accent)'}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${(pct * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 48 48)"/>
    <text x="48" y="54" text-anchor="middle" font-size="20" font-weight="700" fill="currentColor">${Math.round(pct * 100)}%</text></svg>`;
}

export default async function home(root) {
  const st = await refreshState();
  const wk = st.week;
  const p = st.progress;
  const focus = Object.entries(wk.focus || {});
  const idx = st.route.findIndex((r) => r.week === wk.week);
  const days = wk.daysToToets;
  const countdown = wk.after ? 'De doorstroomtoets is geweest. Goed gedaan!' : days === 0 ? 'Vandaag is de doorstroomtoets. Succes!' : days > 0 ? `Nog ${days} ${days === 1 ? 'dag' : 'dagen'} tot de doorstroomtoets` : '';
  const goalDone = p.goal > 0 && p.done >= p.goal;

  const main = studentShell(root, `
    <section class="hello">
      <div class="card week-card">
        <div>
          <p class="countdown">${icon('flag')} ${esc(countdown)}</p>
          <h1 style="margin:0">Hoi ${esc(st.student.name)}!</h1>
          <p class="muted" style="margin:0">${wk.index >= 0 ? `Week ${wk.index + 1} van ${wk.total} · ${esc(weekLabel(wk.week))}` : ''}${wk.holiday ? ' · vakantie' : ''}</p>
        </div>
        ${wk.note ? `<p style="margin:0;padding:10px 14px;background:var(--accent-soft);border-radius:10px">${icon('info')} ${esc(wk.note)}</p>` : ''}
        <div class="goal-ring">${ring(p.done, p.goal)}
          <div>${p.goal ? `<b>${p.done} van de ${p.goal} opgaven</b> in je weektaak${goalDone ? ` <span class="chip good">${icon('check')} af!</span>` : ''}` : `<b>${p.done} opgaven</b> deze week`}
            <div class="muted">${p.pct != null ? `${p.pct}% goed deze week` : 'Je hebt deze week nog niet geoefend.'}</div></div>
        </div>
        ${focus.length ? `<div><div class="label" style="margin-bottom:6px">Deze week oefen je vooral:</div><div class="focus-list">${focus.map(([id, n]) => {
          const s = SKILL_BY_ID[id];
          return `<div class="focus-item"><i style="background:var(--${s.domain})"></i><span>${esc(s.name)}<span class="muted"> · ${esc(s.desc)}</span></span><span class="muted num">${n}×</span></div>`;
        }).join('')}</div></div>` : '<p class="muted" style="margin:0">Deze week herhaal je de onderdelen die nog lastig zijn.</p>'}
        <div class="big-actions">
          <a class="btn btn-primary btn-big" href="#/oefenen/week" data-testid="start-week">${icon('play')} ${goalDone ? 'Nog meer oefenen' : p.done ? 'Verder met je weektaak' : 'Start je weektaak'}</a>
          ${st.test.active ? `<a class="btn btn-big" href="#/proeftoets">${icon('test')} Verder met de proeftoets (${st.test.active.pos}/${st.test.active.total})</a>`
            : st.test.available ? `<a class="btn btn-big" href="#/proeftoets" data-testid="start-test">${icon('test')} Proeftoets maken</a>` : ''}
        </div>
      </div>
      <div class="mountain">${mountainSvg(st.route, idx)}${mountainLegend()}</div>
    </section>

    <section class="card" style="margin-bottom:20px">
      <div class="card-head"><h2>Mijn niveau</h2><span class="spacer"></span><a href="#/niveau">Alles bekijken ${icon('next')}</a></div>
      <div class="grid3">${DOMAINS.map((d) => {
        const dd = st.domains[d.id];
        return `<div><div class="row" style="justify-content:space-between;margin-bottom:6px"><b class="dom"><i style="background:var(--${d.id})"></i>${esc(d.name)}</b>${nivChip(dd.niveau)}</div>${levelMeter(dd.n >= 8 ? dd.theta : null, d.id)}</div>`;
      }).join('')}</div>
    </section>

    <h2>Zelf kiezen wat je oefent</h2>
    <div class="choice-grid">${DOMAINS.map((d) => `<div class="domain-card" style="border-top:5px solid var(--${d.id})">
      <h3>${domainIcon(d.id)} ${esc(d.name)}</h3>
      <a class="btn btn-sm" href="#/oefenen/domain:${d.id}">${icon('shuffle')} Alles door elkaar</a>
      <div class="skills">${skillsOf(d.id).map((s) => `<a class="skill-btn" href="#/oefenen/skill:${s.id}" title="${esc(s.desc)}">${esc(s.name)}</a>`).join('')}</div>
    </div>`).join('')}</div>
    <p style="margin-top:18px"><a class="btn" href="#/oefenen/mix">${icon('shuffle')} Alles door elkaar, zoals in de toets</a></p>
  `, { active: 'start' });
  void main; void session;
}
