// Lezen: woordenschat, signaalwoorden, informatie opzoeken (gegenereerd) en begrijpend lezen (teksten).
import { pick, ri, shuffle, mc, esc, table, euro2, nl } from './util.js';
import { TEKSTEN } from './teksten.js';

// ===================== WOORDENSCHAT =====================
// [zin met het woord tussen *sterretjes*, goede betekenis, fout, fout, fout, niveau]
const WOORDEN = [
  ['De juf was *tevreden* over ons werk.', 'blij omdat het goed is', 'boos', 'verbaasd', 'moe', 1.5],
  ['Hij gaf een *eerlijk* antwoord.', 'waar, zonder te liegen', 'snel', 'grappig', 'heel lang', 1.5],
  ['We moesten *fluisteren* in de bibliotheek.', 'heel zacht praten', 'hard roepen', 'zingen', 'niets zeggen', 1.5],
  ['De hond was erg *nieuwsgierig*.', 'wilde alles weten en zien', 'had honger', 'was bang', 'was moe', 1.5],
  ['Na de wedstrijd was ik *uitgeput*.', 'heel erg moe', 'heel blij', 'boos', 'verdrietig', 1.8],
  ['Het museum is *gratis* voor kinderen.', 'je hoeft niet te betalen', 'heel duur', 'alleen open in het weekend', 'heel leuk', 1.5],
  ['De bakker *bezorgt* het brood aan huis.', 'brengt', 'bakt', 'verkoopt', 'snijdt', 1.8],
  ['Ze *twijfelde* welke jas ze zou kopen.', 'wist het niet zeker', 'wist het meteen', 'vond geen enkele mooi', 'kocht er twee', 2],
  ['Het was een *gevaarlijke* kruising.', 'je kunt er makkelijk een ongeluk krijgen', 'heel druk met mensen', 'heel breed', 'nieuw aangelegd', 1.8],
  ['De leerlingen moesten het *verschil* tussen de twee plaatjes zoeken.', 'wat niet hetzelfde is', 'wat hetzelfde is', 'wat het mooist is', 'wat ontbreekt', 2],
  ['Mijn opa *verzamelt* postzegels.', 'spaart en bewaart ze', 'verkoopt ze', 'plakt ze op brieven', 'gooit ze weg', 2],
  ['De film was erg *spannend*.', 'je wilt weten hoe het afloopt', 'saai', 'grappig', 'kort', 1.5],
  ['De burgemeester hield een *toespraak*.', 'een praatje voor een groep mensen', 'een vergadering', 'een feest', 'een wandeling', 2.2],
  ['De dokter *onderzocht* mijn arm.', 'bekeek goed wat er was', 'deed een verband om', 'gaf een prik', 'brak', 2.2],
  ['We moeten zuinig zijn op ons *milieu*.', 'de natuur om ons heen', 'ons geld', 'onze spullen', 'onze school', 2.4],
  ['Het team had een *voorsprong* van drie punten.', 'stond voor', 'stond achter', 'stond gelijk', 'was uitgeschakeld', 2.4],
  ['Het is *verplicht* om een helm te dragen.', 'het moet', 'het mag niet', 'het hoeft niet', 'het is handig', 2.2],
  ['De oude man was erg *vergeetachtig*.', 'vergat vaak dingen', 'was vaak boos', 'was erg slim', 'liep langzaam', 2.4],
  ['Er was een *storing* bij de trein.', 'iets werkte niet goed', 'er was een feest', 'de trein was nieuw', 'er waren veel reizigers', 2.4],
  ['De kinderen *protesteerden* tegen de nieuwe regel.', 'lieten merken dat ze het er niet mee eens waren', 'waren heel blij met', 'bedachten', 'schreven op', 2.8],
  ['De verkoper gaf ons *advies*.', 'een raad over wat je kunt doen', 'korting', 'een cadeau', 'een bonnetje', 2.6],
  ['Het verhaal was *verzonnen*.', 'niet echt gebeurd', 'heel lang', 'echt gebeurd', 'heel oud', 2.4],
  ['Hij *beweerde* dat hij de snelste van de klas was.', 'zei dat het zo was', 'bewees', 'vergat', 'hoopte', 2.8],
  ['Er was een *tekort* aan stoelen.', 'er waren er niet genoeg', 'er waren er te veel', 'ze waren kapot', 'ze waren nieuw', 2.6],
  ['De voorstelling werd *uitgesteld*.', 'naar een later moment verschoven', 'afgelast', 'eerder gehouden', 'heel kort', 2.8],
  ['De weg was *afgesloten*.', 'je kon er niet langs', 'heel druk', 'pas nieuw', 'heel smal', 2.4],
  ['We hebben de *oorzaak* van het probleem gevonden.', 'waardoor het kwam', 'de oplossing', 'het gevolg', 'de schuldige', 3],
  ['Het was een *bijzondere* dag.', 'anders dan anders, opvallend', 'gewone', 'saaie', 'korte', 2.6],
  ['Zij is *verantwoordelijk* voor de planten in de klas.', 'zij moet ervoor zorgen', 'zij vindt ze mooi', 'zij heeft ze gekocht', 'zij mag ze niet aanraken', 3],
  ['De directeur gaf *toestemming* voor het schoolfeest.', 'zei dat het mocht', 'zei dat het niet mocht', 'betaalde', 'organiseerde', 3],
  ['Het weer is erg *wisselvallig*.', 'het verandert vaak', 'het is altijd mooi', 'het regent steeds', 'het is heel koud', 3.2],
  ['De dieren in het bos zijn *schuw*.', 'snel bang voor mensen', 'heel tam', 'heel groot', 'gevaarlijk', 3.2],
  ['Ze gaf een *duidelijke* uitleg.', 'goed te begrijpen', 'heel lange', 'moeilijke', 'snelle', 2.4],
  ['Hij was *teleurgesteld* over zijn cijfer.', 'het viel tegen', 'hij was trots', 'hij was verrast', 'hij was opgelucht', 3],
  ['De twee teams hadden een *conflict*.', 'ruzie of onenigheid', 'samenwerking', 'wedstrijd', 'afspraak', 3.4],
  ['Het museum heeft een grote *collectie* schilderijen.', 'verzameling', 'tentoonstelling buiten', 'winkel', 'zaal', 3.4],
  ['De stad *breidt uit*.', 'wordt groter', 'wordt kleiner', 'wordt schoner', 'wordt ouder', 3.2],
  ['Het is een *ingewikkelde* som.', 'moeilijk, met veel stappen', 'makkelijke', 'korte', 'foute', 2.8],
  ['De politie *waarschuwde* voor gladheid.', 'vertelde dat je moest oppassen', 'strooide zout', 'gaf boetes', 'zette de weg af', 3],
  ['Zijn reactie was erg *voorspelbaar*.', 'je wist van tevoren al wat hij zou doen', 'onverwacht', 'grappig', 'boos', 3.6],
  ['De *inwoners* van het dorp waren tegen de nieuwe weg.', 'mensen die er wonen', 'toeristen', 'bestuurders', 'boeren', 2.6],
  ['De plant *verdroogt* als je hem geen water geeft.', 'gaat dood door te weinig water', 'groeit snel', 'krijgt bloemen', 'wordt groen', 2.6],
  ['De uitslag van de wedstrijd was *onverwacht*.', 'niemand had het gedacht', 'iedereen wist het al', 'heel saai', 'nog niet bekend', 3],
  ['Het is *noodzakelijk* om je handen te wassen.', 'het is echt nodig', 'het is verboden', 'het is overbodig', 'het is leuk', 3.6],
  ['De wetenschapper deed een *ontdekking*.', 'vond iets nieuws', 'maakte een fout', 'schreef een boek', 'gaf een les', 3],
  ['De burgemeester *opende* de nieuwe brug *officieel*.', 'met een plechtigheid, volgens de regels', 'per ongeluk', 'stiekem', 'alleen voor fietsers', 3.8],
  ['De resultaten zijn *betrouwbaar*.', 'je kunt erop vertrouwen dat ze kloppen', 'heel goed', 'nog niet klaar', 'geheim', 3.8],
  ['Er was veel *kritiek* op het plan.', 'mensen zeiden wat er niet goed aan was', 'mensen waren enthousiast', 'het plan was duur', 'het plan was klaar', 3.8],
  ['De twee landen sloten een *verdrag*.', 'een officiële afspraak', 'een grens', 'een oorlog', 'een wedstrijd', 4.2],
  ['De leerling *presteerde* goed op de toets.', 'haalde een goed resultaat', 'deed goed mee', 'was op tijd', 'was rustig', 3.6],
  ['Ze had een *overtuigend* argument.', 'je gaat het ermee eens zijn', 'zwak', 'grappig', 'onduidelijk', 4],
  ['Het bedrijf wil de *uitstoot* van CO2 verminderen.', 'wat er in de lucht terechtkomt', 'de prijs', 'de winst', 'het gebruik van water', 4.2],
  ['De situatie was *kritiek*.', 'heel ernstig en gevaarlijk', 'grappig', 'normaal', 'opgelost', 4.6],
  ['Het is een *tijdelijke* oplossing.', 'voor een korte periode', 'voor altijd', 'heel goede', 'dure', 3.6],
  ['De meningen waren *verdeeld*.', 'niet iedereen dacht er hetzelfde over', 'iedereen was het eens', 'niemand had een mening', 'iedereen was boos', 4],
  ['De wethouder *reageerde* *terughoudend* op het voorstel.', 'voorzichtig, niet erg enthousiast', 'heel enthousiast', 'woedend', 'grappig', 4.8],
  ['Het onderzoek leverde *opmerkelijke* resultaten op.', 'resultaten die opvallen', 'saaie', 'foute', 'verwachte', 4.4],
  ['Er heerste een *gespannen* sfeer in de klas.', 'iedereen was zenuwachtig of onrustig', 'iedereen was vrolijk', 'iedereen was moe', 'iedereen was stil van verveling', 4],
  ['De regels zijn *aangescherpt*.', 'strenger gemaakt', 'afgeschaft', 'uitgelegd', 'versoepeld', 4.6],
  ['Ze bleef *optimistisch*, ook al ging het slecht.', 'ze dacht dat het goed zou komen', 'ze was somber', 'ze was boos', 'ze gaf op', 4.4],
  // uitdrukkingen
  ['Na die opmerking *ging hij door het lint*.', 'werd hij heel boos', 'ging hij weg', 'moest hij lachen', 'viel hij in slaap', 3],
  ['Ze *heeft het hart op de goede plaats*.', 'ze is lief en behulpzaam', 'ze is gezond', 'ze is moedig', 'ze is verliefd', 3.4],
  ['Hij *liet zich niet uit het veld slaan*.', 'hij gaf niet op', 'hij werd uit het team gezet', 'hij werd boos', 'hij liep weg', 4],
  ['Mijn broer *heeft twee linkerhanden*.', 'hij is onhandig', 'hij is linkshandig', 'hij is heel sterk', 'hij helpt graag', 3],
  ['Die rekentoets was *een makkie*.', 'iets heel makkelijks', 'iets heel moeilijks', 'iets heel saais', 'iets heel kort', 2.6],
  ['Je moet niet *over één nacht ijs gaan*.', 'niet te snel een besluit nemen', 'niet gaan schaatsen', 'niet te laat naar bed gaan', 'niet alleen gaan', 4.4],
  ['Toen de leraar binnenkwam, *viel het kwartje*.', 'begreep hij het ineens', 'viel er geld op de grond', 'werd het stil', 'ging de bel', 3.6],
  ['Hij *nam de benen*.', 'hij rende hard weg', 'hij ging zitten', 'hij viel', 'hij ging sporten', 3],
  ['Ze *sloeg twee vliegen in één klap*.', 'ze bereikte twee dingen tegelijk', 'ze was heel sterk', 'ze maakte een fout', 'ze had pech', 3.6],
  ['Dat plan *valt in het water*.', 'het gaat niet door', 'het is nat', 'het lukt goed', 'het wordt groter', 3.4],
  ['Hij *zat met de handen in het haar*.', 'hij wist niet wat hij moest doen', 'hij kamde zijn haar', 'hij was blij', 'hij was moe', 3.2],
  ['Je *moet het ijzer smeden als het heet is*.', 'je moet een kans meteen grijpen', 'je moet voorzichtig zijn met vuur', 'je moet hard werken', 'je moet wachten', 4.6],
  ['Ze *liet de kat uit de boom kijken*.', 'ze wachtte eerst af hoe het zou gaan', 'ze redde een kat', 'ze was bang', 'ze was lui', 4.4],
  ['Hij *heeft boter op zijn hoofd*.', 'hij verwijt anderen iets wat hij zelf ook doet', 'hij is vergeetachtig', 'hij heeft een rare hoed', 'hij heeft het warm', 5],
  ['Dat *is water naar de zee dragen*.', 'het heeft geen zin, er is al genoeg', 'het is zwaar werk', 'het is goed voor het milieu', 'het is gevaarlijk', 4.8],
];

