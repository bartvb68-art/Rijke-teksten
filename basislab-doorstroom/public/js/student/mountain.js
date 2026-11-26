// Bergroute: elke week een stap op het pad naar de top (de doorstroomtoets).
export function mountainSvg(route, currentIndex) {
  const W = 560; const H = 330;
  const n = Math.max(route.length, 2);
  const pts = route.map((_, i) => {
    const t = i / (n - 1);
    return [70 + t * 330 + Math.sin(t * Math.PI * 3.5) * 46 * (1 - t * 0.7), 300 - t * 250];
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const steps = route.map((w, i) => {
    const [x, y] = pts[i];
    const top = i === route.length - 1;
    const done = w.goal > 0 && w.done >= w.goal;
    const cur = i === currentIndex;
    const past = i < currentIndex;
    if (top) return `<path d="M${x},${y} V${y - 36}" stroke="#1b1d26" stroke-width="3"/><path d="M${x},${y - 36} l22,7 l-22,7z" fill="#d9592a"/>
      <text x="${x + 26}" y="${y - 20}" class="flag-label">toets</text>`;
    const fill = w.holiday ? '#c3c9d6' : done ? '#1baf7a' : cur ? '#ffc23d' : past ? '#f2a07f' : '#ffffff';
    return `<g><title>Week ${i + 1}${w.holiday ? ' (vakantie)' : ''}${w.test ? ' · proeftoets' : ''}${w.goal ? ` · ${w.done}/${w.goal}` : ''}</title>
      <circle cx="${x}" cy="${y}" r="${cur ? 11 : 8}" fill="${fill}" stroke="#1b1d26" stroke-width="2"/>
      ${w.test ? `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1b1d26">T</text>` : done ? `<path d="M${x - 4},${y} l3,3 l5,-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : ''}
      ${cur ? `<g transform="translate(${x + 14},${y - 34})"><circle cx="8" cy="6" r="6" fill="#1F5FAE"/><path d="M0 28 q8 -20 16 0z" fill="#1F5FAE"/><path d="M15 12 l6 16" stroke="#6b4f2a" stroke-width="2"/></g>
        <text x="${x + 38}" y="${y - 6}" class="flag-label">jij bent hier</text>` : ''}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Bergroute naar de doorstroomtoets: week ${currentIndex + 1} van ${route.length}">
    <rect width="${W}" height="${H}" fill="#E2EAF4"/>
    <path d="M-10 ${H} L120 150 L210 220 L400 22 L500 150 L${W + 10} 120 L${W + 10} ${H} Z" fill="#AAC2E0"/>
    <path d="M400 22 L366 62 L382 58 L398 72 L418 56 L432 62 Z" fill="#fff"/>
    <path d="M-10 ${H} L60 250 L170 280 L300 200 L460 290 L${W + 10} 250 L${W + 10} ${H} Z" fill="#C9D8EC"/>
    <path d="${path}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12"/>
    ${steps}
  </svg>`;
}

export function mountainLegend() {
  const dot = (c, extra = '') => `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" fill="${c}" stroke="#1b1d26" stroke-width="1.5"/>${extra}</svg>`;
  return `<div class="legend" style="padding:8px 12px">${dot('#1baf7a')} weektaak af ${dot('#f2a07f')} niet af ${dot('#ffc23d')} deze week ${dot('#fff', '<text x="7" y="10" font-size="8" text-anchor="middle" font-weight="700">T</text>')} proeftoets ${dot('#c3c9d6')} vakantie</div>`;
}
