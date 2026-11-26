// Korte uitleg per onderdeel: bovenaan remediërende werkbladen. Regel, stappen en één uitgewerkt voorbeeld.
export const UITLEG = {
  'rk-getal': {
    regel: 'Afronden: kijk naar het cijfer rechts van de plek waarop je afrondt. Is dat 5 of meer, dan rond je naar boven af; 4 of minder, dan naar beneden.',
    stappen: ['Zoek de plek waarop je afrondt (tientallen, honderdtallen, duizendtallen).', 'Kijk naar het cijfer daar direct rechts van.', 'Rond af en maak de cijfers daarna 0.'],
    voorbeeld: ['Rond 34.682 af op duizendtallen.', 'Duizendtallen: de 4. Rechts daarvan staat een 6: dat is 5 of meer.', 'Dus naar boven: 35.000.'],
  },
  'rk-bewerk': {
    regel: 'Eerst keer en gedeeld door, daarna plus en min. Grote keersommen splits je in stukjes.',
    stappen: ['Lees de vraag en schrijf op wat je moet uitrekenen.', 'Splits een moeilijke som: 23 × 14 = 23 × 10 + 23 × 4.', 'Controleer: past je antwoord bij het verhaal?'],
    voorbeeld: ['75 kinderen, 8 kinderen per busje. Hoeveel busjes?', '75 : 8 = 9, rest 3.', 'Voor de 3 kinderen die over zijn, is nog een busje nodig: 10 busjes.'],
  },
  'rk-breuk': {
    regel: 'Een breuk is een deel van een geheel. Onder de streep: in hoeveel gelijke delen. Boven de streep: hoeveel van die delen.',
    stappen: ['Een breuk van een getal: deel eerst door het getal onder de streep.', 'Vermenigvuldig dan met het getal boven de streep.', 'Optellen: maak eerst de getallen onder de streep gelijk.'],
    voorbeeld: ['3/4 deel van 36', '36 : 4 = 9', '9 × 3 = 27'],
  },
  'rk-komma': {
    regel: 'Zet bij optellen en aftrekken de komma\'s onder elkaar. Vergelijken: maak evenveel cijfers achter de komma.',
    stappen: ['Vergelijken: 0,7 = 0,70 en 0,65 blijft 0,65.', 'Keer 10, 100 of 1000: de komma 1, 2 of 3 plaatsen naar rechts.', 'Gedeeld door 10, 100 of 1000: de komma naar links.'],
    voorbeeld: ['Welk getal is groter: 0,7 of 0,65?', '0,70 en 0,65: 70 honderdsten tegen 65 honderdsten.', '0,7 is groter.'],
  },
  'rk-procent': {
    regel: 'Procent betekent "van de honderd". 100% is het geheel.',
    stappen: ['10% = delen door 10. 50% = de helft. 25% = delen door 4.', 'Andere procenten: begin bij 10% en reken verder (30% = 3 × 10%).', 'Korting: trek de korting af van de prijs.'],
    voorbeeld: ['Een jas kost € 80. Je krijgt 30% korting. Wat betaal je?', '10% van € 80 = € 8, dus 30% = € 24.', '€ 80 − € 24 = € 56.'],
  },
  'rk-verhouding': {
    regel: 'In een verhoudingstabel doe je boven en onder hetzelfde: keer of gedeeld door hetzelfde getal.',
    stappen: ['Zet wat je weet in een tabel.', 'Reken eerst terug naar 1 (of naar een handig getal).', 'Reken dan door naar wat er gevraagd wordt.'],
    voorbeeld: ['3 pakken melk kosten € 2,70. Wat kosten 5 pakken?', '1 pak: € 2,70 : 3 = € 0,90.', '5 pakken: 5 × € 0,90 = € 4,50.'],
  },
  'rk-meten': {
    regel: 'Bij lengte (km, hm, dam, m, dm, cm, mm) is elke stap keer 10. 1 kg = 1000 g. 1 liter = 10 dl = 100 cl = 1000 ml. 1 uur = 60 minuten.',
    stappen: ['Van groot naar klein: keer. Van klein naar groot: gedeeld door.', 'Tijd: reken eerst door tot het hele uur.', 'Schrijf de maat altijd achter je antwoord.'],
    voorbeeld: ['Hoeveel minuten zit er tussen 8:45 en 10:15?', '8:45 → 9:00 = 15 minuten. 9:00 → 10:00 = 60 minuten. 10:00 → 10:15 = 15 minuten.', 'Samen 90 minuten.'],
  },
  'rk-meetkunde': {
    regel: 'Omtrek = alle zijden bij elkaar. Oppervlakte rechthoek = lengte × breedte (m²). Inhoud balk = lengte × breedte × hoogte (m³).',
    stappen: ['Kijk goed: wordt er omtrek, oppervlakte of inhoud gevraagd?', 'Driehoek: basis × hoogte : 2.', '1000 cm³ = 1 liter.'],
    voorbeeld: ['Een rechthoek is 8 m lang en 5 m breed. Wat is de oppervlakte?', '8 × 5 = 40', 'De oppervlakte is 40 m².'],
  },
  'rk-verband': {
    regel: 'Lees eerst de titel en wat er bij de assen of kolommen staat. Gemiddelde: tel alles op en deel door het aantal.',
    stappen: ['Zoek de juiste staaf, stip of rij.', 'Lees het getal precies af langs de as.', 'Bij een verschil: grootste min kleinste.'],
    voorbeeld: ['Cijfers: 6, 8, 7 en 7. Wat is het gemiddelde?', '6 + 8 + 7 + 7 = 28', '28 : 4 = 7'],
  },
  'tv-ww': {
    regel: 'Tegenwoordige tijd: ik + stam, hij/zij + stam + t. Staat jij achter het werkwoord, dan alleen de stam. Verleden tijd: \'t kofschip.',
    stappen: ['Zoek de stam: het hele werkwoord min -en (worden → word).', 'Ik word, jij wordt, hij wordt, maar: word jij?', 'Verleden tijd: zit de letter vóór -en in \'t kofschip (t, k, f, s, ch, p)? Dan -te(n), anders -de(n). Voltooid deelwoord: ge + stam + t of d, behalve bij be-, ge-, her-, ont- en ver-.'],
    voorbeeld: ['Gisteren ..... ik de schuur. (verven)', 'Letter vóór -en in verven: v. Die zit niet in \'t kofschip.', 'Dus -de: verfde.'],
  },
  'tv-spelling': {
    regel: 'Open klankgroep (bo-men): één klinker. Gesloten klankgroep (kip-pen): dubbele medeklinker. Woorden op a, i, o, u, y krijgen \'s in het meervoud.',
    stappen: ['Hak het woord in klankgroepen.', '-lijk klinkt als "luk", -heid eindigt op een d.', 'Tussen-n alleen als het eerste deel een meervoud op -en heeft: pannenkoek.'],
    voorbeeld: ['Welk woord is goed: boomen of bomen?', 'Bo-men: de klankgroep bo eindigt op een klinker (open).', 'Dan één o: bomen.'],
  },
  'tv-interpunctie': {
    regel: 'Hoofdletter aan het begin van de zin en bij namen, landen, talen en feestdagen. Dagen en maanden krijgen geen hoofdletter.',
    stappen: ['Een vraag eindigt met een vraagteken, een uitroep met een uitroepteken.', 'Komma\'s tussen de delen van een opsomming, niet vóór "en".', 'Directe rede: Daan zegt: "Ik heb honger."'],
    voorbeeld: ['In juli gaan we naar Frankrijk.', 'juli: maand, dus kleine letter.', 'Frankrijk: land, dus hoofdletter.'],
  },
  'tv-grammatica': {
    regel: 'De persoonsvorm verandert als je de zin in een andere tijd zet. Het onderwerp vind je met: wie of wat + persoonsvorm?',
    stappen: ['Zet de zin in een andere tijd: het woord dat verandert is de persoonsvorm.', 'Vraag: wie of wat + persoonsvorm? Dat is het onderwerp.', 'Lijdend voorwerp: wie of wat + gezegde + onderwerp?'],
    voorbeeld: ['Mijn zus leest een spannend boek.', 'Andere tijd: Mijn zus las een spannend boek. Persoonsvorm: leest.', 'Wie leest? Mijn zus = onderwerp. Wat leest mijn zus? Een spannend boek = lijdend voorwerp.'],
  },
  'tv-zinsbouw': {
    regel: 'Na groter, sneller, meer: dan. Na even of zo: als. Een het-woord krijgt dat, een de-woord krijgt die.',
    stappen: ['Onderwerp: zij, nooit hun of hen.', 'Na een voorzetsel (met, voor, aan): hen. Bezit: hun jassen.', 'Na alles, iets en niets: wat.'],
    voorbeeld: ['Mijn broer is groter ..... ik.', 'Groter is een vergrotende trap.', 'Dus: groter dan ik.'],
  },
  'lz-woordenschat': {
    regel: 'De zin helpt je om de betekenis te vinden.',
    stappen: ['Lees de hele zin, ook wat ervoor en erna staat.', 'Zet elk antwoord op de plek van het woord.', 'Kies de betekenis waarbij de zin klopt.'],
    voorbeeld: ['De juf was tevreden over ons werk.', 'Probeer: "De juf was boos over ons werk"? Dan zou er iets mis zijn.', 'Tevreden = blij omdat het goed is.'],
  },
  'lz-begrijpend': {
    regel: 'Lees eerst de titel en de vragen, dan de tekst. Zoek bij elke vraag de alinea waar het over gaat.',
    stappen: ['Onderstreep de belangrijkste woorden in de vraag.', 'Zoek die woorden in de tekst en lees die alinea opnieuw.', 'Hoofdgedachte: waar gaat de hele tekst over, niet één alinea?'],
    voorbeeld: ['Vraag: Waarom eet een egel in de herfst zo veel?', 'Zoek "herfst": alinea 2.', 'Daar staat: "want in de winter is er bijna geen eten".'],
  },
  'lz-verbanden': {
    regel: 'Signaalwoorden laten zien hoe zinnen bij elkaar horen.',
    stappen: ['Reden: want, omdat. Conclusie: dus, daarom. Tegenstelling: maar, toch, hoewel.', 'Oorzaak en gevolg: daardoor. Doel: zodat, om ... te. Voorwaarde: als, mits.', 'Tijd: eerst, daarna, toen. Voorbeeld: bijvoorbeeld, zoals.'],
    voorbeeld: ['Het regende hard. ..... gingen we naar buiten.', 'Regen en toch naar buiten: dat is een tegenstelling.', 'Het signaalwoord is: Toch.'],
  },
  'lz-informatie': {
    regel: 'In een tabel zoek je de rij en de kolom die je nodig hebt; waar ze elkaar kruisen staat het antwoord.',
    stappen: ['Lees eerst de titel en de koppen van de kolommen.', 'Zoek de goede rij en de goede kolom.', 'Moet je rekenen met tijd? Tel eerst door tot het hele uur.'],
    voorbeeld: ['De bus vertrekt om 8:47 en komt aan om 9:12. Hoe lang duurt de rit?', '8:47 → 9:00 = 13 minuten. 9:00 → 9:12 = 12 minuten.', 'Samen 25 minuten.'],
  },
};
