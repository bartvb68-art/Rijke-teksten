import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, grade, parseNumber, parseTime, parseFraction } from '../src/content/index.js';
import { SKILLS, defaultPlan, weeksBetween } from '../public/js/shared/skills.js';
import { WEAK, STRONG, verbForms } from '../src/content/taal.js';

test('elke generator maakt geldige opgaven op alle niveaus', () => {
  for (const s of SKILLS) {
    for (let i = 0; i < 250; i++) {
      const target = 1 + (i % 9) * 0.5;
      const it = generate(s.id, target);
      assert.ok(it.prompt && it.answer != null && it.explain, `${s.id}: onvolledig`);
      assert.ok(it.level >= 1 && it.level <= 5.5, `${s.id}: niveau ${it.level}`);
      assert.ok(grade(it, it.answer), `${s.id}: goed antwoord wordt fout gerekend (${it.prompt} -> ${it.answer})`);
      assert.ok(!grade(it, 'xyz'), `${s.id}: onzin wordt goed gerekend`);
      if (it.type === 'mc') assert.ok(it.options.includes(it.answer) && it.options.length >= 2, `${s.id}: meerkeuze`);
      assert.doesNotMatch(it.prompt + it.explain + (it.options || []).join('|'), /undefined|NaN/, `${s.id}: ${it.prompt}`);
    }
  }
});

test('nakijken accepteert gangbare schrijfwijzen', () => {
  assert.equal(parseNumber('1.250'), 1250);
  assert.equal(parseNumber('12,5'), 12.5);
  assert.equal(parseNumber('€ 4,50'), 4.5);
  assert.equal(parseNumber('35 cm'), 35);
  assert.equal(parseNumber('−3'), -3);
  assert.equal(parseTime('9.05'), 545);
  assert.equal(parseTime('09:05'), 545);
  assert.deepEqual(parseFraction('1 1/2'), { n: 3, d: 2, mixed: true });
  assert.ok(grade({ type: 'input', check: 'fraction', answer: '3/4' }, '6/8'));
  assert.ok(!grade({ type: 'input', check: 'fraction-simple', answer: '3/4' }, '6/8'));
  assert.ok(grade({ type: 'input', check: 'text', answer: 'Wordt' }, 'wordt'));
});

test('werkwoordvormen kloppen', () => {
  const f = (inf) => verbForms(WEAK.find((w) => w[0] === inf), false);
  assert.equal(f('verven').vt, 'verfde');
  assert.equal(f('reizen').vd, 'gereisd');
  assert.equal(f('praten').vt, 'praatte');
  assert.equal(f('praten').vd, 'gepraat');
  assert.equal(f('antwoorden').vt, 'antwoordde');
  assert.equal(f('beantwoorden').vd, 'beantwoord');
  assert.equal(f('verhuizen').vd, 'verhuisd');
  assert.equal(f('redden').vd, 'gered');
  assert.equal(f('downloaden').vt, 'downloadde');
  assert.equal(f('printen').vd, 'geprint');
  assert.equal(f('lachen' in {} ? 'x' : 'fietsen').vtm, 'fietsten');
  assert.ok(STRONG.length >= 15);
});

test('standaardplanning tot de doorstroomtoets', () => {
  const weeks = weeksBetween('2026-11-23', '2027-01-26');
  assert.equal(weeks[0], '2026-11-23');
  assert.equal(weeks[weeks.length - 1], '2027-01-25');
  const plan = defaultPlan('2026-11-23', '2027-01-26');
  assert.equal(plan['2026-12-21'].holiday, true);
  assert.ok(Object.values(plan).some((w) => w.test), 'er is een proeftoets');
  const focused = new Set(Object.values(plan).flatMap((w) => w.focus));
  assert.ok(focused.size >= 12, `veel onderdelen in focus (${focused.size})`);
});
