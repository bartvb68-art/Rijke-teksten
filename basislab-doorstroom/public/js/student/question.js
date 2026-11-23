// Eén opgave tonen en het antwoord ophalen. Gebruikt door oefenen en de proeftoets.
import { esc } from '../lib.js';
import { icon } from '../icons.js';
import { SKILL_BY_ID, DOMAIN_BY_ID } from '../shared/skills.js';
import { canSpeak, speak, stopSpeaking, htmlToSpeech } from '../speak.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function renderQuestion(container, item, { readAloud = false, onAnswer }) {
  const skill = SKILL_BY_ID[item.skill];
  const passage = item.passage ? `<div class="passage" tabindex="0" aria-label="Tekst">${item.passage}${readAloud && canSpeak() ? `<p style="padding:0"><button class="speak-btn" data-speak="passage">${icon('sound')} Lees de tekst voor</button></p>` : ''}</div>` : '';
  container.innerHTML = `<div class="q-card"><div class="q-layout ${passage ? 'with-passage' : ''}">
      ${passage}
      <div>
        <div class="q-skill"><i style="background:var(--${skill.domain})"></i>${esc(DOMAIN_BY_ID[skill.domain].name)} · ${esc(skill.name)}</div>
        <div class="q-prompt" id="q-prompt">${item.prompt}</div>
        ${item.figure ? `<div class="q-figure">${item.figure}</div>` : ''}
        ${readAloud && canSpeak() ? `<p><button class="speak-btn" data-speak="q">${icon('sound')} Lees de vraag voor</button></p>` : ''}
        ${item.type === 'mc'
          ? `<div class="options" role="group" aria-labelledby="q-prompt">${item.options.map((o, i) => `<button class="option" data-value="${esc(o)}"><span class="letter">${LETTERS[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`
          : `<form class="answer-row" autocomplete="off"><input name="answer" aria-label="Jouw antwoord" inputmode="${item.check === 'text' ? 'text' : 'decimal'}" spellcheck="false" autocapitalize="off" placeholder="${item.check === 'time' ? 'bijv. 14:30' : item.check === 'fraction' ? 'bijv. 3/4' : 'Jouw antwoord'}">
              ${item.unit ? `<span class="unit">${esc(item.unit)}</span>` : ''}<button class="btn btn-primary" type="submit">Controleer ${icon('check')}</button></form>`}
        <div class="fb"></div>
      </div></div></div>`;
  const started = performance.now();
  let done = false;
  const submit = (value) => {
    if (done || !String(value).trim()) return;
    done = true;
    stopSpeaking();
    container.querySelectorAll('.option').forEach((b) => { b.disabled = true; if (b.dataset.value === value) b.classList.add('chosen'); });
    const input = container.querySelector('input[name=answer]');
    if (input) { input.disabled = true; container.querySelector('.answer-row button').disabled = true; }
    onAnswer(value, Math.round(performance.now() - started));
  };
  container.querySelectorAll('.option').forEach((b) => b.addEventListener('click', () => submit(b.dataset.value)));
  const form = container.querySelector('form.answer-row');
  if (form) {
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(form.answer.value); });
    setTimeout(() => form.answer.focus(), 30);
  }
  container.querySelectorAll('[data-speak]').forEach((b) => b.addEventListener('click', () => {
    const html = b.dataset.speak === 'passage' ? item.passage : `${item.prompt} ${item.type === 'mc' ? `Kies uit: ${item.options.map((o, i) => `${LETTERS[i]}: ${o}`).join('. ')}` : ''}`;
    speak(htmlToSpeech(html));
  }));
  const onKey = (e) => {
    if (done || item.type !== 'mc' || e.target.closest('input, textarea')) return;
    const i = LETTERS.indexOf(e.key.toUpperCase()) >= 0 ? LETTERS.indexOf(e.key.toUpperCase()) : ['1', '2', '3', '4'].indexOf(e.key);
    if (i >= 0 && item.options[i] != null) { e.preventDefault(); submit(item.options[i]); }
  };
  document.addEventListener('keydown', onKey);
  return () => { document.removeEventListener('keydown', onKey); stopSpeaking(); };
}

export function showFeedback(container, item, given, res) {
  container.querySelectorAll('.option').forEach((b) => {
    if (b.dataset.value === res.answer) b.classList.add('right');
    else if (b.dataset.value === given && !res.correct) b.classList.add('wrong');
  });
  const fb = container.querySelector('.fb');
  fb.innerHTML = `<div class="feedback ${res.correct ? 'right' : 'wrong'}" role="status">
    <strong>${res.correct ? `${icon('check')} Goed zo!` : `${icon('x')} Helaas, niet goed`}</strong>
    ${res.correct ? '' : `<span>Het goede antwoord is: <b>${esc(res.answer)}</b>${item.unit && item.type !== 'mc' ? ` ${esc(item.unit)}` : ''}</span>`}
    ${res.explain ? `<span class="explain">${res.explain}</span>` : ''}
  </div>`;
}
