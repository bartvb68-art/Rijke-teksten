import { api, esc, fmtDate } from '../lib.js';
import { icon } from '../icons.js';
import { rocketSvg } from '../avatar.js';
import { session, setStudentState } from '../app.js';
import { BADGES } from '../shared/rewards.js';
import { LESSONS } from '../shared/curriculum.js';
import { hudHtml, bindHud } from './hud.js';

export default async function trophies(root) {
  const [state, board] = await Promise.all([api('GET', '/api/student/state'), api('GET', '/api/student/leaderboard')]);
  setStudentState(state);
  const earned = Object.fromEntries(state.badges.map((b) => [b.badge, b.earned_at]));
  const stars = Object.values(state.progress).reduce((x, p) => x + p.stars, 0);
  root.innerHTML = `${hudHtml('erekast')}
  <div class="page">
    <h1>Erekast</h1>
    <div class="result-stats" style="margin-top:0">
      <div class="stat"><b>${stars} / ${LESSONS.length * 3}</b><span>sterren verdiend</span></div>
      <div class="stat"><b>${state.badges.length} / ${BADGES.length}</b><span>badges</span></div>
      <div class="stat"><b>${state.stats.recentApm || '–'}</b><span>aanslagen per minuut (gemiddeld)</span></div>
    </div>
    <div class="grid" style="grid-template-columns: 2fr 1fr; align-items:start">
      <section class="card">
        <h2>Badges</h2>
        <div class="badge-grid">${BADGES.map((b) => `<div class="badge-card ${earned[b.id] ? '' : 'locked'}">
          <span class="badge-icon ${earned[b.id] ? 'earned' : 'locked'}">${icon(earned[b.id] ? b.icon : 'lock')}</span>
          <strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small>
          ${earned[b.id] ? `<small>${fmtDate(earned[b.id])}</small>` : ''}
        </div>`).join('')}</div>
      </section>
      <section class="card">
        <h2>Ranglijst van de week</h2>
        ${board.enabled ? `<p class="muted" style="font-size:.9rem">XP verdiend deze week in ${esc(state.class.name)}. Oefenen loont!</p>
        <div class="leader">${board.rows.map((r, i) => `<div class="leader-row ${r.me ? 'me' : ''}">
          <span class="pos">${i + 1}</span>${rocketSvg(r.avatar, { size: 36, flame: false })}<span>${esc(r.name)}</span><b>${r.xp} XP</b></div>`).join('')}</div>`
          : '<p class="muted">Je leerkracht heeft de ranglijst uitgezet.</p>'}
      </section>
    </div>
  </div>`;
  bindHud(root);
  if (window.matchMedia('(max-width: 980px)').matches) root.querySelector('.grid').style.gridTemplateColumns = '1fr';
}
