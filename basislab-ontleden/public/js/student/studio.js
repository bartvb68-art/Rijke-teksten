import { api, esc, toast } from '../lib.js';
import { icon } from '../icons.js';
import { guitarSvg } from '../avatar.js';
import { session, setStudentState, applyStudentPrefs } from '../app.js';
import { SHOP } from '../shared/rewards.js';
import { sfx } from '../sound.js';
import { hudHtml, bindHud } from './hud.js';

const SLOTS = [
  ['body', 'Kleur'],
  ['pattern', 'Versiering'],
  ['guard', 'Slagplaat'],
  ['waves', 'Klank'],
];

export default async function studio(root) {
  setStudentState(await api('GET', '/api/student/state'));

  function render() {
    const s = session.state.student;
    const owned = new Set(s.owned);
    root.innerHTML = `${hudHtml('studio')}
    <div class="page">
      <h1>Studio</h1>
      <div class="hangar">
        <div class="card hangar-preview">
          ${guitarSvg(s.avatar, { size: 220 })}
          <p style="margin:0"><b>${esc(s.name)}</b> · ${esc(s.rank.name)}</p>
          <p class="muted" style="margin:0">${icon('note')} ${s.coins} muzieknoten</p>
          <p class="muted" style="font-size:.9rem">Verdien muzieknoten met sterren, spellen en elke dag oefenen.</p>
        </div>
        <div class="card">
          ${SLOTS.map(([slot, label]) => `<div class="shop-section"><h3>${label}</h3><div class="shop-grid">${SHOP[slot].map((item) => {
            const has = item.price === 0 || owned.has(`${slot}:${item.id}`);
            const selected = s.avatar[slot] === item.id;
            const cant = !has && s.coins < item.price;
            const preview = slot === 'pattern'
              ? guitarSvg({ ...s.avatar, pattern: item.id }, { size: 46, waves: false })
              : `<span class="swatch" style="background:${item.color}"></span>`;
            return `<button class="shop-item ${selected ? 'selected' : ''} ${cant ? 'cant' : ''}" data-slot="${slot}" data-id="${item.id}" aria-pressed="${selected}">
              ${preview}<span>${esc(item.name)}</span>
              ${has ? `<span class="muted" style="font-size:.78rem">${selected ? 'Gekozen' : 'Kies'}</span>` : `<span class="price">${icon('note')} ${item.price}</span>`}
            </button>`;
          }).join('')}</div></div>`).join('')}
          <div class="shop-section"><h3>Instellingen</h3>
            <label class="check"><input type="checkbox" data-set="readAloud" ${s.settings.readAloud ? 'checked' : ''}> Zinnen voorlezen bij de uitleg</label>
            <label class="check"><input type="checkbox" data-set="largeText" ${s.settings.largeText ? 'checked' : ''}> Grotere letters</label>
            <label class="check"><input type="checkbox" data-set="dyslexia" ${s.settings.dyslexia ? 'checked' : ''}> Extra ruimte tussen letters (prettig bij dyslexie)</label>
            <label class="check"><input type="checkbox" data-set="sound" ${s.settings.sound ? 'checked' : ''}> Geluid</label>
          </div>
        </div>
      </div>
    </div>`;
    bindHud(root);
    root.querySelectorAll('.shop-item').forEach((b) => b.addEventListener('click', () => choose(b.dataset.slot, b.dataset.id)));
    root.querySelectorAll('[data-set]').forEach((c) => c.addEventListener('change', async () => {
      try {
        setStudentState(await api('POST', '/api/student/settings', { [c.dataset.set]: c.checked }));
        applyStudentPrefs();
        toast('Opgeslagen', 'good');
      } catch (err) { toast(err.message, 'error'); }
    }));
  }

  async function choose(slot, id) {
    const s = session.state.student;
    const item = SHOP[slot].find((i) => i.id === id);
    const has = item.price === 0 || s.owned.includes(`${slot}:${id}`);
    try {
      if (!has) {
        if (s.coins < item.price) { toast(`Je hebt nog ${item.price - s.coins} muzieknoten nodig.`); return; }
        setStudentState(await api('POST', '/api/student/buy', { slot, id }));
        sfx.coin();
        toast(`${item.name} gekocht!`, 'good');
      }
      setStudentState(await api('POST', '/api/student/avatar', { [slot]: id }));
      render();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  render();
}