function woordItem(target, seen) {
  const ranked = WOORDEN.map((r) => ({ r, d: Math.abs(r[5] - target) + (seen.has(`woord:${r[0]}`) ? 3 : 0) + Math.random() * 0.6 })).sort((a, b) => a.d - b.d);
  const [zin, good, f1, f2, f3, level] = ranked[0].r;
  const words = [...zin.matchAll(/\*([^*]+)\*/g)].map((m) => m[1]);
  const shown = esc(zin).replace(/\*([^*]+)\*/g, '<b>$1</b>');
  const isExpr = words.join(' ').split(' ').length > 2;
  return { level, key: `woord:${zin}`, prompt: `${isExpr ? 'Wat betekent de uitdrukking' : 'Wat betekent'} <b>${esc(words.join(' … '))}</b> in deze zin?<br><span class="sentence">${shown}</span>`,
    ...mc(good, [f1, f2, f3]), explain: `<b>${esc(words.join(' … '))}</b> betekent hier: ${esc(good)}.` };
}

// ===================== SIGNAALWOORDEN =====================
const VERBAND = {
  oorzaak: 'oorzaak en gevolg', tegenstelling: 'tegenstelling', opsomming: 'opsomming', tijd: 'tijd', voorwaarde: 'voorwaarde',
  doel: 'doel', voorbeeld: 'voorbeeld', vergelijking: 'vergelijking', conclusie: 'conclusie', reden: 'reden',
};
// [zin met ... , goed woord, fout, fout, verband, niveau]
const SIGNAAL = [
  ['Het regende hard. ... gingen we toch naar buiten.', 'Toch', 'Dus', 'Want', 'tegenstelling', 1.8],
  ['Ik had honger, ... at ik een boterham.', 'dus', 'maar', 'of', 'conclusie', 1.8],
  ['We bleven binnen, ... het onweerde.', 'omdat', 'hoewel', 'maar', 'reden', 1.8],
  ['... je je huiswerk af hebt, mag je buiten spelen.', 'Als', 'Hoewel', 'Omdat', 'voorwaarde', 2.2],
  ['Eerst doe je de bloem in de kom. ... breek je de eieren.', 'Daarna', 'Daarom', 'Bijvoorbeeld', 'tijd', 1.8],
  ['Ik neem een paraplu mee, ... ik niet nat word.', 'zodat', 'hoewel', 'maar', 'doel', 2.6],
  ['Veel dieren houden een winterslaap, ... de egel en de vleermuis.', 'zoals', 'omdat', 'toch', 'voorbeeld', 2.6],
  ['Mijn zus houdt van voetbal. ... houdt ze van tekenen.', 'Bovendien', 'Daardoor', 'Toch', 'opsomming', 3],
  ['De weg was glad. ... gebeurden er veel ongelukken.', 'Daardoor', 'Toch', 'Bovendien', 'oorzaak', 2.6],
  ['... hij ziek was, ging hij naar de wedstrijd.', 'Hoewel', 'Omdat', 'Zodat', 'tegenstelling', 3],
  ['Een cheeta is sneller ... een leeuw.', 'dan', 'als', 'zoals', 'vergelijking', 2],
  ['Je mag mee, ... je moet wel op tijd zijn.', 'maar', 'want', 'dus', 'tegenstelling', 1.8],
  ['Ik kom niet naar het feest, ... ik moet naar mijn oma.', 'want', 'dus', 'toch', 'reden', 2],
  ['... de bel ging, renden alle kinderen naar buiten.', 'Zodra', 'Hoewel', 'Zodat', 'tijd', 3],
  ['Er zijn veel soorten energie, ... zonne-energie en windenergie.', 'bijvoorbeeld', 'daarom', 'echter', 'voorbeeld', 2.6],
  ['Het plan was goed. Het was ... te duur.', 'echter', 'daarom', 'bijvoorbeeld', 'tegenstelling', 3.6],
  ['Alle proeven mislukten. ... besloten de onderzoekers te stoppen.', 'Daarom', 'Bovendien', 'Hoewel', 'conclusie', 3],
  ['Ze oefende elke dag. ... won ze de wedstrijd.', 'Uiteindelijk', 'Daarentegen', 'Bijvoorbeeld', 'tijd', 3.4],
  ['Kinderen bewegen steeds minder. ... worden ze vaker te zwaar.', 'Als gevolg daarvan', 'Daarentegen', 'Bijvoorbeeld', 'oorzaak', 3.8],
  ['In de stad is het druk. Op het platteland is het ... rustig.', 'daarentegen', 'daardoor', 'dus', 'tegenstelling', 4],
  ['... je goed oplet, maak je minder fouten.', 'Mits', 'Hoewel', 'Zodat', 'voorwaarde', 4.4],
  ['Hij trainde hard, ... hij sneller zou worden.', 'opdat', 'hoewel', 'zodra', 'doel', 4.6],
  ['De ene helft van de klas wilde naar de dierentuin. ... wilde naar het zwembad.', 'De andere helft', 'Daarom', 'Bijvoorbeeld', 'tegenstelling', 2.6],
  ['De fabriek loosde afval in de rivier. ... stierven er veel vissen.', 'Ten gevolge daarvan', 'Ondanks dat', 'Bovendien', 'oorzaak', 4.4],
];
// Vraag naar het soort verband bij een gegeven signaalwoord
const SIGNAAL_SOORT = [
  ['omdat', 'reden', 2.4], ['want', 'reden', 2.4], ['maar', 'tegenstelling', 2], ['toch', 'tegenstelling', 2.4], ['dus', 'conclusie', 2.6],
  ['daardoor', 'oorzaak', 3], ['als', 'voorwaarde', 3], ['zodat', 'doel', 3.4], ['bijvoorbeeld', 'voorbeeld', 2.4], ['bovendien', 'opsomming', 3.4],
  ['daarna', 'tijd', 2], ['eerst', 'tijd', 2], ['hoewel', 'tegenstelling', 3.6], ['kortom', 'conclusie', 3.8], ['zoals', 'voorbeeld', 3],
  ['echter', 'tegenstelling', 4], ['ten slotte', 'opsomming', 3.6], ['mits', 'voorwaarde', 4.6], ['om ... te', 'doel', 3.8], ['net als', 'vergelijking', 3.4],
  ['daarentegen', 'tegenstelling', 4.4], ['ten gevolge van', 'oorzaak', 4.6], ['op voorwaarde dat', 'voorwaarde', 4.2], ['evenals', 'vergelijking', 4.8],
];

