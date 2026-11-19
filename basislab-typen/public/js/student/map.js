import { api, esc, starsHtml } from '../lib.js';
import { icon } from '../icons.js';
import { rocketSvg } from '../avatar.js';
import { session, setStudentState } from '../app.js';
import { PLANETS, LESSONS, GAMES_UNLOCK_LESSON } from '../shared/curriculum.js';
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
  const allDone = (progress[20]?.stars || 0) >= 2;

  root.innerHTML = `${hudHtml('kaart')}
  <div class="map-page">
    <section class="planets" aria-label="Lessen">
      ${PLANETS.map((p) => {
        const lessons = LESSONS.filter((l) => l.planet === p.id);
        const planetLocked = lessons[0].id > unlocked;
        const done = lessons.filter((l) => (progress[l.id]?.stars || 0) >= 1).length;
        return `<article class="planet ${planetLocked ? 'locked' : ''}" style="--pc:${p.color}">
          <div class="planet-orb"><span class="num">${p.id}</span></div>
          <div>
            <h2>${esc(p.name)}</h2>
            <p>${esc(p.desc)} · ${done}/${lessons.length} gehaald</p>
            <div class="lesson-path">${lessons.map((l) => {
              const pr = progress[l.id];
              const locked = l.id > unlocked;
              const isCur = l.id === unlocked && !allDone;
              const cls = ['lesson-node', locked ? 'locked' : '', isCur ? 'current' : '', pr?.stars ? 'done' : ''].join(' ');
              const inner = `<span class="ln-num">${l.id}</span><span class="ln-title">${esc(l.title)}</span>${locked ? icon('lock') : starsHtml(pr?.stars || 0)}${isCur ? `<span class="you">${rocketSvg(st.student.avatar, { size: 34 })}</span>` : ''}`;
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
        <h3>${allDone ? 'Gefeliciteerd, typeheld!' : 'Verder met reizen'}</h3>
        ${allDone
          ? `<p class="muted">Je hebt het typediploma gehaald. Blijf oefenen om nog sneller te worden!</p><a class="btn btn-primary" href="#/diploma">${icon('diploma')} Mijn diploma</a>`
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
        <a class="game-card ${st.gamesUnlocked ? '' : 'locked'}" href="#/spel/meteoren" data-testid="game-meteoren">
          <span class="gi" style="background:linear-gradient(135deg,#eb6834,#a5401a)">${icon('meteor')}</span>
          <span><strong>Meteorenstorm</strong><small>Record: ${st.stats.meteorenRecord} punten</small></span>
        </a>
        <a class="game-card ${st.gamesUnlocked ? '' : 'locked'}" href="#/spel/race" data-testid="game-race">
          <span class="gi" style="background:linear-gradient(135deg,#3987e5,#184f95)">${icon('rocket')}</span>
          <span><strong>Raketrace</strong><small>Race tegen 3 raketten</small></span>
        </a>
      </div>
    </aside>
  </div>`;
  bindHud(root);
}
