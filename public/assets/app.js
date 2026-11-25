// Basislab Meestertekst – voorkant
const $ = (s, el = document) => el.querySelector(s);
const SUGGESTIES = ['Bijen', 'Vulkanen', 'Kinderrechten', 'De ruimte', 'Plastic in zee', 'Prinsjesdag', 'De Tweede Wereldoorlog', 'Dinosaurussen', 'Verkiezingen', 'Klimaatverandering'];
const opslag = {
  get(k) { try { return JSON.parse(localStorage.getItem('bt:' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('bt:' + k, JSON.stringify(v)); } catch {} },
};

/** Klein hulpje om veilig DOM te bouwen (tekst wordt nooit als HTML gelezen). */
function h(tag, attrs = {}, ...kinderen) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinderen.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}

let config;
let huidig = null; // { materiaal, onderzoekId, aanvraag }
let bezig = false;

/* ---------------- opstarten ---------------- */
async function start() {
  config = await fetch('api/config').then((r) => r.json());
  if (config.testmodus) $('#testbanner').hidden = false;

  const vorige = opslag.get('instellingen') ?? {};
  const sug = $('#suggesties');
  for (const s of SUGGESTIES) sug.append(h('button', { type: 'button', class: 'chip', onclick: () => { $('#thema').value = s; $('#thema').focus(); } }, s));

  const groepen = $('#groepen');
  for (const g of config.groepen) {
    const [naam, avi] = g.label.replace(')', '').split(' (');
    groepen.append(h('label', {}, h('input', { type: 'radio', name: 'groep', value: g.id, checked: g.id === (vorige.groep ?? '6') }), h('span', {}, naam, h('small', {}, avi))));
  }
  for (const t of config.tekstsoorten) $('#tekstsoort').append(h('option', { value: t.id, selected: t.id === vorige.tekstsoort }, t.label));
  for (const l of config.lengtes) $('#lengte').append(h('option', { value: l.id, selected: l.id === (vorige.lengte ?? 'middel') }, l.label));
  const bronnen = $('#bronnen');
  for (const b of config.bronnen) {
    const aan = vorige.bronnen ? vorige.bronnen.includes(b.id) : b.standaard;
    bronnen.append(h('label', { class: 'chip', title: `${b.omschrijving} – ${b.domein}` }, h('input', { type: 'checkbox', name: 'bron', value: b.id, checked: aan }), b.naam));
  }

  $('#maken').addEventListener('submit', (e) => { e.preventDefault(); maak(); });
  $('#open-bronnen').addEventListener('click', toonBronnenInfo);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) sluitModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluitModal(); });

  const bewaard = opslag.get('laatste');
  if (bewaard?.materiaal) { huidig = bewaard; toonResultaat(); }
  if (config.codeNodig && !opslag.get('code')) vraagCode();
}

function leesFormulier() {
  return {
    thema: $('#thema').value.trim(),
    groep: $('input[name=groep]:checked')?.value,
    tekstsoort: $('#tekstsoort').value,
    lengte: $('#lengte').value,
    bronnen: [...document.querySelectorAll('input[name=bron]:checked')].map((i) => i.value),
  };
}

function toonFout(tekst) {
  const f = $('#fout');
  f.textContent = tekst;
  f.hidden = !tekst;
}

