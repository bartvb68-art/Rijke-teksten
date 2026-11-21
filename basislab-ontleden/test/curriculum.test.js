import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SENTENCES, LESSONS, lessonSteps, generateItems, checkAnswer, cutGaps, selectTargets, expectedLabels, explainItem, hintFor,
  starsFor, knownLabels, labelChoices, gameLabels, gameSentences, parseSentence, LABELS,
} from '../public/js/shared/curriculum.js';

const perfect = (it) => {
  if (it.mode === 'split') return cutGaps(it.s).map((g, i) => (g === 'must' ? i : null)).filter((x) => x != null);
  if (it.mode === 'select') return selectTargets(it);
  if (it.mode === 'label') return expectedLabels(it);
  return it.answer;
};

test('elke zin is goed gemarkeerd', () => {
  assert.ok(SENTENCES.length >= 120);
  for (const s of SENTENCES) {
    const roles = s.chunks.map((c) => c.role);
    assert.equal(roles.filter((r) => r === 'pv').length, 1, `één pv: ${s.text}`);
    assert.equal(roles.filter((r) => r === 'ow').length, 1, `één ow: ${s.text}`);
    assert.ok(s.chunks.find((c) => c.role === 'pv').alt, `tijdproef ontbreekt: ${s.text}`);
    assert.ok(['.', '?', '!'].includes(s.end), `leesteken: ${s.text}`);
    assert.ok([1, 2, 3].includes(s.level), `niveau: ${s.text}`);
    assert.ok(/^[A-Z]/.test(s.text), `hoofdletter: ${s.text}`);
    for (const c of s.chunks) {
      assert.ok(['ow', 'pv', 'wg', 'lv', 'mv', 'bwb', 'nd'].includes(c.role), `rol ${c.role}: ${s.text}`);
      if (c.role === 'bwb') assert.ok(['tijd', 'plaats', 'manier', 'reden'].includes(c.kind), `soort bwb: ${s.text}`);
      assert.equal(c.text, c.text.trim());
    }
    if (roles.includes('mv')) assert.ok(roles.includes('lv'), `mv zonder lv: ${s.text}`);
  }
});

test('elke stap van elke les maakt genoeg opdrachten die perfect op te lossen zijn', () => {
  for (const l of LESSONS) {
    lessonSteps(l.id).forEach((step, i) => {
      for (const groep of [5, 6, 7, 8]) {
        for (const seed of [1, 42, 2026]) {
          const items = generateItems(l.id, i, { groep, seed });
          assert.equal(items.length, step.count, `les ${l.id} stap ${i}`);
          for (const it of items) {
            assert.ok(checkAnswer(it, perfect(it)).correct, `les ${l.id}: ${it.mode} ${it.s.text}`);
            assert.ok(explainItem(it).length >= 1);
            assert.ok(hintFor(it).length > 10);
          }
        }
      }
    });
  }
});

test('een les vraagt alleen naar zinsdelen die al geleerd zijn', () => {
  for (const l of LESSONS.filter((x) => x.mode === 'label')) {
    const choices = labelChoices(l.exam ? 19 : l.id);
    for (const it of generateItems(l.id, 3 < lessonSteps(l.id).length ? 3 : 1, { seed: 5 })) {
      if (it.mode !== 'label') continue;
      for (const c of it.choices) assert.ok(choices.includes(c));
      if (!knownLabels(l.id).includes('ng')) assert.ok(!it.s.ng, `les ${l.id} geeft ng-zin: ${it.s.text}`);
    }
  }
});

test('groep 5 krijgt kortere zinnen dan groep 8', () => {
  const avg = (groep) => {
    let sum = 0; let n = 0;
    for (let seed = 1; seed < 40; seed++) for (const it of generateItems(16, 3, { groep, seed })) { sum += it.s.level; n++; }
    return sum / n;
  };
  assert.ok(avg(5) < avg(8) - 0.5);
});

test('nakijken: knippen', () => {
  const s = parseSentence('1|[ow De drummer] [pv heeft|had] [lv een solo] [wg gespeeld].');
  const it = { mode: 'split', s };
  assert.deepEqual(cutGaps(s), ['no', 'must', 'must', 'no', 'must']);
  assert.ok(checkAnswer(it, [1, 2, 4]).correct);
  const r = checkAnswer(it, [1, 4, 0]);
  assert.equal(r.correct, false);
  assert.deepEqual(r.stats.knip, [2, 2]);
});

test('nakijken: aanwijzen en etiketten, met verwarringen', () => {
  const s = parseSentence('2|[ow De zanger] [pv geeft|gaf] [mv de fans] [lv een handtekening].');
  const sel = { mode: 'select', s, target: 'lv' };
  assert.ok(checkAnswer(sel, [3]).correct);
  const wrong = checkAnswer(sel, [2]);
  assert.equal(wrong.correct, false);
  assert.deepEqual(wrong.confusions, { 'mv>lv': 1 });
  const lab = { mode: 'label', s, choices: labelChoices(13) };
  assert.ok(checkAnswer(lab, ['ow', 'pv', 'mv', 'lv']).correct);
  const r = checkAnswer(lab, ['ow', 'pv', 'lv', 'mv']);
  assert.equal(r.correct, false);
  assert.deepEqual(r.confusions, { 'mv>lv': 1, 'lv>mv': 1 });
  assert.deepEqual(r.stats.pv, [1, 0]);
});

test('naamwoordelijk gezegde: koppelwerkwoord en andere werkwoorden horen bij ng', () => {
  const s = parseSentence('3|[ow Mijn broer] [pv wil|wilde] [nd zanger] [wg worden].');
  assert.ok(s.ng);
  assert.deepEqual(s.chunks.map((c) => c.label), ['ow', 'pv', 'ng', 'ng']);
  assert.deepEqual(selectTargets({ mode: 'select', s, target: 'ng' }), [1, 2, 3]);
});

test('sterren en spellen', () => {
  assert.equal(starsFor(59), 0);
  assert.equal(starsFor(60), 1);
  assert.equal(starsFor(80), 2);
  assert.equal(starsFor(90), 3);
  assert.deepEqual(gameLabels(4), ['pv', 'ow', 'rest']);
  assert.ok(gameSentences(4).every((s) => !s.ng));
  assert.ok(gameSentences(20).some((s) => s.ng));
  assert.ok(Object.keys(LABELS).includes('knip'));
});
