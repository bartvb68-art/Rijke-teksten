import { api, esc, fmtDate } from '../lib.js';
import { icon } from '../icons.js';
import { refreshState } from '../app.js';
import { studentShell } from './shell.js';
import { DOMAINS, SKILL_BY_ID, skillsOf, weekLabel } from '../shared/skills.js';
import { levelMeter, nivChip, niveauLegend } from '../ui.js';
import { levelChart } from '../charts.js';
import { resultHtml } from './test.js';

export default async function results(root) {
  await refreshState();
  const r = await api('GET', '/api/student/results');
  const sk = Object.fromEntries(r.skills.map((s) => [s.id, s]));
  const main = studentShell(root, `
    <h1>Mijn niveau</h1>
    <p class="muted">Na elk antwoord wordt je niveau opnieuw geschat. Hoe meer je oefent, hoe preciezer het klopt.</p>
    ${niveauLegend()}
    <div class="grid3" style="margin-top:16px">${r.domains.map((d) => {
      const dom = DOMAINS.find((x) => x.id === d.id);
      return `<section class="card stack" style="border-top:5px solid var(--${d.id})">
        <div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(dom.name)}</h2>${nivChip(d.niveau)}</div>
        ${levelMeter(d.n >= 8 ? d.theta : null, d.id)}
        <div class="table-wrap"><table class="list"><tbody>${skillsOf(d.id).map((s) => {
          const x = sk[s.id];
          return `<tr><td><a href="#/oefenen/skill:${s.id}" class="name">${esc(s.name)}</a><div class="muted" style="font-size:.8rem">${x.n} opgaven${x.pct != null ? ` · ${x.pct}% goed` : ''}</div></td><td class="r">${nivChip(x.niveau)}</td></tr>`;
        }).join('')}</tbody></table></div>
      </section>`;
    }).join('')}</div>
    <section class="card" style="margin-top:20px"><h2>Zo groei je</h2><div data-chart></div></section>
    ${r.tests.length ? `<section style="margin-top:20px"><h2>Proeftoetsen</h2>${r.tests.slice().reverse().map((t) => `<h3 class="muted" style="margin-top:12px">${esc(fmtDate(t.at))} · ${t.result.correct} van de ${t.result.total} goed</h3>${resultHtml(t.result)}`).join('')}</section>` : ''}
    ${r.mistakes.length ? `<section class="card" style="margin-top:20px"><h2>Leer van je fouten</h2><p class="muted">Je laatste foute antwoorden, met het goede antwoord.</p>
      <div class="table-wrap"><table class="list answers-list"><thead><tr><th>Onderdeel</th><th>Opgave</th><th>Jij</th><th>Goed</th></tr></thead><tbody>
      ${r.mistakes.map((m) => `<tr><td>${esc(SKILL_BY_ID[m.skill].name)}</td><td class="prompt">${esc(m.prompt)}</td><td class="nok">${esc(m.given)}</td><td class="ok">${esc(m.answer)}</td></tr>`).join('')}
      </tbody></table></div></section>` : ''}
    <p style="margin-top:20px"><a class="btn" href="#/start">${icon('back')} Terug naar start</a></p>
  `, { active: 'niveau' });
  levelChart(main.querySelector('[data-chart]'), {
    labels: r.series.map((w) => weekLabel(w.week).split(' – ')[0]),
    series: DOMAINS.map((d) => ({ id: d.id, name: d.name, color: `var(--${d.id})`, values: r.series.map((w) => w[d.id]) })),
  });
}
