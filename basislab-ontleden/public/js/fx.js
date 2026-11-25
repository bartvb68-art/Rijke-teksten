// Bewegende extra's: nootjesregen, meedansende zinsdelen, equalizer en de bandstrook.
import { icon } from './icons.js';

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLORS = ['#6a3fc8', '#eb5f36', '#9a7fdc', '#f2a900', '#1f5fae'];
const NOTES = ['♪', '♫', '♩', '♬'];

/** Een regen van muzieknootjes vanaf een element of punt. */
export function burst(from, count = 14) {
  if (reduce()) return;
  const r = from?.getBoundingClientRect ? from.getBoundingClientRect() : { left: from?.x ?? innerWidth / 2, top: from?.y ?? innerHeight / 2, width: 0, height: 0 };
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fx-note';
    el.textContent = NOTES[i % NOTES.length];
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const d = 70 + Math.random() * 110;
    el.style.cssText = `left:${x}px;top:${y}px;color:${COLORS[i % COLORS.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--rot:${(Math.random() - 0.5) * 120}deg;font-size:${18 + Math.random() * 18}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
}

/** Laat de zinsdelen als een golf meedansen. */
export function wave(container) {
  if (!container || reduce()) return;
  container.classList.remove('party');
  void container.offsetWidth;
  container.classList.add('party');
  setTimeout(() => container.classList.remove('party'), 1200);
}

/** Kleine equalizer die in de maat meebeweegt. */
export function eqHtml() {
  return '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
}

export const BAND = [
  { id: 'drums', name: 'Drums', icon: 'drum' },
  { id: 'bas', name: 'Bas', icon: 'guitar' },
  { id: 'keys', name: 'Keys', icon: 'piano' },
  { id: 'solo', name: 'Solo', icon: 'mic' },
];

/** De bandstrook: welke instrumenten spelen mee? */
export function bandStripHtml() {
  return `<div class="band-strip" data-band aria-label="Jouw band">
    <span class="band-label">${icon('note')} Jouw band</span>
    ${BAND.map((b, i) => `<span class="band-slot" data-slot="${i + 1}">${icon(b.icon)}<small>${b.name}</small></span>`).join('')}
    <span class="band-tip muted" data-band-tip>Elk goed antwoord op rij laat een instrument meespelen!</span>
  </div>`;
}

export function setBandStrip(root, level) {
  root?.querySelectorAll('.band-slot').forEach((s) => s.classList.toggle('on', Number(s.dataset.slot) <= level));
  const tip = root?.querySelector('[data-band-tip]');
  if (tip) tip.textContent = level >= 4 ? 'De hele band speelt! Houd het vol!' : level <= 1 ? 'Elk goed antwoord op rij laat een instrument meespelen!' : `Nog ${4 - level} goed op rij voor de hele band!`;
}

/** Zet de maat van de muziek door naar de pagina (class "beat" op body). */
let beatTimer;
window.addEventListener('bo:beat', (e) => {
  document.body.classList.add('beat');
  document.body.dataset.beat = e.detail.beat;
  clearTimeout(beatTimer);
  beatTimer = setTimeout(() => document.body.classList.remove('beat'), 130);
});