/* ---------------- genereren ---------------- */
async function maak(overrides = {}, onderzoekId) {
  if (bezig) return;
  const aanvraag = { ...(overrides.groep ? huidig.aanvraag : leesFormulier()), ...overrides };
  if (!aanvraag.thema) return toonFout('Vul eerst een thema in.');
  if (!aanvraag.bronnen.length) return toonFout('Vink minstens één bron aan.');
  toonFout('');
  if (!overrides.groep) opslag.set('instellingen', { groep: aanvraag.groep, tekstsoort: aanvraag.tekstsoort, lengte: aanvraag.lengte, bronnen: aanvraag.bronnen });

  bezig = true;
  stopVoorlezen();
  $('#knop-maak').disabled = true;
  $('#resultaat').hidden = true;
  const log = $('#log');
  log.replaceChildren();
  $('#voortgang-titel').textContent = overrides.groep ? 'Tekst aanpassen naar een ander niveau…' : 'Lesmateriaal maken…';
  $('#voortgang').hidden = false;
  $('#voortgang').scrollIntoView({ behavior: 'smooth', block: 'center' });

  try {
    const res = await fetch('api/genereer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-toegangscode': opslag.get('code') ?? '' },
      body: JSON.stringify({ ...aanvraag, onderzoekId }),
    });
    if (res.status === 401) { opslag.set('code', null); vraagCode(); throw new Error('Vul de toegangscode in en probeer het opnieuw.'); }
    if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).fout ?? 'Er ging iets mis.');

    const lezer = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    let klaar = null;
    for (;;) {
      const { value, done } = await lezer.read();
      if (done) break;
      buffer += value;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const regel = buffer.slice(0, i).trim();
        buffer = buffer.slice(i + 1);
        if (!regel) continue;
        const bericht = JSON.parse(regel);
        if (bericht.type === 'status') log.append(h('li', {}, bericht.tekst));
        else if (bericht.type === 'fout') throw new Error(bericht.fout);
        else if (bericht.type === 'klaar') klaar = bericht;
      }
    }
    if (!klaar) throw new Error('De verbinding werd verbroken. Probeer het opnieuw.');
    huidig = { materiaal: klaar.materiaal, onderzoekId: klaar.onderzoekId, aanvraag };
    opslag.set('laatste', huidig);
    $('#voortgang').hidden = true;
    toonResultaat();
    $('#resultaat').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    $('#voortgang').hidden = true;
    toonFout(e.message || 'Er ging iets mis.');
    if (huidig) $('#resultaat').hidden = false;
    $('#maken').scrollIntoView({ behavior: 'smooth' });
  } finally {
    bezig = false;
    $('#knop-maak').disabled = false;
  }
}

/* ---------------- resultaat tonen ---------------- */
function groepLabel(id) { return config.groepen.find((g) => g.id === id)?.label ?? `Groep ${id}`; }

