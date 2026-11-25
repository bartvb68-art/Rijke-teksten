// De band van de leerling: drums, bas, keys en gitaarsolo, live gemaakt met de Web Audio API.
// Geen geluidsbestanden: alles wordt in de browser opgewekt.
// Niveau 0 = stil, 1 = drums, 2 = + bas, 3 = + keys, 4 = + gitaarsolo.
import { audio } from './sound.js';

const BPM = 100;
const STEP = 60 / BPM / 2; // achtste noten
const BAR_STEPS = 8;
const LOOP_BARS = 4;
const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Am - F - C - G: vrolijk en een beetje stoer
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ROOTS = [45, 41, 48, 43];
export const SCALE = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79]; // A-mineur pentatonisch
// Solomotief per maat (stap -> index in SCALE), afwisselend vraag en antwoord
const LEAD = [
  { 0: 5, 2: 6, 3: 7, 5: 6, 6: 5 },
  { 0: 4, 3: 5, 4: 4, 6: 2 },
  { 0: 6, 1: 7, 2: 8, 4: 7, 6: 6, 7: 5 },
  { 0: 4, 2: 3, 4: 2, 5: 1, 6: 2 },
];

let master = null;
let timer = null;
let nextTime = 0;
let step = 0;
let level = 0;
let targetLevel = 2;
let running = false;

function out(c) {
  if (!master || master.context !== c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = c.createGain();
    master.gain.value = 0.32;
    master.connect(comp).connect(c.destination);
  }
  return master;
}

let noiseBuf = null;
function noise(c) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

function env(c, t, peak, dur, dest) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  return g;
}

// ---------- instrumenten ----------
function kick(c, t, dest) {
  const o = c.createOscillator();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  o.connect(env(c, t, 0.9, 0.3, dest));
  o.start(t); o.stop(t + 0.32);
}
function snare(c, t, dest, vol = 0.45) {
  const n = noise(c);
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
  n.connect(f).connect(env(c, t, vol, 0.18, dest));
  n.start(t, Math.random() * 0.5); n.stop(t + 0.2);
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
  o.connect(env(c, t, vol * 0.5, 0.09, dest)); o.start(t); o.stop(t + 0.1);
}
function hat(c, t, dest, open = false) {
  const n = noise(c);
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
  n.connect(f).connect(env(c, t, open ? 0.12 : 0.08, open ? 0.22 : 0.045, dest));
  n.start(t, Math.random() * 0.5); n.stop(t + 0.25);
}
function bass(c, t, midi, dest, dur = STEP * 0.9) {
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + dur);
  o.connect(f).connect(env(c, t, 0.32, dur, dest));
  o.start(t); o.stop(t + dur + 0.02);
}
function stab(c, t, notes, dest, dur = 0.16, vol = 0.07) {
  for (const n of notes) {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n + 12); o.detune.value = (Math.random() - 0.5) * 12;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    o.connect(f).connect(env(c, t, vol, dur, dest));
    o.start(t); o.stop(t + dur + 0.02);
  }
}
function lead(c, t, midi, dest, dur = STEP * 1.6, vol = 0.09) {
  const o = c.createOscillator(); o.type = 'square'; o.frequency.value = mtof(midi + 12);
  const lfo = c.createOscillator(); lfo.frequency.value = 5.5;
  const lg = c.createGain(); lg.gain.value = 6; lfo.connect(lg).connect(o.detune);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
  o.connect(f).connect(env(c, t, vol, dur, dest));
  o.start(t); lfo.start(t); o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
}
function pluck(c, t, midi, dest, vol = 0.12, dur = 0.6) {
  // gitaarachtige tokkel: zaagtand met snel sluitend filter
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(midi);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(500, t + dur * 0.6);
  o.connect(f).connect(env(c, t, vol, dur, dest));
  o.start(t); o.stop(t + dur + 0.02);
}

// ---------- sequencer ----------
function schedule(c, t, s) {
  const dest = out(c);
  const bar = Math.floor(s / BAR_STEPS) % LOOP_BARS;
  const i = s % BAR_STEPS;
  if (level >= 1) {
    if (i === 0 || i === 3 || i === 4 || (i === 7 && bar === 3)) kick(c, t, dest);
    if (i === 2 || i === 6) snare(c, t, dest);
    if (bar === 3 && i >= 6 && level >= 2) snare(c, t + STEP / 2, dest, 0.25); // korte roffel naar de volgende ronde
    hat(c, t, dest, i === 7);
  }
  if (level >= 2 && [0, 1, 3, 4, 6, 7].includes(i)) bass(c, t, ROOTS[bar] + (i === 7 ? 7 : i === 1 ? 12 : 0), dest);
  if (level >= 3 && i % 2 === 1) stab(c, t, CHORDS[bar], dest);
  if (level >= 4 && LEAD[bar][i] != null) lead(c, t, SCALE[LEAD[bar][i]], dest);
  if (i % 2 === 0) {
    const delay = Math.max(0, (t - c.currentTime) * 1000);
    const detail = { beat: i / 2, bar, level };
    setTimeout(() => { if (running) window.dispatchEvent(new CustomEvent('bo:beat', { detail })); }, delay);
  }
}

