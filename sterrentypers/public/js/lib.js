// Kleine hulpfuncties voor de hele app.

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'sterrentypers' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth')) {
      window.dispatchEvent(new CustomEvent('st:logged-out'));
    }
    throw new ApiError(res.status, data?.error || 'Er ging iets mis. Probeer het opnieuw.');
  }
  return data;
}

let toastTimer;
export function toast(message, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.className = `toast toast-${kind} show`;
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

/** Toon een dialoog; resolves met de waarde van de gekozen knop. */
export function modal({ title, body, actions = [{ label: 'OK', value: true, primary: true }], className = '', withData = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${esc(className)}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${esc(title)}</h2>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          ${actions.map((a, i) => `<button type="button" class="btn ${a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'}" data-i="${i}">${esc(a.label)}</button>`).join('')}
        </div>
      </div>`;
    const close = (v) => {
      const form = wrap.querySelector('form');
      const data = form ? Object.fromEntries(new FormData(form).entries()) : {};
      wrap.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(withData ? { value: v, data } : v);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(null); }
    };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) close(actions[Number(b.dataset.i)].value);
      else if (e.target === wrap) close(null);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = actions.find((a) => a.primary);
        close(p ? p.value : true);
      });
      form.querySelector('input, textarea, select')?.focus();
    } else {
      const primary = wrap.querySelector('.btn-primary') || wrap.querySelector('button');
      primary?.focus();
    }
  });
}

const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const longDateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

export const fmtDate = (ts) => (ts ? dateFmt.format(new Date(ts)) : '–');
export const fmtDateTime = (ts) => (ts ? dateTimeFmt.format(new Date(ts)) : '–');
export const fmtLongDate = (ts) => (ts ? longDateFmt.format(new Date(ts)) : '–');
export const fmtDay = (key) => dateFmt.format(new Date(`${key}T12:00:00`));

export function timeAgo(ts) {
  if (!ts) return 'nooit';
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 2) return 'net';
  if (min < 60) return `${min} min geleden`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} uur geleden`;
  const d = Math.round(h / 24);
  if (d === 1) return 'gisteren';
  if (d < 14) return `${d} dagen geleden`;
  return fmtDate(ts);
}

export function minutesLabel(min) {
  if (min == null) return '–';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} u ${m} min` : `${h} u`;
}

export function starsHtml(n, max = 3, cls = '') {
  let out = `<span class="stars ${cls}" aria-label="${n} van ${max} sterren">`;
  for (let i = 0; i < max; i++) out += `<svg viewBox="0 0 24 24" class="star ${i < n ? 'on' : ''}" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
  return out + '</span>';
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const isTouchOnly = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;
