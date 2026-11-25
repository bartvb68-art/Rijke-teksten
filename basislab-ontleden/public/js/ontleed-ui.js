// Weergave van zinnen, zinsdelen en etiketten (gedeeld door lessen en spellen).
import { esc } from './lib.js';
import {
  LABELS, sentenceWords, cutGaps, selectTargets, expectedLabels,
} from './shared/curriculum.js';

export function labelPill(label, { long = false } = {}) {
  const l = LABELS[label];
  if (!l) return '';
  return `<span class="lbl" style="--lc:${l.color}" title="${esc(l.name)}">${esc(long ? l.name : l.short)}</span>`;
}

const ARTICLE = { pv: 'de', ow: 'het', wg: 'het', lv: 'het', mv: 'het', bwb: 'alle', ng: 'het' };
const NAME = { bwb: 'bijwoordelijke bepalingen' };

export function promptFor(item) {
  if (item.mode === 'split') return { title: 'Knip de zin in zinsdelen', sub: 'Klik tussen de woorden om te knippen. Klik nog een keer om het knipje weg te halen.' };
  if (item.mode === 'select') {
    const t = item.target;
    const sub = t === 'wg' ? 'Kies álle werkwoorden: de persoonsvorm en de andere werkwoorden.'
      : t === 'ng' ? 'Kies het koppelwerkwoord én het naamwoordelijk deel (en eventuele andere werkwoorden).'
        : t === 'bwb' ? 'Er kunnen er meer zijn. Kies ze allemaal.' : 'Klik op het goede zinsdeel.';
    return { title: `Wijs ${ARTICLE[t]} ${NAME[t] || LABELS[t].name.toLowerCase()} aan`, sub, label: t };
  }
  if (item.mode === 'label') return { title: 'Geef elk zinsdeel een etiket', sub: 'Klik op een zinsdeel en kies het etiket. Sneller: gebruik de cijfertoetsen.' };
  return { title: item.question, sub: 'Kies het goede antwoord.' };
}

/** HTML van de zin voor een opdracht. state: { cuts:Set, selected:Set, labels:[], active, quizAnswer } */
export function sentenceHtml(item, state = {}, { result = null, interactive = true } = {}) {
  const { s } = item;
  if (item.mode === 'split') {
    const words = sentenceWords(s);
    const gaps = cutGaps(s);
    const cuts = state.cuts || new Set();
    let html = '';
    words.forEach((w, i) => {
      html += `<span class="w" style="--i:${i}">${esc(w.w)}</span>`;
      if (i < words.length - 1) {
        let cls = cuts.has(i) ? 'cut' : '';
        if (result) {
          const g = gaps[i];
          if (g === 'must') cls = cuts.has(i) ? 'cut ok' : 'miss';
          else if (g === 'may') cls = cuts.has(i) ? 'cut optional' : '';
          else cls = cuts.has(i) ? 'wrong' : '';
        }
        html += `<button type="button" class="gap ${cls}" data-gap="${i}" aria-label="Knip na ${esc(w.w)}" aria-pressed="${cuts.has(i)}" ${result || !interactive ? 'disabled' : ''}></button>`;
      }
    });
    return `<div class="zin split">${html}<span class="end">${esc(s.end)}</span></div>`;
  }
  const targets = item.mode === 'select' ? new Set(selectTargets(item)) : null;
  const exp = item.mode === 'label' ? expectedLabels(item) : null;
  const chunks = s.chunks.map((c, idx) => {
    const cls = ['chunk'];
    let extra = '';
    if (item.mode === 'select') {
      const sel = state.selected?.has(idx);
      if (sel) cls.push('sel');
      if (result) {
        if (targets.has(idx)) cls.push(sel ? 'ok' : 'missed');
        else if (sel) cls.push('bad');
        if (targets.has(idx)) extra = `<span class="fix">${esc(LABELS[item.target === 'wg' || item.target === 'ng' ? item.target : c.label].short)}</span>`;
      }
    } else if (item.mode === 'label') {
      const given = state.labels?.[idx];
      if (state.active === idx && !result) cls.push('active');
      if (result) cls.push(given === exp[idx] ? 'ok' : 'bad');
      const l = given ? LABELS[given] : null;
      extra = `<span class="tag ${l ? 'set' : ''}" style="${l ? `--lc:${l.color}` : ''}">${l ? esc(l.short) : '…'}</span>`;
      if (result && given !== exp[idx]) extra += `<span class="fix">goed: ${esc(exp[idx] === 'rest' ? 'ander' : LABELS[exp[idx]].short)}</span>`;
    } else if (item.mode === 'quiz') {
      if (idx === item.chunk) cls.push('mark');
      cls.push('static');
    }
    const tag = item.mode === 'quiz' || !interactive || result ? 'span' : 'button';
    return `<${tag} ${tag === 'button' ? 'type="button"' : ''} class="${cls.join(' ')}" data-chunk="${idx}" style="--i:${idx}">${esc(c.text)}${extra}</${tag}>`;
  });
  return `<div class="zin">${chunks.join('')}<span class="end">${esc(s.end)}</span></div>`;
}

/** Een opgeloste opdracht (voor de uitleg vooraf). */
export function solvedHtml(item) {
  if (item.mode === 'split') {
    const cuts = new Set(cutGaps(item.s).map((g, i) => (g === 'must' ? i : null)).filter((x) => x != null));
    return sentenceHtml(item, { cuts }, { interactive: false });
  }
  if (item.mode === 'select') {
    const t = new Set(selectTargets(item));
    return `<div class="zin">${item.s.chunks.map((c, i) => `<span class="chunk static ${t.has(i) ? 'sel' : ''}">${esc(c.text)}${t.has(i) ? `<span class="fix">${esc(LABELS[item.target].short)}</span>` : ''}</span>`).join('')}<span class="end">${esc(item.s.end)}</span></div>`;
  }
  if (item.mode === 'label') return sentenceHtml(item, { labels: expectedLabels(item) }, { interactive: false });
  return `<div class="zin">${item.s.chunks.map((c, i) => `<span class="chunk static ${i === item.chunk ? 'mark' : ''}">${esc(c.text)}${i === item.chunk ? `<span class="fix">${esc(item.options.find((o) => o.value === item.answer)?.label || '')}</span>` : ''}</span>`).join('')}<span class="end">${esc(item.s.end)}</span></div>`;
}

/** Tel goed/fout per onderdeel op. */
export function mergeStats(into, add) {
  for (const [k, v] of Object.entries(add)) {
    const e = into[k] || (into[k] = [0, 0]);
    e[0] += v[0];
    e[1] += v[1];
  }
  return into;
}

export function mergeCounts(into, add) {
  for (const [k, n] of Object.entries(add)) into[k] = (into[k] || 0) + n;
  return into;
}
