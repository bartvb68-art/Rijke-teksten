import { icon } from './icons.js';
import { schoolLogoHtml } from './app.js';
import { mountainSvg } from './student/mountain.js';

export default function landing(root) {
  const demo = Array.from({ length: 9 }, (_, i) => ({ week: `w${i}`, done: i < 4 ? 60 : i === 4 ? 25 : 0, goal: 60, holiday: i === 5, test: i === 7 }));
  root.innerHTML = `
  <div class="landing">
    <section class="landing-hero">
      <div>
        ${schoolLogoHtml({ size: 56, withName: true })}
        <h1>Basislab <span>Doorstroom</span></h1>
        <p class="lead">Elke week een stukje hoger, op weg naar de doorstroomtoets. Oefen rekenen, taalverzorging en lezen op je eigen niveau.</p>
        <div class="landing-choice">
          <a class="choice" href="#/leerling" data-testid="choose-student">${icon('mountain')}<strong>Ik ben leerling</strong><span>Log in met je klascode en wachtwoord.</span></a>
          <a class="choice" href="#/leraar" data-testid="choose-teacher">${icon('chart')}<strong>Ik ben leerkracht</strong><span>Plan de weken en volg je klas.</span></a>
        </div>
      </div>
      <div class="mountain" aria-hidden="true">${mountainSvg(demo, 4)}</div>
    </section>
    <section class="features">
      <div class="card feature">${icon('target')}<h3>Past zich aan</h3><p>Na elk antwoord schat Basislab opnieuw het niveau per onderdeel. Opgaven zijn nooit veel te moeilijk of veel te makkelijk, van onder 1F tot 2F/1S.</p></div>
      <div class="card feature">${icon('calendar')}<h3>Per week ingericht</h3><p>De leerkracht kiest per week de focus en het weekdoel tot aan de toets, met proeftoetsen in de stijl van de doorstroomtoets.</p></div>
      <div class="card feature">${icon('users')}<h3>Volgsysteem</h3><p>Niveau per leerling en onderdeel, foutenanalyse, signalen en voorstellen voor instructiegroepjes.</p></div>
    </section>
    <p class="landing-foot"><a href="#/uitleg">${icon('help')} Handleiding</a><span>Alle gegevens blijven op de server van de school. Geen advertenties, geen trackers.</span></p>
  </div>`;
}