function signaalItem(target, seen) {
  if (Math.random() < 0.6) {
    const rows = SIGNAAL;
    const ranked = rows.map((r) => ({ r, d: Math.abs(r[5] - target) + (seen.has(`signaal:${r[0]}`) ? 3 : 0) + Math.random() * 0.6 })).sort((a, b) => a.d - b.d);
    const [zin, good, f1, f2, soort, level] = ranked[0].r;
    return { level, key: `signaal:${zin}`, prompt: `Welk woord past op de puntjes?<br><span class="sentence">${esc(zin).replace('...', '<span class="gap">.....</span>')}</span>`,
      ...mc(good, [f1, f2]), explain: `<b>${esc(good)}</b> geeft hier een ${VERBAND[soort]} aan.` };
  }
  const ranked = SIGNAAL_SOORT.map((r) => ({ r, d: Math.abs(r[2] - target) + (seen.has(`soort:${r[0]}`) ? 3 : 0) + Math.random() * 0.6 })).sort((a, b) => a.d - b.d);
  const [w, soort, level] = ranked[0].r;
  const others = shuffle(Object.keys(VERBAND).filter((k) => k !== soort && !(soort === 'reden' && k === 'oorzaak') && !(soort === 'oorzaak' && k === 'reden'))).slice(0, 3);
  return { level, key: `soort:${w}`, prompt: `Welk verband geeft het signaalwoord <b>${esc(w)}</b> aan?`, ...mc(VERBAND[soort], others.map((k) => VERBAND[k])),
    explain: `<b>${esc(w)}</b> is een signaalwoord voor ${VERBAND[soort]}.` };
}

