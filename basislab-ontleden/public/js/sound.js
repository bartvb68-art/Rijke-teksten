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

/** De audiocontext (of null als het geluid uit staat). */
export function audio() {
  return ac();
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
  tick: () => tone(660, { type: 'triangle', dur: 0.04, vol: 0.03 }),
  pick: () => tone(880, { type: 'triangle', dur: 0.05, vol: 0.035 }),
  good: () => { tone(523, { type: 'triangle', dur: 0.12, vol: 0.07 }); tone(784, { type: 'triangle', dur: 0.2, vol: 0.07, delay: 0.09 }); },
  error: () => tone(160, { type: 'square', dur: 0.15, vol: 0.05, slide: -40 }),
  step: () => { tone(523, { dur: 0.12 }); tone(659, { dur: 0.12, delay: 0.1 }); tone(784, { dur: 0.2, delay: 0.2 }); },
  star: (i = 0) => tone(784 + i * 196, { type: 'triangle', dur: 0.25, vol: 0.09 }),
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, { type: 'triangle', dur: 0.3, vol: 0.08, delay: i * 0.12 })),
  // een noot uit de toonladder (voor Notenregen: elke goede noot klinkt hoger)
  note: (n = 0) => tone(392 * Math.pow(2, ([0, 2, 4, 5, 7, 9, 11, 12][n % 8] + 12 * Math.floor(n / 8) % 24) / 12), { type: 'triangle', dur: 0.22, vol: 0.08 }),
  miss: () => { noise({ dur: 0.25, vol: 0.12, filter: 500 }); tone(110, { type: 'sawtooth', dur: 0.25, vol: 0.05, slide: -30 }); },
  drum: () => { noise({ dur: 0.12, vol: 0.14, filter: 1800 }); tone(90, { type: 'sine', dur: 0.15, vol: 0.12, slide: -40 }); },
  count: () => tone(440, { type: 'square', dur: 0.12, vol: 0.05 }),
  go: () => tone(880, { type: 'square', dur: 0.3, vol: 0.06 }),
  coin: () => { tone(988, { type: 'square', dur: 0.07, vol: 0.04 }); tone(1319, { type: 'square', dur: 0.15, vol: 0.04, delay: 0.07 }); },
};

// ---------- Voorlezen (spraak van de browser zelf, er gaat niets naar buiten) ----------
let voice = null;
function nlVoice() {
  if (voice || !('speechSynthesis' in window)) return voice;
  voice = speechSynthesis.getVoices().find((v) => /^nl(-|_|$)/i.test(v.lang)) || null;
  return voice;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', () => { voice = null; nlVoice(); });

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'nl-NL';
  u.rate = 0.9;
  const v = nlVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}
