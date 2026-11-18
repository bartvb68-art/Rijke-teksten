import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LESSONS, lessonSteps, generateText, charsUpTo, targetApm, starsFor, gameWords, raceText, CHAR_INFO,
} from '../public/js/shared/curriculum.js';
import { WORDS } from '../public/js/shared/words.js';

test('elke les gebruikt alleen tekens die al geleerd zijn', () => {
  for (const l of LESSONS) {
    const allowed = charsUpTo(l.id);
    lessonSteps(l.id).forEach((step, i) => {
      for (const seed of [1, 2, 3, 99, 12345]) {
        const t = generateText(l.id, i, seed);
        assert.ok(t.length >= 20, `les ${l.id} stap ${i} is te kort: "${t}"`);
        const badChars = [...t].filter((c) => !allowed.has(c));
        assert.deepEqual(badChars, [], `les ${l.id} stap ${i} bevat ${badChars.join('')}`);
        assert.ok(!/ {2}/.test(t) && t === t.trim(), `les ${l.id} stap ${i} heeft rare spaties`);
      }
    });
  }
});

test('alle letters a-z komen in de leerlijn voor', () => {
  const all = charsUpTo(LESSONS.length);
  for (const c of 'abcdefghijklmnopqrstuvwxyz0123456789') assert.ok(all.has(c), c);
});

test('alle tekens zijn op het toetsenbord te vinden', () => {
  for (const c of charsUpTo(LESSONS.length)) assert.ok(CHAR_INFO[c], `geen toets voor "${c}"`);
});

test('doelen stijgen per les en per groep', () => {
  assert.ok(targetApm(20, 8) > targetApm(20, 6));
  assert.ok(targetApm(10, 7) > targetApm(1, 7));
  assert.ok(targetApm(20, 7, 0.6) < targetApm(20, 7, 1));
});

test('sterrenregels', () => {
  assert.equal(starsFor(80, 200, 50), 0);
  assert.equal(starsFor(90, 10, 50), 1);
  assert.equal(starsFor(93, 40, 50), 2);
  assert.equal(starsFor(97, 50, 50), 3);
});

test('spellen hebben altijd genoeg woorden', () => {
  for (const l of LESSONS) {
    assert.ok(gameWords(l.id).length >= 12, `les ${l.id}`);
    assert.ok(raceText(l.id, 5).length >= 30, `race ${l.id}`);
  }
});

test('woordenlijst bevat alleen kleine letters', () => {
  assert.ok(WORDS.length > 500);
  for (const w of WORDS) assert.match(w, /^[a-z]+$/);
});
