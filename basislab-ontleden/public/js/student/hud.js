import { esc } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { session, logout, schoolLogoHtml, syncBand } from '../app.js';
import { eqHtml } from '../fx.js';
import { setSoundEnabled } from '../sound.js';
import { api } from '../lib.js';

export function hudHtml(active = '') {
  const st = session.state;
  const s = st.student;
  const rank = s.rank;
  const pct = rank.next ? Math.round(((s.xp - rank.xp) / (rank.next.xp - rank.xp)) * 100) : 100;
  const nav = [
    ['kaart', '#/kaart', 'map', 'Tourkaart'],
    ['studio', '#/studio', 'guitar', 'Studio'],
    ['platen', '#/platen', 'disc', 'Gouden platen'],
  ];
  return `<header class="hud">
    ${schoolLogoHtml({ size: 36, cls: 'on-dark' })}
    <a class="brand" href="#/kaart" aria-label="Basislab Ontleden"><img src="/img/icon.svg" alt=""><span class="brand-text">Basis<span class="lab">lab</span> <span class="prog">Ontleden</span></span></a>
    <nav aria-label="Menu">${nav.map(([id, href, ic, label]) => `<a class="hud-pill ${active === id ? 'active' : ''}" href="${href}">${icon(ic)}${label}</a>`).join('')}</nav>
    <span class="spacer"></span>
    <span class="hud-pill" title="${s.xp} XP">${guitarSvg(s.avatar, { size: 26, waves: false })}<span>${esc(s.name)} · ${esc(rank.name)}</span><span class="xp-bar" aria-label="${pct}% naar volgende rang"><i style="width:${pct}%"></i></span></span>
    <span class="hud-pill coins" title="Muzieknoten">${icon('note')}<span data-coins>${s.coins}</span></span>
    <span class="hud-pill streak" title="Dagen op rij geoefend">${icon('flame')}${st.stats.streak}</span>
    <button class="hud-pill music-toggle ${s.settings.music !== false && s.settings.sound ? 'on' : ''}" data-music title="Muziek van je band aan/uit" aria-label="Muziek aan of uit" aria-pressed="${s.settings.music !== false}">${eqHtml()}<span>Muziek</span></button>
    <button class="hud-pill btn-ghost" data-sound title="Geluid aan/uit" aria-label="Geluid aan of uit">${icon(s.settings.sound ? 'sound' : 'mute')}</button>
    <button class="hud-pill btn-ghost icon-only" data-logout title="Uitloggen" aria-label="Uitloggen">${icon('logout')}<span>Uitloggen</span></button>
  </header>`;
}

export function bindHud(root) {
  root.querySelector('[data-music]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const s = session.state.student.settings;
    const on = !(s.music !== false);
    s.music = on;
    if (on && !s.sound) { s.sound = true; setSoundEnabled(true); }
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    btn.blur();
    syncBand();
    try { session.state = await api('POST', '/api/student/settings', { music: on, sound: s.sound }); } catch { /* niet erg */ }
  });
  root.querySelector('[data-logout]')?.addEventListener('click', () => logout());
  root.querySelector('[data-sound]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const on = !session.state.student.settings.sound;
    session.state.student.settings.sound = on;
    setSoundEnabled(on);
    btn.innerHTML = icon(on ? 'sound' : 'mute');
    btn.blur();
    syncBand();
    root.querySelector('[data-music]')?.classList.toggle('on', on && session.state.student.settings.music !== false);
    try {
      session.state = await api('POST', '/api/student/settings', { sound: on });
    } catch { /* niet erg */ }
  });
}
