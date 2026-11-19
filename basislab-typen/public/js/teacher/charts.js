// Kleine SVG-grafieken voor het volgsysteem. Eén as per grafiek, rustige rasterlijnen, tooltips bij hover.
import { esc, fmtDay } from '../lib.js';
import { KEY_ROWS, FINGERS } from '../shared/curriculum.js';

export const SERIES = { blue: '#2a78d6', aqua: '#1baf7a', orange: '#eb6834', violet: '#6250d6' };
export const SEQ = ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'];

function niceMax(v) {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function tipEl(container) {
  let tip = container.querySelector('.chart-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'chart-tip';
    container.appendChild(tip);
  }
  return tip;
}

function showTip(container, tip, html, x, y) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  const cw = container.clientWidth;
  const tw = tip.offsetWidth;
  tip.style.left = `${Math.max(0, Math.min(cw - tw, x - tw / 2))}px`;
  tip.style.top = `${Math.max(0, y - tip.offsetHeight - 10)}px`;
}

/**
 * Lijngrafiek met één reeks. points: [{ day, value }]; nulls worden overgeslagen.
 */
export function lineChart(container, { points, color = SERIES.blue, unit = '', target = null, targetLabel = '', yMax = null, yMin = 0, area: showArea = true, height = 220, format = (v) => v }) {
  const W = 640;
  const H = height;
  const m = { t: 14, r: 16, b: 28, l: 40 };
  const vals = points.map((p) => p.value).filter((v) => v != null);
  container.classList.add('chart');
  if (!vals.length) {
    container.innerHTML = '<p class="empty">Nog geen gegevens.</p>';
    return;
  }
  const max = yMax ?? niceMax(Math.max(...vals, target || 0) * 1.1);
  const min = Math.min(yMin, ...vals);
  const n = points.length;
  const x = (i) => m.l + (n === 1 ? (W - m.l - m.r) / 2 : (i / (n - 1)) * (W - m.l - m.r));
  const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
  const defined = points.map((p, i) => ({ ...p, i })).filter((p) => p.value != null);
  const path = defined.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const area = showArea && defined.length > 1 ? `${path}L${x(defined[defined.length - 1].i).toFixed(1)},${y(min)}L${x(defined[0].i).toFixed(1)},${y(min)}Z` : '';
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lijngrafiek">
    ${ticks.map((t) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-label" x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${format(Math.round(t))}</text>`).join('')}
    ${points.map((p, i) => ((i % labelEvery === 0 && (n - 1 - i >= labelEvery * 0.6 || i === n - 1)) || i === n - 1 ? `<text class="axis-label" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(p.label || fmtDay(p.day))}</text>` : '')).join('')}
    ${target != null ? `<line class="target-line" x1="${m.l}" x2="${W - m.r}" y1="${y(target)}" y2="${y(target)}"/><text class="target-label" x="${W - m.r}" y="${y(target) - 6}" text-anchor="end">${esc(targetLabel)}</text>` : ''}
    ${area ? `<path class="area" d="${area}" fill="${color}"/>` : ''}
    <path class="line" d="${path}" stroke="${color}"/>
    ${defined.map((p) => `<circle class="dot" cx="${x(p.i)}" cy="${y(p.value)}" r="4" fill="${color}"/>`).join('')}
    <line class="cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}"/>
    <rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/>
  </svg>`;
  const svg = container.querySelector('svg');
  const cross = svg.querySelector('.cross');
  const tip = tipEl(container);
  svg.querySelector('.hit').addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    let best = defined[0];
    for (const p of defined) if (Math.abs(x(p.i) - sx) < Math.abs(x(best.i) - sx)) best = p;
    cross.setAttribute('x1', x(best.i));
    cross.setAttribute('x2', x(best.i));
    cross.style.opacity = 1;
    const px = (x(best.i) / W) * r.width;
    const py = (y(best.value) / H) * r.height;
    showTip(container, tip, `<b>${esc(best.label || fmtDay(best.day))}</b><br>${format(best.value)}${unit}`, px, py);
  });
  svg.querySelector('.hit').addEventListener('mouseleave', () => { tip.style.opacity = 0; cross.style.opacity = 0; });
}

/** Staafgrafiek met één reeks. data: [{ label, value, tip }] */
export function barChart(container, { data, color = SERIES.blue, unit = '', height = 200, goal = null, goalLabel = '' }) {
  const W = 640;
  const H = height;
  const m = { t: 14, r: 12, b: 28, l: 40 };
  container.classList.add('chart');
  const max = niceMax(Math.max(1, ...data.map((d) => d.value), goal || 0) * 1.08);
  const n = data.length;
  const slot = (W - m.l - m.r) / n;
  const bw = Math.max(4, Math.min(48, slot - 2));
  const y = (v) => m.t + (1 - v / max) * (H - m.t - m.b);
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const labelEvery = Math.max(1, Math.ceil(n / 10));
  const r = Math.min(4, bw / 2);
  const barPath = (x0, v) => {
    const top = y(v);
    const bottom = y(0);
    if (v <= 0) return '';
    const rr = Math.min(r, bottom - top);
    return `M${x0},${bottom}V${top + rr}Q${x0},${top} ${x0 + rr},${top}H${x0 + bw - rr}Q${x0 + bw},${top} ${x0 + bw},${top + rr}V${bottom}Z`;
  };
  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Staafgrafiek">
    ${ticks.map((t) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-label" x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${Math.round(t)}</text>`).join('')}
    ${goal != null ? `<line class="target-line" x1="${m.l}" x2="${W - m.r}" y1="${y(goal)}" y2="${y(goal)}"/><text class="target-label" x="${W - m.r}" y="${y(goal) - 6}" text-anchor="end">${esc(goalLabel)}</text>` : ''}
    ${data.map((d, i) => {
      const x0 = m.l + i * slot + (slot - bw) / 2;
      return `<path class="bar" data-i="${i}" d="${barPath(x0, d.value)}" fill="${d.color || color}"/>
        <rect class="hit" data-i="${i}" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${H - m.t - m.b}"/>
        ${i % labelEvery === 0 ? `<text class="axis-label" x="${x0 + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>` : ''}`;
    }).join('')}
  </svg>`;
  const svg = container.querySelector('svg');
  const tip = tipEl(container);
  svg.querySelectorAll('.hit').forEach((h) => {
    h.addEventListener('mousemove', () => {
      const i = Number(h.dataset.i);
      const d = data[i];
      const rect = svg.getBoundingClientRect();
      const px = ((m.l + i * slot + slot / 2) / W) * rect.width;
      const py = (y(d.value) / H) * rect.height;
      showTip(container, tip, d.tip || `<b>${esc(d.label)}</b><br>${d.value}${unit}`, px, py);
    });
    h.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
  });
}

/** Toetsenbord-heatmap: foutpercentage per toets. */
export function keyHeatmap(container, keys, { minHits = 5 } = {}) {
  container.classList.add('chart');
  const rate = (k) => {
    const s = keys[k];
    if (!s || s.hits + s.misses < minHits) return null;
    return s.misses / (s.hits + s.misses);
  };
  const bins = [0.02, 0.05, 0.1, 0.18];
  const colorFor = (r) => SEQ[bins.findIndex((b) => r < b) === -1 ? 4 : bins.findIndex((b) => r < b)];
  const rows = KEY_ROWS.slice(0, 4).map((row) => row.filter(([k]) => k.length === 1));
  container.innerHTML = `<div class="heat-kb" role="img" aria-label="Foutpercentage per toets">${rows.map((row, ri) => `<div class="heat-row" style="padding-left:${[0, 18, 28, 44][ri]}px">${row.map(([k]) => {
    const r = rate(k);
    const s = keys[k];
    const bg = r == null ? '' : `background:${colorFor(r)};color:${r >= 0.05 ? '#fff' : '#0b1230'};border-color:transparent`;
    const title = s ? `${k.toUpperCase()}: ${Math.round((s.misses / Math.max(1, s.hits + s.misses)) * 100)}% fout (${s.misses} van ${s.hits + s.misses})` : `${k.toUpperCase()}: nog niet geoefend`;
    return `<span class="heat-key ${r == null ? 'none' : ''}" style="--w:1;${bg}" data-tip="${esc(title)}">${esc(k.toUpperCase())}</span>`;
  }).join('')}</div>`).join('')}</div>
  <div class="heat-scale"><span>minder fouten</span><span class="ramp">${SEQ.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span>meer fouten</span><span class="spacer"></span><span>grijs = te weinig gegevens</span></div>`;
  const tip = tipEl(container);
  container.querySelectorAll('.heat-key').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const cr = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      showTip(container, tip, esc(el.dataset.tip), r.left - cr.left + r.width / 2, r.top - cr.top);
    });
    el.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
  });
}

/** Lijst van toetsen met de meeste fouten. */
export function worstKeys(keys, n = 5, minHits = 8) {
  return Object.entries(keys)
    .filter(([, s]) => s.hits + s.misses >= minHits && s.misses > 0)
    .map(([k, s]) => ({ key: k, rate: s.misses / (s.hits + s.misses), misses: s.misses, total: s.hits + s.misses }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, n);
}

/** Fouten per vinger als horizontale balken. */
export function fingerBars(container, fingers) {
  const order = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];
  const rows = order.map((f) => {
    const s = fingers[f];
    return { f, rate: s && s.hits + s.misses >= 5 ? s.misses / (s.hits + s.misses) : null, s };
  });
  const max = Math.max(0.05, ...rows.map((r) => r.rate || 0));
  container.innerHTML = `<div class="finger-bars">${rows.map((r) => `<div class="finger-bar"><span>${esc(FINGERS[r.f].name)}</span>
    <span class="track"><i style="width:${r.rate == null ? 0 : Math.max(2, (r.rate / max) * 100)}%;background:${SERIES.blue}"></i></span>
    <span class="num" style="text-align:right">${r.rate == null ? '–' : `${(r.rate * 100).toFixed(1)}%`}</span></div>`).join('')}</div>`;
}

/** Oefenkalender: minuten per dag (laatste weken). */
export function calendar(container, days) {
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const color = (m) => (m <= 0 ? '' : SEQ[Math.min(4, Math.floor((m / max) * 4.999))]);
  // begin op maandag
  const first = new Date(`${days[0].day}T12:00:00`);
  const pad = (first.getDay() + 6) % 7;
  const cells = [...Array(pad).fill(null), ...days];
  container.classList.add('chart');
  container.innerHTML = `<div class="cal" role="img" aria-label="Oefenkalender">${cells.map((d) => (d
    ? `<i style="${d.minutes > 0 ? `background:${color(d.minutes)};border-color:transparent` : ''}" data-tip="${esc(`${fmtDay(d.day)}: ${Math.round(d.minutes)} min`)}"></i>`
    : '<i style="visibility:hidden"></i>')).join('')}</div>
    <div class="heat-scale"><span>0 min</span><span class="ramp">${SEQ.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span>${Math.round(max)} min</span></div>`;
  const tip = tipEl(container);
  container.querySelectorAll('.cal i[data-tip]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const cr = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      showTip(container, tip, esc(el.dataset.tip), r.left - cr.left + r.width / 2, r.top - cr.top);
    });
    el.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
  });
}
