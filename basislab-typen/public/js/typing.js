// Typ-motor: houdt bij wat er getypt wordt, fouten, snelheid en per-toets statistiek.
import { esc } from './lib.js';

const MAX_GAP_MS = 5000; // pauzes langer dan 5 seconden tellen niet als oefentijd

export class TypingEngine {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.correct = 0;
    this.errors = 0;
    this.keyStats = {};
    this.errorAt = new Set();
    this.activeMs = 0;
    this.lastKeyAt = null;
    this.startedAt = null;
    this.streak = 0;
  }

  get done() {
    return this.pos >= this.text.length;
  }

  get expected() {
    return this.text[this.pos];
  }

  tick(now) {
    if (this.lastKeyAt == null) {
      this.startedAt = now;
      this.activeMs = 600; // eerste aanslag telt als korte reactietijd
    } else {
      this.activeMs += Math.min(MAX_GAP_MS, now - this.lastKeyAt);
    }
    this.lastKeyAt = now;
  }

  /** Verwerk een getypt teken. Geeft 'correct', 'wrong' of null terug. */
  input(char, now = performance.now()) {
    if (this.done || typeof char !== 'string' || char.length !== 1) return null;
    this.tick(now);
    const exp = this.expected;
    const ks = this.keyStats[exp] || (this.keyStats[exp] = [0, 0]);
    if (char === exp) {
      ks[0] += 1;
      this.correct += 1;
      this.pos += 1;
      this.streak += 1;
      return 'correct';
    }
    ks[1] += 1;
    this.errors += 1;
    this.errorAt.add(this.pos);
    this.streak = 0;
    return 'wrong';
  }

  get accuracy() {
    const total = this.correct + this.errors;
    return total ? (this.correct / total) * 100 : 100;
  }

  get apm() {
    if (this.activeMs < 1000) return 0;
    return this.correct / (this.activeMs / 60000);
  }

  get progress() {
    return this.text.length ? this.pos / this.text.length : 0;
  }

  /** Toetsen met de meeste fouten. */
  trickyKeys(n = 3) {
    return Object.entries(this.keyStats)
      .filter(([, [, m]]) => m > 0)
      .sort((a, b) => b[1][1] - a[1][1])
      .slice(0, n)
      .map(([k]) => k);
  }

  result() {
    return {
      durationMs: Math.max(1000, Math.round(this.activeMs)),
      chars: this.text.length,
      correct: this.correct,
      errors: this.errors,
      keyStats: this.keyStats,
      apm: Math.round(this.apm),
      accuracy: Math.round(this.accuracy * 10) / 10,
    };
  }
}

/** Bepaal welk teken een toetsaanslag oplevert (of null als het geen typbaar teken is). */
export function charFromEvent(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === 'Dead') return null;
  if (e.key.length === 1) return e.key;
  return null;
}

/** Tekstweergave met huidige positie, fouten en automatisch scrollen. */
export class TextView {
  constructor(el, text) {
    this.el = el;
    this.text = text;
    let html = '<div class="tv-inner">';
    let i = 0;
    for (const part of text.split(/( )/)) {
      if (part === ' ') {
        html += `<span class="ch sp" data-i="${i}"> </span>`;
        i += 1;
      } else if (part) {
        html += '<span class="word">';
        for (const c of part) {
          html += `<span class="ch" data-i="${i}">${esc(c)}</span>`;
          i += 1;
        }
        html += '</span>';
      }
    }
    html += '</div>';
    el.innerHTML = html;
    this.inner = el.querySelector('.tv-inner');
    this.chars = [...el.querySelectorAll('.ch')];
  }

  update(engine) {
    const { pos } = engine;
    for (let i = Math.max(0, pos - 3); i < Math.min(this.chars.length, pos + 2); i++) {
      const c = this.chars[i];
      c.classList.toggle('done', i < pos);
      c.classList.toggle('cur', i === pos);
      c.classList.toggle('err', engine.errorAt.has(i));
    }
    this.scrollTo(pos);
  }

  shake() {
    const cur = this.chars[this.chars.findIndex((c) => c.classList.contains('cur'))];
    if (!cur) return;
    cur.classList.remove('shake');
    void cur.offsetWidth;
    cur.classList.add('shake');
  }

  scrollTo(pos) {
    const cur = this.chars[Math.min(pos, this.chars.length - 1)];
    if (!cur) return;
    const lineH = cur.offsetHeight || 40;
    const top = cur.offsetTop;
    const shift = Math.max(0, top - lineH * 1.1);
    this.inner.style.transform = `translateY(${-shift}px)`;
  }
}
