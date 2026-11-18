// Toetsenbord op het scherm, met vingerkleuren en handen.
import { KEY_ROWS, CHAR_INFO, FINGERS, shiftKeyFor } from './shared/curriculum.js';
import { esc } from './lib.js';

export const FINGER_COLORS = {
  lp: '#e87ba4', rp: '#e87ba4',
  lr: '#eda100', rr: '#eda100',
  lm: '#1baf7a', rm: '#1baf7a',
  li: '#3987e5', ri: '#3987e5',
  th: '#9085e9',
};

const LABELS = {
  Backspace: '⌫', Tab: 'Tab', CapsLock: 'Caps', Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift', ' ': '',
};

export function keyboardHtml({ known = null } = {}) {
  return `<div class="kb" aria-hidden="true">${KEY_ROWS.map((row) => `<div class="kb-row">${row.map(([key, shifted, finger, w]) => {
    const label = LABELS[key] ?? key.toUpperCase();
    const isChar = key.length === 1 && key !== ' ';
    const dim = known && isChar && !known.has(key) ? ' dim' : '';
    const home = ['f', 'j'].includes(key) ? ' bump' : '';
    const sub = isChar && shifted && !/[A-Z]/.test(shifted) ? `<small>${esc(shifted)}</small>` : '';
    return `<div class="kb-key${dim}${home}" data-key="${esc(key)}" data-finger="${finger}" style="--w:${w || 1};--fc:${FINGER_COLORS[finger]}">${sub}<span>${esc(label)}</span></div>`;
  }).join('')}</div>`).join('')}</div>`;
}

// Gestileerde handen: per vinger een afgerond blokje.
const LEFT = [
  { f: 'lp', x: 6, y: 34, h: 38 },
  { f: 'lr', x: 26, y: 18, h: 52 },
  { f: 'lm', x: 46, y: 10, h: 60 },
  { f: 'li', x: 66, y: 18, h: 52 },
];

function handSvg(side) {
  const fingers = LEFT.map((d) => {
    const f = side === 'left' ? d.f : `r${d.f[1]}`;
    const x = side === 'left' ? d.x : 142 - d.x - 18;
    return `<rect class="finger" data-finger="${f}" x="${x}" y="${d.y}" width="18" height="${d.h + 20}" rx="9" style="--fc:${FINGER_COLORS[f]}"/>`;
  }).join('');
  const thumb = side === 'left'
    ? '<rect class="finger" data-finger="th" x="86" y="70" width="18" height="44" rx="9" transform="rotate(-38 95 92)" style="--fc:#9085e9"/>'
    : '<rect class="finger" data-finger="th" x="38" y="70" width="18" height="44" rx="9" transform="rotate(38 47 92)" style="--fc:#9085e9"/>';
  const palmX = side === 'left' ? 4 : 56;
  return `<svg class="hand hand-${side}" viewBox="0 0 142 140" aria-hidden="true">${fingers}${thumb}<rect class="palm" x="${palmX}" y="72" width="82" height="62" rx="24"/></svg>`;
}

export function handsHtml() {
  return `<div class="hands">${handSvg('left')}<div class="finger-hint" aria-live="polite"></div>${handSvg('right')}</div>`;
}

/** Markeer de volgende toets en vinger. */
export function highlightNext(root, char) {
  if (!root) return;
  root.querySelectorAll('.kb-key.next, .finger.active').forEach((el) => el.classList.remove('next', 'active'));
  const hint = root.querySelector('.finger-hint');
  if (char == null) { if (hint) hint.textContent = ''; return; }
  const info = CHAR_INFO[char];
  if (!info) return;
  root.querySelector(`.kb-key[data-key="${CSS.escape(info.key)}"]`)?.classList.add('next');
  root.querySelectorAll(`.finger[data-finger="${info.finger}"]`).forEach((el) => el.classList.add('active'));
  const shift = shiftKeyFor(char);
  let text = char === ' ' ? 'Spatie: duim' : FINGERS[info.finger].name;
  if (shift) {
    root.querySelector(`.kb-key[data-key="${shift}"]`)?.classList.add('next');
    const pinky = shift === 'ShiftLeft' ? 'lp' : 'rp';
    root.querySelectorAll(`.finger[data-finger="${pinky}"]`).forEach((el) => el.classList.add('active'));
    text += ` + Shift (${FINGERS[pinky].name})`;
  }
  if (hint) hint.textContent = text.charAt(0).toUpperCase() + text.slice(1);
}

export function flashKey(root, key, cls = 'wrong') {
  if (!root || !key) return;
  const k = key.length === 1 ? (CHAR_INFO[key]?.key ?? key.toLowerCase()) : key;
  const el = root.querySelector(`.kb-key[data-key="${CSS.escape(k)}"]`);
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 250);
}
