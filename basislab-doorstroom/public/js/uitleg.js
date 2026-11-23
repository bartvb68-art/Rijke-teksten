import { esc } from './lib.js';
import { icon } from './icons.js';
import { shell } from './teacher/shell.js';
import { DOMAINS, skillsOf } from './shared/skills.js';
import { niveauLegend } from './ui.js';

export default function uitleg(root) {
  shell(root, 'uitleg', `
  <h1>Handleiding Basislab Doorstroom</h1>
  <p class="muted" style="max-width:75ch">Basislab Doorstroom bereidt groep 8 voor op de doorstroomtoets (IEP). Leerlingen oefenen rekenen, taalverzorging en lezen; de site past de moeilijkheid steeds aan. Jij plant per week de focus en volgt de klas.</p>
  <div class="grid3" style="margin-top:16px">
    <section class="card"><h2>${icon('calendar')} Elke week</h2><ol style="padding-left:18px;margin:0">
      <li>Kijk op <b>Overzicht</b> hoe vorige week ging en welke signalen er zijn.</li>
      <li>Controleer de <b>Weekplanning</b>: focus, weekdoel, proeftoets en een bericht voor de klas.</li>
      <li>Gebruik <b>Instructiegroepjes</b> om kinderen die een onderdeel nog lastig vinden, extra uitleg te geven.</li>
      <li>Bespreek met leerlingen hun groei bij <i>Mijn niveau</i>.</li></ol></section>
    <section class="card"><h2>${icon('target')} Zo werkt het aanpassen</h2>
      <p>Per onderdeel houdt Basislab een score bij van 1 tot 5. Na elk antwoord wordt die opnieuw geschat. De volgende opgave is zo gekozen dat de kans op een goed antwoord ongeveer 70 tot 75% is: uitdagend, maar haalbaar.</p>
      <p style="margin:0">De weektaak bestaat voor 70% uit de focus van de week en voor 30% uit herhaling van wat voor die leerling nog lastig is of lang niet is geoefend.</p></section>
    <section class="card"><h2>${icon('users')} Alle niveaus</h2>
      <p>Van onder 1F tot boven 2F/1S: de opgaven lopen van groep 6-niveau tot pittig 1S. Per leerling kun je instellen:</p>
      <ul style="padding-left:18px;margin:0"><li>een startniveau per vakgebied</li><li>een eigen weekdoel (50% tot 150%)</li><li>eigen leerdoelen in de weektaak</li><li>voorlezen, grotere letters, extra letterruimte en een rustige modus</li></ul></section>
  </div>
  <section class="card" style="margin-top:16px"><h2>Niveaus</h2>
    <p>De IEP rapporteert in referentieniveaus: voor taal 1F en 2F, voor rekenen 1F en 1S. Basislab gebruikt dezelfde indeling. De score is een schatting op basis van het oefenen, geen officiële toetsuitslag.</p>${niveauLegend()}
    <p class="muted" style="margin:10px 0 0">Grenzen op de scoreschaal: onder 2,0 = op weg naar 1F · 2,0 tot 3,0 = 1F · 3,0 tot 3,7 = op weg naar 2F/1S · 3,7 en hoger = 2F/1S.</p></section>
  <section class="card" style="margin-top:16px"><h2>Wat wordt er geoefend?</h2>
    <div class="grid3">${DOMAINS.map((d) => `<div><h3 class="dom"><i style="background:var(--${d.id})"></i>${esc(d.name)}</h3><ul style="padding-left:18px">${skillsOf(d.id).map((s) => `<li><b>${esc(s.name)}</b>: ${esc(s.desc)}</li>`).join('')}</ul></div>`).join('')}</div>
    <p class="muted" style="margin:0">Rekenopgaven, werkwoordspelling, zinsdelen en informatie opzoeken worden steeds opnieuw gemaakt, dus die zijn onuitputtelijk. Spelling, leestekens, goede zinnen, woordenschat, signaalwoorden en teksten komen uit een vaste verzameling; een leerling krijgt eerst alles wat nog niet gemaakt is.</p></section>
  <div class="grid2" style="margin-top:16px">
    <section class="card"><h2>${icon('test')} Proeftoets</h2><p>36 vragen in de stijl van de doorstroomtoets: 12 rekenen, 12 taalverzorging en 12 lezen. Tijdens de toets krijgen leerlingen geen feedback. Daarna zien ze per vakgebied hun geschatte niveau. Jij ziet de uitslagen bij <b>Proeftoetsen</b>. De standaardplanning zet twee keer een proeftoets open; je kunt dat per week aanpassen.</p></section>
    <section class="card"><h2>${icon('alert')} Signalen</h2><ul style="padding-left:18px;margin:0">
      <li><b>Deze week nog niet geoefend</b>: vanaf woensdag, als er nog niets is gemaakt.</li>
      <li><b>Onder 1F</b>: een vakgebied scoort onder de 1F-grens (na minstens 15 opgaven).</li>
      <li><b>Veel fout bij …</b>: van de laatste 10 opgaven van een onderdeel minder dan 40% goed.</li>
      <li><b>Daling bij …</b>: de score is in twee weken duidelijk gezakt.</li>
      <li><b>Klikt snel door</b>: antwoorden binnen enkele seconden, met veel fouten.</li></ul></section>
  </div>
  <section class="card" style="margin-top:16px"><h2>Voor leerlingen</h2>
    <p>Leerlingen gaan naar de website, kiezen <i>Ik ben leerling</i>, typen de klascode en kiezen hun naam. Op het startscherm zien ze hun weektaak, hun route naar de toets en hun niveau. Na elke opgave krijgen ze direct uitleg. Ze kunnen ook zelf een onderdeel kiezen. Thuis oefenen kan met dezelfde inlog.</p></section>
  <p class="muted" style="margin-top:16px">Privacy: alle gegevens staan op de server van de school. Van leerlingen wordt alleen de voornaam en de oefengegevens bewaard. Er zijn geen trackers, advertenties of externe diensten.</p>
  `);
}
