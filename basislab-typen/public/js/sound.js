// Geluidseffecten met de Web Audio API (geen geluidsbestanden nodig).
let ctx = null;
let enabled = true;

export function setSoundEnabled(v) {
  enabled = !!v;
}

function ac() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { type = 'sine', dur = 0.1, vol = 0.08, slide = 0, delay = 0 } = {}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.3, vol = 0.12, filter = 900 } = {}) {
  const c = ac();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

export const sfx = {
  key: () => tone(660, { type: 'triangle', dur: 0.04, vol: 0.03 }),
  error: () => tone(160, { type: 'square', dur: 0.12, vol: 0.05, slide: -40 }),
  step: () => { tone(523, { dur: 0.12 }); tone(659, { dur: 0.12, delay: 0.1 }); tone(784, { dur: 0.2, delay: 0.2 }); },
  star: (i = 0) => tone(784 + i * 196, { type: 'triangle', dur: 0.25, vol: 0.09 }),
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, { type: 'triangle', dur: 0.3, vol: 0.08, delay: i * 0.12 })),
  laser: () => tone(1200, { type: 'sawtooth', dur: 0.15, vol: 0.04, slide: -900 }),
  boom: () => noise({ dur: 0.35, vol: 0.18, filter: 700 }),
  hit: () => { noise({ dur: 0.5, vol: 0.2, filter: 300 }); tone(90, { type: 'square', dur: 0.3, vol: 0.06, slide: -40 }); },
  power: () => [440, 660, 880].forEach((f, i) => tone(f, { type: 'sine', dur: 0.15, vol: 0.07, delay: i * 0.07 })),
  count: () => tone(440, { type: 'square', dur: 0.12, vol: 0.05 }),
  go: () => tone(880, { type: 'square', dur: 0.3, vol: 0.06 }),
  coin: () => { tone(988, { type: 'square', dur: 0.07, vol: 0.04 }); tone(1319, { type: 'square', dur: 0.15, vol: 0.04, delay: 0.07 }); },
};
