// De raket van de leerling als SVG.
import { SHOP, DEFAULT_AVATAR, shopItem } from './shared/rewards.js';

let uid = 0;

export function rocketSvg(avatar = DEFAULT_AVATAR, { size = 64, flame = true, cls = '' } = {}) {
  const a = { ...DEFAULT_AVATAR, ...avatar };
  const body = shopItem('body', a.body)?.color || SHOP.body[0].color;
  const win = shopItem('window', a.window)?.color || '#86b6ef';
  const fl = shopItem('flame', a.flame)?.color || '#ff9a3c';
  const id = `r${++uid}`;
  let pattern = '';
  if (a.pattern === 'strepen') pattern = '<path d="M22 52h20M21 58h22" stroke="rgba(0,0,0,.28)" stroke-width="3"/>';
  if (a.pattern === 'stippen') pattern = '<g fill="rgba(0,0,0,.25)"><circle cx="26" cy="50" r="2"/><circle cx="38" cy="54" r="2"/><circle cx="30" cy="60" r="2"/><circle cx="36" cy="44" r="1.6"/></g>';
  if (a.pattern === 'sterren') pattern = '<g fill="#fff8c4"><path d="M27 50l1 2.4 2.5.2-1.9 1.6.6 2.5-2.2-1.4-2.2 1.4.6-2.5-1.9-1.6 2.5-.2z"/><path d="M37 57l.8 1.8 2 .2-1.5 1.2.5 2-1.8-1-1.8 1 .5-2-1.5-1.2 2-.2z"/></g>';
  if (a.pattern === 'bliksem') pattern = '<path d="M35 44l-7 10h5l-3 9 8-12h-5z" fill="#ffe14d" stroke="rgba(0,0,0,.25)" stroke-width="1"/>';
  return `<svg class="rocket ${cls}" width="${size}" height="${size}" viewBox="0 0 64 80" aria-hidden="true">
    <defs>
      <clipPath id="${id}"><path d="M32 4c10 8 14 22 14 34v26H18V38c0-12 4-26 14-34z"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
    </defs>
    ${flame ? `<path class="rocket-flame" d="M24 64c2 8 5 12 8 15 3-3 6-7 8-15z" fill="${fl}"/><path class="rocket-flame inner" d="M28 64c1 5 2.5 7 4 9 1.5-2 3-4 4-9z" fill="#fff6d6"/>` : ''}
    <path d="M18 46L6 62v4l12-4zM46 46l12 16v4l-12-4z" fill="${body}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
    <path d="M32 4c10 8 14 22 14 34v26H18V38c0-12 4-26 14-34z" fill="${body}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
    <g clip-path="url(#${id})">${pattern}<rect x="18" y="0" width="28" height="70" fill="url(#${id}g)"/></g>
    <circle cx="32" cy="30" r="8" fill="${win}" stroke="#2a3557" stroke-width="3"/>
    <circle cx="29.5" cy="27.5" r="2.4" fill="#fff" opacity=".7"/>
    <rect x="22" y="62" width="20" height="4" rx="2" fill="#2a3557"/>
  </svg>`;
}
