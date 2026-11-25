import { icon } from './icons.js';
import { schoolLogoHtml } from './app.js';

export default function landing(root) {
  root.innerHTML = `
  <div class="landing">
    <section class="landing-hero">
      <div>
        ${schoolLogoHtml({ size: 56, withName: true })}
        <h1>Basis<span class="lab">lab</span><br><span class="prog">Ontleden</span></h1>
        <p class="lead">Oefen zinsontleding stap voor stap, met muziek als thema. Voor groep 5, 6, 7 en 8, op school en thuis.</p>
        <div class="landing-choice">
          <a class="choice" href="#/leerling" data-testid="choose-student">
            ${icon('guitar')}
            <strong>Ik ben leerling →</strong>
            <span>Log in met je klascode en wachtwoord.</span>
          </a>
          <a class="choice" href="#/leraar" data-testid="choose-teacher">
            ${icon('chart')}
            <strong>Ik ben leerkracht →</strong>
            <span>Volg de voortgang van je klas.</span>
          </a>
        </div>
      </div>
      <div class="hero-art">
        <img class="program-logo" src="/img/basislab-ontleden-logo.png" alt="Logo Basislab Ontleden" width="600" height="640">
      </div>
    </section>
    <section class="features">
      <div class="card feature">${icon('stage')}<h3>Stap voor stap</h3><p>20 lessen op 6 podia: zinsdelen knippen, persoonsvorm, onderwerp, gezegde, lijdend en meewerkend voorwerp, bijwoordelijke bepaling en het naamwoordelijk gezegde.</p></div>
      <div class="card feature">${icon('note')}<h3>Spellen met ritme</h3><p>Vang de zinsdelen bij Notenregen en win de Bandbattle, met de zinsdelen die je al kent.</p></div>
      <div class="card feature">${icon('chart')}<h3>Volgsysteem</h3><p>Zie per leerling de score, het tempo, lastige zinsdelen en wat er door elkaar wordt gehaald.</p></div>
    </section>
    <p class="landing-foot"><a href="#/uitleg">${icon('info')} Uitleg en handleiding</a><a href="https://basislab.nl" rel="noopener">Onderdeel van Basislab →</a><span>Alle gegevens blijven op de server van de school. Geen advertenties, geen trackers.</span></p>
  </div>`;
}