// ===================== INFORMATIE OPZOEKEN =====================
const tm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const STOPS = [['Groningen', 'Hoogkerk', 'Zuidhorn', 'Grijpskerk', 'Buitenpost', 'Leeuwarden'], ['Zwolle', 'Dalfsen', 'Ommen', 'Hardenberg', 'Coevorden'], ['Utrecht', 'Bunnik', 'Driebergen', 'Veenendaal', 'Ede', 'Arnhem']];

function dienstregeling(target) {
  const stops = pick(STOPS);
  const nTrips = 4;
  const first = ri(7, 8) * 60 + pick([2, 12, 17, 32]);
  const interval = pick([30, 60]);
  const legs = stops.slice(1).map(() => ri(5, 14));
  const trips = Array.from({ length: nTrips }, (_, t) => {
    let m = first + t * interval;
    return stops.map((s, i) => { if (i) m += legs[i - 1]; return m; });
  });
  const fig = table(['Halte', ...trips.map((_, i) => `rit ${i + 1}`)], stops.map((s, i) => [s, ...trips.map((tr) => tm(tr[i]))]), `Bus ${ri(10, 99)}: ${stops[0]} – ${stops[stops.length - 1]}`);
  const kinds = [
    { level: 1.8, make() {
      const t = ri(0, nTrips - 1); const i = ri(1, stops.length - 1);
      return { prompt: `Hoe laat is rit ${t + 1} in ${stops[i]}?`, type: 'input', check: 'time', answer: tm(trips[t][i]), explain: `Zoek de rij ${stops[i]} en de kolom rit ${t + 1}: ${tm(trips[t][i])}.` };
    } },
    { level: 2.6, make() {
      const t = ri(0, nTrips - 1); const a = ri(0, stops.length - 3); const b = ri(a + 1, stops.length - 1);
      const d = trips[t][b] - trips[t][a];
      return { prompt: `Hoeveel minuten duurt de rit van ${stops[a]} naar ${stops[b]}?`, type: 'input', check: 'number', answer: String(d), unit: 'minuten', explain: `Vertrek ${tm(trips[t][a])}, aankomst ${tm(trips[t][b])}: ${d} minuten.` };
    } },
    { level: 3.4, make() {
      const i = ri(1, stops.length - 1); const t = ri(1, nTrips - 1);
      const need = trips[t][i] - ri(1, interval - 5);
      return { prompt: `Je moet uiterlijk om ${tm(need)} in ${stops[i]} zijn. Je vertrekt vanaf ${stops[0]}. Hoe laat moet je daar uiterlijk de bus nemen?`, type: 'input', check: 'time', answer: tm(trips[t - 1][0]),
        explain: `De bus van ${tm(trips[t - 1][0])} is om ${tm(trips[t - 1][i])} in ${stops[i]}. De volgende bus is pas om ${tm(trips[t][i])} daar, en dat is te laat.` };
    } },
  ];
  const k = pick(kinds.filter((x) => Math.abs(x.level - target) <= 1)) || pick(kinds);
  return { ...k.make(), level: k.level, figure: fig };
}

