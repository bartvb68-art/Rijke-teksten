// De gitaar van de leerling als SVG.
import { SHOP, DEFAULT_AVATAR, shopItem } from './shared/rewards.js';

let uid = 0;

export function guitarSvg(avatar = DEFAULT_AVATAR, { size = 64, waves = true, cls = '' } = {}) {
  const a = { ...DEFAULT_AVATAR, ...avatar };
  const body = shopItem('body', a.body)?.color || SHOP.body[0].color;
  const guard = shopItem('guard', a.guard)?.color || '#f4f1ea';
  const wave = shopItem('waves', a.waves)?.color || '#ffc23d';
  const id = `g${++uid}`;
  let pattern = '';
  if (a.pattern === 'strepen') pattern = '<path d="M14 40l36 22M12 50l30 20" stroke="rgba(255,255,255,.55)" stroke-width="4"/>';
  if (a.pattern === 'stippen') pattern = '<g fill="rgba(0,0,0,.22)"><circle cx="22" cy="50" r="2.4"/><circle cx="40" cy="66" r="2.4"/><circle cx="20" cy="66" r="2"/><circle cx="44" cy="52" r="2"/><circle cx="30" cy="74" r="2"/></g>';
  if (a.pattern === 'noten') pattern = '<g fill="rgba(255,255,255,.75)"><path d="M20 47v8.5a2.6 2.6 0 11-1.6-2.4V47z"/><path d="M42 62v8.5a2.6 2.6 0 11-1.6-2.4V62z"/></g>';
  if (a.pattern === 'bliksem') pattern = '<path d="M30 44l-8 14h6l-4 14 11-17h-6l4-11z" fill="#ffe14d" stroke="rgba(0,0,0,.25)" stroke-width="1"/>';
  const bodyPath = 'M32 34c-4-6-17-5-18 5-1 6 4 8 3 13-1 6-5 8-4 14 1 9 10 12 19 12s18-3 19-12c1-6-3-8-4-14-1-5 4-7 3-13-1-10-14-11-18-5z';
  return `<svg class="guitar ${cls}" width="${size}" height="${size}" viewBox="0 0 64 84" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${bodyPath}"/></clipPath>
      <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>
    ${waves ? `<g class="guitar-waves" fill="none" stroke="${wave}" stroke-width="2.5" stroke-linecap="round"><path d="M7 48c-3 4-3 10 0 14"/><path d="M2 44c-5 7-5 19 0 26"/><path d="M57 48c3 4 3 10 0 14"/><path d="M62 44c5 7 5 19 0 26"/></g>` : ''}
    <rect x="29" y="2" width="6" height="6" rx="2" fill="#3b2a1a"/>
    <rect x="29.5" y="6" width="5" height="34" fill="#7a5230" stroke="rgba(0,0,0,.3)"/>
    <g stroke="rgba(255,255,255,.55)" stroke-width="1"><path d="M31 8h2M31 13h2M31 18h2M31 23h2M31 28h2"/></g>
    <path d="${bodyPath}" fill="${body}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
    <g clip-path="url(#${id})">${pattern}<rect x="0" y="30" width="64" height="54" fill="url(#${id}g)"/></g>
    <path d="M38 52c6 0 10 4 9 10-1 5-6 7-10 6z" fill="${guard}" stroke="rgba(0,0,0,.2)"/>
    <circle cx="32" cy="56" r="5.5" fill="#2a1a12" stroke="rgba(255,255,255,.25)"/>
    <rect x="26" y="68" width="12" height="3.5" rx="1.5" fill="#2a1a12"/>
    <g stroke="#e6e1d6" stroke-width=".7"><path d="M30.6 6v64M32 6v64M33.4 6v64"/></g>
  </svg>`;
}