function hoofdtekstNaarHtml(tekst, woorden) {
  const frag = [];
  for (const regel of tekst.split('\n').map((r) => r.trim()).filter(Boolean)) {
    if (regel.startsWith('## ')) frag.push(h('h3', {}, regel.slice(3)));
    else frag.push(h('p', {}, ...markeerWoorden(regel.replace(/^#+\s*/, ''), woorden)));
  }
  return frag;
}

// Woorden uit de woordenlijst krijgen een stippellijn met de uitleg als tooltip (eerste keer dat ze voorkomen).
function markeerWoorden(zin, woorden) {
  const delen = [zin];
  for (const w of woorden) {
    if (w._gezien) continue;
    for (let i = 0; i < delen.length; i++) {
      if (typeof delen[i] !== 'string') continue;
      const m = new RegExp(`(^|[^\\p{L}])(${w.woord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^\\p{L}]|$)`, 'iu').exec(delen[i]);
      if (!m) continue;
      const start = m.index + m[1].length;
      const eind = start + m[2].length;
      delen.splice(i, 1, delen[i].slice(0, start), h('mark', { class: 'woord', title: w.uitleg }, delen[i].slice(start, eind)), delen[i].slice(eind));
      w._gezien = true;
      break;
    }
  }
  return delen.filter((d) => d !== '');
}

function toonResultaat() {
  const { materiaal: m, aanvraag } = huidig;
  const groepen = config.groepen.map((g) => g.id);
  const idx = groepen.indexOf(m.groep);
  const woorden = m.woorden.map((w) => ({ ...w }));
  let nr = 0;
  const blok = (titel, ...inhoud) => h('section', { class: 'card blok' }, h('h2', {}, h('span', { class: 'nr' }, ++nr), titel), ...inhoud);

  const werkbalk = h('div', { class: 'werkbalk' },
    h('div', { class: 'niveau' }, h('span', { class: 'badge' }, groepLabel(m.groep)), h('span', { class: 'muted klein' }, m.thema)),
    h('button', { class: 'btn btn-ghost', disabled: idx <= 0, title: 'Zelfde onderwerp, een groep lager', onclick: () => maak({ groep: groepen[idx - 1] }, huidig.onderzoekId) }, '⬇ Makkelijker'),
    h('button', { class: 'btn btn-ghost', disabled: idx >= groepen.length - 1, title: 'Zelfde onderwerp, een groep hoger', onclick: () => maak({ groep: groepen[idx + 1] }, huidig.onderzoekId) }, '⬆ Moeilijker'),
    h('button', { class: 'btn btn-ghost', id: 'knop-voorlezen', onclick: voorlezen }, '🔊 Voorlezen'),
    h('button', { class: 'btn btn-ghost' + (document.body.classList.contains('dyslexie') ? ' on' : ''), title: 'Grotere letters en meer ruimte', onclick: (e) => e.currentTarget.classList.toggle('on', document.body.classList.toggle('dyslexie')) }, 'Aa Dyslexie'),
    h('button', { class: 'btn btn-ghost' + (document.body.classList.contains('antwoorden') ? ' on' : ''), onclick: (e) => e.currentTarget.classList.toggle('on', document.body.classList.toggle('antwoorden')) }, '✓ Antwoorden'),
    h('button', { class: 'btn btn-ghost', onclick: () => window.print() }, '🖨 Afdrukken'),
    h('button', { class: 'btn btn-accent', onclick: () => downloadDocx('leerling') }, 'Word leerling'),
    h('button', { class: 'btn btn-accent', onclick: () => downloadDocx('leerkracht') }, 'Word leerkracht'),
  );

  const intro = blok('Introductie',
    h('p', { class: 'intro' }, m.introductie),
    m.beeldmateriaal.length
      ? h('div', { class: 'videos' }, m.beeldmateriaal.map((v) => h('a', { class: 'video', href: v.url, target: '_blank', rel: 'noopener' }, h('span', { class: 'play', 'aria-hidden': 'true' }, '▶'), h('span', {}, h('b', {}, v.titel), h('small', {}, `Bekijk bij ${v.bron}`)))))
      : h('p', { class: 'muted klein' }, 'Geen geschikte video gevonden in de gekozen bronnen.'),
  );
  intro.classList.add('geen-print');

  const papier = h('article', { class: 'papier blok', id: 'papier' },
    h('p', { class: 'meta' }, `${groepLabel(m.groep)} · ${aanvraag?.tekstsoort ? config.tekstsoorten.find((t) => t.id === aanvraag.tekstsoort)?.label.split(' (')[0] : 'Tekst'}`),
    h('h1', {}, m.titel),
    ...hoofdtekstNaarHtml(m.hoofdtekst, woorden),
  );

  const woordenBlok = blok('Woordenlijst', h('div', { class: 'woordenlijst' }, m.woorden.map((w) => h('div', { class: 'woordkaart' }, h('b', {}, w.woord), w.uitleg))));

  const vragenBlok = blok('Vragen bij de tekst', h('div', { class: 'vragen' }, m.vragen.map((v, i) =>
    h('div', { class: 'vraag' }, h('span', { class: 'bol' }, i + 1), h('span', { class: 'soort' }, v.soort), h('p', {}, v.vraag), h('div', { class: 'antwoord' }, 'Antwoordmodel: ', v.antwoord)))));

  const mcBlok = blok('Meerkeuzevragen (toetsstijl)', h('div', { class: 'vragen' }, m.meerkeuze.map((v, i) =>
    h('div', { class: 'vraag' }, h('span', { class: 'bol' }, i + 1), h('span', { class: 'soort' }, 'Meerkeuze'), h('p', {}, v.vraag),
      h('div', { class: 'opties' }, Object.entries(v.opties).map(([letter, tekst]) => h('div', { class: 'optie' + (letter === v.antwoord ? ' goed' : '') }, h('span', { class: 'letter' }, letter), tekst))),
      h('div', { class: 'antwoord' }, `Goed antwoord: ${v.antwoord}. ${v.uitleg}`)))));

  const diffBlok = blok('Differentiatie', h('div', { class: 'diff' },
    h('div', { class: 'steun' }, h('h3', {}, 'Extra ondersteuning'), h('p', {}, m.differentiatie.ondersteuning)),
    h('div', { class: 'uitdaag' }, h('h3', {}, 'Extra uitdaging'), h('p', {}, m.differentiatie.uitdaging))));
  diffBlok.classList.add('geen-print');

  const bronBlok = blok('Gebruikte bronnen',
    h('ul', { class: 'bronlijst' }, m.bronnen.map((b) => h('li', {}, h('span', { class: 'tag' }, b.bron), h('a', { href: b.url, target: '_blank', rel: 'noopener' }, b.titel)))),
    h('p', { class: 'bronnote' }, 'Alle feiten komen uit deze pagina’s van erkende kinderbronnen. De links zijn door de server gecontroleerd. Lees de tekst wel altijd even na voordat je hem in de klas gebruikt.'));

  $('#resultaat').replaceChildren(werkbalk, intro, papier, woordenBlok, vragenBlok, mcBlok, diffBlok, bronBlok);
  $('#resultaat').hidden = false;
}

/* ---------------- Word ---------------- */
async function downloadDocx(versie) {
  try {
    const res = await fetch('api/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-toegangscode': opslag.get('code') ?? '' },
      body: JSON.stringify({ materiaal: huidig.materiaal, versie }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).fout ?? 'Downloaden mislukt.');
    const url = URL.createObjectURL(await res.blob());
    const a = h('a', { href: url, download: `${huidig.materiaal.titel}${versie === 'leerkracht' ? ' - leerkracht' : ''}.docx` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    alert(e.message);
  }
}

/* ---------------- voorlezen (spraak van de browser) ---------------- */
let leest = false;
function stemNl() {
  const stemmen = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('nl'));
  return stemmen.find((v) => /nl-nl/i.test(v.lang) && /google|natural|online|neural/i.test(v.name)) ?? stemmen.find((v) => /nl-nl/i.test(v.lang)) ?? stemmen[0];
}
function stopVoorlezen() {
  if (!('speechSynthesis' in window)) return;
  leest = false;
  speechSynthesis.cancel();
  document.querySelectorAll('.voorgelezen').forEach((el) => el.classList.remove('voorgelezen'));
  const k = $('#knop-voorlezen');
  if (k) { k.textContent = '🔊 Voorlezen'; k.classList.remove('on'); }
}
function voorlezen() {
  if (!('speechSynthesis' in window)) return alert('Voorlezen wordt niet ondersteund in deze browser.');
  if (leest) return stopVoorlezen();
  const delen = [...document.querySelectorAll('#papier h1, #papier h3, #papier p:not(.meta)')];
  const stem = stemNl();
  leest = true;
  const k = $('#knop-voorlezen');
  k.textContent = '⏹ Stop';
  k.classList.add('on');
  delen.forEach((el, i) => {
    const u = new SpeechSynthesisUtterance(el.textContent);
    u.lang = 'nl-NL';
    if (stem) u.voice = stem;
    u.rate = 0.92;
    u.onstart = () => { document.querySelectorAll('.voorgelezen').forEach((x) => x.classList.remove('voorgelezen')); el.classList.add('voorgelezen'); };
    if (i === delen.length - 1) u.onend = stopVoorlezen;
    speechSynthesis.speak(u);
  });
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

/* ---------------- modals ---------------- */
function openModal(...inhoud) {
  $('#modal-body').replaceChildren(...inhoud);
  $('#modal').hidden = false;
  $('#modal').querySelector('input, button:not(.modal-close)')?.focus();
}
function sluitModal() {
  if (config?.codeNodig && !opslag.get('code')) return;
  $('#modal').hidden = true;
}

function toonBronnenInfo() {
  openModal(
    h('h2', { id: 'modal-titel' }, 'Alleen erkende bronnen'),
    h('p', {}, 'Meestertekst zoekt en leest alleen op deze websites. Feiten van andere sites worden niet gebruikt en links naar andere sites worden door de server geweigerd.'),
    h('ul', {}, config.bronnen.map((b) => h('li', {}, h('b', {}, b.naam), ` – ${b.omschrijving} (${b.domein})`))),
    h('p', { class: 'muted klein' }, 'De AI schrijft de tekst zelf, op basis van wat er op deze pagina’s staat. Vindt hij niets over je thema, dan krijg je een melding in plaats van een verzonnen tekst.'),
  );
}

function vraagCode() {
  const invoer = h('input', { type: 'password', id: 'code', autocomplete: 'current-password', placeholder: 'Toegangscode' });
  const melding = h('p', { class: 'fout', hidden: true });
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const res = await fetch('api/controleer-code', { method: 'POST', headers: { 'x-toegangscode': invoer.value } });
    if (res.ok) { opslag.set('code', invoer.value); $('#modal').hidden = true; }
    else { melding.textContent = 'Deze code klopt niet.'; melding.hidden = false; }
  } },
    h('h2', { id: 'modal-titel' }, 'Toegangscode'),
    h('p', {}, 'Vul de toegangscode van je school in. Je hoeft dit maar één keer te doen op dit apparaat.'),
    invoer, melding,
    h('button', { type: 'submit', class: 'btn btn-accent' }, 'Doorgaan'));
  openModal(form);
}

start();