function prijslijst(target) {
  const items = shuffle([['Zwemmen (kind tot 12 jaar)', 3.75], ['Zwemmen (volwassene)', 5.5], ['10-badenkaart kind', 32], ['10-badenkaart volwassene', 48.5], ['Huur zwembandjes', 1.25], ['Kluisje', 0.5]]).slice(0, 5)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const kid = items.find((i) => i[0].startsWith('Zwemmen (kind')) || ['Zwemmen (kind tot 12 jaar)', 3.75];
  if (!items.includes(kid)) items[0] = kid;
  const adult = items.find((i) => i[0].startsWith('Zwemmen (volw')) || null;
  const card = items.find((i) => i[0] === '10-badenkaart kind');
  const fig = table(['Product', 'Prijs'], items.map(([n, p]) => [n, euro2(p)]), 'Prijslijst zwembad De Golf');
  const kinds = [
    { level: 1.8, make() {
      const it = pick(items);
      return { prompt: `Wat kost "${it[0]}"?`, type: 'input', check: 'number', answer: nl(it[1], 2), unit: '€', explain: `Lees in de prijslijst: ${euro2(it[1])}.` };
    } },
    { level: 2.8, make() {
      const n = ri(2, 4);
      if (!adult) return { prompt: `Wat kost zwemmen voor ${n} kinderen?`, type: 'input', check: 'number', answer: nl(n * kid[1], 2), unit: '€', explain: `${n} × ${euro2(kid[1])} = ${euro2(n * kid[1])}.` };
      const v = n * kid[1] + adult[1];
      return { prompt: `Een moeder gaat met ${n} kinderen van 9 jaar zwemmen. Wat betalen ze samen?`, type: 'input', check: 'number', answer: nl(v, 2), unit: '€', explain: `${n} × ${euro2(kid[1])} + ${euro2(adult[1])} = ${euro2(v)}.` };
    } },
    { level: 3.8, make() {
      if (!card) return kinds[1].make();
      const save = 10 * kid[1] - card[1];
      return { prompt: 'Hoeveel geld bespaar je met een 10-badenkaart voor een kind, vergeleken met tien keer een los kaartje?', type: 'input', check: 'number', answer: nl(save, 2), unit: '€',
        explain: `Tien losse kaartjes: 10 × ${euro2(kid[1])} = ${euro2(10 * kid[1])}. De kaart kost ${euro2(card[1])}. Je bespaart ${euro2(save)}.` };
    } },
  ];
  const k = pick(kinds.filter((x) => Math.abs(x.level - target) <= 1)) || pick(kinds);
  return { ...k.make(), level: k.level, figure: fig };
}

