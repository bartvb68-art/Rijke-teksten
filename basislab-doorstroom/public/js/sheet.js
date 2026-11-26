// Opmaak van printbare werkbladen (A4): per leerling één of meer pagina's, optioneel met nakijkblad.
import { esc } from './lib.js';
import { SKILL_BY_ID, DOMAIN_BY_ID } from './shared/skills.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const logo = '<img class="ws-logo" src="/img/icon.svg" alt="" width="44" height="44">';

function itemHtml(it, n) {
  const answer = it.type === 'mc'
    ? `<ol class="ws-options">${it.options.map((o, i) => `<li><span class="ws-box">${LETTERS[i]}</span>${esc(o)}</li>`).join('')}</ol>`
    : `<p class="ws-answer">Antwoord: <span class="ws-line"></span>${it.unit ? ` ${esc(it.unit)}` : ''}</p>`;
  return `<li class="ws-item"><span class="ws-n">${n}</span><div class="ws-body"><div class="ws-prompt">${it.prompt}</div>${it.figure ? `<div class="ws-figure">${it.figure}</div>` : ''}${answer}</div></li>`;
}

function uitlegHtml(u) {
  return `<div class="ws-uitleg"><p class="ws-regel"><b>Zo werkt het.</b> ${esc(u.regel)}</p>
    <ol class="ws-stappen">${u.stappen.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="ws-voorbeeld"><b>Voorbeeld</b>${u.voorbeeld.map((v, i) => `<p>${i === u.voorbeeld.length - 1 ? '<b>' : ''}${esc(v)}${i === u.voorbeeld.length - 1 ? '</b>' : ''}</p>`).join('')}</div></div>`;
}

export function sheetsHtml(data, { answers = false, subtitle = '' } = {}) {
  return data.sheets.map((sh) => {
    let n = 0;
    const key = [];
    const body = sh.sections.map((sec) => {
      const sk = SKILL_BY_ID[sec.skill];
      const items = sec.items.map((it) => { n += 1; key.push({ n, it, skill: sk }); return itemHtml(it, n); }).join('');
      return `<section class="ws-section"><h3><i style="background:var(--${sk.domain})"></i>${esc(DOMAIN_BY_ID[sk.domain].name)} · ${esc(sk.name)}</h3>
        ${sec.uitleg ? uitlegHtml(sec.uitleg) : ''}${sec.passage ? `<div class="ws-passage">${sec.passage}</div>` : ''}<ol class="ws-items">${items}</ol></section>`;
    }).join('');
    const sheet = `<article class="ws-sheet">
      <header class="ws-head">${logo}<div><div class="ws-brand">Basis<span class="lab">lab</span> <span class="prog">Doorstroom</span></div><h2>${esc(sh.titel)}${subtitle ? ` · ${esc(subtitle)}` : ''}</h2></div>
        <dl class="ws-meta"><dt>Naam</dt><dd>${esc(sh.student.name)}</dd><dt>Datum</dt><dd><span class="ws-line short"></span></dd></dl></header>
      ${body}
      <footer class="ws-foot">${n} opgaven · ${sh.soort === 'remediering' ? 'Lees eerst de uitleg. Werk rustig van boven naar beneden.' : 'Werk netjes en gebruik kladpapier voor de rekenopgaven.'}</footer>
    </article>`;
    const nakijk = answers ? `<article class="ws-sheet ws-key"><header class="ws-head">${logo}<div><div class="ws-brand">Nakijkblad</div><h2>${esc(sh.titel)} · ${esc(sh.student.name)}</h2></div></header>
      <table class="ws-keytable"><thead><tr><th>Nr.</th><th>Onderdeel</th><th>Antwoord</th><th>Uitleg</th></tr></thead><tbody>
      ${key.map(({ n: k, it, skill }) => `<tr><td>${k}</td><td>${esc(skill.name)}</td><td><b>${esc(it.answer)}</b>${it.unit && it.type !== 'mc' ? ` ${esc(it.unit)}` : ''}</td><td>${it.explain || ''}</td></tr>`).join('')}
      </tbody></table></article>` : '';
    return sheet + nakijk;
  }).join('');
}
