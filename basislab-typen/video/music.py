"""Maakt een vrolijk, eenvoudig achtergrondmuziekje (eigen compositie, geen rechten van derden).

Gebruik: python3 video/music.py <uitvoer.wav> [seconden]
128 slagen per minuut, akkoorden C - G - Am - F, met bas, arpeggio, belletjes en drums.
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 128
BEAT = 60 / BPM


def note(freq, dur, kind='tri', vol=0.3, decay=6.0):
    t = np.arange(int(SR * dur)) / SR
    if kind == 'sine':
        w = np.sin(2 * np.pi * freq * t)
    elif kind == 'square':
        w = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6
    else:
        w = 2 * np.abs(2 * ((freq * t) % 1) - 1) - 1
    env = np.exp(-decay * t) * np.minimum(1, t * 200)
    return w * env * vol


def noise(dur, vol, decay):
    t = np.arange(int(SR * dur)) / SR
    return np.random.default_rng(7).uniform(-1, 1, len(t)) * np.exp(-decay * t) * vol


def kick():
    t = np.arange(int(SR * 0.25)) / SR
    f = 120 * np.exp(-18 * t) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-10 * t) * 0.9


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


CHORDS = [  # grondtoon (MIDI) en akkoordtonen
    (48, [60, 64, 67]),  # C
    (43, [59, 62, 67]),  # G
    (45, [57, 60, 64]),  # Am
    (41, [57, 60, 65]),  # F
]
MELODY = [72, 76, 79, 76, 74, 71, 74, 79, 72, 76, 81, 79, 77, 76, 74, 72]


def main():
    out = sys.argv[1]
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 70
    total = int(SR * (seconds + 2))
    mix = np.zeros(total)

    def add(sig, at):
        i = int(at * SR)
        if i >= total:
            return
        j = min(total, i + len(sig))
        mix[i:j] += sig[: j - i]

    bars = int(seconds / (4 * BEAT)) + 2
    for b in range(bars):
        root, tones = CHORDS[b % 4]
        start = b * 4 * BEAT
        intro = b < 2
        for beat in range(4):
            t0 = start + beat * BEAT
            if not intro:
                add(kick(), t0)
                if beat in (1, 3):
                    add(noise(0.18, 0.25, 22), t0)
            for half in (0, 0.5):
                add(noise(0.05, 0.08, 80), t0 + half * BEAT)
                add(note(hz(root), BEAT * 0.45, 'tri', 0.32, 5), t0 + half * BEAT)
        for k in range(16):
            tone = tones[k % 3] + (12 if k % 6 >= 3 else 0)
            add(note(hz(tone), BEAT * 0.3, 'square', 0.07, 14), start + k * BEAT / 4)
        if not intro and b % 8 in (2, 3, 6, 7):
            for k in range(8):
                m = MELODY[(b % 2) * 8 + k]
                add(note(hz(m), BEAT * 0.9, 'sine', 0.16, 3.5), start + k * BEAT / 2)
        if b % 4 == 0:
            add(note(hz(96), 1.2, 'sine', 0.05, 2.5), start)

    mix = mix[: int(SR * seconds)]
    mix = mix / np.max(np.abs(mix)) * 0.89
    stereo = np.stack([mix, np.roll(mix, int(SR * 0.012))], axis=1)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    print(f'{out}: {seconds:.0f} s')


if __name__ == '__main__':
    main()