function rooster(target) {
  const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
  const acts = ['Judo', 'Voetbal', 'Muziekles', 'Zwemles', 'Tekenclub', 'Schaakclub', 'Dansen', 'Hockey'];
  const durs = shuffle([45, 60, 75, 90, 105, 120]);
  const rows = shuffle(acts).slice(0, 6).map((a, i) => {
    const d = pick(days); const s = ri(14, 18) * 60 + pick([0, 15, 30, 45]); const dur = durs[i];
    return { a, d, s, e: s + dur, dur, place: pick(['Sporthal Noord', 'Buurthuis De Brug', 'Muziekschool', 'Zwembad De Golf', 'Bibliotheek']) };
  });
  const fig = table(['Activiteit', 'Dag', 'Tijd', 'Plaats'], rows.map((r) => [r.a, r.d, `${tm(r.s)} – ${tm(r.e)}`, r.place]), 'Naschoolse activiteiten');
  const kinds = [
    { level: 1.6, make() {
      const r = pick(rows);
      return { prompt: `Op welke dag is ${r.a.toLowerCase()}?`, ...mc(r.d, shuffle(days.filter((d) => d !== r.d)).slice(0, 3)), explain: `In het rooster staat ${r.a} op ${r.d}.` };
    } },
    { level: 2.4, make() {
      const r = pick(rows);
      return { prompt: `Waar is ${r.a.toLowerCase()}, en hoe laat begint het? Kies het goede antwoord.`, ...mc(`${r.place}, ${tm(r.s)}`, [`${r.place}, ${tm(r.e)}`, ...shuffle(rows.filter((x) => x.place !== r.place)).slice(0, 2).map((x) => `${x.place}, ${tm(r.s)}`)]),
        explain: `In de rij van ${r.a} staat: ${r.place}, van ${tm(r.s)} tot ${tm(r.e)}.` };
    } },
    { level: 3, make() {
      const r = pick(rows);
      return { prompt: `Hoeveel minuten duurt ${r.a.toLowerCase()}?`, type: 'input', check: 'number', answer: String(r.dur), unit: 'minuten', explain: `Van ${tm(r.s)} tot ${tm(r.e)} is ${r.dur} minuten.` };
    } },
    { level: 3.6, make() {
      const longest = rows.reduce((a, b) => (b.dur > a.dur ? b : a));
      return { prompt: 'Welke activiteit duurt het langst?', ...mc(longest.a, shuffle(rows.filter((x) => x !== longest)).map((x) => x.a)),
        explain: `Reken bij elke activiteit uit hoe lang hij duurt. ${longest.a} duurt ${longest.dur} minuten: het langst.` };
    } },
  ];
  const k = pick(kinds.filter((x) => Math.abs(x.level - target) <= 1)) || pick(kinds);
  return { ...k.make(), level: k.level, figure: fig };
}