function tick() {
  const c = audio();
  if (!c) { stop(); return; }
  if (c.state !== 'running') return; // wacht op een klik of toets
  if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05;
  while (nextTime < c.currentTime + 0.12) {
    // nieuwe instrumenten komen er netjes op de eerste tel van een maat bij
    if (step % BAR_STEPS === 0 || targetLevel < level) level = targetLevel;
    schedule(c, nextTime, step);
    nextTime += STEP;
    step = (step + 1) % (BAR_STEPS * LOOP_BARS);
  }
}

export function start() {
  if (running) return;
  const c = audio();
  if (!c) return;
  running = true;
  step = 0;
  nextTime = c.currentTime + 0.1;
  timer = setInterval(tick, 25);
  document.body.classList.add('band-on');
}

export function stop() {
  running = false;
  clearInterval(timer);
  timer = null;
  level = 0;
  document.body.classList.remove('band-on');
}

export const isRunning = () => running;

/** Hoeveel instrumenten meespelen (0-4). */
export function setLevel(n) {
  targetLevel = Math.max(0, Math.min(4, n));
  window.dispatchEvent(new CustomEvent('bo:band-level', { detail: { level: targetLevel } }));
}
export const getLevel = () => targetLevel;

// ---------- muzikale effecten (ook zonder achtergrondmuziek) ----------
function now(c) {
  return c.currentTime + 0.01;
}
function currentChord() {
  return CHORDS[Math.floor(step / BAR_STEPS) % LOOP_BARS];
}

/** Een noot uit de toonladder (bijv. bij het aanklikken van zinsdeel nummer i). */
export function note(i = 0) {
  const c = audio(); if (!c) return;
  pluck(c, now(c), SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length] + 12, out(c), 0.1, 0.35);
}

/** Gitaarakkoord dat past bij de muziek: voor een goed antwoord. */
export function strum() {
  const c = audio(); if (!c) return;
  const t = now(c);
  const ch = currentChord();
  [ch[0] - 12, ch[0], ch[1], ch[2], ch[0] + 12].forEach((n, k) => pluck(c, t + k * 0.028, n, out(c), 0.09, 0.9));
}

/** Een valse "boink" voor een fout antwoord. */
export function bonk() {
  const c = audio(); if (!c) return;
  const t = now(c);
  const o = c.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.3);
  o.connect(env(c, t, 0.25, 0.35, out(c))); o.start(t); o.stop(t + 0.37);
  const o2 = c.createOscillator(); o2.type = 'triangle';
  o2.frequency.setValueAtTime(233, t); o2.frequency.exponentialRampToValueAtTime(116, t + 0.3);
  o2.connect(env(c, t, 0.18, 0.35, out(c))); o2.start(t); o2.stop(t + 0.37);
}

/** Bekken. */
export function crash(delay = 0) {
  const c = audio(); if (!c) return;
  const t = now(c) + delay;
  const n = noise(c);
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4500;
  n.connect(f).connect(env(c, t, 0.3, 1.6, out(c)));
  n.start(t); n.stop(t + 1.7);
}

/** Drumroffel met bekken: het einde van een nummer. */
export function finale() {
  const c = audio(); if (!c) return;
  const t = now(c);
  for (let k = 0; k < 12; k++) snare(c, t + k * 0.055, out(c), 0.12 + k * 0.025);
  kick(c, t + 0.68, out(c));
  crash(0.68);
  const ch = CHORDS[0];
  [ch[0] - 12, ch[0], ch[1], ch[2], ch[0] + 12].forEach((nn, k) => pluck(c, t + 0.68 + k * 0.03, nn, out(c), 0.1, 1.6));
}

/** Applaus van het publiek. */
export function applause(seconds = 2.2) {
  const c = audio(); if (!c) return;
  const t0 = now(c);
  const dest = out(c);
  for (let k = 0; k < seconds * 60; k++) {
    const t = t0 + Math.random() * seconds;
    const n = noise(c);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200 + Math.random() * 2200; f.Q.value = 1.2;
    const fade = 1 - (t - t0) / (seconds * 1.15);
    n.connect(f).connect(env(c, t, 0.05 * fade + 0.01, 0.03 + Math.random() * 0.03, dest));
    n.start(t, Math.random() * 0.5); n.stop(t + 0.07);
  }
}

/** Oplopend loopje (sterren, nieuwe badge). */
export function riff(n = 3) {
  const c = audio(); if (!c) return;
  const t = now(c);
  for (let k = 0; k < n + 2; k++) pluck(c, t + k * 0.09, SCALE[Math.min(SCALE.length - 1, 4 + k)] + 12, out(c), 0.1, 0.5);
}
