"""Maakt de Nederlandse voice-over voor de uitlegvideo met Piper (offline spraaksynthese).

Stem: nl_NL-pim-medium (Nederlands-Nederlands, CC0) van huggingface.co/rhasspy/piper-voices.
Gebruik: PIPER_MODEL=/pad/naar/nl_NL-pim-medium.onnx python3 video/tts.py
Schrijft per segment een wav-bestand en video/out/timing.json met de begin- en eindtijd van elke zin.
"""
import json
import os
import re
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

HERE = Path(__file__).resolve().parent
OUTROOT = HERE / os.environ.get('VIDEO_OUT', 'out')
OUT = OUTROOT / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
MODEL = os.environ.get('PIPER_MODEL', '/tmp/claude-0/tts/nl_NL-pim/nl_NL-pim-medium.onnx')
GAP = float(os.environ.get('GAP', '0.32'))  # stilte tussen zinnen (s)
LEAD = float(os.environ.get('LEAD', '0.5'))  # stilte aan het begin van een segment (s)

# Uitspraakhulp: woorden die de stem anders verkeerd uitspreekt.
SAY = {
    'Raketrace': 'Raketrees',
    'race': 'rees',
    'Race': 'Rees',
    'Excel': 'Eksel',
    'software': 'softwèr',
}


def speakable(text):
    for k, v in SAY.items():
        text = re.sub(rf'\b{k}\b', v, text)
    return text


def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p for p in parts if p]


def main():
    voice = PiperVoice.load(MODEL)
    cfg = SynthesisConfig(length_scale=float(os.environ.get('LENGTH_SCALE', '1.06')), noise_scale=float(os.environ.get('NOISE_SCALE', '0.5')), noise_w_scale=0.333)
    segments = json.loads((HERE / os.environ.get('NARRATION', 'narration.json')).read_text(encoding='utf-8'))
    timing = {}
    for seg in segments:
        frames = []
        rate = None
        t = LEAD
        cues = []
        for sent in sentences(seg['text']):
            tmp = OUT / '_tmp.wav'
            with wave.open(str(tmp), 'wb') as w:
                voice.synthesize_wav(speakable(sent), w, syn_config=cfg)
            with wave.open(str(tmp), 'rb') as r:
                rate = r.getframerate()
                data = r.readframes(r.getnframes())
                dur = r.getnframes() / rate
            frames.append(data)
            cues.append({'start': round(t, 3), 'end': round(t + dur, 3), 'text': sent})
            t += dur + GAP
        silence = lambda s: b'\x00\x00' * int(rate * s)  # noqa: E731
        with wave.open(str(OUT / f"{seg['id']}.wav"), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(silence(LEAD))
            for i, f in enumerate(frames):
                w.writeframes(f)
                w.writeframes(silence(GAP if i < len(frames) - 1 else float(os.environ.get('TAIL', '0.6'))))
        timing[seg['id']] = {'duration': round(t - GAP + float(os.environ.get('TAIL', '0.6')), 3), 'cues': cues, 'speed': seg.get('speed', 1), 'chapter': seg.get('chapter', '')}
        print(f"{seg['id']}: {timing[seg['id']]['duration']:.1f}s")
    (OUT / '_tmp.wav').unlink(missing_ok=True)
    (OUTROOT / 'timing.json').write_text(json.dumps(timing, indent=1, ensure_ascii=False), encoding='utf-8')


if __name__ == '__main__':
    main()
