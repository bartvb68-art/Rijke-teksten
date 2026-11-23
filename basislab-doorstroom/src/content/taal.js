// Taalverzorging: werkwoordspelling (gegenereerd) en banken met spelling, leestekens, zinsdelen en zinsbouw.
import { pick, shuffle, mc, esc } from './util.js';

// ===================== WERKWOORDSPELLING =====================
// Zwakke werkwoorden: [infinitief, stam, voorvoegsel (geen ge-), hulpwerkwoord, aanvullingen]
const WEAK = [
  ['werken', 'werk', false, 'h', ['in de tuin', 'op de boerderij']],
  ['spelen', 'speel', false, 'h', ['op het plein', 'een spelletje']],
  ['fietsen', 'fiets', false, 'h', ['door het park', 'een rondje']],
  ['wachten', 'wacht', false, 'h', ['op de bus', 'bij het hek']],
  ['praten', 'praat', false, 'h', ['met de juf', 'over de vakantie']],
  ['zetten', 'zet', false, 'h', ['de borden op tafel', 'thee']],
  ['antwoorden', 'antwoord', false, 'h', ['op de vraag', 'meteen']],
  ['leggen', 'leg', false, 'h', ['de boeken op de kast', 'een puzzel']],
  ['bouwen', 'bouw', false, 'h', ['een hut', 'een toren van blokken']],
  ['maken', 'maak', false, 'h', ['het huiswerk', 'een tekening']],
  ['dansen', 'dans', false, 'h', ['op het feest', 'in de gymzaal']],
  ['koken', 'kook', false, 'h', ['pasta', 'het avondeten']],
  ['plakken', 'plak', false, 'h', ['een sticker op het schrift', 'de plaatjes in het album']],
  ['verven', 'verf', false, 'h', ['het hek', 'de schuur']],
  ['reizen', 'reis', false, 'h', ['met de trein', 'door Europa']],
  ['verhuizen', 'verhuis', true, 'z', ['naar Groningen', 'naar een groter huis']],
  ['beantwoorden', 'beantwoord', true, 'h', ['de vraag', 'alle mails']],
  ['vertellen', 'vertel', true, 'h', ['een spannend verhaal', 'een mop']],
  ['ontdekken', 'ontdek', true, 'h', ['een geheime gang', 'een nieuw spel']],
  ['herhalen', 'herhaal', true, 'h', ['de som', 'de tafels']],
  ['beloven', 'beloof', true, 'h', ['een verrassing', 'het aan de juf']],
  ['versieren', 'versier', true, 'h', ['de klas', 'de kerstboom']],
  ['wandelen', 'wandel', false, 'h', ['in het bos', 'met de hond']],
  ['oefenen', 'oefen', false, 'h', ['de tafels', 'op de piano']],
  ['kletsen', 'klets', false, 'h', ['met een vriendin', 'in de klas']],
  ['poetsen', 'poets', false, 'h', ['de schoenen', 'de ramen']],
  ['rusten', 'rust', false, 'h', ['na de wedstrijd', 'op de bank']],
  ['melden', 'meld', false, 'h', ['het ongeluk', 'het aan de directeur']],
  ['redden', 'red', false, 'h', ['de kat uit de boom', 'een vogeltje']],
  ['luisteren', 'luister', false, 'h', ['naar muziek', 'naar de juf']],
  ['tekenen', 'teken', false, 'h', ['een paard', 'een plattegrond']],
  ['missen', 'mis', false, 'h', ['de bus', 'de trein']],
  ['printen', 'print', false, 'h', ['het werkstuk', 'een plaatje'], 'eng'],
  ['downloaden', 'download', false, 'h', ['een app', 'het spel'], 'eng'],
  ['mailen', 'mail', false, 'h', ['de juf', 'een foto'], 'eng'],
];
// Sterke en onregelmatige werkwoorden: [infinitief, stam, vt enkelvoud, vt meervoud, voltooid deelwoord, hulpww, aanvullingen]
const STRONG = [
  ['lopen', 'loop', 'liep', 'liepen', 'gelopen', 'h', ['een rondje', 'de marathon']],
  ['zwemmen', 'zwem', 'zwom', 'zwommen', 'gezwommen', 'h', ['in het meer', 'twintig baantjes']],
  ['schrijven', 'schrijf', 'schreef', 'schreven', 'geschreven', 'h', ['een brief', 'een verhaal']],
  ['lezen', 'lees', 'las', 'lazen', 'gelezen', 'h', ['een spannend boek', 'de krant']],
  ['eten', 'eet', 'at', 'aten', 'gegeten', 'h', ['een appel', 'pannenkoeken']],
  ['drinken', 'drink', 'dronk', 'dronken', 'gedronken', 'h', ['een glas melk', 'thee']],
  ['zingen', 'zing', 'zong', 'zongen', 'gezongen', 'h', ['een liedje', 'in het koor']],
  ['vinden', 'vind', 'vond', 'vonden', 'gevonden', 'h', ['een euro op straat', 'de sleutel']],
  ['rijden', 'rijd', 'reed', 'reden', 'gereden', 'h', ['op een pony', 'in een nieuwe auto']],
  ['houden', 'houd', 'hield', 'hielden', 'gehouden', 'h', ['een spreekbeurt', 'van chocola']],
  ['zoeken', 'zoek', 'zocht', 'zochten', 'gezocht', 'h', ['de sleutel', 'een nieuw boek']],
  ['kopen', 'koop', 'kocht', 'kochten', 'gekocht', 'h', ['een cadeau', 'nieuwe schoenen']],
  ['brengen', 'breng', 'bracht', 'brachten', 'gebracht', 'h', ['de post', 'een taart']],
  ['denken', 'denk', 'dacht', 'dachten', 'gedacht', 'h', ['aan de vakantie', 'aan opa']],
  ['vergeten', 'vergeet', 'vergat', 'vergaten', 'vergeten', 'h', ['de sleutel', 'het huiswerk']],
  ['worden', 'word', 'werd', 'werden', 'geworden', 'z', ['twaalf jaar', 'heel boos']],
  ['beginnen', 'begin', 'begon', 'begonnen', 'begonnen', 'z', ['met de toets', 'aan een nieuw boek']],
  ['kiezen', 'kies', 'koos', 'kozen', 'gekozen', 'h', ['een nieuwe fiets', 'de rode trui']],
  ['snijden', 'snijd', 'sneed', 'sneden', 'gesneden', 'h', ['het brood', 'de taart']],
];

const isKof = (inf) => {
  const base = inf.replace(/en$/, '');
  return base.endsWith('ch') || 'tkfsp'.includes(base.slice(-1));
};
function weakForms([inf, stam, prefix]) {
  const t = isKof(inf) ? 't' : 'd';
  const vt = `${stam}${t}e`;
  const end = /[td]$/.test(stam) ? '' : t;
  return { vt, vtm: `${vt}n`, vd: `${prefix ? '' : 'ge'}${stam}${end}`, t };
}
export function verbForms(entry, strong) {
  if (strong) {
    const [inf, stam, vt, vtm, vd, hulp, compl] = entry;
    return { inf, stam, vt, vtm, vd, hulp, compl, strong: true, eng: false };
  }
  const f = weakForms(entry);
  return { inf: entry[0], stam: entry[1], prefix: entry[2], hulp: entry[3], compl: entry[4], eng: entry[5] === 'eng', strong: false, ...f };
}

