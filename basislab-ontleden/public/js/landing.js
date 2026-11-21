import { icon } from './icons.js';
import { guitarSvg } from './avatar.js';
import { schoolLogoHtml } from './app.js';
import { LABELS } from './shared/curriculum.js';

export default function landing(root) {
  const pills = ['ow', 'pv', 'lv', 'mv', 'bwb'].map((l) => `<span class="lbl" style="--lc:${LABELS[l].color}">${LABELS[l].short}</span>`).join('');
  root.innerHTML = `
  <div class="landing">
    <section class="landing-hero">
      <div>
        ${schoolLogoHtml({ size: 56, withName: true, cls: 'on-dark' })}
        <h1>Basislab <span>Ontleden</span></h1>
        <p class="lead">Leer zinsontleding tijdens een tour langs zes podia: van het oefenhok tot het stadion. Voor groep 5, 6, 7 en 8 &mdash; op school én thuis.</p>
        <div class="landing-choice">
          <a class="choice" href="#/leerling" data-testid="choose-student">
            ${icon('guitar')}
            <strong>Ik ben leerling</strong>
            <span>Log in met je klascode en wachtwoord.</span>
          </a>
          <a class="choice" href="#/leraar" data-testid="choose-teacher">
            ${icon('chart')}
            <strong>Ik ben leerkracht</strong>
            <span>Volg de voortgang van je klas.</span>
          </a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="orbit"></div><div class="p1"></div><div class="p2"></div>
        <div class="hero-guitar">${guitarSvg({ body: 'goud', pattern: 'noten', guard: 'zwart', waves: 'plasma' }, { size: 230 })}</div>
        <div class="legend-pills" style="position:absolute;bottom:4%;right:0">${pills}</div>
      </div>
    </section>
    <section class="features">
      <div class="card feature">${icon('stage')}<h3>Stap voor stap</h3><p>20 lessen: zinsdelen knippen, persoonsvorm, onderwerp, gezegde, lijdend en meewerkend voorwerp, bijwoordelijke bepaling en het naamwoordelijk gezegde.</p></div>
      <div class="card feature">${icon('note')}<h3>Spellen met ritme</h3><p>Vang de zinsdelen bij Notenregen en win de Bandbattle, met precies de zinsdelen die je al kent.</p></div>
      <div class="card feature">${icon('chart')}<h3>Volgsysteem</h3><p>Leerkrachten zien scores, tempo, lastige zinsdelen, verwarringen, oefentijd en signalen per leerling.</p></div>
    </section>
    <p class="landing-foot"><a href="#/uitleg">${icon('info')} Uitleg en handleiding</a><span>Alle gegevens blijven op de server van de school. Geen advertenties, geen trackers.</span></p>
  </div>`;
}
