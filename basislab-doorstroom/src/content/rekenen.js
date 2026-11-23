// Rekenopgaven: elke opgave wordt vers gemaakt, dus er is onbeperkt oefenstof.
// level: 1 = groep 6-niveau, 2 = op weg naar 1F, 3 = 1F, 4 = 1S, 5 = pittig 1S.
import {
  ri, pick, gcd, nl, euro2, round, mc, numDistractors, svgRect, svgL, svgBox, svgTriangle, svgStrip, svgPie,
  svgHundred, svgNumberLine, svgBars, svgLine, table, shuffle,
} from './util.js';

const num = (value, extra = {}) => ({ type: 'input', check: 'number', answer: nl(value), ...extra });
const NAMES = ['Sanne', 'Daan', 'Mila', 'Noah', 'Fatima', 'Liam', 'Yara', 'Sem', 'Noor', 'Milan', 'Aya', 'Luuk', 'Zoë', 'Bram', 'Ilse', 'Mehmet'];

// ===================== GETALLEN =====================
const getal = [
  { level: 1, make() {
    const n = ri(1200, 9800); const d = pick([10, 100, 1000]);
    return { prompt: `Welk getal is ${nl(d)} meer dan ${nl(n)}?`, ...num(n + d), explain: `${nl(n)} + ${nl(d)} = ${nl(n + d)}.` };
  } },
  { level: 1.5, make() {
    const n = ri(101, 989);
    const r = Math.round(n / 10) * 10;
    return { prompt: `Rond ${nl(n)} af op tientallen.`, ...num(r), explain: `Kijk naar de eenheden: ${n % 10} ${n % 10 >= 5 ? 'is 5 of meer, dus naar boven' : 'is minder dan 5, dus naar beneden'}. Het wordt ${nl(r)}.` };
  } },
  { level: 2, make() {
    const n = ri(10100, 98900);
    const r = Math.round(n / 1000) * 1000;
    return { prompt: `Rond ${nl(n)} af op duizendtallen.`, ...num(r), explain: `Kijk naar de honderdtallen: ${Math.floor((n % 1000) / 100)}. ${(n % 1000) >= 500 ? 'Dat is 5 of meer, dus naar boven.' : 'Dat is minder dan 5, dus naar beneden.'} Het wordt ${nl(r)}.` };
  } },
  { level: 2, make() {
    const [a, b, n] = pick([[0, 100, 10], [0, 1000, 10], [200, 300, 10], [0, 50, 10], [1000, 2000, 10], [0, 1, 10]]);
    const k = ri(1, n - 1);
    const v = round(a + ((b - a) / n) * k, 4);
    return { prompt: 'Welk getal hoort bij de pijl?', figure: svgNumberLine(a, b, n, k), ...num(v),
      explain: `De lijn loopt van ${nl(a)} tot ${nl(b)} in ${n} stappen. Elke stap is ${nl(round((b - a) / n, 4))}. De pijl staat bij stap ${k}: ${nl(v)}.` };
  } },
  { level: 2.5, make() {
    const t = ri(12, 98) * 100 + pick([0, 0, 50]);
    const unit = pick([['tientallen', 10], ['honderdtallen', 100]]);
    return { prompt: `Hoeveel ${unit[0]} zitten er in ${nl(t)}?`, ...num(t / unit[1]), explain: `${nl(t)} : ${unit[1]} = ${nl(t / unit[1])}.` };
  } },
  { level: 3, make() {
    const a = ri(11, 60) * 100; const b = a + ri(2, 20) * 200;
    return { prompt: `Welk getal ligt precies in het midden tussen ${nl(a)} en ${nl(b)}?`, ...num((a + b) / 2), explain: `Het verschil is ${nl(b - a)}. De helft daarvan is ${nl((b - a) / 2)}. ${nl(a)} + ${nl((b - a) / 2)} = ${nl((a + b) / 2)}.` };
  } },
  { level: 3, make() {
    const t = -ri(2, 12); const up = ri(4, 18);
    return { prompt: `Het is 's nachts ${nl(t)} °C. Overdag wordt het ${up} graden warmer. Hoe warm is het overdag?`, ...num(t + up, { unit: '°C' }), explain: `Van ${nl(t)} naar 0 is ${-t} graden. Er blijven ${up + t} graden over: het wordt ${nl(t + up)} °C.` };
  } },
  { level: 3.5, make() {
    const m = ri(2, 9); const th = ri(1, 9) * 10 + ri(0, 9);
    const value = m * 1_000_000 + th * 1000;
    const words = ['', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen'];
    const tens = ['', 'tien', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
    const teen = { 11: 'elf', 12: 'twaalf', 13: 'dertien', 14: 'veertien', 15: 'vijftien', 16: 'zestien', 17: 'zeventien', 18: 'achttien', 19: 'negentien' };
    const t = Math.floor(th / 10); const e = th % 10;
    const thWord = teen[th] || (e ? `${words[e]}${'aeiou'.includes(tens[t][0]) ? 'ën' : 'en'}${tens[t]}` : tens[t]);
    return { prompt: `Schrijf in cijfers: <b>${words[m]} miljoen ${thWord}duizend</b>.`, ...num(value), explain: `${words[m]} miljoen = ${nl(m * 1_000_000)} en ${thWord}duizend = ${nl(th * 1000)}. Samen ${nl(value)}.` };
  } },
  { level: 4, make() {
    const n = ri(1, 9) * 1_000_000 + ri(100, 999) * 1000 + ri(0, 999);
    const r = Math.round(n / 1_000_000) * 1_000_000;
    return { prompt: `Rond ${nl(n)} af op miljoenen.`, ...num(r), explain: `Kijk naar de honderdduizendtallen: ${Math.floor((n % 1_000_000) / 100000)}. Het wordt ${nl(r)}.` };
  } },
  { level: 4, make() {
    const a = -ri(3, 15); const b = ri(5, 25);
    if ((a + b) % 2) return getal[9].make();
    return { prompt: `Welk getal ligt precies in het midden tussen ${nl(a)} en ${nl(b)}?`, ...num((a + b) / 2), explain: `De afstand is ${b - a}. De helft is ${(b - a) / 2}. ${nl(a)} + ${(b - a) / 2} = ${nl((a + b) / 2)}.` };
  } },
  { level: 4.5, make() {
    const a = ri(20, 89) / 10; const k = ri(1, 9);
    const v = round(a + k / 100, 2);
    return { prompt: 'Welk getal hoort bij de pijl?', figure: svgNumberLine(a, round(a + 0.1, 1), 10, k), ...num(v),
      explain: `Tussen ${nl(a)} en ${nl(round(a + 0.1, 1))} zitten 10 stappen van 0,01. De pijl staat bij stap ${k}: ${nl(v)}.` };
  } },
  { level: 5, make() {
    const x = pick([1.5, 2.5, 3.2, 4.8, 0.6, 7.25]); const big = pick([['miljoen', 1e6], ['miljard', 1e9]]);
    return { prompt: `Schrijf als gewoon getal: <b>${nl(x)} ${big[0]}</b>.`, ...num(x * big[1]), explain: `${nl(x)} × ${nl(big[1])} = ${nl(x * big[1])}.` };
  } },
];

// ===================== BEWERKINGEN =====================
const bewerk = [
  { level: 1, make() {
    const a = ri(120, 780); const b = ri(110, 890 - (a % 100));
    return { prompt: `${nl(a)} + ${nl(b)} =`, ...num(a + b), explain: `${nl(a)} + ${nl(b)} = ${nl(a + b)}.` };
  } },
  { level: 1.5, make() {
    const a = ri(400, 999); const b = ri(105, a - 50);
    return { prompt: `${nl(a)} − ${nl(b)} =`, ...num(a - b), explain: `${nl(a)} − ${nl(b)} = ${nl(a - b)}. Controle: ${nl(a - b)} + ${nl(b)} = ${nl(a)}.` };
  } },
  { level: 2, make() {
    const [thing, per] = pick([['doos eieren', 12], ['krat flesjes', 24], ['pak koeken', 18], ['doos stiften', 15]]);
    const n = ri(6, 14);
    return { prompt: `In een ${thing} zitten ${per} stuks. Hoeveel stuks zitten er in ${n} keer zo'n ${thing.split(' ')[0]}?`, ...num(per * n), explain: `${n} × ${per} = ${nl(per * n)}.` };
  } },
  { level: 2, make() {
    const b = ri(3, 9); const q = ri(12, 60);
    return { prompt: `${nl(b * q)} : ${b} =`, ...num(q), explain: `${b} × ${q} = ${nl(b * q)}, dus ${nl(b * q)} : ${b} = ${q}.` };
  } },
  { level: 2.5, make() {
    const a = ri(13, 49); const b = ri(12, 38);
    return { prompt: `${a} × ${b} =`, ...num(a * b), explain: `${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10} = ${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${nl(a * b)}.` };
  } },
  { level: 3, make() {
    const per = pick([6, 8, 9, 12, 15]); const kids = ri(3, 12) * per + ri(1, per - 1);
    const need = Math.ceil(kids / per);
    return { prompt: `Er gaan ${kids} kinderen op schoolreis. In één busje passen ${per} kinderen. Hoeveel busjes zijn er minstens nodig?`, ...num(need),
      explain: `${kids} : ${per} = ${Math.floor(kids / per)} rest ${kids % per}. Voor de overgebleven ${kids % per} kinderen is nog een busje nodig: ${need} busjes.` };
  } },
  { level: 3, make() {
    const a = ri(2, 20); const b = ri(2, 9); const c = ri(2, 9);
    const op = pick(['+', '−']);
    const v = op === '+' ? a + b * c : a * 10 - b * c;
    const left = op === '+' ? a : a * 10;
    return { prompt: `${left} ${op} ${b} × ${c} =`, ...num(v), explain: `Eerst vermenigvuldigen: ${b} × ${c} = ${b * c}. Dan ${left} ${op} ${b * c} = ${v}.` };
  } },
  { level: 3.5, make() {
    const price = ri(3, 9) * 5 + 0.5 * ri(0, 1); const n = ri(3, 8); const pay = Math.ceil((price * n + 1) / 50) * 50;
    const name = pick(NAMES);
    return { prompt: `${name} koopt ${n} kaartjes van ${euro2(price)} en betaalt met ${euro2(pay)}. Hoeveel geld krijgt ${name} terug?`, ...num(round(pay - price * n, 2), { unit: '€' }),
      explain: `${n} × ${euro2(price)} = ${euro2(price * n)}. ${euro2(pay)} − ${euro2(price * n)} = ${euro2(pay - price * n)}.` };
  } },
  { level: 4, make() {
    const a = ri(102, 489); const b = ri(21, 78);
    const v = a * b;
    return { prompt: `${nl(a)} × ${b} =`, ...num(v), explain: `${nl(a)} × ${b} = ${nl(a * Math.floor(b / 10) * 10)} + ${nl(a * (b % 10))} = ${nl(v)}.` };
  } },
  { level: 4, make() {
    const d = ri(12, 25); const q = ri(21, 89);
    return { prompt: `${nl(d * q)} : ${d} =`, ...num(q), explain: `Probeer: ${d} × ${q} = ${nl(d * q)}. Dus het antwoord is ${q}.` };
  } },
  { level: 4.5, make() {
    const a = ri(39, 91) * 10 - 2; const b = ri(19, 61) * 10 + 1;
    const est = Math.round(a / 100) * 100 * Math.round(b / 10) * 10;
    const opts = [est, est * 10, Math.round(est / 10), est + Math.round(a / 100) * 100 * 10];
    return { prompt: `Welke schatting van ${nl(a)} × ${nl(b)} is het best?`, ...mc(nl(est), opts.slice(1).map((o) => nl(o))),
      explain: `${nl(a)} is ongeveer ${nl(Math.round(a / 100) * 100)} en ${nl(b)} is ongeveer ${nl(Math.round(b / 10) * 10)}. Samen ongeveer ${nl(est)}.` };
  } },
  { level: 5, make() {
    const per = ri(3, 6); const days = pick([5, 7]); const weeks = ri(6, 12); const people = ri(18, 30);
    const v = per * days * weeks * people;
    return { prompt: `In een klas van ${people} kinderen leest ieder kind ${days} dagen per week ${per} bladzijden. Hoeveel bladzijden lezen ze samen in ${weeks} weken?`, ...num(v),
      explain: `Per kind per week: ${days} × ${per} = ${days * per}. In ${weeks} weken: ${days * per * weeks}. Voor ${people} kinderen: ${nl(v)}.` };
  } },
];

// ===================== BREUKEN =====================
const fracStr = (a, b) => `${a}/${b}`;
const simp = (a, b) => { const g = gcd(a, b); return [a / g, b / g]; };
const breuk = [
  { level: 1, make() {
    const n = pick([3, 4, 5, 6, 8]); const k = ri(1, n - 1);
    const fig = Math.random() < 0.5 ? svgStrip(n, k) : svgPie(n, k);
    return { prompt: 'Welk deel is gekleurd? Schrijf als breuk, bijvoorbeeld 2/5.', figure: fig, type: 'input', check: 'fraction', answer: fracStr(k, n), explain: `Er zijn ${n} gelijke delen en ${k} daarvan zijn gekleurd: ${k}/${n}.` };
  } },
  { level: 1.5, make() {
    const d = pick([2, 3, 4, 5, 10]); const q = ri(3, 12);
    return { prompt: `1/${d} deel van ${d * q} is`, ...num(q), explain: `1/${d} deel van ${d * q} = ${d * q} : ${d} = ${q}.` };
  } },
  { level: 2, make() {
    const d = pick([3, 4, 5, 6, 8]); const k = ri(2, d - 1); const q = ri(3, 12);
    return { prompt: `${k}/${d} deel van ${d * q} is`, ...num(k * q), explain: `1/${d} van ${d * q} is ${q}. Dan is ${k}/${d} deel ${k} × ${q} = ${k * q}.` };
  } },
  { level: 2.5, make() {
    const pairs = [['2/3', '3/5'], ['3/4', '2/3'], ['1/2', '3/8'], ['5/6', '7/8'], ['2/5', '1/3'], ['3/10', '1/4'], ['4/5', '3/4']];
    const [a, b] = pick(pairs);
    const val = (f) => { const [x, y] = f.split('/').map(Number); return x / y; };
    const va = val(a); const vb = val(b);
    const big = va > vb ? a : b;
    return { prompt: `Welke breuk is het grootst: <b>${a}</b> of <b>${b}</b>?`, ...mc(big, [va > vb ? b : a, 'Ze zijn even groot']),
      explain: `${a} ≈ ${nl(round(va, 2))} en ${b} ≈ ${nl(round(vb, 2))}. ${big} is het grootst.` };
  } },
  { level: 2.5, make() {
    const [k, d, m] = pick([[3, 4, 60], [1, 4, 60], [2, 3, 60], [1, 3, 60], [3, 4, 100], [1, 5, 100], [2, 5, 1000], [3, 4, 1000]]);
    const what = { 60: ['uur', 'minuten'], 100: ['meter', 'centimeter'], 1000: ['kilo', 'gram'] }[m];
    return { prompt: `Hoeveel ${what[1]} is ${k}/${d} ${what[0]}?`, ...num((k * m) / d, { unit: what[1] }), explain: `1 ${what[0]} = ${m} ${what[1]}. ${m} : ${d} × ${k} = ${(k * m) / d}.` };
  } },
  { level: 3, make() {
    const d = pick([6, 8, 9, 10, 12, 15, 16, 20]); const k = pick([...Array(d - 1).keys()].map((x) => x + 1).filter((x) => gcd(x, d) > 1));
    const [a, b] = simp(k, d);
    return { prompt: `Vereenvoudig de breuk <b>${k}/${d}</b> zo ver als het kan.`, type: 'input', check: 'fraction-simple', answer: fracStr(a, b), explain: `Deel boven en onder door ${gcd(k, d)}: ${k}/${d} = ${a}/${b}.` };
  } },
  { level: 3, make() {
    const [a, b, c, d] = pick([[1, 2, 1, 4], [1, 4, 1, 8], [1, 3, 1, 6], [1, 2, 1, 8], [3, 4, 1, 8], [2, 5, 1, 10], [1, 2, 3, 10]]);
    const den = (b * d) / gcd(b, d); const nu = a * (den / b) + c * (den / d);
    const [x, y] = simp(nu, den);
    return { prompt: `${a}/${b} + ${c}/${d} =`, type: 'input', check: 'fraction', answer: fracStr(x, y), explain: `Maak de noemers gelijk: ${a * (den / b)}/${den} + ${c * (den / d)}/${den} = ${nu}/${den}${nu / den !== x / y || nu !== x ? ` = ${x}/${y}` : ''}.` };
  } },
  { level: 3.5, make() {
    const [n, d] = pick([[1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [7, 10], [1, 20], [3, 20]]);
    return { prompt: `Schrijf <b>${n}/${d}</b> als kommagetal.`, ...num(n / d), explain: `${n} : ${d} = ${nl(n / d)}.` };
  } },
  { level: 4, make() {
    const [a, b, c, d] = pick([[2, 3, 1, 4], [1, 2, 2, 5], [3, 4, 1, 6], [2, 3, 1, 5], [5, 6, 1, 4], [3, 5, 1, 3]]);
    const den = (b * d) / gcd(b, d); const nu = a * (den / b) + c * (den / d);
    const [x, y] = simp(nu, den);
    const show = x > y ? `${x}/${y} (of ${Math.floor(x / y)} ${x % y}/${y})` : `${x}/${y}`;
    return { prompt: `${a}/${b} + ${c}/${d} =`, type: 'input', check: 'fraction', answer: fracStr(x, y), explain: `Gelijke noemers (${den}): ${a * (den / b)}/${den} + ${c * (den / d)}/${den} = ${show}.` };
  } },
  { level: 4, make() {
    const [w, a, b] = pick([[1, 1, 2], [2, 1, 4], [1, 3, 4], [2, 1, 2], [1, 1, 4]]); const m = ri(2, 6);
    const v = (w + a / b) * m;
    return { prompt: `${w} ${a}/${b} × ${m} =`, ...num(v), explain: `${w} × ${m} = ${w * m} en ${a}/${b} × ${m} = ${nl((a / b) * m)}. Samen ${nl(v)}.` };
  } },
  { level: 4.5, make() {
    const [k, d] = pick([[2, 5], [3, 4], [2, 3], [3, 5], [5, 8]]); const part = k * ri(2, 8);
    const total = (part / k) * d;
    return { prompt: `${k}/${d} deel van de kinderen in groep 8 fietst naar school. Dat zijn ${part} kinderen. Hoeveel kinderen zitten er in groep 8?`, ...num(total),
      explain: `${k}/${d} is ${part} kinderen, dus 1/${d} is ${part} : ${k} = ${part / k}. Het geheel (${d}/${d}) is ${d} × ${part / k} = ${total}.` };
  } },
  { level: 5, make() {
    const [a, b, c] = pick([[3, 4, 8], [1, 2, 6], [2, 3, 6], [1, 2, 10], [3, 5, 10]]);
    const v = (a / b) / (1 / c);
    return { prompt: `Hoeveel keer past 1/${c} in ${a}/${b}?`, ...num(v), explain: `${a}/${b} = ${(a * c) / b}/${c}. Daar past 1/${c} dus ${nl(v)} keer in.` };
  } },
];

// ===================== KOMMAGETALLEN =====================
const komma = [
  { level: 1.5, make() {
    const a = pick([0.5, 0.25, 0.75, 1.5, 2.5]); const b = pick([0.25, 0.5, 0.75, 1.25]);
    return { prompt: `${nl(a)} + ${nl(b)} =`, ...num(round(a + b, 2)), explain: `${nl(a)} + ${nl(b)} = ${nl(round(a + b, 2))}.` };
  } },
  { level: 2, make() {
    const sets = [[0.7, 0.65, 0.09, 0.612], [2.5, 2.45, 2.405, 2.09], [0.8, 0.75, 0.799, 0.08], [3.1, 3.09, 3.099, 3.01], [1.2, 1.19, 1.109, 1.02]];
    const s = pick(sets);
    return { prompt: 'Welk getal is het grootst?', ...mc(nl(s[0]), s.slice(1).map((x) => nl(x))), explain: `Vergelijk eerst de cijfers voor de komma, dan de tienden, dan de honderdsten. ${nl(s[0])} is het grootst.` };
  } },
  { level: 2.5, make() {
    const a = ri(11, 89) / 10; const b = ri(105, 499) / 100;
    return { prompt: `${nl(a)} + ${nl(b)} =`, ...num(round(a + b, 2)), explain: `Zet de komma's onder elkaar: ${nl(a, 2)} + ${nl(b, 2)} = ${nl(round(a + b, 2))}.` };
  } },
  { level: 2.5, make() {
    const a = ri(105, 999) / 100; const f = pick([10, 100, 1000]);
    const div = Math.random() < 0.4;
    return { prompt: div ? `${nl(a * 100)} : ${f} =` : `${nl(a)} × ${nl(f)} =`, ...num(div ? round((a * 100) / f, 4) : round(a * f, 4)),
      explain: div ? `Delen door ${f}: de komma ${Math.log10(f)} plaats(en) naar links.` : `Keer ${f}: de komma ${Math.log10(f)} plaats(en) naar rechts.` };
  } },
  { level: 3, make() {
    const a = ri(105, 495) / 100; const m = ri(3, 8);
    return { prompt: `${m} × ${nl(a)} =`, ...num(round(a * m, 2)), explain: `${m} × ${nl(Math.floor(a))} = ${m * Math.floor(a)} en ${m} × ${nl(round(a - Math.floor(a), 2))} = ${nl(round(m * (a - Math.floor(a)), 2))}. Samen ${nl(round(a * m, 2))}.` };
  } },
  { level: 3, make() {
    const d = ri(3, 6); const q = ri(11, 49) / 10;
    return { prompt: `${nl(round(d * q, 2))} : ${d} =`, ...num(q), explain: `${d} × ${nl(q)} = ${nl(round(d * q, 2))}, dus het antwoord is ${nl(q)}.` };
  } },
  { level: 3.5, make() {
    const items = [['een liter melk', 1.15], ['een brood', 2.39], ['een zak appels', 2.79], ['een pak sap', 1.89], ['een tijdschrift', 4.95], ['een stuk kaas', 3.49]];
    const [a, b] = shuffle(items);
    const pay = Math.ceil(a[1] + b[1] + 1);
    const back = round(pay - a[1] - b[1], 2);
    return { prompt: `${pick(NAMES)} koopt ${a[0]} van ${euro2(a[1])} en ${b[0]} van ${euro2(b[1])}. ${pay === 10 ? 'Er wordt betaald met een briefje van € 10,-.' : `Er wordt betaald met € ${pay},-.`} Hoeveel geld krijg je terug?`, ...num(back, { unit: '€' }),
      explain: `${euro2(a[1])} + ${euro2(b[1])} = ${euro2(a[1] + b[1])}. € ${pay},- − ${euro2(a[1] + b[1])} = ${euro2(back)}.` };
  } },
  { level: 4, make() {
    const a = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8]); const b = pick([0.2, 0.4, 0.5, 0.7, 0.9]);
    return { prompt: `${nl(a)} × ${nl(b)} =`, ...num(round(a * b, 3)), explain: `${nl(a * 10)} × ${nl(b * 10)} = ${round(a * b * 100, 0)}. Er staan samen 2 cijfers achter de komma: ${nl(round(a * b, 3))}.` };
  } },
  { level: 4, make() {
    const a = ri(2, 30); const b = pick([0.5, 0.25, 0.1]);
    return { prompt: `${a} : ${nl(b)} =`, ...num(round(a / b, 4)), explain: `Hoe vaak past ${nl(b)} in ${a}? In 1 past het ${nl(1 / b)} keer, dus in ${a} past het ${nl(round(a / b, 4))} keer.` };
  } },
  { level: 4.5, make() {
    const kg = ri(12, 38) / 10 + pick([0, 0.05]); const per = ri(149, 699) / 100;
    const v = round(kg * per, 2);
    return { prompt: `Kaas kost ${euro2(per)} per kilo. Hoeveel kost ${nl(kg)} kilo kaas? Rond af op centen.`, ...num(v, { unit: '€' }),
      explain: `${nl(kg)} × ${euro2(per)} = ${euro2(v)}.` };
  } },
  { level: 5, make() {
    const a = pick([1.25, 2.5, 0.75, 1.5]); const b = pick([0.8, 0.4, 0.6, 1.2]);
    return { prompt: `${nl(a)} × ${nl(b)} =`, ...num(round(a * b, 4)), explain: `${nl(a)} × ${nl(b)} = ${nl(round(a * b, 4))}.` };
  } },
];

// ===================== PROCENTEN =====================
const procent = [
  { level: 1.5, make() {
    const k = ri(5, 95);
    return { prompt: 'Hoeveel procent van het honderdveld is gekleurd?', figure: svgHundred(k), ...num(k, { unit: '%' }), explain: `Er zijn 100 vakjes en ${k} zijn gekleurd: ${k}%.` };
  } },
  { level: 2, make() {
    const [p, frac] = pick([[50, 2], [25, 4], [10, 10], [20, 5]]); const n = frac * ri(3, 30);
    return { prompt: `${p}% van ${n} is`, ...num(n / frac), explain: `${p}% is 1/${frac} deel. ${n} : ${frac} = ${n / frac}.` };
  } },
  { level: 2.5, make() {
    const price = ri(4, 24) * 5; const p = pick([10, 20, 25, 50]);
    return { prompt: `Een spel kost ${euro2(price)}. Je krijgt ${p}% korting. Hoeveel euro korting krijg je?`, ...num(round((price * p) / 100, 2), { unit: '€' }), explain: `${p}% van ${euro2(price)} = ${euro2((price * p) / 100)}.` };
  } },
  { level: 3, make() {
    const price = ri(4, 24) * 4; const p = pick([25, 50, 75, 10, 20]);
    const v = round(price - (price * p) / 100, 2);
    return { prompt: `Een jas kost ${euro2(price)}. In de uitverkoop krijg je ${p}% korting. Wat betaal je?`, ...num(v, { unit: '€' }), explain: `Korting: ${p}% van ${euro2(price)} = ${euro2((price * p) / 100)}. Je betaalt ${euro2(price)} − ${euro2((price * p) / 100)} = ${euro2(v)}.` };
  } },
  { level: 3, make() {
    const total = pick([20, 25, 50, 40]); const part = pick([...Array(total).keys()].filter((x) => x > 0 && ((x * 100) / total) % 5 === 0));
    return { prompt: `In een klas zitten ${total} kinderen. Er zijn er ${part} op de fiets gekomen. Hoeveel procent van de kinderen kwam op de fiets?`, ...num((part * 100) / total, { unit: '%' }),
      explain: `${part} van de ${total} = ${part}/${total} = ${(part * 100) / total}/100 = ${(part * 100) / total}%.` };
  } },
  { level: 3.5, make() {
    const n = ri(12, 96) * 10; const p = pick([5, 15, 30, 40, 60, 70]);
    return { prompt: `${p}% van ${nl(n)} is`, ...num((n * p) / 100), explain: `10% van ${nl(n)} is ${nl(n / 10)}. ${p}% is ${p / 10} × ${nl(n / 10)} = ${nl((n * p) / 100)}.` };
  } },
  { level: 4, make() {
    const price = ri(4, 16) * 10; const p = pick([10, 15, 20, 30]);
    const v = round(price * (1 + p / 100), 2);
    return { prompt: `Een fiets kost ${euro2(price)}. De prijs gaat met ${p}% omhoog. Wat is de nieuwe prijs?`, ...num(v, { unit: '€' }), explain: `${p}% van ${euro2(price)} = ${euro2((price * p) / 100)}. Nieuwe prijs: ${euro2(v)}.` };
  } },
  { level: 4, make() {
    const total = pick([40, 48, 60, 80, 120, 150, 200]); const p = pick([5, 10, 15, 20, 25, 30, 40, 75]);
    const part = (total * p) / 100;
    if (!Number.isInteger(part)) return procent[7].make();
    return { prompt: `Van de ${total} leerlingen gaan er ${part} naar de havo. Hoeveel procent is dat?`, ...num(p, { unit: '%' }), explain: `${part} : ${total} = ${nl(part / total)} = ${p}%.` };
  } },
  { level: 4.5, make() {
    const oldP = ri(3, 12) * 10; const p = pick([10, 20, 25, 40]);
    const now = round(oldP * (1 - p / 100), 2);
    return { prompt: `Na ${p}% korting kost een paar schoenen nog ${euro2(now)}. Wat was de prijs zonder korting?`, ...num(oldP, { unit: '€' }),
      explain: `${euro2(now)} is ${100 - p}% van de oude prijs. 1% is ${euro2(now / (100 - p))}, dus 100% is ${euro2(oldP)}.` };
  } },
  { level: 5, make() {
    const a = pick([40, 50, 80, 120, 200, 250]); const p = pick([10, 20, 25, 50, 75]);
    const b = a * (1 + p / 100);
    return { prompt: `Vorig jaar kwamen er ${a} bezoekers op de schoolmusical, dit jaar ${nl(b)}. Met hoeveel procent is het aantal bezoekers gestegen?`, ...num(p, { unit: '%' }),
      explain: `De toename is ${nl(b - a)}. ${nl(b - a)} van de ${a} = ${p}%.` };
  } },
];

// ===================== VERHOUDINGEN =====================
const verhouding = [
  { level: 1.5, make() {
    const n = ri(2, 4); const price = round(n * (0.9 + ri(1, 6) * 0.1), 2); const m = n * pick([2, 3]);
    const per = round(price / n, 2);
    return { prompt: `${n} pakken melk kosten samen ${euro2(price)}. Wat kosten ${m} pakken?`, figure: table(['pakken', n, m], [['prijs', euro2(price), '?']]),
      ...num(round(per * m, 2), { unit: '€' }), explain: `${m} is ${m / n} keer ${n}. Dus ${m / n} × ${euro2(price)} = ${euro2(per * m)}.` };
  } },
  { level: 2, make() {
    const persons = pick([4, 6]); const to = persons === 4 ? pick([8, 12, 2]) : pick([3, 9, 12]);
    const [ing, per, unit] = pick([['bloem', 50, 'gram'], ['melk', 100, 'ml'], ['suiker', 15, 'gram'], ['boter', 20, 'gram']]);
    const amount = per * persons;
    return { prompt: `Voor pannenkoeken voor ${persons} personen heb je ${amount} ${unit} ${ing} nodig. Hoeveel ${unit} ${ing} heb je nodig voor ${to} personen?`, ...num((amount / persons) * to, { unit }),
      explain: `Voor 1 persoon: ${amount} : ${persons} = ${nl(amount / persons)} ${unit}. Voor ${to} personen: ${nl((amount / persons) * to)} ${unit}.` };
  } },
  { level: 2.5, make() {
    const cm = ri(2, 9); const scale = pick([100, 50, 200]);
    const m = (cm * scale) / 100;
    return { prompt: `Op een plattegrond met schaal 1 : ${scale} is een muur ${cm} cm lang. Hoe lang is de muur in het echt, in meter?`, ...num(m, { unit: 'm' }),
      explain: `1 cm op de kaart is ${scale} cm in het echt. ${cm} × ${scale} cm = ${cm * scale} cm = ${nl(m)} m.` };
  } },
  { level: 3, make() {
    const [a, b] = pick([[2, 3], [1, 3], [3, 4], [2, 5], [1, 4]]); const k = ri(3, 7);
    const total = (a + b) * k;
    return { prompt: `In een klas is de verhouding jongens : meisjes = ${a} : ${b}. Er zitten ${total} kinderen in de klas. Hoeveel meisjes zijn er?`, ...num(b * k),
      explain: `${a} + ${b} = ${a + b} delen. ${total} : ${a + b} = ${k} kinderen per deel. Meisjes: ${b} × ${k} = ${b * k}.` };
  } },
  { level: 3.5, make() {
    const kmh = pick([12, 15, 18, 20, 24, 30, 60, 80, 90]); const min = pick([10, 15, 20, 30, 40, 45]);
    const km = (kmh * min) / 60;
    if (!Number.isInteger(km * 2)) return verhouding[4].make();
    return { prompt: `Een ${kmh >= 60 ? 'auto' : 'fietser'} rijdt ${kmh} km per uur. Hoeveel kilometer legt ${kmh >= 60 ? 'de auto' : 'de fietser'} af in ${min} minuten?`, ...num(km, { unit: 'km' }),
      explain: `${min} minuten is ${nl(min / 60)} uur. ${nl(min / 60)} × ${kmh} = ${nl(km)} km.` };
  } },
  { level: 4, make() {
    const km = pick([20, 30, 45, 15, 40]); const min = pick([30, 45, 20, 40]);
    const v = (km / min) * 60;
    if (!Number.isInteger(v * 2)) return verhouding[5].make();
    return { prompt: `Een trein rijdt ${km} km in ${min} minuten. Wat is de gemiddelde snelheid in km per uur?`, ...num(v, { unit: 'km/u' }),
      explain: `In 1 minuut ${nl(km / min)} km. In 60 minuten: ${nl(v)} km. Dat is ${nl(v)} km per uur.` };
  } },
  { level: 4, make() {
    const a = [pick([250, 300, 500]), round(ri(80, 160) / 100, 2)];
    const b = [a[0] * 2, round(a[1] * 2 * pick([0.85, 0.9, 1.1, 1.15]), 2)];
    const cheaper = b[1] / b[0] < a[1] / a[0] ? 'B' : 'A';
    return { prompt: `Welk pak hagelslag is het voordeligst?<br>A: ${a[0]} gram voor ${euro2(a[1])}<br>B: ${b[0]} gram voor ${euro2(b[1])}`,
      ...mc(`Pak ${cheaper}`, [`Pak ${cheaper === 'A' ? 'B' : 'A'}`, 'Ze zijn even duur'], { keepOrder: false }),
      explain: `Twee pakken A (${b[0]} gram) kosten ${euro2(a[1] * 2)}. Pak B kost ${euro2(b[1])}. Pak ${cheaper} is voordeliger.` };
  } },
  { level: 4.5, make() {
    const scale = pick([25000, 50000, 10000, 20000]); const cm = ri(2, 9);
    const km = (cm * scale) / 100000;
    return { prompt: `Op een wandelkaart met schaal 1 : ${nl(scale)} is een route ${cm} cm lang. Hoeveel kilometer is de route in het echt?`, ...num(km, { unit: 'km' }),
      explain: `1 cm is ${nl(scale)} cm = ${nl(scale / 100000)} km. ${cm} × ${nl(scale / 100000)} = ${nl(km)} km.` };
  } },
  { level: 5, make() {
    const lim = pick([[1, 4], [1, 5], [2, 7], [1, 6]]); const total = (lim[0] + lim[1]) * pick([0.25, 0.3, 0.5]) * 1000;
    const syr = (total * lim[0]) / (lim[0] + lim[1]);
    return { prompt: `Ranja maak je met siroop en water in de verhouding ${lim[0]} : ${lim[1]}. Je wilt ${nl(total)} ml ranja maken. Hoeveel ml siroop heb je nodig?`, ...num(syr, { unit: 'ml' }),
      explain: `Er zijn ${lim[0] + lim[1]} delen. Eén deel is ${nl(total)} : ${lim[0] + lim[1]} = ${nl(total / (lim[0] + lim[1]))} ml. Siroop: ${lim[0]} × ${nl(total / (lim[0] + lim[1]))} = ${nl(syr)} ml.` };
  } },
];

// ===================== METEN EN TIJD =====================
const tm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const meten = [
  { level: 1, make() {
    const m = pick([1.5, 2.5, 3, 0.5, 1.25, 4.75]);
    return { prompt: `Hoeveel centimeter is ${nl(m)} meter?`, ...num(m * 100, { unit: 'cm' }), explain: `1 meter = 100 cm. ${nl(m)} × 100 = ${nl(m * 100)} cm.` };
  } },
  { level: 1.5, make() {
    const start = ri(8, 16) * 60 + pick([0, 15, 30, 45]); const d = pick([45, 30, 75, 90, 105]);
    return { prompt: `De film begint om ${tm(start)} en duurt ${d} minuten. Hoe laat is de film afgelopen?`, type: 'input', check: 'time', answer: tm(start + d),
      explain: `${tm(start)} + ${d} minuten = ${tm(start + d)}.` };
  } },
  { level: 2, make() {
    const [v, from, to, f] = pick([[1.5, 'kilo', 'gram', 1000], [2.25, 'kilo', 'gram', 1000], [0.75, 'liter', 'ml', 1000], [1.5, 'liter', 'dl', 10], [3.5, 'km', 'meter', 1000], [0.25, 'kilo', 'gram', 1000]]);
    return { prompt: `Hoeveel ${to} is ${nl(v)} ${from}?`, ...num(v * f, { unit: to }), explain: `1 ${from} = ${nl(f)} ${to}. ${nl(v)} × ${nl(f)} = ${nl(v * f)} ${to}.` };
  } },
  { level: 2.5, make() {
    const a = ri(7, 10) * 60 + ri(0, 59); const d = ri(55, 150);
    return { prompt: `De trein vertrekt om ${tm(a)} en komt aan om ${tm(a + d)}. Hoeveel minuten duurt de reis?`, ...num(d, { unit: 'minuten' }),
      explain: `Van ${tm(a)} tot ${tm(a + d)} is ${Math.floor(d / 60)} uur en ${d % 60} minuten = ${d} minuten.` };
  } },
  { level: 3, make() {
    const [v, from, to, f] = pick([[2500, 'meter', 'km', 0.001], [750, 'gram', 'kilo', 0.001], [350, 'ml', 'liter', 0.001], [45, 'cm', 'meter', 0.01], [125, 'cl', 'liter', 0.01], [4, 'dl', 'liter', 0.1]]);
    return { prompt: `Hoeveel ${to} is ${nl(v)} ${from}?`, ...num(round(v * f, 4), { unit: to }), explain: `${nl(v)} ${from} = ${nl(round(v * f, 4))} ${to}.` };
  } },
  { level: 3, make() {
    const days = ri(2, 5); const hours = ri(1, 23);
    return { prompt: `Hoeveel uur is ${days} dagen en ${hours} uur?`, ...num(days * 24 + hours, { unit: 'uur' }), explain: `${days} × 24 = ${days * 24} uur. Plus ${hours} is ${days * 24 + hours} uur.` };
  } },
  { level: 3.5, make() {
    const pick2 = pick([['m²', 'cm²', 10000, [1, 2, 3, 0.5]], ['ha', 'm²', 10000, [1, 2, 0.5, 3]], ['dm³', 'liter', 1, [2, 5, 0.75]], ['m³', 'liter', 1000, [1, 2, 0.5]], ['cm³', 'ml', 1, [250, 330]]]);
    const v = pick(pick2[3]);
    return { prompt: `Hoeveel ${pick2[1]} is ${nl(v)} ${pick2[0]}?`, ...num(v * pick2[2], { unit: pick2[1] }), explain: `1 ${pick2[0]} = ${nl(pick2[2])} ${pick2[1]}. ${nl(v)} ${pick2[0]} = ${nl(v * pick2[2])} ${pick2[1]}.` };
  } },
  { level: 4, make() {
    const km = ri(1, 3) + ri(1, 9) / 10; const m = ri(1, 9) * 50; const dm = ri(1, 9) * 10;
    const v = km * 1000 + m + dm / 10;
    return { prompt: `${nl(km)} km + ${m} m + ${dm} dm = ... meter`, ...num(round(v, 2), { unit: 'm' }), explain: `${nl(km)} km = ${nl(km * 1000)} m en ${dm} dm = ${dm / 10} m. Samen ${nl(round(v, 2))} m.` };
  } },
  { level: 4, make() {
    const d = ri(80, 260); const start = ri(7, 13) * 60 + ri(0, 3) * 15;
    return { prompt: `Een busreis duurt ${Math.floor(d / 60)} uur en ${d % 60} minuten. De bus moet om ${tm(start + d)} aankomen. Hoe laat moet de bus vertrekken?`, type: 'input', check: 'time', answer: tm(start),
      explain: `Reken terug: ${tm(start + d)} − ${Math.floor(d / 60)} uur en ${d % 60} minuten = ${tm(start)}.` };
  } },
  { level: 4.5, make() {
    const ton = pick([1.2, 2.5, 3.2, 0.8, 4.05]);
    return { prompt: `Een olifant weegt ${nl(ton)} ton. Hoeveel kilo is dat?`, ...num(ton * 1000, { unit: 'kg' }), explain: `1 ton = 1.000 kg. ${nl(ton)} × 1.000 = ${nl(ton * 1000)} kg.` };
  } },
  { level: 5, make() {
    const l = pick([2, 3, 4]); const b = pick([1, 1.5, 2]); const h = pick([0.5, 1, 1.5]);
    const liters = l * b * h * 1000;
    return { prompt: `Een zwembadje is ${l} m lang, ${nl(b)} m breed en wordt ${nl(h * 100)} cm hoog gevuld met water. Hoeveel liter water is dat?`, ...num(liters, { unit: 'liter' }),
      explain: `${l} × ${nl(b)} × ${nl(h)} = ${nl(l * b * h)} m³. 1 m³ = 1.000 liter, dus ${nl(liters)} liter.` };
  } },
];

// ===================== MEETKUNDE =====================
const meetkunde = [
  { level: 1, make() {
    const w = ri(3, 12); const h = ri(2, 9);
    return { prompt: 'Wat is de omtrek van deze rechthoek?', figure: svgRect(w, h, `${w} cm`, `${h} cm`), ...num(2 * (w + h), { unit: 'cm' }),
      explain: `Omtrek = alle zijden bij elkaar: ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm.` };
  } },
  { level: 1.5, make() {
    const w = ri(3, 12); const h = ri(2, 9);
    return { prompt: 'Wat is de oppervlakte van deze rechthoek?', figure: svgRect(w, h, `${w} m`, `${h} m`), ...num(w * h, { unit: 'm²' }),
      explain: `Oppervlakte = lengte × breedte = ${w} × ${h} = ${w * h} m².` };
  } },
  { level: 2.5, make() {
    const s = ri(3, 15);
    return { prompt: `Een vierkant heeft een omtrek van ${4 * s} cm. Hoe lang is één zijde?`, ...num(s, { unit: 'cm' }), explain: `Een vierkant heeft 4 gelijke zijden: ${4 * s} : 4 = ${s} cm.` };
  } },
  { level: 3, make() {
    const a = ri(6, 12); const b = ri(5, 10); const c = ri(2, a - 3); const d = ri(2, b - 2);
    const v = a * b - c * d;
    return { prompt: 'Wat is de oppervlakte van deze figuur?', figure: svgL(a, b, c, d, 'm'), ...num(v, { unit: 'm²' }),
      explain: `Hele rechthoek: ${a} × ${b} = ${a * b} m². Het hoekje dat weg is: ${c} × ${d} = ${c * d} m². ${a * b} − ${c * d} = ${v} m².` };
  } },
  { level: 3, make() {
    const l = ri(3, 10); const b = ri(2, 6); const h = ri(2, 8);
    return { prompt: 'Hoeveel kubusjes van 1 cm³ passen er in deze balk?', figure: svgBox(l, b, h, 'cm'), ...num(l * b * h, { unit: 'cm³' }),
      explain: `Inhoud = lengte × breedte × hoogte = ${l} × ${b} × ${h} = ${l * b * h} cm³.` };
  } },
  { level: 3.5, make() {
    const a = ri(30, 80); const b = ri(30, 150 - a - 10);
    return { prompt: `In een driehoek zijn twee hoeken ${a}° en ${b}°. Hoe groot is de derde hoek?`, ...num(180 - a - b, { unit: '°' }),
      explain: `De hoeken van een driehoek zijn samen 180°. 180 − ${a} − ${b} = ${180 - a - b}°.` };
  } },
  { level: 4, make() {
    const base = ri(4, 14); const h = ri(3, 10);
    if ((base * h) % 2) return meetkunde[6].make();
    return { prompt: 'Wat is de oppervlakte van deze driehoek?', figure: svgTriangle(base, h, 'cm'), ...num((base * h) / 2, { unit: 'cm²' }),
      explain: `Oppervlakte driehoek = basis × hoogte : 2 = ${base} × ${h} : 2 = ${(base * h) / 2} cm².` };
  } },
  { level: 4, make() {
    const l = pick([20, 25, 30, 40, 50]); const b = pick([10, 20, 25]); const h = pick([10, 20, 30]);
    const lit = (l * b * h) / 1000;
    return { prompt: `Een aquarium is ${l} cm lang, ${b} cm breed en ${h} cm hoog. Hoeveel liter water past erin?`, figure: svgBox(l, b, h, 'cm'), ...num(lit, { unit: 'liter' }),
      explain: `${l} × ${b} × ${h} = ${nl(l * b * h)} cm³. 1.000 cm³ = 1 liter, dus ${nl(lit)} liter.` };
  } },
  { level: 4.5, make() {
    const w = ri(3, 8); const h = ri(2, 6); const tile = pick([[50, 4], [25, 16]]);
    return { prompt: `Een vloer van ${w} m bij ${h} m wordt betegeld met vierkante tegels van ${tile[0]} cm bij ${tile[0]} cm. Hoeveel tegels zijn er nodig?`, ...num(w * h * tile[1]),
      explain: `In 1 m² passen ${tile[1]} tegels (${100 / tile[0]} × ${100 / tile[0]}). De vloer is ${w * h} m², dus ${w * h} × ${tile[1]} = ${w * h * tile[1]} tegels.` };
  } },
  { level: 5, make() {
    const d = pick([10, 20, 50, 30, 40]);
    const v = round(3.14 * d, 2);
    return { prompt: `Een rond tafelblad heeft een middellijn van ${d} cm. Wat is de omtrek? Reken met π = 3,14.`, ...num(v, { unit: 'cm' }),
      explain: `Omtrek cirkel = π × middellijn = 3,14 × ${d} = ${nl(v)} cm.` };
  } },
];

// ===================== TABELLEN EN GRAFIEKEN =====================
const DAYS = ['ma', 'di', 'wo', 'do', 'vr'];
const verband = [
  { level: 1, make() {
    const data = DAYS.map((d) => ({ label: d, value: ri(1, 9) * 5 }));
    const i = ri(0, 4);
    const full = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'][i];
    return { prompt: `Het staafdiagram laat zien hoeveel boeken er per dag zijn uitgeleend in de schoolbibliotheek. Hoeveel boeken waren het op ${full}?`,
      figure: svgBars(data, { title: 'Uitgeleende boeken', max: 50 }), ...num(data[i].value), explain: `Kijk bij ${data[i].label}: de staaf komt tot ${data[i].value}.` };
  } },
  { level: 2, make() {
    const data = DAYS.map((d) => ({ label: d, value: ri(1, 9) * 5 }));
    const max = data.reduce((a, b) => (b.value > a.value ? b : a)); const min = data.reduce((a, b) => (b.value < a.value ? b : a));
    return { prompt: 'Hoeveel boeken zijn er op de drukste dag méér uitgeleend dan op de rustigste dag?', figure: svgBars(data, { title: 'Uitgeleende boeken', max: 50 }),
      ...num(max.value - min.value), explain: `Drukste dag: ${max.value}. Rustigste dag: ${min.value}. Verschil: ${max.value - min.value}.` };
  } },
  { level: 2.5, make() {
    const n = pick([4, 5]); const vals = Array.from({ length: n }, () => ri(4, 10));
    const sum = vals.reduce((a, b) => a + b, 0);
    if (sum % n) vals[0] += n - (sum % n);
    const s2 = vals.reduce((a, b) => a + b, 0);
    return { prompt: `${pick(NAMES)} haalde deze cijfers voor topografie: ${vals.join(', ')}. Wat is het gemiddelde cijfer?`, ...num(s2 / n),
      explain: `Tel alles op: ${vals.join(' + ')} = ${s2}. Deel door ${n}: ${s2} : ${n} = ${s2 / n}.` };
  } },
  { level: 3, make() {
    const hours = ['8 uur', '10 uur', '12 uur', '14 uur', '16 uur', '18 uur'];
    let t = ri(2, 8); const data = hours.map((h) => { t += ri(-1, 4); return { label: h.replace(' uur', ''), value: t }; });
    const i = ri(1, 5);
    return { prompt: `De grafiek laat de temperatuur op een dag zien (tijd in uren). Hoeveel graden was het om ${hours[i]}?`,
      figure: svgLine(data, { title: 'Temperatuur', unit: '°C', min: 0, max: 25 }), ...num(data[i].value, { unit: '°C' }), explain: `Zoek ${hours[i]} op de onderste as en kijk naar de stip: ${data[i].value} °C.` };
  } },
  { level: 3.5, make() {
    const items = shuffle([['Patat', 2.5], ['Kroket', 1.75], ['Frikandel', 1.6], ['Ijsje', 1.25], ['Limonade', 1.1], ['Appelflap', 1.9]]).slice(0, 4);
    const a = ri(1, 3); const b = ri(1, 3);
    const v = round(items[0][1] * a + items[1][1] * b, 2);
    return { prompt: `Je koopt ${a} × ${items[0][0].toLowerCase()} en ${b} × ${items[1][0].toLowerCase()}. Hoeveel moet je betalen?`,
      figure: table(['Product', 'Prijs'], items.map(([n, p]) => [n, euro2(p)]), 'Prijslijst snackbar'), ...num(v, { unit: '€' }),
      explain: `${a} × ${euro2(items[0][1])} = ${euro2(items[0][1] * a)} en ${b} × ${euro2(items[1][1])} = ${euro2(items[1][1] * b)}. Samen ${euro2(v)}.` };
  } },
  { level: 4, make() {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun'];
    const data = months.map((m) => ({ label: m, value: ri(2, 18) * 10 }));
    const sum = data.reduce((a, b) => a + b.value, 0);
    return { prompt: 'Hoeveel millimeter regen viel er in totaal in deze zes maanden?', figure: svgBars(data, { title: 'Neerslag', unit: 'mm', max: 200 }), ...num(sum, { unit: 'mm' }),
      explain: `${data.map((d) => d.value).join(' + ')} = ${sum} mm.` };
  } },
  { level: 4.5, make() {
    const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun'];
    const data = months.map((m) => ({ label: m, value: ri(2, 18) * 10 }));
    let i = 1;
    let best = 0;
    for (let k = 1; k < data.length; k++) if (data[k].value - data[k - 1].value > best) { best = data[k].value - data[k - 1].value; i = k; }
    if (best <= 0) return verband[6].make();
    const full = { feb: 'februari', mrt: 'maart', apr: 'april', mei: 'mei', jun: 'juni' };
    return { prompt: 'In welke maand nam de neerslag het sterkst toe ten opzichte van de maand ervoor?', figure: svgBars(data, { title: 'Neerslag', unit: 'mm', max: 200 }),
      ...mc(full[data[i].label], shuffle(Object.values(full).filter((m) => m !== full[data[i].label])).slice(0, 3)),
      explain: `Van ${data[i - 1].label} naar ${data[i].label} ging het van ${data[i - 1].value} naar ${data[i].value} mm: ${best} mm erbij. Dat is de grootste stijging.` };
  } },
  { level: 5, make() {
    const n = 5; const avg = ri(6, 8); const vals = [ri(5, 9), ri(5, 9), ri(5, 9), ri(5, 9)];
    const fifth = avg * n - vals.reduce((a, b) => a + b, 0);
    if (fifth < 1 || fifth > 10) return verband[7].make();
    return { prompt: `${pick(NAMES)} heeft vijf toetsen gemaakt. Het gemiddelde is precies een ${avg}. Vier cijfers zijn: ${vals.join(', ')}. Welk cijfer was de vijfde toets?`, ...num(fifth),
      explain: `Gemiddeld ${avg} bij 5 toetsen betekent samen ${avg * n}. De vier bekende cijfers zijn samen ${vals.reduce((a, b) => a + b, 0)}. ${avg * n} − ${vals.reduce((a, b) => a + b, 0)} = ${fifth}.` };
  } },
];

export const REKENEN = {
  'rk-getal': getal,
  'rk-bewerk': bewerk,
  'rk-breuk': breuk,
  'rk-komma': komma,
  'rk-procent': procent,
  'rk-verhouding': verhouding,
  'rk-meten': meten,
  'rk-meetkunde': meetkunde,
  'rk-verband': verband,
};

export { numDistractors };
