import { esc } from '../lib.js';
import { icon } from '../icons.js';
import { session, logout, schoolLogoHtml } from '../app.js';

export function shell(root, active, content) {
  const t = session.teacher;
  root.innerHTML = `<div class="t-shell">
    <header class="t-top">
      ${schoolLogoHtml({ size: 34 })}
      <a class="brand" href="${t ? '#/dashboard' : '#/'}"><img src="/img/icon.svg" alt="">Basislab Typen <span class="muted" style="font-weight:500">· volgsysteem</span></a>
      <nav aria-label="Menu">
        ${t ? `<a href="#/dashboard" class="${active === 'dashboard' ? 'active' : ''}">${icon('users')} Mijn klassen</a>` : ''}
        ${t?.is_admin ? `<a href="#/beheer" class="${active === 'beheer' ? 'active' : ''}" data-testid="nav-beheer">${icon('settings')} Beheer</a>` : ''}
        <a href="#/uitleg" class="${active === 'uitleg' ? 'active' : ''}">${icon('video')} Uitleg</a>
      </nav>
      <span class="spacer"></span>
      ${t ? `<a class="muted" href="#/account" title="Mijn account">${icon('user')} ${esc(t.name)}</a><button class="btn btn-ghost btn-sm" data-logout>${icon('logout')} Uitloggen</button>` : '<a class="btn btn-ghost btn-sm" href="#/">Start</a>'}
    </header>
    <main class="t-main">${content}</main>
  </div>`;
  root.querySelector('[data-logout]')?.addEventListener('click', () => logout());
  return root.querySelector('.t-main');
}
