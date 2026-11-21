import { api, esc, modal, toast, timeAgo, fmtDay, fmtDate } from '../lib.js';
import { icon } from '../icons.js';
import { session, refreshSchool, refreshMe, go, schoolLogoHtml } from '../app.js';
import { shell } from './shell.js';
import { barChart, SERIES } from './charts.js';

const TABS = [['gebruik', 'Gebruik'], ['leerkrachten', 'Leerkrachten'], ['school', 'School en logo']];

export default async function adminView(root) {
  if (!session.teacher?.is_admin) {
    toast('Alleen de beheerder van de school kan deze pagina openen.');
    go('#/dashboard');
    return;
  }
  let tab = (() => { try { return sessionStorage.getItem('bo_admin_tab') || 'gebruik'; } catch { return 'gebruik'; } })();
  let data = await api('GET', '/api/admin/overview');

  function render() {
    const main = shell(root, 'beheer', `
      <div class="row" style="margin-bottom:6px"><h1 style="margin:0">Beheer</h1>${schoolLogoHtml({ size: 36, withName: true })}</div>
      <p class="muted" style="margin-top:0">Alles voor de hele school: gebruik, leerkrachten en het logo.</p>
      <div class="tabs" role="tablist">${TABS.map(([id, label]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</div>
      <div data-body></div>`);
    main.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
      tab = b.dataset.tab;
      try { sessionStorage.setItem('bo_admin_tab', tab); } catch { /* privémodus */ }
      render();
    }));
    const body = main.querySelector('[data-body]');
    if (tab === 'gebruik') usage(body);
    if (tab === 'leerkrachten') teachers(body);
    if (tab === 'school') school(body);
  }

  async function reload() {
    data = await api('GET', '/api/admin/overview');
    render();
  }

  // ---------- Gebruik ----------
  function usage(body) {
    const t = data.totals;
    body.innerHTML = `
      <div class="tiles" style="margin-top:0">
        <div class="tile"><div class="label">Leerkrachten</div><div class="value">${t.teachers}</div><div class="sub">${t.classes} klassen</div></div>
        <div class="tile"><div class="label">Leerlingen</div><div class="value">${t.students}</div><div class="sub">${t.activeWeek} actief deze week</div></div>
        <div class="tile"><div class="label">Oefentijd deze week</div><div class="value">${t.minutesWeek} min</div><div class="sub">hele school samen</div></div>
        <div class="tile"><div class="label">Weekdoel gehaald</div><div class="value">${t.goalReached} / ${t.students}</div><div class="sub">leerlingen</div></div>
        <div class="tile"><div class="label">Gem. score</div><div class="value">${t.avgScore != null ? `${t.avgScore}%` : '–'}</div><div class="sub">zinnen goed ontleed</div></div>
        <div class="tile"><div class="label">Ontleeddiploma</div><div class="value">${t.diplomas}</div><div class="sub">leerlingen geslaagd</div></div>
      </div>
      <div class="panels">
        <section class="panel wide"><h2>Oefentijd per dag</h2><p class="panel-sub">Minuten geoefend door alle leerlingen, laatste 30 dagen. Beweeg over een staaf voor het aantal actieve leerlingen.</p><div data-daily></div></section>
        <section class="panel wide">
          <div class="row" style="margin-bottom:10px"><h2 style="margin:0">Klassen</h2><span class="spacer"></span>
            <a class="btn btn-ghost btn-sm" href="/api/admin/export.csv" download data-testid="admin-export">${icon('download')} Exporteren</a></div>
          <div class="table-wrap">${data.classes.length ? `<table class="table">
            <thead><tr><th scope="col">Klas</th><th scope="col">Leerkracht</th><th scope="col" class="num">Groep</th><th scope="col" class="num">Leerlingen</th><th scope="col" class="num">Actief deze week</th><th scope="col" class="num">Minuten deze week</th><th scope="col" class="num">Weekdoel gehaald</th><th scope="col" class="num">Score</th><th scope="col" class="num">Tempo</th><th scope="col" class="num">Diploma's</th><th scope="col">Signalen</th></tr></thead>
            <tbody>${data.classes.map((c) => `<tr data-class="${c.id}" tabindex="0">
              <td><b>${esc(c.name)}</b></td><td>${esc(c.teacher)}</td><td class="num">${c.groep}</td><td class="num">${c.students}</td>
              <td class="num">${c.activeWeek}</td><td class="num">${c.minutesWeek}</td><td class="num">${c.goalReached}</td>
              <td class="num">${c.avgScore != null ? `${c.avgScore}%` : '–'}</td><td class="num">${c.avgSec != null ? `${c.avgSec} s` : '–'}</td><td class="num">${c.diplomas}</td>
              <td>${c.alerts ? `<span class="chip warning">${icon('alert')} ${c.alerts}</span>` : '<span class="muted">–</span>'}</td></tr>`).join('')}</tbody></table>`
            : `<div class="empty">${icon('users')}<p>Er zijn nog geen klassen. Leerkrachten maken hun eigen klassen aan.</p></div>`}</div>
          <p class="muted" style="font-size:.88rem">Klik op een klas om het volledige klasoverzicht en de leerlingen te bekijken.</p>
        </section>
      </div>`;
    barChart(body.querySelector('[data-daily]'), {
      data: data.daily.map((d) => ({ label: fmtDay(d.day), value: d.minutes, tip: `<b>${fmtDay(d.day)}</b><br>${d.minutes} minuten · ${d.active} ${d.active === 1 ? 'leerling' : 'leerlingen'}` })),
      color: SERIES.blue,
      height: 220,
    });
    body.querySelectorAll('tr[data-class]').forEach((tr) => {
      const open = () => go(`#/klas/${tr.dataset.class}`);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  }

  // ---------- Leerkrachten ----------
  function teachers(body) {
    const me = session.teacher.id;
    body.innerHTML = `
      <div class="row" style="margin-bottom:12px"><p class="muted" style="margin:0">Leerkrachten loggen in met hun e-mailadres. Een nieuwe leerkracht kiest bij de eerste keer inloggen een eigen wachtwoord.</p>
        <span class="spacer"></span><button class="btn btn-primary" data-add>${icon('plus')} Leerkracht toevoegen</button></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">Naam</th><th scope="col">E-mailadres</th><th scope="col">Rol</th><th scope="col" class="num">Klassen</th><th scope="col">Laatst ingelogd</th><th scope="col">Acties</th></tr></thead>
        <tbody>${data.teachers.map((t) => `<tr style="cursor:default">
          <td><b>${esc(t.name)}</b>${t.id === me ? ' <span class="muted">(jij)</span>' : ''}</td>
          <td>${esc(t.email)}</td>
          <td>${t.isAdmin ? `<span class="chip good">${icon('shield')} beheerder</span>` : '<span class="chip">leerkracht</span>'}${t.mustChange ? ` <span class="chip warning">${icon('key')} nog niet ingelogd</span>` : ''}</td>
          <td class="num">${t.classes}</td>
          <td>${t.lastLogin ? timeAgo(t.lastLogin) : 'nooit'}</td>
          <td><div class="row" style="gap:6px;flex-wrap:nowrap">
            <button class="btn btn-ghost btn-sm" data-reset="${t.id}" title="Nieuw tijdelijk wachtwoord">${icon('key')} Wachtwoord</button>
            ${t.id === me ? '' : `<button class="btn btn-ghost btn-sm" data-role="${t.id}">${t.isAdmin ? 'Geen beheerder' : 'Maak beheerder'}</button>
            <button class="btn btn-ghost btn-sm" data-del="${t.id}" aria-label="Verwijder ${esc(t.name)}">${icon('trash')}</button>`}
          </div></td></tr>`).join('')}</tbody></table></div>`;

    body.querySelector('[data-add]').addEventListener('click', async () => {
      const r = await modal({
        title: 'Leerkracht toevoegen',
        withData: true,
        body: `<form><div class="field"><label for="t-name">Naam</label><input id="t-name" name="tname" placeholder="Meester Ahmed" required></div>
          <div class="field"><label for="t-mail">E-mailadres</label><input id="t-mail" name="tmail" type="email" placeholder="a.yilmaz@school.nl" required></div>
          <label class="check"><input type="checkbox" name="tadmin"> Ook beheerder (mag leerkrachten en het logo beheren)</label>
          <button type="submit" hidden></button></form>`,
        actions: [{ label: 'Annuleren', value: false }, { label: 'Toevoegen', value: true, primary: true }],
      });
      if (!r.value) return;
      try {
        const t = await api('POST', '/api/admin/teachers', { name: r.data.tname, email: r.data.tmail, isAdmin: !!r.data.tadmin });
        await showPassword(t, 'Leerkracht toegevoegd');
        reload();
      } catch (err) { toast(err.message, 'error'); }
    });

    body.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', async () => {
      const t = data.teachers.find((x) => x.id === Number(b.dataset.reset));
      const ok = await modal({
        title: `Nieuw wachtwoord voor ${t.name}?`,
        body: '<p>Er wordt een tijdelijk wachtwoord gemaakt. Bij het inloggen kiest de leerkracht daarna een eigen wachtwoord.</p>',
        actions: [{ label: 'Annuleren', value: false }, { label: 'Nieuw wachtwoord', value: true, primary: true }],
      });
      if (!ok) return;
      try {
        const res = await api('POST', `/api/admin/teachers/${t.id}/reset-password`);
        await showPassword(res, 'Nieuw tijdelijk wachtwoord');
        if (t.id === me) { await refreshMe(); go('#/account'); return; }
        reload();
      } catch (err) { toast(err.message, 'error'); }
    }));

    body.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', async () => {
      const t = data.teachers.find((x) => x.id === Number(b.dataset.role));
      try {
        await api('PATCH', `/api/admin/teachers/${t.id}`, { isAdmin: !t.isAdmin });
        toast(t.isAdmin ? `${t.name} is geen beheerder meer` : `${t.name} is nu beheerder`, 'good');
        reload();
      } catch (err) { toast(err.message, 'error'); }
    }));

    body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const t = data.teachers.find((x) => x.id === Number(b.dataset.del));
      const others = data.teachers.filter((x) => x.id !== t.id);
      const r = await modal({
        title: `${t.name} verwijderen?`,
        withData: true,
        body: `<form><p>Het account wordt verwijderd. ${t.classes ? `Deze leerkracht heeft ${t.classes} ${t.classes === 1 ? 'klas' : 'klassen'}.` : ''}</p>
          ${t.classes ? `<div class="field"><label for="d-to">Klassen overdragen aan</label><select id="d-to" name="to">
            ${others.map((o) => `<option value="${o.id}" ${o.id === me ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}
            <option value="">Niet overdragen: klassen en resultaten ook verwijderen</option></select></div>` : ''}</form>`,
        actions: [{ label: 'Annuleren', value: false }, { label: 'Verwijderen', value: true, danger: true }],
      });
      if (!r.value) return;
      try {
        await api('DELETE', `/api/admin/teachers/${t.id}`, r.data.to ? { transferTo: Number(r.data.to) } : {});
        toast(`${t.name} is verwijderd`);
        reload();
      } catch (err) { toast(err.message, 'error'); }
    }));
  }

  async function showPassword(t, title) {
    const text = `Je account voor Basislab Ontleden\nWebadres: ${location.origin}\nE-mailadres: ${t.email}\nTijdelijk wachtwoord: ${t.password}\nBij de eerste keer inloggen kies je een eigen wachtwoord.`;
    const copy = await modal({
      title,
      body: `<p>Geef deze gegevens door aan <b>${esc(t.name)}</b>. Het wachtwoord is later niet meer te zien.</p>
        <pre style="white-space:pre-wrap;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:.92rem">${esc(text)}</pre>`,
      actions: [{ label: 'Sluiten', value: false }, { label: 'Kopiëren', value: true, primary: true }],
    });
    if (copy) {
      try { await navigator.clipboard.writeText(text); toast('Gekopieerd', 'good'); } catch { toast('Kopiëren lukte niet; selecteer de tekst zelf.'); }
    }
  }

  // ---------- School en logo ----------
  function school(body) {
    const sc = data.school;
    body.innerHTML = `<div class="settings-grid">
      <section class="card">
        <h2 style="font-size:1.1rem">Schoolnaam</h2>
        <form data-name><div class="field"><label for="s-name">Naam van de school</label><input id="s-name" name="sname" value="${esc(sc.name)}" placeholder="Basisschool De Notenbalk" maxlength="80"></div>
        <p class="hint muted" style="font-size:.88rem">Staat bij het logo en op het ontleeddiploma.</p>
        <button class="btn btn-primary" type="submit">Opslaan</button></form>
      </section>
      <section class="card">
        <h2 style="font-size:1.1rem">Logo</h2>
        <div class="logo-preview">${sc.logo ? `<img src="/api/school/logo?v=${encodeURIComponent(sc.logo)}" alt="Huidig logo">` : '<span class="muted">Nog geen logo</span>'}</div>
        <p class="muted" style="font-size:.88rem">PNG, JPG of WebP. Het logo verschijnt bij het inloggen, in de software van leerlingen en leerkrachten, op inlogkaarten en op het diploma.</p>
        <div class="row"><label class="btn btn-primary" style="cursor:pointer">${icon('plus')} Logo kiezen<input type="file" accept="image/png,image/jpeg,image/webp" data-file hidden></label>
        ${sc.logo ? `<button class="btn btn-ghost" data-remove>${icon('trash')} Verwijderen</button>` : ''}</div>
      </section>
      <section class="card">
        <h2 style="font-size:1.1rem">Accounts voor leerkrachten</h2>
        <label class="check"><input type="checkbox" data-signup ${sc.allowSignup ? 'checked' : ''}> Leerkrachten mogen zelf een account maken (met de registratiecode)</label>
        <p class="muted" style="font-size:.88rem">Staat dit uit, dan voeg je leerkrachten zelf toe onder <b>Leerkrachten</b>.</p>
      </section>
    </div>`;
    body.querySelector('[data-name]').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('PATCH', '/api/admin/settings', { schoolName: e.target.elements.sname.value });
        await refreshSchool();
        toast('Schoolnaam opgeslagen', 'good');
        reload();
      } catch (err) { toast(err.message, 'error'); }
    });
    body.querySelector('[data-signup]').addEventListener('change', async (e) => {
      try {
        await api('PATCH', '/api/admin/settings', { allowSignup: e.target.checked });
        await refreshSchool();
        toast('Opgeslagen', 'good');
      } catch (err) { toast(err.message, 'error'); }
    });
    body.querySelector('[data-file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await shrink(file);
        await api('POST', '/api/admin/logo', { dataUrl });
        await refreshSchool();
        toast('Logo opgeslagen', 'good');
        reload();
      } catch (err) { toast(err.message, 'error'); }
    });
    body.querySelector('[data-remove]')?.addEventListener('click', async () => {
      await api('DELETE', '/api/admin/logo');
      await refreshSchool();
      toast('Logo verwijderd');
      reload();
    });
  }

  render();
}

/** Verklein het logo in de browser tot maximaal 512 px en lever het aan als PNG. */
function shrink(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { reject(new Error('Kies een afbeelding in PNG, JPG of WebP.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Het bestand kon niet worden gelezen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Dit bestand is geen geldige afbeelding.'));
      img.onload = () => {
        const scale = Math.min(1, 512 / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 500 * 1024) { resolve(reader.result); return; }
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export { fmtDate };
