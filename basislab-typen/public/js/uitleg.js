import { icon } from './icons.js';
import { shell } from './teacher/shell.js';

export default function uitleg(root) {
  shell(root, 'uitleg', `
    <h1>Uitleg</h1>
    <div class="panels">
      <section class="panel two-third">
        <h2>Uitlegvideo</h2>
        <p class="panel-sub">In vijf minuten zie je hoe Basislab Typen werkt voor leerlingen en leerkrachten (met Nederlandse ondertiteling).</p>
        <div class="video-box"><video controls preload="metadata" src="/video/uitleg.mp4" poster="/video/poster.jpg">
          Je browser kan deze video niet afspelen.</video></div>
      </section>
      <section class="panel third">
        <h2>Zo begin je</h2>
        <ol class="steps-list">
          <li><span><b>Maak een account</b> als leerkracht.</span></li>
          <li><span><b>Maak een klas</b> en kies groep 6, 7 of 8.</span></li>
          <li><span><b>Voeg leerlingen toe</b> en print de inlogkaarten.</span></li>
          <li><span>Leerlingen loggen in met <b>klascode, naam en wachtwoord</b>, op school en thuis.</span></li>
          <li><span>Volg de voortgang in het <b>volgsysteem</b> en reageer op signalen.</span></li>
        </ol>
      </section>
      <section class="panel"><h2>${icon('map')} De leerlijn</h2>
        <p>Zes planeten met samen 20 lessen: de thuisrij, reiken naar boven en beneden, de onderste rij, hoofdletters en leestekens, cijfers en tot slot lange teksten met het typediploma. Elke les heeft vijf stappen: nieuwe toetsen, lettertraining, woorden, ruimtemix en de sterrentest.</p>
        <p>Een leerling verdient 1 tot 3 sterren per les. De volgende les gaat open zodra de les is gehaald (instelbaar). De doelsnelheid hangt af van de groep en kan per leerling worden aangepast.</p></section>
      <section class="panel"><h2>${icon('chart')} Het volgsysteem</h2>
        <p>Per klas zie je oefentijd, snelheid, nauwkeurigheid, het weekdoel en signalen (niet geoefend, loopt vast, veel fouten). Per leerling zie je de ontwikkeling in grafieken, een toetsenbord met lastige toetsen, fouten per vinger, een oefenkalender en concreet advies.</p>
        <p>Exporteer de klas naar Excel (CSV) voor je leerlingvolgsysteem of oudergesprekken.</p></section>
    </div>`);
}
