import { api, esc, fmtLongDate } from './lib.js';
import { icon } from './icons.js';
import { rocketSvg } from './avatar.js';
import { session } from './app.js';

export default async function diploma(root, params) {
  const teacher = session.role === 'teacher';
  const back = teacher ? '#/dashboard' : '#/kaart';
  let d;
  try {
    d = await api('GET', teacher ? `/api/teacher/students/${params.studentId}/diploma` : '/api/student/diploma');
  } catch (err) {
    root.innerHTML = `<div class="print-page"><div class="print-bar"><a class="btn btn-blue" href="${back}">${icon('back')} Terug</a></div><p>${esc(err.message)}</p></div>`;
    return;
  }
  const avatar = teacher ? {} : session.state.student.avatar;
  root.innerHTML = `<div class="print-page">
    <div class="print-bar"><a class="btn btn-blue" href="${back}" data-back>${icon('back')} Terug</a><button class="btn btn-primary" data-print>${icon('print')} Afdrukken</button></div>
    <div class="diploma">
      <svg class="deco" style="top:30px;left:40px" width="70" height="70" viewBox="0 0 24 24" fill="#ffc23d"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>
      <svg class="deco" style="bottom:40px;right:50px" width="50" height="50" viewBox="0 0 24 24" fill="#3987e5"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>
      <div class="deco" style="top:30px;right:50px">${rocketSvg(avatar, { size: 90 })}</div>
      <p style="letter-spacing:.3em;text-transform:uppercase;margin:0;font-weight:600">Sterrentypers</p>
      <h1>Typediploma</h1>
      <p style="margin:0">Hierbij verklaren wij dat</p>
      <div class="who">${esc(d.name)}</div>
      <p style="max-width:56ch;margin:0">met succes de typecursus van Sterrentypers heeft afgerond en blind kan typen met tien vingers.</p>
      <div class="facts">
        <div><b>${d.apm}</b>aanslagen per minuut</div>
        <div><b>${d.accuracy}%</b>nauwkeurigheid</div>
        <div><b>${'★'.repeat(d.stars)}</b>examen</div>
      </div>
      <p style="margin:0">${esc(d.school || '')}${d.school ? ' · ' : ''}${esc(d.className)} (groep ${d.groep}) · ${fmtLongDate(d.date)}</p>
      <div class="sign"><div>${esc(d.teacher)}<br><small>leerkracht</small></div><div>${esc(d.name)}<br><small>sterrentyper</small></div></div>
    </div>
  </div>`;
  root.querySelector('[data-print]').addEventListener('click', () => window.print());
  root.querySelector('[data-back]').addEventListener('click', (e) => {
    if (teacher && history.length > 1) { e.preventDefault(); history.back(); }
  });
}
