// Hulpfuncties voor het maken van opgaven.

export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Getal in Nederlandse notatie: 12.345,6 */
export function nl(n, decimals = null) {
  const neg = n < 0;
  let s = decimals == null ? String(Math.round(Math.abs(n) * 1e6) / 1e6) : Math.abs(n).toFixed(decimals);
  let [int, dec] = s.split('.');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + int + (dec ? `,${dec}` : '');
}
export const euro = (n) => `€ ${nl(n, Number.isInteger(n) ? 0 : 2)}${Number.isInteger(n) ? ',-' : ''}`;
export const euro2 = (n) => `€ ${nl(n, 2)}`;
export const round = (n, d = 6) => Math.round(n * 10 ** d) / 10 ** d;

/** Meerkeuze met unieke opties, de goede ertussen, door elkaar. */
export function mc(answer, distractors, { keepOrder = false } = {}) {
  const seen = new Set([String(answer)]);
  const opts = [String(answer)];
  for (const d of distractors) {
    const s = String(d);
    if (!seen.has(s) && opts.length < 4) { seen.add(s); opts.push(s); }
  }
  return { type: 'mc', options: keepOrder ? opts : shuffle(opts), answer: String(answer) };
}

/** Numerieke afleiders rond een antwoord (alleen positief, uniek). */
export function numDistractors(ans, cands) {
  return cands.filter((c) => c !== ans && c >= 0 && Number.isFinite(c));
}

// ---------- kleine SVG-figuren ----------
const SVG_STYLE = 'class="fig" xmlns="http://www.w3.org/2000/svg"';

export function svgRect(w, h, labelW, labelH, { fill = '#e8f1fc' } = {}) {
  const W = 300; const H = 200;
  const s = Math.min(220 / w, 130 / h);
  const rw = w * s; const rh = h * s;
  const x = (W - rw) / 2; const y = (H - rh) / 2 - 6;
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Rechthoek van ${esc(labelW)} bij ${esc(labelH)}">
    <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="${fill}" stroke="currentColor" stroke-width="2"/>
    <text x="${W / 2}" y="${y + rh + 22}" text-anchor="middle">${esc(labelW)}</text>
    <text x="${x + rw + 8}" y="${y + rh / 2 + 5}">${esc(labelH)}</text></svg>`;
}

/** L-vorm: een rechthoek a×b waaruit rechtsboven c×d is weggehaald. */
export function svgL(a, b, c, d, unit) {
  const W = 320; const H = 230;
  const s = Math.min(230 / a, 160 / b);
  const x0 = 40; const y0 = 20;
  const pts = [[0, 0], [a - c, 0], [a - c, d], [a, d], [a, b], [0, b]].map(([x, y]) => `${x0 + x * s},${y0 + y * s}`).join(' ');
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Samengestelde figuur">
    <polygon points="${pts}" fill="#e8f1fc" stroke="currentColor" stroke-width="2"/>
    <text x="${x0 + (a * s) / 2}" y="${y0 + b * s + 20}" text-anchor="middle">${a} ${unit}</text>
    <text x="${x0 - 8}" y="${y0 + (b * s) / 2}" text-anchor="end">${b} ${unit}</text>
    <text x="${x0 + ((a - c) * s) / 2}" y="${y0 - 5}" text-anchor="middle">${a - c} ${unit}</text>
    <text x="${x0 + (a - c) * s + 6}" y="${y0 + (d * s) / 2 + 4}">${d} ${unit}</text></svg>`;
}

export function svgBox(l, b, h, unit) {
  const W = 300; const H = 210;
  const s = Math.min(150 / l, 90 / h, 70 / b);
  const L = l * s; const B = b * s * 0.7; const Hh = h * s;
  const x = 50; const y = 50 + B * 0.6;
  const dx = B; const dy = -B * 0.6;
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Balk">
    <polygon points="${x},${y} ${x + L},${y} ${x + L},${y + Hh} ${x},${y + Hh}" fill="#e8f1fc" stroke="currentColor" stroke-width="2"/>
    <polygon points="${x},${y} ${x + dx},${y + dy} ${x + L + dx},${y + dy} ${x + L},${y}" fill="#d3e5fa" stroke="currentColor" stroke-width="2"/>
    <polygon points="${x + L},${y} ${x + L + dx},${y + dy} ${x + L + dx},${y + Hh + dy} ${x + L},${y + Hh}" fill="#bcd6f6" stroke="currentColor" stroke-width="2"/>
    <text x="${x + L / 2}" y="${y + Hh + 20}" text-anchor="middle">${l} ${unit}</text>
    <text x="${x - 8}" y="${y + Hh / 2 + 4}" text-anchor="end">${h} ${unit}</text>
    <text x="${x + L + dx / 2 + 10}" y="${y + Hh + dy / 2 + 14}">${b} ${unit}</text></svg>`;
}

export function svgTriangle(base, height, unit) {
  const W = 300; const H = 200;
  const s = Math.min(220 / base, 140 / height);
  const x = (W - base * s) / 2; const y = 20 + height * s;
  const apex = x + base * s * 0.35;
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Driehoek">
    <polygon points="${x},${y} ${x + base * s},${y} ${apex},20" fill="#e8f1fc" stroke="currentColor" stroke-width="2"/>
    <line x1="${apex}" y1="20" x2="${apex}" y2="${y}" stroke="currentColor" stroke-dasharray="5 4"/>
    <rect x="${apex}" y="${y - 10}" width="10" height="10" fill="none" stroke="currentColor"/>
    <text x="${(x + x + base * s) / 2}" y="${y + 20}" text-anchor="middle">${base} ${unit}</text>
    <text x="${apex + 8}" y="${(20 + y) / 2}">${height} ${unit}</text></svg>`;
}

