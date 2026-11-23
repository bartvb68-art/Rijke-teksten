// Gedeelde stukjes interface voor leerling en leerkracht.
import { esc } from './lib.js';
import { icon } from './icons.js';
import { DOMAINS, DOMAIN_BY_ID, SKILL_BY_ID, niveauFor } from './shared/skills.js';

export const nivClass = (id) => `niv niv-${id === '1F+' ? '1Fp' : id}`;
export function nivChip(niveau, { title = '' } = {}) {
  return `<span class="${nivClass(niveau.id)}" title="${esc(title || niveau.name)}">${esc(niveau.short)}</span>`;
}
export function nivFromTheta(theta, domain, n = 99) {
  return niveauFor(n >= 5 && theta != null ? theta : null, domain);
}
export const domColor = (id) => `var(--${id})`;
export function domLabel(id) {
  const d = DOMAIN_BY_ID[id];
  return `<span class="dom"><i style="background:${domColor(id)}"></i>${esc(d.name)}</span>`;
}
export function skillName(id) { return SKILL_BY_ID[id]?.name || id; }
export function skillLabel(id) {
  const s = SKILL_BY_ID[id];
  if (!s) return esc(id);
  return `<span class="focus-chip ${s.domain}">${esc(s.name)}</span>`;
}
export const domainIcon = (id) => icon(DOMAIN_BY_ID[id].icon);

/** Niveaumeter: theta 1..5 naar een balk met de referentieniveaus. */
export function levelMeter(theta, domain) {
  const pct = theta == null ? null : Math.max(0, Math.min(100, ((theta - 1) / 4) * 100));
  const d = DOMAIN_BY_ID[domain];
  return `<div class="level-meter" role="img" aria-label="Niveau ${esc(niveauFor(theta, domain).name)}">
    <div class="track">${pct == null ? '' : `<span class="pin" style="left:${pct}%"></span>`}</div>
    <div class="scale"><span>op weg naar 1F</span><span>1F</span><span>op weg naar ${d.streef}</span><span>${d.streef}</span></div></div>`;
}

export function niveauLegend() {
  return `<div class="legend"><span>Niveau:</span>
    <span><span class="niv niv-onder">&lt;1F</span> op weg naar 1F</span>
    <span><span class="niv niv-1F">1F</span></span>
    <span><span class="niv niv-1Fp">1F→</span> op weg naar 2F/1S</span>
    <span><span class="niv niv-2F">2F/1S</span></span>
    <span><span class="niv niv-onbekend">–</span> nog te weinig gegevens</span></div>`;
}

export const thetaFmt = (t) => (t == null ? '–' : t.toFixed(1).replace('.', ','));
export { DOMAINS };
