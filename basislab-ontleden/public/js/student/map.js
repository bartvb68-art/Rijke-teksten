import { api, esc, starsHtml } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { session, setStudentState } from '../app.js';
import { PODIA, LESSONS, GAMES_UNLOCK_LESSON, EXAM_LESSON_ID, EXAM_PASS_STARS } from '../shared/curriculum.js';
import { hudHtml, bindHud } from './hud.js';

export default async function map(root) {
  setStudentState(await api('GET', '/api/student/state'));
  const st = session.state;
  const { progress, unlocked } = st;
  const goal = st.class.settings.weeklyGoalMinutes || 0;
  const mins = st.stats.minutesWeek;
  const pct = goal ? Math.min(1, mins / goal) : 1;
  const C = 2 * Math.PI * 34;
  const current = LESSONS.find((l) => l.id === unlocked);
  const allDone = (progress[EXAM_LESSON_ID]?.stars || 0) >= EXAM_PASS_STARS;

  root.innerHTML = `${hudHtml('kaart')}
  <div class="map-page">
    <section class="planets" aria-label="Lessen">
      ${PODIA.map((p) => {
        const lessons = LESSONS.filter((l) => l.podium === p.id);
        const podiumLocked = lessons[0].id > unlocked;
        const done = lessons.filter((l) => (progress[l.id]?.stars || 0) >= 1).length;
        return `<article class="planet ${podiumLocked ? 'locked' : ''}" style="--pc:${p.color}">
          <div class="planet-orb podium-orb"><span class="num">${p.id}</span></div>
          <div>
            <h2>${esc(p.name)}</h2>
            <p>${esc(p.desc)} · ${done}/${lessons.length} gehaald</p>
            <div class="lesson-path">${lessons.map((l) => {
              const pr = progress[l.id];
              const locked = l.id > unlocked;
              const isCur = l.id === unlocked && !allDone;
              const cls = ['lesson-node', locked ? 'locked' : '', isCur ? 'current' : '', pr?.stars ? 'done' : ''].join(' ');
              const inner = `<span class="ln-num">${l.id}</span><span class="ln-title">${esc(l.title)}</span>${locked ? icon('lock') : starsHtml(pr?.stars || 0)}${isCur ? `<span class="you">${guitarSvg(st.student.avatar, { size: 34, waves: false })}</span>` : ''}`;
              return locked
                ? `<span class="${cls}" aria-label="Les ${l.id} ${esc(l.title)}, op slot" title="Haal eerst de vorige les">${inner}</span>`
                : `<a class="${cls}" href="#/les/${l.id}" aria-label="Les ${l.id}: ${esc(l.title)}" data-lesson="${l.id}">${inner}</a>`;
            }).join('')}</div>
          </div>
        </article>`;
      }).join('')}
    </section>
    <aside class="side">
      <div class="card continue-card">
        <h3>${allDone ? 'Gefeliciteerd, ontleedster!' : 'Verder op tour'}</h3>
        ${allDone
          ? `<p class="muted">Je hebt het ontleeddiploma gehaald. Speel de spellen of verdien nog meer sterren!</p><a class="btn btn-primary" href="#/diploma">${icon('diploma')} Mijn diploma</a>`
          : `<p class="muted">Les ${current.id}: ${esc(current.title)}</p><a class="btn btn-primary btn-big" href="#/les/${current.id}" data-testid="continue">${icon('play')} Start les ${current.id}</a>`}
      </div>
      <div class="card">
        <h3>Weekdoel</h3>
        <div class="goal-ring">
          <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="track" cx="40" cy="40" r="34" fill="none" stroke-width="10"/><circle class="fill" cx="40" cy="40" r="34" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
          <div><b style="font-size:1.4rem">${mins} / ${goal} min</b><br><span class="muted">${pct >= 1 ? 'Doel gehaald, top!' : `Nog ${Math.max(0, goal - mins)} minuten deze week`}</span></div>
        </div>
      </div>
      <div class="card">
        <h3>Spellen</h3>
        ${st.gamesUnlocked ? '' : `<p class="muted">${st.class.settings.gamesEnabled ? `Haal les ${GAMES_UNLOCK_LESSON} om de spellen te openen.` : 'Je leerkracht heeft de spellen even uitgezet.'}</p>`}
        <a class="game-card ${st.gamesUnlocked ? '' : 'locked'}" href="#/spel/notenregen" data-testid="game-notenregen">
          <span class="gi" style="background:linear-gradient(135deg,#e87ba4,#9c3b63)">${icon('note')}</span>
          <span><strong>Notenregen</strong><small>Record: ${st.stats.notenregenRecord} punten</small></span>
        </a>
        <a class="game-card ${st.gamesUnlocked ? '' : 'locked'}" href="#/spel/battle" data-testid="game-battle">
          <span class="gi" style="background:linear-gradient(135deg,#3987e5,#184f95)">${icon('mic')}</span>
          <span><strong>Bandbattle</strong><small>Speel tegen 3 andere bands</small></span>
        </a>
      </div>
    </aside>
  </div>`;
  bindHud(root);
}
