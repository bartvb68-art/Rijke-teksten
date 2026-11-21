import { icon } from './icons.js';
import { shell } from './teacher/shell.js';
import { LABELS, LABEL_ORDER, PROEVEN, PODIA, LESSONS, STAR_RULES } from './shared/curriculum.js';
import { esc } from './lib.js';

export default function uitleg(root) {
  shell(root, 'uitleg', `
    <h1>Uitleg</h1>
    <div class="panels">
      <section class="panel two-third">
        <h2>${icon('stage')} Wat is Basislab Ontleden?</h2>
        <p>Een oefenomgeving voor <b>zinsontleding</b> (redekundig ontleden) voor groep 5 tot en met 8, in een muziekthema. Leerlingen reizen als band langs zes podia: van het oefenhok tot het stadion. Op elk podium leren ze een nieuw zinsdeel, met korte uitleg, voorbeelden, oefenen met hulpvragen en een optreden waarmee ze 1 tot 3 sterren verdienen.</p>
        <p>Alle zinnen gaan over muziek en zijn speciaal voor Basislab Ontleden geschreven en gecontroleerd. De zinnen worden steeds anders gekozen en passen bij de groep: groep 5 krijgt vooral korte zinnen, groep 8 vooral lange.</p>
      </section>
      <section class="panel third">
        <h2>Zo begin je</h2>
        <ol class="steps-list">
          <li><span><b>Maak een account</b> als leerkracht.</span></li>
          <li><span><b>Maak een klas</b> en kies groep 5, 6, 7 of 8.</span></li>
          <li><span><b>Voeg leerlingen toe</b> en print de inlogkaarten.</span></li>
          <li><span>Leerlingen loggen in met <b>klascode, naam en wachtwoord</b>, op school en thuis.</span></li>
          <li><span>Volg de voortgang in het <b>volgsysteem</b> en reageer op signalen.</span></li>
        </ol>
      </section>
      <section class="panel wide"><h2>${icon('map')} De leerlijn</h2>
        <div class="lesson-grid">${PODIA.map((p) => `<div class="lesson-cell done" style="--pc:${p.color}"><b>${p.id}. ${esc(p.name)}</b>
          <div class="muted">${LESSONS.filter((l) => l.podium === p.id).map((l) => `${l.id}. ${esc(l.title)}`).join('<br>')}</div></div>`).join('')}</div>
        <p>Elke les heeft vier stappen: <b>Soundcheck</b> (uitleg met voorbeeld en drie zinnen met hulp), <b>Repetitie</b> (zes zinnen, hulpvraag beschikbaar), <b>Jamsessie</b> (deze les en eerdere lessen door elkaar) en het <b>Optreden</b> (tien zinnen zonder hulp). Sterren: 1 ster vanaf ${STAR_RULES.one}% goed, 2 vanaf ${STAR_RULES.two}%, 3 vanaf ${STAR_RULES.three}%. Les 20 is het examen voor het <b>ontleeddiploma</b> (twaalf zinnen helemaal ontleden, twee sterren nodig).</p>
        <p>Opdrachtvormen: zinnen <b>knippen</b> in zinsdelen (verschuifproef), een zinsdeel <b>aanwijzen</b>, elk zinsdeel een <b>etiket</b> geven en <b>vragen</b> (welk zinsdeel, welke vraag stel je, welke soort bepaling, werkwoordelijk of naamwoordelijk gezegde).</p>
        <p class="muted">Richtlijn: groep 5 werkt aan podium 1 en 2, groep 6 aan podium 2 en 3, groep 7 aan podium 3 tot en met 5 en groep 8 rondt af met podium 6 en het diploma. Met "lessen vrijgeven" zet je een leerling of klas direct op de goede plek.</p>
      </section>
      <section class="panel wide"><h2>${icon('tag')} Zinsdelen en proeven</h2>
        <div class="table-wrap"><table class="table"><thead><tr><th>Zinsdeel</th><th>Afkorting en kleur</th><th>Zo vind je het</th></tr></thead>
        <tbody>${['knip', ...LABEL_ORDER].map((l) => `<tr style="cursor:default"><td><b>${esc(LABELS[l].name)}</b></td><td><span class="chip" style="background:${LABELS[l].color};color:#fff;border-color:transparent">${esc(LABELS[l].short)}</span></td><td style="white-space:normal">${esc(PROEVEN[l])}</td></tr>`).join('')}</tbody></table></div>
        <p class="muted" style="font-size:.9rem">De persoonsvorm hoort ook bij het gezegde. Bij het etiketten plakken kiest de leerling voor de persoonsvorm "pv" en voor de andere werkwoorden "wg" (of "ng" bij een naamwoordelijk gezegde). Bij aanwijzen van het werkwoordelijk gezegde kiest de leerling álle werkwoorden, dus ook de persoonsvorm. Een voorzetselvoorwerp komt in de zinnen niet voor.</p>
      </section>
      <section class="panel"><h2>${icon('note')} Spellen</h2>
        <p><b>Notenregen</b>: de zinsdelen van een zin vallen als noten naar beneden; de leerling kiest het goede etiket voordat de noot de lijn raakt. <b>Bandbattle</b>: race tegen drie bands door zinsdelen te benoemen; de andere bands spelen in het tempo van de leerling.</p>
        <p>De spellen gaan open na les 3 en gebruiken alleen zinsdelen die de leerling al kent. Ze tellen mee in het volgsysteem (lastige zinsdelen en verwarringen).</p></section>
      <section class="panel"><h2>${icon('chart')} Het volgsysteem</h2>
        <p>Per klas zie je oefentijd, score (percentage goed), tempo (seconden per zin), het weekdoel, waar de klas is in de leerlijn, lastige zinsdelen en <b>verwarringen</b> (bijvoorbeeld lijdend voorwerp aangezien voor onderwerp). Signalen: niet geoefend, loopt vast, score daalt of is laag, verwart vaak twee zinsdelen.</p>
        <p>Per leerling zie je de ontwikkeling in grafieken, de zinsdelen, verwarringen, een oefenkalender, resultaten per les en concreet advies. Differentiëren kan met het <b>niveau van de zinnen</b> (makkelijker/uitdaging), lessen vrijgeven en voorlezen. Exporteer de klas naar Excel (CSV).</p></section>
    </div>`);
}
