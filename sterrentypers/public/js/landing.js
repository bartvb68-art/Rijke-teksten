import { icon } from './icons.js';
import { rocketSvg } from './avatar.js';

export default function landing(root) {
  root.innerHTML = `
  <div class="landing">
    <section class="landing-hero">
      <div>
        <h1>Sterren<span>typers</span></h1>
        <p class="lead">Leer typen met tien vingers tijdens een reis langs zes planeten. Voor groep 6, 7 en 8 &mdash; op school én thuis.</p>
        <div class="landing-choice">
          <a class="choice" href="#/leerling" data-testid="choose-student">
            ${icon('rocket')}
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
        ${rocketSvg({ body: 'blauw', pattern: 'sterren', window: 'goud', flame: 'vuur' }, { size: 200 })}
      </div>
    </section>
    <section class="features">
      <div class="card feature">${icon('map')}<h3>Stap voor stap</h3><p>20 lessen: van de thuisrij tot hoofdletters, cijfers en het typediploma. Elke les bouwt voort op de vorige.</p></div>
      <div class="card feature">${icon('meteor')}<h3>Spannende spellen</h3><p>Schiet meteoren uit de lucht en race tegen andere raketten, met precies de letters die je al kent.</p></div>
      <div class="card feature">${icon('chart')}<h3>Volgsysteem</h3><p>Leerkrachten zien snelheid, nauwkeurigheid, lastige toetsen, oefentijd en signalen per leerling.</p></div>
    </section>
    <p class="landing-foot"><a href="#/uitleg">${icon('video')} Uitlegvideo en handleiding</a><span>Alle gegevens blijven op de server van de school. Geen advertenties, geen trackers.</span></p>
  </div>`;
}