const SUBJECTS = [
  { w: 'ik', p: 1 }, { w: 'jij', p: 2 }, { w: 'hij', p: 3 }, { w: 'Sanne', p: 3 }, { w: 'mijn broer', p: 3 }, { w: 'de juf', p: 3 },
  { w: 'Daan', p: 3 }, { w: 'wij', p: 'mv' }, { w: 'jullie', p: 'mv' }, { w: 'de kinderen', p: 'mv' }, { w: 'mijn ouders', p: 'mv' },
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const thirdT = (stam) => (stam.endsWith('t') ? stam : `${stam}t`);
function presentForm(v, subj, inverted) {
  if (subj.p === 'mv') return v.inf;
  if (subj.p === 1) return v.stam;
  if (subj.p === 2 && inverted) return v.stam;
  return thirdT(v.stam);
}
const HULP = { h: { 1: 'heb', 2: 'hebt', 3: 'heeft', mv: 'hebben' }, z: { 1: 'ben', 2: 'bent', 3: 'is', mv: 'zijn' } };

function wwExplainPresent(v, subj, inverted, ans) {
  if (subj.p === 'mv') return `Bij een onderwerp in het meervoud (${subj.w}) gebruik je de hele stam + en: ${ans}.`;
  if (subj.p === 1) return `Bij ik schrijf je alleen de stam: ${ans}${v.stam.endsWith('d') ? ' (ook al hoor je een t)' : ''}.`;
  if (subj.p === 2 && inverted) return `Staat jij of je achter de persoonsvorm, dan schrijf je alleen de stam: ${ans}.`;
  return `Stam + t: ${v.stam} + t = ${ans}${v.stam.endsWith('t') ? ' (de stam eindigt al op een t)' : v.stam.endsWith('d') ? ' (dt!)' : ''}.`;
}

function wwItem(target) {
  const all = [...WEAK.map((e) => verbForms(e, false)), ...STRONG.map((e) => verbForms(e, true))];
  const kinds = [
    { level: 1.5, kind: 'tt', filter: (v) => !/[dt]$/.test(v.stam), subjects: SUBJECTS.filter((s) => s.p !== 2) },
    { level: 2.5, kind: 'tt', filter: (v) => /d$/.test(v.stam), subjects: SUBJECTS.filter((s) => s.p !== 2) },
    { level: 3, kind: 'tt', filter: () => true, subjects: SUBJECTS.filter((s) => s.p === 2) },
    { level: 3.5, kind: 'tt-inv', filter: (v) => /d$/.test(v.stam), subjects: SUBJECTS.filter((s) => s.p === 2 || s.p === 3) },
    { level: 2.5, kind: 'vt', filter: (v) => v.strong, subjects: SUBJECTS },
    { level: 2.8, kind: 'vt', filter: (v) => !v.strong && !v.eng && !/[dt]$/.test(v.stam) && !['verven', 'reizen', 'beloven'].includes(v.inf), subjects: SUBJECTS },
    { level: 3.6, kind: 'vt', filter: (v) => !v.strong && (/[dt]$/.test(v.stam) || ['verven', 'reizen', 'beloven'].includes(v.inf)), subjects: SUBJECTS },
    { level: 2.5, kind: 'vd', filter: (v) => !v.prefix && !v.eng && !/[dt]$/.test(v.stam), subjects: SUBJECTS },
    { level: 3.2, kind: 'vd', filter: (v) => v.prefix || /[dt]$/.test(v.stam), subjects: SUBJECTS },
    { level: 4, kind: 'mc-pv-vd', filter: (v) => !v.strong && v.prefix && /d$/.test(v.stam), subjects: SUBJECTS.filter((s) => s.p === 3) },
    { level: 4.5, kind: 'eng', filter: (v) => v.eng, subjects: SUBJECTS },
    { level: 5, kind: 'je', filter: (v) => v.inf === 'worden' || v.inf === 'vinden' || v.inf === 'houden', subjects: [] },
  ];
  const near = kinds.filter((k) => Math.abs(k.level - target) <= 0.8);
  const k = pick(near.length ? near : kinds);
  const v = pick(all.filter(k.filter));
  const compl = pick(v.compl);
  let prompt; let answer; let explain; let level = k.level;

  if (k.kind === 'tt' || k.kind === 'tt-inv') {
    const subj = pick(k.subjects);
    const inverted = k.kind === 'tt-inv' || Math.random() < 0.35;
    answer = presentForm(v, subj, inverted);
    if (inverted) {
      const q = Math.random() < 0.5;
      prompt = q ? `<span class="gap">.....</span> ${subj.w} ${compl}?` : `Elke dag <span class="gap">.....</span> ${subj.w} ${compl}.`;
      if (q) answer = cap(answer);
      if (subj.p === 2) level = Math.max(level, /d$/.test(v.stam) ? 3.5 : 3);
    } else {
      prompt = `${cap(subj.w)} <span class="gap">.....</span> elke week ${compl}.`;
      if (subj.p === 2) level = /d$/.test(v.stam) ? 3.2 : 2.5;
    }
    explain = wwExplainPresent(v, subj, inverted, answer.toLowerCase());
    prompt = `Vul de goede vorm van <b>${v.inf}</b> in (tegenwoordige tijd).<br><span class="sentence">${prompt}</span>`;
  } else if (k.kind === 'vt') {
    const subj = pick(k.subjects);
    const mv = subj.p === 'mv';
    answer = mv ? v.vtm : v.vt;
    const s = Math.random() < 0.5 ? `Gisteren <span class="gap">.....</span> ${subj.w} ${compl}.` : `${cap(subj.w)} <span class="gap">.....</span> vorige week ${compl}.`;
    prompt = `Vul de goede vorm van <b>${v.inf}</b> in (verleden tijd).<br><span class="sentence">${s}</span>`;
    explain = v.strong
      ? `${v.inf} is een sterk werkwoord: ${v.vt} (meervoud: ${v.vtm}).`
      : `Stam: ${v.stam}. Kijk naar de letter vóór -en in <i>${v.inf}</i>: ${v.inf.replace(/en$/, '').endsWith('ch') ? 'ch' : v.inf.replace(/en$/, '').slice(-1)}. ${v.t === 't' ? "Die zit in 't kofschip, dus -te" : "Die zit niet in 't kofschip, dus -de"}${mv ? 'n (meervoud)' : ''}: ${answer}.`;
  } else if (k.kind === 'vd') {
    const subj = pick(k.subjects);
    const h = HULP[v.hulp][subj.p];
    answer = v.vd;
    prompt = `Vul het voltooid deelwoord van <b>${v.inf}</b> in.<br><span class="sentence">${cap(subj.w)} ${h} gisteren ${compl} <span class="gap">.....</span>.</span>`;
    explain = v.strong
      ? `${v.inf} is een sterk werkwoord: ${v.vd}.`
      : v.prefix
        ? `${v.inf} begint met be-, ge-, her-, ont- of ver-: dan komt er geen ge- voor. Kofschip: ${v.t}. Het wordt ${v.vd}.`
        : `ge + stam + ${v.t}${/[dt]$/.test(v.stam) ? ` (de stam eindigt al op ${v.stam.slice(-1)}, dus niets erbij)` : ''}: ${v.vd}.`;
  } else if (k.kind === 'mc-pv-vd') {
    const pv = thirdT(v.stam);
    const usePv = Math.random() < 0.5;
    const subj = pick(k.subjects);
    if (usePv) {
      prompt = `Welke vorm is goed?<br><span class="sentence">${cap(subj.w)} <span class="gap">.....</span> elke dag ${compl}.</span>`;
      const o = mc(pv, [v.vd === pv ? `${v.stam}d` : v.vd, `${v.stam}dt`.replace('ddt', 'dt')]);
      return { level, prompt, ...o, explain: `Hier is het de persoonsvorm in de tegenwoordige tijd (hij-vorm): stam + t = ${pv}.` };
    }
    prompt = `Welke vorm is goed?<br><span class="sentence">${cap(subj.w)} ${HULP[v.hulp][3]} ${compl} <span class="gap">.....</span>.</span>`;
    const o = mc(v.vd, [pv, `ge${v.vd}`]);
    return { level, prompt, ...o, explain: `Hier is het een voltooid deelwoord (na ${HULP[v.hulp][3]}). ${v.inf} heeft geen ge- en eindigt op d: ${v.vd}.` };
  } else if (k.kind === 'eng') {
    const subj = pick(SUBJECTS);
    if (Math.random() < 0.5) {
      answer = v.vd;
      prompt = `Vul het voltooid deelwoord van <b>${v.inf}</b> in.<br><span class="sentence">${cap(subj.w)} ${HULP.h[subj.p]} ${compl} <span class="gap">.....</span>.</span>`;
      explain = `Ook Engelse werkwoorden volgen 't kofschip. Stam: ${v.stam}. ${v.t === 't' ? 'Kofschipletter, dus t' : 'Geen kofschipletter, dus d'}: ${v.vd}.`;
    } else {
      answer = subj.p === 'mv' ? v.vtm : v.vt;
      prompt = `Vul de goede vorm van <b>${v.inf}</b> in (verleden tijd).<br><span class="sentence">Gisteren <span class="gap">.....</span> ${subj.w} ${compl}.</span>`;
      explain = `Stam ${v.stam}, ${v.t === 't' ? "kofschipletter, dus -te" : "geen kofschipletter, dus -de"}${subj.p === 'mv' ? 'n' : ''}: ${answer}.`;
    }
  } else {
    // je als bezittelijk voornaamwoord tegenover je als persoonlijk voornaamwoord
    const bez = Math.random() < 0.5;
    const ow = bez ? 'je broer' : 'je';
    answer = bez ? cap(thirdT(v.stam)) : cap(v.stam);
    prompt = `Vul de goede vorm van <b>${v.inf}</b> in (tegenwoordige tijd).<br><span class="sentence"><span class="gap">.....</span> ${ow} ${pick(v.compl)}?</span>`;
    explain = bez
      ? `Let op: "je broer" is hetzelfde als "hij". Hij-vorm: stam + t = ${answer}.`
      : `"je" is hier "jij" en staat achter de persoonsvorm: alleen de stam, ${answer}.`;
  }
  return { level, prompt, type: 'input', check: 'text', answer, explain };
}

// ===================== SPELLING =====================
// [goed, fout, fout, niveau, uitleg]
const SPELLING = [
  ['bomen', 'boomen', 'bohmen', 1.5, 'Bo-men: na een open klankgroep schrijf je één o.'],
  ['straten', 'straaten', 'stratten', 1.5, 'Stra-ten: open klankgroep, dus één a.'],
  ['kippen', 'kipen', 'kippe', 1.5, 'Kip-pen: na een korte klank verdubbel je de medeklinker.'],
  ['ijsje', 'eisje', 'ijsie', 1.5, 'IJs schrijf je met lange ij; het verkleinwoord is ijsje.'],
  ['trein', 'trijn', 'treijn', 1.5, 'Trein schrijf je met korte ei.'],
  ['blauw', 'blouw', 'blau', 1.5, 'Blauw schrijf je met auw.'],
  ['koud', 'kaud', 'kout', 1.5, 'Koud: ou, en een d omdat het koude wordt.'],
  ['hond', 'hont', 'honnd', 1.5, 'Hond met een d: honden.'],
  ['paard', 'paart', 'paardt', 1.5, 'Paard met een d: paarden.'],
  ['vliegen', 'vlieggen', 'fliegen', 1.5, 'Vlie-gen: geen dubbele g na ie.'],
  ['eigenlijk', 'eigelijk', 'eigenlek', 2, 'Eigen + lijk. Je hoort "luk", maar je schrijft -lijk.'],
  ['gevaarlijk', 'gevaarlek', 'gevaarlik', 2, 'Aan het eind hoor je "luk", je schrijft -lijk.'],
  ['vriendelijk', 'vriendelek', 'vrindelijk', 2, 'Vriend + e + lijk.'],
  ['duidelijk', 'duidelek', 'duidlijk', 2, 'Dui-de-lijk.'],
  ['gezelligheid', 'gezelligheit', 'gezellegheid', 2, 'Woorden op -heid schrijf je met d: gezelligheden.'],
  ['schaduw', 'schaduuw', 'schadu', 2, 'Schaduw eindigt op -uw.'],
  ['politie', 'polietie', 'polisie', 2, 'Politie: je hoort "sie", maar je schrijft -tie.'],
  ['cadeau', 'kado', 'cadau', 2, 'Cadeau komt uit het Frans: eau klinkt als o.'],
  ['bureau', 'buro', 'burau', 2, 'Bureau komt uit het Frans: eau klinkt als o.'],
  ['chauffeur', 'sjoffeur', 'chauffeuur', 2.5, 'Chauffeur komt uit het Frans: ch klinkt als sj, au als o.'],
  ['station', 'stasion', 'statsion', 2, 'Station: je hoort "sjon", je schrijft -tion.'],
  ['vakantie', 'vakansie', 'vakanntie', 2, 'Vakantie: je hoort "sie", je schrijft -tie.'],
  ['liniaal', 'lineaal', 'liniaall', 2.5, 'Li-ni-aal.'],
  ['praktisch', 'prakties', 'praktiesch', 2.5, 'Woorden op -isch schrijf je zonder e: praktisch, logisch.'],
  ["foto's", 'fotos', 'fotoos', 2.5, "Eindigt een woord op a, i, o, u of y, dan komt er bij het meervoud 's: foto's."],
  ["auto's", 'autos', 'autoos', 2.5, "Meervoud van woorden op een klinker: auto's."],
  ["menu's", 'menus', 'menuus', 2.5, "Meervoud van menu: menu's."],
  ["baby's", 'babies', 'babys', 3, "Baby's: na een y komt 's, niet -ies zoals in het Engels."],
  ["paraplu's", 'paraplus', 'parapluus', 3, "Meervoud van paraplu: paraplu's."],
  ['boompje', 'boomtje', 'boompie', 2.5, 'Na een m komt -pje: boompje, bloempje.'],
  ['koninkje', 'koningje', 'konninkje', 3, 'Koning wordt koninkje: -ing wordt -inkje.'],
  ['balletje', 'baletje', 'ballentje', 2.5, 'Bal-le-tje: korte a, dus dubbele l en -etje.'],
  ['karretje', 'karetje', 'karrtje', 2.5, 'Kar-re-tje: korte a, dus dubbele r en -etje.'],
  ['dinsdag', 'dinstag', 'dinsdach', 2.5, 'Dinsdag: dag met een d en een g.'],
  ['vriendschap', 'vrientschap', 'vriendsgap', 3, 'Vriend + schap: de d van vriend blijft.'],
  ['tijdschrift', 'tijtschrift', 'tydschrift', 3, 'Tijd + schrift: de d van tijd blijft.'],
  ['abrikoos', 'abbrikoos', 'abrikoz', 3, 'A-bri-koos.'],
  ['hobby', 'hobbie', 'hoby', 3, 'Hobby komt uit het Engels.'],
  ['computer', 'kompjoeter', 'computter', 3, 'Computer komt uit het Engels.'],
  ['restaurant', 'restaurand', 'restorant', 3, 'Restaurant komt uit het Frans: au klinkt als o.'],
  ['chocola', 'sjokola', 'chocolla', 3, 'Chocola: ch klinkt als sj.'],
  ['garage', 'garaazje', 'garrage', 3, 'Garage: de g aan het eind klinkt als zj.'],
  ['horloge', 'horlozje', 'horlogie', 3.5, 'Horloge: de g klinkt als zj.'],
  ['enthousiast', 'entoesiast', 'enthousiasd', 3.5, 'Enthousiast: th en ou.'],
  ['reünie', 'reunie', 'reüni', 3.5, 'Reünie: een trema op de u, zodat je re-u-nie leest.'],
  ['museum', 'museeum', 'muzeum', 3, 'Mu-se-um.'],
  ['ideeën', 'ideeen', 'ideëen', 3.5, 'Idee + en: een trema op de e waar een nieuwe klankgroep begint: ideeën.'],
  ['zeeën', 'zeeen', 'zeëen', 3.5, 'Zee + en = zeeën, met trema.'],
  ['knieën', 'knien', 'knieen', 3.5, 'Knie + en = knieën, met trema.'],
  ['tegelijkertijd', 'tegelijktijd', 'tegelijkerteid', 3.5, 'Tegelijk + er + tijd.'],
  ['enigszins', 'enigzins', 'eenigszins', 4, 'Enigszins: met s en z.'],
  ['gebeurtenis', 'gebeurtennis', 'gebeurdenis', 3.5, 'Gebeur + te + nis: -nis met één n.'],
  ['ontzettend', 'onzettend', 'ontzetend', 3.5, 'Ont + zet + tend.'],
  ['beïnvloeden', 'beinvloeden', 'beïnfloeden', 4, 'Be + invloed + en: trema op de i.'],
  ['mysterie', 'misterie', 'mystery', 3.5, 'Mysterie met een y.'],
  ['onmiddellijk', 'onmidellijk', 'onmiddelijk', 4, 'On + middel + lijk: twee keer dubbele letters.'],
  ['accommodatie', 'accomodatie', 'acommodatie', 4.5, 'Accommodatie: dubbele c en dubbele m.'],
  ['parallel', 'paralel', 'parrallel', 4.5, 'Parallel: één r, twee keer ll.'],
  ['definitief', 'difinitief', 'definitif', 4, 'De-fi-ni-tief.'],
  ['interessant', 'interresant', 'intressant', 4, 'In-te-res-sant: één r, dubbele s.'],
  ['geïnteresseerd', 'geinteresseerd', 'geïnterreseerd', 4.5, 'Ge + interesseerd: trema op de i.'],
  ['bibliotheek', 'biebliotheek', 'bibliotheeck', 3.5, 'Bi-bli-o-theek met th.'],
  ['gymnastiek', 'gimnastiek', 'gymnastik', 4, 'Gymnastiek met een y.'],
  ['ambulance', 'ambulanse', 'ambulans', 4, 'Ambulance komt uit het Frans.'],
  ['commissie', 'comissie', 'commisie', 4.5, 'Commissie: dubbele m en dubbele s.'],
  ['apparaat', 'aparaat', 'apparraat', 4, 'Apparaat: dubbele p, één r.'],
  ['categorie', 'catagorie', 'kategorie', 4.5, 'Ca-te-go-rie.'],
  ['ritme', 'rhytme', 'ritmme', 4, 'Ritme schrijf je in het Nederlands zonder h.'],
  ['chaos', 'gaos', 'chaoss', 4, 'Chaos: ch klinkt hier als g.'],
  ['pannenkoek', 'pannekoek', 'pannenkoeck', 4, 'Tussen-n: het meervoud van pan is pannen, dus pannenkoek.'],
  ['zonnebril', 'zonnenbril', 'zonebril', 4, 'Geen tussen-n: zon heeft geen meervoud dat je hier bedoelt (er is maar één zon).'],
  ['hondenhok', 'hondehok', 'hondenhock', 4, 'Tussen-n: honden is het meervoud van hond.'],
  ['ruggengraat', 'ruggegraat', 'rugengraat', 4.5, 'Tussen-n: ruggen is het meervoud van rug.'],
  ['kippensoep', 'kippesoep', 'kipensoep', 4, 'Tussen-n: kippen is het meervoud van kip.'],
  ['paardenbloem', 'paardebloem', 'paardnbloem', 4.5, 'Tussen-n: paarden is het meervoud van paard.'],
  ['boekenkast', 'boekekast', 'boekencast', 4, 'Tussen-n: boeken is het meervoud van boek.'],
  ['barbecue', 'barbeque', 'barbecu', 4.5, 'Barbecue komt uit het Engels.'],
  ['souvenir', 'suvenier', 'souveniere', 4.5, 'Souvenir komt uit het Frans: ou klinkt als oe.'],
  ['belachelijk', 'belachlijk', 'belagchelijk', 4, 'Be-la-che-lijk.'],
  ['pyjama', 'pyama', 'pajama', 4.5, 'Pyjama met y en j.'],
  ['hygiëne', 'hygiene', 'hygïene', 5, 'Hygiëne: trema op de e.'],
  ['symmetrie', 'symetrie', 'simmetrie', 5, 'Symmetrie: y en dubbele m.'],
  ['diarree', 'diaree', 'diarrhee', 5, 'Diarree: dubbele r en dubbele e.'],
  ['vacuüm', 'vacuum', 'vacüum', 5, 'Vacuüm: trema op de tweede u.'],
  ['puberteit', 'pubertijd', 'puberteid', 4.5, 'Puberteit: korte ei en een t, net als majesteit.'],
  ['onafhankelijk', 'onafhankelek', 'onafhankenlijk', 4, 'On + af + hanke + lijk.'],
];

// ===================== LEESTEKENS EN HOOFDLETTERS =====================
// [goed, fout, fout, niveau, uitleg]
const INTERPUNCTIE = [
  ['Op maandag gaan we zwemmen.', 'Op Maandag gaan we zwemmen.', 'op maandag gaan we zwemmen.', 1.5, 'Dagen en maanden schrijf je met een kleine letter. Een zin begint met een hoofdletter.'],
  ['Mijn tante woont in Amsterdam.', 'mijn tante woont in amsterdam.', 'Mijn Tante woont in Amsterdam.', 1.5, 'Hoofdletter aan het begin van de zin en bij namen van plaatsen.'],
  ['Hoe laat begint de film?', 'Hoe laat begint de film.', 'Hoe laat begint de film!', 1.5, 'Na een vraag komt een vraagteken.'],
  ['In juli gaan we naar Frankrijk.', 'In Juli gaan we naar Frankrijk.', 'In juli gaan we naar frankrijk.', 1.5, 'Maanden met een kleine letter, landen met een hoofdletter.'],
  ['Wat een mooie tekening!', 'Wat een mooie tekening?', 'wat een mooie tekening!', 1.5, 'Een uitroep eindigt met een uitroepteken.'],
  ['Ik koop appels, peren en bananen.', 'Ik koop appels peren en bananen.', 'Ik koop, appels, peren, en bananen.', 2, 'Bij een opsomming zet je komma\'s tussen de delen, maar meestal niet voor "en".'],
  ["We hebben twee auto's.", 'We hebben twee autos.', 'We hebben twee auto,s.', 2, "Meervoud van auto: auto's, met een apostrof."],
  ['Met Pasen zoeken we eieren.', 'Met pasen zoeken we eieren.', 'met Pasen zoeken we eieren.', 2, 'Feestdagen schrijf je met een hoofdletter.'],
  ['Daan zegt: "Ik heb honger."', 'Daan zegt: "ik heb honger."', 'Daan zegt "Ik heb honger".', 2.5, 'Na een dubbele punt en aanhalingstekens begint de directe rede met een hoofdletter. De punt staat binnen de aanhalingstekens.'],
  ['Juf Ilse woont in de Kerkstraat.', 'juf Ilse woont in de kerkstraat.', 'Juf ilse woont in de Kerkstraat.', 2, 'Namen van mensen en straten krijgen een hoofdletter.'],
  ["'s Morgens eet ik brood.", "'S morgens eet ik brood.", "S'morgens eet ik brood.", 3, "Begint een zin met 's, dan krijgt het woord erna de hoofdletter: 's Morgens."],
  ["We hebben 's avonds pizza gegeten.", 'We hebben savonds pizza gegeten.', "We hebben 's Avonds pizza gegeten.", 3, "'s avonds schrijf je met een apostrof en een kleine letter, midden in de zin."],
  ['Hij spreekt Frans en Engels.', 'Hij spreekt frans en engels.', 'Hij spreekt Frans en engels.', 2.5, 'Namen van talen krijgen een hoofdletter.'],
  ['We eten Franse kaas.', 'We eten franse kaas.', 'We eten Franse Kaas.', 3, 'Een bijvoeglijk naamwoord dat van een land komt, krijgt een hoofdletter: Franse kaas.'],
  ["Hoeveel baby's liggen er op de afdeling?", 'Hoeveel babys liggen er op de afdeling?', 'Hoeveel babies liggen er op de afdeling?', 2.5, "Meervoud van baby: baby's."],
  ['Ze kocht een broek, een trui en twee paar sokken.', 'Ze kocht een broek een trui en twee paar sokken.', 'Ze kocht, een broek, een trui en twee paar sokken.', 2.5, 'Komma\'s tussen de delen van een opsomming.'],
  ['Toen het begon te regenen, gingen we naar binnen.', 'Toen het begon te regenen gingen, we naar binnen.', 'Toen, het begon te regenen gingen we naar binnen.', 3, 'Tussen twee persoonsvormen die bij verschillende zinsdelen horen, zet je een komma: regenen, gingen.'],
  ["'Kom je ook?' vroeg Mila.", "'Kom je ook,' vroeg Mila?", "'Kom je ook?' Vroeg Mila.", 3.5, 'Het vraagteken hoort bij de vraag, binnen de aanhalingstekens. Daarna gaat de zin verder met een kleine letter.'],
  ['De ruïne van het kasteel is erg oud.', 'De ruine van het kasteel is erg oud.', 'De ruinë van het kasteel is erg oud.', 3, 'Ruïne: een trema op de i, zodat je ru-i-ne leest.'],
  ['Sinterklaas komt op 5 december.', 'sinterklaas komt op 5 December.', 'Sinterklaas komt op 5 December.', 2.5, 'Sinterklaas met een hoofdletter, december met een kleine letter.'],
  ['Wist je dat de Rijn door Duitsland stroomt?', 'Wist je dat de rijn door Duitsland stroomt?', 'Wist je dat de Rijn door duitsland stroomt?', 2.5, 'Rivieren en landen krijgen een hoofdletter.'],
  ['Mijn broer, die in Utrecht woont, komt morgen.', 'Mijn broer die in Utrecht woont, komt morgen.', 'Mijn broer, die in Utrecht woont komt morgen.', 4, 'Een bijzin die extra uitleg geeft, zet je tussen twee komma\'s.'],
  ['De Nederlandse vlag is rood, wit en blauw.', 'De nederlandse vlag is rood, wit en blauw.', 'De Nederlandse vlag is Rood, Wit en Blauw.', 3, 'Nederlandse met een hoofdletter; kleuren met een kleine letter.'],
  ['Mijn moeder vroeg of ik mijn kamer al had opgeruimd.', 'Mijn moeder vroeg of ik mijn kamer al had opgeruimd?', 'Mijn moeder vroeg: of ik mijn kamer al had opgeruimd.', 4, 'Dit is een indirecte vraag: daar komt geen vraagteken achter.'],
  ['Op Koningsdag verkoop ik speelgoed.', 'Op koningsdag verkoop ik speelgoed.', 'op Koningsdag verkoop ik speelgoed.', 2.5, 'Koningsdag is een feestdag: hoofdletter.'],
  ['Ik heb een zee-egel gevonden.', 'Ik heb een zeeëgel gevonden.', 'Ik heb een zeeegel gevonden.', 4, 'Bij samenstellingen waarbij klinkers botsen (zee + egel) gebruik je een koppelteken.'],
  ['We varen op de Middellandse Zee.', 'We varen op de Middellandse zee.', 'We varen op de middellandse zee.', 3.5, 'In aardrijkskundige namen krijgen alle belangrijke woorden een hoofdletter: Middellandse Zee.'],
  ['Pas op, de vloer is nat!', 'Pas op de vloer is nat!', 'Pas op, de vloer is nat?', 3, 'De komma laat zien dat "pas op" een waarschuwing is. Zonder komma lees je "pas op de vloer".'],
  ["De oma's en opa's kwamen kijken.", 'De omas en opas kwamen kijken.', "De oma's en opas kwamen kijken.", 3, "Meervoud van oma en opa: oma's en opa's."],
  ["'Wat ben je laat!' riep de juf.", "'Wat ben je laat,' riep de juf!", "'Wat ben je laat!' Riep de juf.", 4, 'Het uitroepteken hoort binnen de aanhalingstekens. Daarna gaat de zin verder met een kleine letter.'],
  ['Ik logeer bij Daans oma.', "Ik logeer bij Daan's oma.", 'Ik logeer bij Daan zijn oma.', 4.5, "Bij een naam schrijf je de bezits-s zonder apostrof: Daans oma. Een apostrof alleen als de naam op een klinker eindigt: Noa's fiets."],
  ["Dat is Noa's fiets.", 'Dat is Noas fiets.', 'Dat is Noa zijn fiets.', 4, "Eindigt een naam op a, i, o, u of y, dan schrijf je 's: Noa's fiets."],
  ['De Tweede Wereldoorlog eindigde in 1945.', 'De tweede wereldoorlog eindigde in 1945.', 'De Tweede wereldoorlog eindigde in 1945.', 4, 'Namen van historische gebeurtenissen krijgen hoofdletters: de Tweede Wereldoorlog.'],
  ['Hij is een echte Amsterdammer.', 'Hij is een echte amsterdammer.', 'hij is een echte Amsterdammer.', 3.5, 'Inwoners van een plaats of land krijgen een hoofdletter.'],
  ['Er waren drie cafés in het dorp.', "Er waren drie cafe's in het dorp.", 'Er waren drie cafe\'s\' in het dorp.', 4.5, 'Café heeft een accent op de e. Het meervoud is cafés: alleen een s, omdat je de é al goed uitspreekt.'],
  ['De scheidsrechter beëindigde de wedstrijd.', 'De scheidsrechter beeindigde de wedstrijd.', 'De scheidsrechter be-eindigde de wedstrijd.', 4, 'Be + eindigde: trema op de e waar een nieuwe klankgroep begint.'],
  ['"Ik kom morgen," zei opa, "als het niet regent."', '"Ik kom morgen," zei opa, "Als het niet regent."', '"Ik kom morgen" zei opa "als het niet regent."', 5, 'Loopt de directe rede door na "zei opa", dan gaat het verder met een kleine letter.'],
];

// ===================== ZINSDELEN EN WOORDSOORTEN =====================
// Rollen: ow onderwerp, pv persoonsvorm, wg rest van het werkwoordelijk gezegde, lv lijdend voorwerp,
// mv meewerkend voorwerp, bwb bijwoordelijke bepaling. Woordsoorten na de schuine streep.
const ZINNEN = [
  'ow:De/lw kinderen/zn|pv:spelen/ww|bwb:op/vz het/lw plein/zn',
  'ow:Mijn/vnw zus/zn|pv:leest/ww|lv:een/lw spannend/bn boek/zn',
  'bwb:Morgen/bw|pv:gaan/ww|ow:wij/vnw|bwb:naar/vz de/lw dierentuin/zn',
  'ow:De/lw juf/zn|pv:geeft/ww|mv:de/lw kinderen/zn|lv:een/lw compliment/zn',
  'ow:Daan/zn|pv:heeft/ww|lv:zijn/vnw fiets/zn|wg:gerepareerd/ww',
  'bwb:Gisteren/bw|pv:kocht/ww|ow:opa/zn|lv:drie/tw nieuwe/bn boeken/zn',
  'pv:Heb/ww|ow:jij/vnw|lv:mijn/vnw gum/zn|wg:gezien/ww?',
  'ow:De/lw oude/bn hond/zn|pv:slaapt/ww|bwb:in/vz de/lw mand/zn',
  'ow:Wij/vnw|pv:hebben/ww|bwb:gisteren/bw|lv:een/lw taart/zn|wg:gebakken/ww',
  'bwb:In/vz de/lw zomer/zn|pv:zwemmen/ww|ow:de/lw kinderen/zn|bwb:in/vz het/lw meer/zn',
  'ow:Mila/zn|pv:stuurt/ww|mv:haar/vnw oma/zn|lv:een/lw kaart/zn',
  'ow:De/lw voetballers/zn|pv:winnen/ww|lv:de/lw finale/zn',
  'ow:Mijn/vnw ouders/zn|pv:zijn/ww|bwb:naar/vz Spanje/zn|wg:gevlogen/ww',
  'ow:Twee/tw vrolijke/bn meisjes/zn|pv:zingen/ww|lv:een/lw liedje/zn',
  'bwb:Vanmiddag/bw|pv:schrijft/ww|ow:Noah/zn|lv:een/lw brief/zn|mv:aan/vz zijn/vnw vriend/zn',
  'ow:De/lw directeur/zn|pv:opent/ww|lv:het/lw nieuwe/bn schoolplein/zn',
  'ow:Het/lw kleine/bn katje/zn|pv:drinkt/ww|lv:melk/zn',
  'bwb:Na/vz school/zn|pv:maakt/ww|ow:Sem/zn|lv:zijn/vnw huiswerk/zn',
  'ow:De/lw bakker/zn|pv:verkoopt/ww|bwb:elke/vnw ochtend/zn|lv:vers/bn brood/zn',
  'ow:Jullie/vnw|pv:moeten/ww|lv:de/lw tafels/zn|wg:oefenen/ww',
  'ow:Mijn/vnw broer/zn|pv:leende/ww|mv:mij/vnw|lv:zijn/vnw skateboard/zn',
  'ow:De/lw toeristen/zn|pv:fotograferen/ww|lv:de/lw hoge/bn toren/zn',
  'bwb:Op/vz zaterdag/zn|pv:helpt/ww|ow:Fatima/zn|bwb:in/vz de/lw winkel/zn',
  'ow:Zij/vnw|pv:hebben/ww|bwb:per/vz ongeluk/zn|lv:het/lw raam/zn|wg:gebroken/ww',
  'ow:Opa/zn|pv:vertelt/ww|mv:ons/vnw|lv:een/lw grappig/bn verhaal/zn',
  'ow:De/lw nieuwe/bn leerling/zn|pv:zit/ww|bwb:naast/vz mij/vnw',
  'bwb:Vorige/bn week/zn|pv:heeft/ww|ow:onze/vnw klas/zn|lv:het/lw museum/zn|wg:bezocht/ww',
  'ow:De/lw vogels/zn|pv:vliegen/ww|bwb:naar/vz het/lw zuiden/zn',
  'ow:Liam/zn|pv:geeft/ww|lv:de/lw bal/zn|mv:aan/vz de/lw keeper/zn',
  'ow:Wie/vnw|pv:heeft/ww|lv:mijn/vnw pen/zn|wg:gepakt/ww?',
  'ow:Vijf/tw leerlingen/zn|pv:krijgen/ww|lv:een/lw prijs/zn',
  'bwb:Over/vz twee/tw weken/zn|pv:maken/ww|ow:wij/vnw|lv:de/lw doorstroomtoets/zn',
  'ow:Mijn/vnw moeder/zn|pv:koopt/ww|mv:mij/vnw|lv:een/lw warme/bn jas/zn',
  'ow:De/lw wind/zn|pv:waait/ww|bwb:hard/bn',
];
const ROLE_NAMES = { ow: 'onderwerp', pv: 'persoonsvorm', lv: 'lijdend voorwerp', mv: 'meewerkend voorwerp', bwb: 'bijwoordelijke bepaling', wg: 'deel van het werkwoordelijk gezegde' };
const POS_NAMES = { zn: 'zelfstandig naamwoord', ww: 'werkwoord', bn: 'bijvoeglijk naamwoord', lw: 'lidwoord', vnw: 'voornaamwoord', vz: 'voorzetsel', tw: 'telwoord', bw: 'bijwoord' };

function parseZin(spec) {
  const question = spec.endsWith('?');
  const chunks = spec.replace(/\?$/, '').split('|').map((c) => {
    const [role, words] = c.split(':');
    const ws = words.split(' ').map((w) => { const [t, pos] = w.split('/'); return { t, pos }; });
    return { role, words: ws, text: ws.map((w) => w.t).join(' ') };
  });
  const text = chunks.map((c) => c.text).join(' ') + (question ? '?' : '.');
  return { chunks, text, question };
}

function grammaticaItem(target) {
  const opts = [];
  for (const spec of ZINNEN) {
    const z = parseZin(spec);
    const has = (r) => z.chunks.some((c) => c.role === r);
    const inverted = z.chunks[0].role !== 'ow';
    opts.push({ z, q: 'pv', level: has('wg') || z.question ? 2.6 : 2 });
    opts.push({ z, q: 'ow', level: inverted ? 3 : 2.4 });
    if (has('lv')) opts.push({ z, q: 'lv', level: 3.6 });
    if (has('mv')) opts.push({ z, q: 'mv', level: z.chunks.find((c) => c.role === 'mv').words[0].pos === 'vz' ? 5 : 4.5 });
    if (has('wg')) opts.push({ z, q: 'wwg', level: 4 });
    for (const pos of ['zn', 'ww', 'lw', 'bn', 'tw', 'vz']) {
      if (z.chunks.some((c) => c.words.some((w) => w.pos === pos))) opts.push({ z, q: `pos-${pos}`, level: { zn: 1.8, ww: 1.8, lw: 2, bn: 2.8, tw: 3, vz: 3.6 }[pos] });
    }
  }
  const near = opts.filter((o) => Math.abs(o.level - target) <= 0.7);
  const { z, q, level } = pick(near.length ? near : opts);
  const zin = `<span class="sentence">${esc(z.text)}</span>`;
  const words = z.chunks.flatMap((c) => c.words.map((w) => ({ ...w, role: c.role })));
  if (q === 'pv') {
    const pv = z.chunks.find((c) => c.role === 'pv').text;
    const others = shuffle(words.filter((w) => w.role !== 'pv')).sort((a, b) => (b.pos === 'ww') - (a.pos === 'ww')).map((w) => w.t);
    return { level, prompt: `Wat is de persoonsvorm in deze zin?<br>${zin}`, ...mc(pv, others),
      explain: `De persoonsvorm verandert als je de zin in een andere tijd of in het meervoud/enkelvoud zet. Hier is dat <b>${esc(pv)}</b>.` };
  }
  if (q === 'ow' || q === 'lv' || q === 'mv') {
    const c = z.chunks.find((x) => x.role === q);
    const others = shuffle(z.chunks.filter((x) => x.role !== q && x.role !== 'pv')).map((x) => x.text);
    const how = {
      ow: `Vraag: wie of wat + persoonsvorm? Wie/wat ${z.chunks.find((x) => x.role === 'pv').text}? Het onderwerp is <b>${esc(c.text)}</b>.`,
      lv: `Vraag: wie of wat + gezegde + onderwerp? Het lijdend voorwerp is <b>${esc(c.text)}</b>.`,
      mv: `Het meewerkende voorwerp kun je vaak vragen met "aan wie" of "voor wie". Hier is dat <b>${esc(c.text)}</b>.`,
    }[q];
    return { level, prompt: `Wat is het <b>${ROLE_NAMES[q]}</b> in deze zin?<br>${zin}`, ...mc(c.text, others), explain: how };
  }
  if (q === 'wwg') {
    const pv = z.chunks.find((c) => c.role === 'pv').text;
    const wg = z.chunks.filter((c) => c.role === 'wg').map((c) => c.text).join(' ');
    const lv = z.chunks.find((c) => c.role === 'lv');
    return { level, prompt: `Wat is het <b>werkwoordelijk gezegde</b> in deze zin?<br>${zin}`, ...mc(`${pv} ${wg}`, [pv, wg, lv ? `${pv} ${lv.text} ${wg}` : `${z.chunks[0].text} ${pv}`]),
      explain: `Het werkwoordelijk gezegde bestaat uit alle werkwoorden in de zin: <b>${esc(pv)} ${esc(wg)}</b>.` };
  }
  const pos = q.slice(4);
  const cand = words.filter((w) => w.pos === pos);
  const w = pick(cand);
  if (Math.random() < 0.5) {
    const others = ['zn', 'ww', 'bn', 'lw', 'vnw', 'vz', 'tw'].filter((p) => p !== pos);
    return { level, prompt: `Welke woordsoort is het woord <b>${esc(w.t)}</b> in deze zin?<br>${zin}`, ...mc(POS_NAMES[pos], shuffle(others).slice(0, 3).map((p) => POS_NAMES[p])),
      explain: `<b>${esc(w.t)}</b> is een ${POS_NAMES[pos]}.` };
  }
  const others = shuffle(words.filter((x) => x.pos !== pos && x.pos !== 'bw')).map((x) => x.t);
  return { level: Math.round((level + 0.2) * 10) / 10, prompt: `Welk woord is een <b>${POS_NAMES[pos]}</b>?<br>${zin}`, ...mc(w.t, others), explain: `<b>${esc(w.t)}</b> is een ${POS_NAMES[pos]}.` };
}

// ===================== GOEDE ZINNEN =====================
const ZINSBOUW = [
  ['Mijn broer is groter dan ik.', 'Mijn broer is groter als ik.', 'Mijn broer is groter als mij.', 2.5, 'Na een vergrotende trap (groter, sneller) gebruik je "dan".'],
  ['Hij is even oud als zijn neef.', 'Hij is even oud dan zijn neef.', 'Hij is zo oud dan zijn neef.', 3, 'Bij "even" of "zo" gebruik je "als": even oud als.'],
  ['Het is mooier dan ik had gedacht.', 'Het is mooier als ik had gedacht.', 'Het is mooier wie ik had gedacht.', 3, 'Mooier is een vergrotende trap, dus "dan".'],
  ['Zij hebben de wedstrijd gewonnen.', 'Hun hebben de wedstrijd gewonnen.', 'Hen hebben de wedstrijd gewonnen.', 2.5, 'Als onderwerp gebruik je "zij", nooit "hun" of "hen".'],
  ['Ik ga met hen naar de film.', 'Ik ga met hun naar de film.', 'Ik ga met zij naar de film.', 4, 'Na een voorzetsel (met, voor, naar) gebruik je "hen".'],
  ['Het meisje dat naast mij zit, heet Noor.', 'Het meisje die naast mij zit, heet Noor.', 'Het meisje wat naast mij zit, heet Noor.', 3, 'Het meisje is een het-woord, dus "dat".'],
  ['De jongen die daar loopt, is mijn neef.', 'De jongen dat daar loopt, is mijn neef.', 'De jongen wie daar loopt, is mijn neef.', 2.5, 'De jongen is een de-woord, dus "die".'],
  ['Het boek dat ik lees, is spannend.', 'Het boek wat ik lees, is spannend.', 'Het boek die ik lees, is spannend.', 3.5, 'Het boek is een het-woord, dus "dat". "Wat" gebruik je na woorden als alles, iets en niets.'],
  ['De man met wie ik praatte, was aardig.', 'De man met die ik praatte, was aardig.', 'De man met wat ik praatte, was aardig.', 4, 'Na een voorzetsel gebruik je voor personen "wie": met wie.'],
  ['Omdat het regende, bleven we binnen.', 'Omdat het regende, we bleven binnen.', 'Omdat het regende bleven, we binnen.', 3, 'Na de bijzin komt eerst de persoonsvorm: ..., bleven we binnen.'],
  ['Ik weet niet of hij komt.', 'Ik weet niet als hij komt.', 'Ik weet niet of komt hij.', 3, 'Bij twijfel gebruik je "of", niet "als".'],
  ['Als het mooi weer is, gaan we naar het strand.', 'Of het mooi weer is, gaan we naar het strand.', 'Als het mooi weer is, we gaan naar het strand.', 3, '"Als" gebruik je bij een voorwaarde. Na de bijzin komt de persoonsvorm: gaan we.'],
  ['Het lijkt mij leuk om mee te gaan.', 'Het lijkt ik leuk om mee te gaan.', 'Het lijkt mijn leuk om mee te gaan.', 2, 'Hier gebruik je "mij" (of "me").'],
  ['Ik heb het aan hem gevraagd.', 'Ik heb het aan hij gevraagd.', 'Ik heb het aan zijn gevraagd.', 2, 'Na een voorzetsel gebruik je "hem".'],
  ['Die schoenen zijn van mij.', 'Die schoenen zijn van mijn.', 'Die schoenen zijn van ik.', 2, '"Van mij" is goed. "Mijn" moet altijd voor een zelfstandig naamwoord staan: mijn schoenen.'],
  ['Ik ben de hele dag thuis gebleven.', 'Ik heb de hele dag thuis gebleven.', 'Ik ben de hele dag thuis geblijfd.', 2.5, 'Bij blijven hoort het hulpwerkwoord "zijn": ik ben gebleven.'],
  ['De kinderen trokken hun jassen aan.', 'De kinderen trokken hen jassen aan.', 'De kinderen trokken zijn jassen aan.', 3, 'Voor een zelfstandig naamwoord (bezit) gebruik je "hun": hun jassen.'],
  ['Na het eten gingen we buiten spelen.', 'Na het eten we gingen buiten spelen.', 'Na het eten gingen buiten we spelen.', 2.5, 'Begint de zin met "Na het eten", dan volgt eerst de persoonsvorm: gingen we.'],
  ['Volgens mij is de winkel al dicht.', 'Volgens ik is de winkel al dicht.', 'Volgens mijn is de winkel al dicht.', 2, 'Na het voorzetsel "volgens" gebruik je "mij".'],
  ['Hoewel hij ziek was, ging hij toch naar school.', 'Hoewel hij was ziek, ging hij toch naar school.', 'Hoewel hij ziek was, hij ging toch naar school.', 3.5, 'In een bijzin staat de persoonsvorm achteraan: hoewel hij ziek was. Daarna volgt de persoonsvorm: ging hij.'],
  ['Er zijn veel mensen gekomen.', 'Er is veel mensen gekomen.', 'Er zijn veel mensen gekomt.', 3.5, 'Het onderwerp is "veel mensen" (meervoud), dus "zijn". Het voltooid deelwoord van komen is gekomen.'],
  ['Jij en ik gaan samen.', 'Jij en mij gaan samen.', 'Jou en ik gaan samen.', 3, 'Het onderwerp is "jij en ik".'],
  ['Ik zag hem en haar op het plein.', 'Ik zag hij en zij op het plein.', 'Ik zag hem en zij op het plein.', 3.5, 'Als lijdend voorwerp gebruik je "hem" en "haar".'],
  ['Ik heb niemand gezien.', 'Ik heb niet niemand gezien.', 'Ik heb geen niemand gezien.', 2.5, 'Eén ontkenning is genoeg: niemand.'],
  ['De auto van mijn vader is rood.', 'Mijn vader zijn auto is rood.', "Mijn vader's auto is rood.", 3, '"Mijn vader zijn auto" is spreektaal. In geschreven taal: de auto van mijn vader.'],
  ['Hij ging naar de winkel om brood te kopen.', 'Hij ging naar de winkel voor brood te kopen.', 'Hij ging naar de winkel om brood kopen.', 3.5, 'Bij een doel gebruik je "om ... te".'],
  ['Ik moet mijn huiswerk nog maken.', 'Ik moet mijn huiswerk nog maak.', 'Ik moet mijn huiswerk nog te maken.', 2.5, 'Na "moet" komt een heel werkwoord zonder "te": maken.'],
  ['Zullen we morgen afspreken?', 'Zal we morgen afspreken?', 'Zullen wij morgen afspreekt?', 2, 'Bij "we" hoort "zullen", en daarna het hele werkwoord: afspreken.'],
  ['Weet jij wie mijn pen heeft?', 'Weet jij die mijn pen heeft?', 'Weet jij wat mijn pen heeft?', 3, 'Vraag je naar een persoon, dan gebruik je "wie".'],
  ['Alles wat je zegt, klopt.', 'Alles die je zegt, klopt.', 'Alles wie je zegt, klopt.', 3.5, 'Na "alles", "iets" en "niets" gebruik je "wat".'],
  ['Ik heb hem gisteren mijn tekening laten zien.', 'Ik heb hij gisteren mijn tekening laten zien.', 'Ik heb hem gisteren mijn tekening laat zien.', 3, 'Na "hebben ... laten" komt een heel werkwoord: laten zien.'],
  ['Mijn zus en ik hebben samen gekookt.', 'Mijn zus en ik heeft samen gekookt.', 'Mijn zus en mij hebben samen gekookt.', 3.5, '"Mijn zus en ik" is meervoud, dus "hebben".'],
  ['Hij rende zo hard dat hij viel.', 'Hij rende zo hard als hij viel.', 'Hij rende zo hard dan hij viel.', 4, '"Zo ... dat" geeft een gevolg aan.'],
  ['Wij hebben gisteren met z\'n allen gevoetbald.', 'Wij hebben gisteren met z\'n allen gevoetbalt.', 'Wij heb gisteren met z\'n allen gevoetbald.', 3.5, 'Voetballen: stam voetbal, geen kofschipletter, dus gevoetbald. Bij "wij" hoort "hebben".'],
  ['Sanne vroeg of ik ook kwam.', 'Sanne vroeg als ik ook kwam.', 'Sanne vroeg of kwam ik ook.', 3.5, 'Bij een indirecte vraag gebruik je "of", en de persoonsvorm staat achteraan.'],
  ['De meeste kinderen vonden het een leuke les.', 'De meeste kinderen vond het een leuke les.', 'De meeste kinderen vonden het een leuk les.', 4, 'Het onderwerp is meervoud, dus "vonden". Les is een de-woord: een leuke les.'],
];

function bankItem(bank, row, kind) {
  const [good, w1, w2, level, uitleg] = row;
  const prompt = kind === 'spelling' ? 'Welk woord is goed geschreven?' : 'Welke zin is goed geschreven?';
  return { level, prompt, ...mc(good, [w1, w2]), explain: uitleg, key: `${kind}:${good}` };
}

export function pickFromBank(bank, target, seen, kind) {
  const ranked = bank.map((row, i) => ({ row, i, d: Math.abs(row[3] - target) + (seen.has(`${kind}:${row[0]}`) ? 3 : 0) + Math.random() * 0.6 }))
    .sort((a, b) => a.d - b.d);
  return bankItem(bank, ranked[0].row, kind);
}

export const TAAL = {
  'tv-ww': (target) => wwItem(target),
  'tv-spelling': (target, seen) => pickFromBank(SPELLING, target, seen, 'spelling'),
  'tv-interpunctie': (target, seen) => pickFromBank(INTERPUNCTIE, target, seen, 'interpunctie'),
  'tv-grammatica': (target) => grammaticaItem(target),
  'tv-zinsbouw': (target, seen) => pickFromBank(ZINSBOUW, target, seen, 'zinsbouw'),
};

export const BANK_SIZES = { spelling: SPELLING.length, interpunctie: INTERPUNCTIE.length, zinsbouw: ZINSBOUW.length, zinnen: ZINNEN.length };
export { WEAK, STRONG, parseZin, ZINNEN };