function informatieItem(target) {
  return pick([dienstregeling, prijslijst, rooster])(target);
}

// ===================== BEGRIJPEND LEZEN =====================
const TYPE_LABEL = { detail: 'details zoeken', woord: 'woordbetekenis', verwijzing: 'verwijswoorden', hoofdgedachte: 'hoofdgedachte', doel: 'bedoeling van de schrijver', mening: 'meningen', conclusie: 'conclusies trekken', alinea: 'tekstopbouw', verband: 'verbanden' };
export const LEES_ITEMS = TEKSTEN.flatMap((t) => t.questions.map((q, i) => ({ text: t, q, i, key: `tekst:${t.id}:${i}`, level: Math.round((t.level + q[6]) * 10) / 10 })));

function tekstHtml(t) {
  return `<h3>${esc(t.title)}</h3><p class="genre">${esc(t.genre)}</p>${t.paras.map((p, i) => `<p><span class="alinea">${i + 1}</span>${esc(p)}</p>`).join('')}`;
}

/** Kies een tekstvraag; ga bij voorkeur verder met de tekst die de leerling al aan het lezen is. */
function begrijpendItem(target, seen, ctx = {}) {
  if (ctx.lastTextId) {
    const next = LEES_ITEMS.find((it) => it.text.id === ctx.lastTextId && !seen.has(it.key));
    if (next) return build(next);
  }
  // kies een tekst die past bij het niveau en die nog niet (helemaal) gelezen is
  const texts = TEKSTEN.map((t) => {
    const unseen = t.questions.filter((_, i) => !seen.has(`tekst:${t.id}:${i}`)).length;
    return { t, d: Math.abs(t.level - target) + (unseen === 0 ? 4 : unseen < t.questions.length ? 0.6 : 0) + Math.random() * 0.8 };
  }).sort((a, b) => a.d - b.d);
  const t = texts[0].t;
  const items = LEES_ITEMS.filter((it) => it.text.id === t.id);
  const it = items.find((x) => !seen.has(x.key)) || pick(items);
  return build(it);
  function build({ text, q, i, key, level }) {
    const [vraag, good, f1, f2, f3, soort] = q;
    const keepOrder = /^Alinea \d/.test(good);
    const o = mc(good, [f1, f2, f3]);
    if (keepOrder) o.options.sort();
    return { level, key, textId: text.id, prompt: `<span class="qnum">Vraag ${i + 1} van ${text.questions.length}</span>${esc(vraag)}`, passage: tekstHtml(text), ...o,
      explain: `Het goede antwoord is: <b>${esc(good)}</b>. Dit is een vraag over ${TYPE_LABEL[soort] || soort}.`, tag: soort };
  }
}

export const LEZEN = {
  'lz-woordenschat': (target, seen) => woordItem(target, seen),
  'lz-begrijpend': (target, seen, ctx) => begrijpendItem(target, seen, ctx),
  'lz-verbanden': (target, seen) => signaalItem(target, seen),
  'lz-informatie': (target) => informatieItem(target),
};

export const LEZEN_SIZES = { woorden: WOORDEN.length, signaal: SIGNAAL.length + SIGNAAL_SOORT.length, teksten: TEKSTEN.length, tekstvragen: LEES_ITEMS.length };
