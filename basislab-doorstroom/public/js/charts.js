// Kleine SVG-grafieken. Rustige rasterlijnen, tooltips bij hover, kleuren per vakgebied.
import { esc, fmtDay } from './lib.js';

function tipEl(container) {
  let tip = container.querySelector('.chart-tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; container.appendChild(tip); }
  return tip;
}
function showTip(container, tip, html, x, y) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  const cw = container.clientWidth; const tw = tip.offsetWidth;
  tip.style.left = `${Math.max(0, Math.min(cw - tw, x - tw / 2))}px`;
  tip.style.top = `${Math.max(0, y - tip.offsetHeight - 10)}px`;
}
const niceMax = (v) => { if (v <= 0) return 10; const p = 10 ** Math.floor(Math.log10(v)); for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p; return 10 * p; };

/**
 * Niveau in de tijd: één lijn per vakgebied op de schaal 1–5, met de referentieniveaus als banden.
 * series: [{ id, name, color, values: [number|null] }], labels: [string]
 */
export function levelChart(container, { labels, series, height = 240 }) {
  const W = 640; const H = height; const m = { t: 12, r: 70, b: 28, l: 12 };
  container.classList.add('chart');
  if (!labels.length || !series.some((s) => s.values.some((v) => v != null))) { container.innerHTML = '<p class="empty">Nog te weinig gegevens. Na een paar weken oefenen verschijnt hier de groei.</p>'; return; }
  const n = labels.length;
  const x = (i) => m.l + (n === 1 ? (W - m.l - m.r) / 2 : (i / (n - 1)) * (W - m.l - m.r));
  const y = (v) => m.t + (1 - (Math.max(1, Math.min(5, v)) - 1) / 4) * (H - m.t - m.b);
  const bands = [[1, 2, 'op weg naar 1F', 'var(--n-onder)'], [2, 3, '1F', 'var(--n-1F)'], [3, 3.7, 'richting 2F/1S', 'var(--n-1Fp)'], [3.7, 5, '2F/1S', 'var(--n-2F)']];
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Niveau per week">
    ${bands.map(([a, b, l, c]) => `<rect x="${m.l}" y="${y(b)}" width="${W - m.l - m.r}" height="${y(a) - y(b)}" fill="${c}" opacity=".13"/>
      <text class="band-label" x="${W - m.r + 6}" y="${(y(a) + y(b)) / 2 + 4}">${esc(l)}</text>`).join('')}
    ${[2, 3, 3.7].map((v) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}
    ${labels.map((l, i) => (i % labelEvery === 0 || i === n - 1 ? `<text class="axis-label" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>` : '')).join('')}
    ${series.map((s) => {
      const pts = s.values.map((v, i) => ({ v, i })).filter((p) => p.v != null);
      const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
      return `<path class="line" d="${d}" stroke="${s.color}"/>${pts.map((p) => `<circle class="dot" cx="${x(p.i)}" cy="${y(p.v)}" r="4" fill="${s.color}"/>`).join('')}`;
    }).join('')}
    <line class="cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}"/>
    <rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/>
  </svg>
  <div class="legend" style="margin-top:6px">${series.map((s) => `<span class="dom"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  const svg = container.querySelector('svg'); const tip = tipEl(container); const cross = svg.querySelector('.cross');
  svg.querySelector('.hit').addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    let i = 0; for (let k = 0; k < n; k++) if (Math.abs(x(k) - sx) < Math.abs(x(i) - sx)) i = k;
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.opacity = 1;
    showTip(container, tip, `<b>${esc(labels[i])}</b><br>${series.map((s) => `${esc(s.name)}: ${s.values[i] == null ? '–' : s.values[i].toFixed(1).replace('.', ',')}`).join('<br>')}`, (x(i) / W) * r.width, 20);
  });
  svg.querySelector('.hit').addEventListener('mouseleave', () => { tip.style.opacity = 0; cross.style.opacity = 0; });
}

/** Staafgrafiek met één reeks. data: [{ label, value, tip }] */
export function barChart(container, { data, color = 'var(--accent)', height = 180, goal = null, goalLabel = '' }) {
  const W = 640; const H = height; const m = { t: 14, r: 12, b: 28, l: 36 };
  container.classList.add('chart');
  const max = niceMax(Math.max(1, ...data.map((d) => d.value), goal || 0) * 1.08);
  const n = data.length; const slot = (W - m.l - m.r) / n; const bw = Math.max(4, Math.min(44, slot - 4));
  const y = (v) => m.t + (1 - v / max) * (H - m.t - m.b);
  const labelEvery = Math.max(1, Math.ceil(n / 10));
  const barPath = (x0, v) => { if (v <= 0) return ''; const top = y(v); const bottom = y(0); const rr = Math.min(4, bw / 2, bottom - top); return `M${x0},${bottom}V${top + rr}Q${x0},${top} ${x0 + rr},${top}H${x0 + bw - rr}Q${x0 + bw},${top} ${x0 + bw},${top + rr}V${bottom}Z`; };
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Staafgrafiek">
    ${[0, 0.5, 1].map((f) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(f * max)}" y2="${y(f * max)}"/><text class="axis-label" x="${m.l - 6}" y="${y(f * max) + 4}" text-anchor="end">${Math.round(f * max)}</text>`).join('')}
    ${goal != null ? `<line x1="${m.l}" x2="${W - m.r}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--muted)" stroke-dasharray="4 4"/><text class="axis-label" x="${W - m.r}" y="${y(goal) - 5}" text-anchor="end">${esc(goalLabel)}</text>` : ''}
    ${data.map((d, i) => { const x0 = m.l + i * slot + (slot - bw) / 2; return `<path d="${barPath(x0, d.value)}" fill="${d.color || color}"/><rect class="hit" data-i="${i}" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${H - m.t - m.b}"/>${i % labelEvery === 0 ? `<text class="axis-label" x="${x0 + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>` : ''}`; }).join('')}
  </svg>`;
  const svg = container.querySelector('svg'); const tip = tipEl(container);
  svg.querySelectorAll('.hit').forEach((h) => {
    h.addEventListener('mousemove', () => { const i = Number(h.dataset.i); const d = data[i]; const r = svg.getBoundingClientRect(); showTip(container, tip, d.tip || `<b>${esc(d.label)}</b><br>${d.value}`, ((m.l + i * slot + slot / 2) / W) * r.width, (y(d.value) / H) * r.height); });
    h.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
  });
}

/** Verdeling over niveaus als gestapelde balk. counts: { onder, 1F, 1F+, 2F, onbekend } */
export function stackBar(counts) {
  const order = [['onder', 'var(--n-onder)', 'op weg naar 1F'], ['1F', 'var(--n-1F)', '1F'], ['1F+', 'var(--n-1Fp)', 'richting 2F/1S'], ['2F', 'var(--n-2F)', '2F/1S'], ['onbekend', 'var(--n-onbekend)', 'nog onbekend']];
  const total = order.reduce((x, [k]) => x + (counts[k] || 0), 0) || 1;
  return `<div class="stackbar" role="img" aria-label="${order.map(([k, , l]) => `${l}: ${counts[k] || 0}`).join(', ')}">${order.map(([k, c, l]) => (counts[k] ? `<i style="width:${(counts[k] / total) * 100}%;background:${c}" title="${l}: ${counts[k]}"></i>` : '')).join('')}</div>`;
}

export { fmtDay };
