import { api, esc } from '../lib.js';
import { icon } from '../icons.js';
import { weekLabel } from '../shared/skills.js';
import { sheetsHtml } from '../sheet.js';

export default async function huiswerk(root) {
  let data;
  try { data = await api('GET', '/api/student/huiswerk'); } catch (err) {
    root.innerHTML = `<div class="ws-wrap"><div class="card"><p>${esc(err.message)}</p><a class="btn" href="#/start">${icon('back')} Terug</a></div></div>`; return;
  }
  root.innerHTML = `<div class="ws-wrap">
    <div class="ws-bar no-print"><a class="btn" href="#/start">${icon('back')} Terug</a><button class="btn btn-accent" data-print>${icon('print')} Huiswerk afdrukken</button></div>
    <p class="no-print muted">Dit blad is op jouw niveau gemaakt. Lever het in bij je juf of meester.</p>
    ${sheetsHtml(data, { answers: false, subtitle: `week van ${weekLabel(data.week.week)}` })}</div>`;
  root.querySelector('[data-print]').addEventListener('click', () => window.print());
}