/** Strook verdeeld in n gelijke delen, k gekleurd. */
export function svgStrip(n, k) {
  const W = 320; const H = 70; const w = 280 / n;
  let out = '';
  for (let i = 0; i < n; i++) out += `<rect x="${20 + i * w}" y="15" width="${w}" height="40" fill="${i < k ? '#3987e5' : '#fff'}" stroke="#1d2a44" stroke-width="2"/>`;
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Strook met ${n} delen">${out}</svg>`;
}

/** Cirkel verdeeld in n gelijke taartpunten, k gekleurd. */
export function svgPie(n, k) {
  const r = 70; const cx = 90; const cy = 85;
  let out = '';
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    const p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
    out += `<path d="M${cx},${cy}L${p1[0].toFixed(1)},${p1[1].toFixed(1)}A${r},${r} 0 0 1 ${p2[0].toFixed(1)},${p2[1].toFixed(1)}Z" fill="${i < k ? '#eb6834' : '#fff'}" stroke="#1d2a44" stroke-width="2"/>`;
  }
  return `<svg ${SVG_STYLE} viewBox="0 0 180 170" role="img" aria-label="Cirkel met ${n} delen">${out}</svg>`;
}

/** Honderdveld met k gekleurde vakjes. */
export function svgHundred(k) {
  let out = '';
  for (let i = 0; i < 100; i++) {
    const x = 10 + (i % 10) * 15; const y = 10 + Math.floor(i / 10) * 15;
    out += `<rect x="${x}" y="${y}" width="15" height="15" fill="${i < k ? '#1baf7a' : '#fff'}" stroke="#1d2a44" stroke-width="1"/>`;
  }
  return `<svg ${SVG_STYLE} viewBox="0 0 170 170" role="img" aria-label="Honderdveld">${out}</svg>`;
}

/** Getallenlijn van a tot b met n stappen; pijl bij stap k. */
export function svgNumberLine(a, b, n, k, fmt = nl) {
  const W = 360; const x0 = 20; const x1 = 340; const y = 50;
  const step = (x1 - x0) / n;
  let ticks = '';
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * step;
    const big = i === 0 || i === n;
    ticks += `<line x1="${x}" y1="${y - (big ? 12 : 7)}" x2="${x}" y2="${y + (big ? 12 : 7)}" stroke="currentColor" stroke-width="2"/>`;
  }
  const px = x0 + k * step;
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} 100" role="img" aria-label="Getallenlijn">
    <line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="currentColor" stroke-width="2"/>${ticks}
    <text x="${x0}" y="${y + 32}" text-anchor="middle">${esc(fmt(a))}</text>
    <text x="${x1}" y="${y + 32}" text-anchor="middle">${esc(fmt(b))}</text>
    <path d="M${px},${y - 16} l-7,-14 h14 z" fill="#eb6834"/></svg>`;
}

/** Staafdiagram (tabelwaarden) als SVG. */
export function svgBars(data, { unit = '', max = null, title = '' } = {}) {
  const W = 380; const H = 230; const m = { l: 44, r: 10, t: 24, b: 34 };
  const top = max || Math.ceil(Math.max(...data.map((d) => d.value)) / 10) * 10 || 10;
  const slot = (W - m.l - m.r) / data.length;
  const y = (v) => m.t + (1 - v / top) * (H - m.t - m.b);
  const gridStep = top <= 20 ? 2 : top <= 50 ? 5 : top <= 100 ? 10 : top <= 200 ? 20 : top <= 500 ? 50 : 100;
  let grid = '';
  for (let v = 0; v <= top; v += gridStep) grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#d9dce5"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11">${v}</text>`;
  const bars = data.map((d, i) => `<rect x="${m.l + i * slot + slot * 0.18}" y="${y(d.value)}" width="${slot * 0.64}" height="${y(0) - y(d.value)}" fill="#3987e5"/>
    <text x="${m.l + i * slot + slot / 2}" y="${H - 14}" text-anchor="middle" font-size="12">${esc(d.label)}</text>`).join('');
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Staafdiagram ${esc(title)}">
    <text x="${m.l}" y="14" font-size="12" font-weight="600">${esc(title)}${unit ? ` (${esc(unit)})` : ''}</text>${grid}${bars}</svg>`;
}

/** Lijngrafiek als SVG. */
export function svgLine(data, { unit = '', min = 0, max, title = '' } = {}) {
  const W = 380; const H = 230; const m = { l: 44, r: 14, t: 24, b: 34 };
  const n = data.length;
  const x = (i) => m.l + (i / (n - 1)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);
  const step = (max - min) / 5;
  let grid = '';
  for (let v = min; v <= max + 1e-9; v += step) grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#d9dce5"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11">${nl(round(v, 1))}</text>`;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('');
  return `<svg ${SVG_STYLE} viewBox="0 0 ${W} ${H}" role="img" aria-label="Lijngrafiek ${esc(title)}">
    <text x="${m.l}" y="14" font-size="12" font-weight="600">${esc(title)}${unit ? ` (${esc(unit)})` : ''}</text>${grid}
    <path d="${path}" fill="none" stroke="#eb6834" stroke-width="3"/>
    ${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.value)}" r="4" fill="#eb6834"/><text x="${x(i)}" y="${H - 14}" text-anchor="middle" font-size="11">${esc(d.label)}</text>`).join('')}</svg>`;
}

export function table(head, rows, caption = '') {
  return `<table class="data-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
