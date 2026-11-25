"""Natuurlijker Nederlandse voice-over met Chatterbox Multilingual (MIT-licentie).

Gebruik (in een omgeving met chatterbox-tts en faster-whisper):
  VIDEO_OUT=out-promo NARRATION=promo-narration.json REF_WAV=ref.wav python video/tts_chatterbox.py

- REF_WAV: korte Nederlandse voorbeeldstem (wij gebruiken een synthetische CC0-stem, geen echt persoon).
- Elke zin wordt na het maken door Whisper uitgeschreven; wijkt die te veel af, dan wordt de zin opnieuw gemaakt.
- Schrijft per segment een wav en <VIDEO_OUT>/timing.json (zelfde vorm als tts.py).
"""
import json
import os
import re
import subprocess
import wave
from pathlib import Path

import numpy as np
import torch
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

HERE = Path(__file__).resolve().parent
OUTROOT = HERE / os.environ.get('VIDEO_OUT', 'out')
OUT = OUTROOT / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
REF = os.environ['REF_WAV']
GAP = float(os.environ.get('GAP', '0.25'))
LEAD = float(os.environ.get('LEAD', '0.3'))
TAIL = float(os.environ.get('TAIL', '0.35'))
TRIES = int(os.environ.get('TRIES', '4'))

# Uitspraakhulp: hoe het model het woord moet zeggen (de ondertitels/teksten houden de gewone spelling).
SAY = {
    'laser': 'leezer',
    'Typ': 'Tiep',
    'typen': 'tiepen',
    'Typen': 'Tiepen',
    'typediploma': 'tiepdiploma',
    'badges': 'betsjes',
}


def speakable(text):
    for k, v in SAY.items():
        text = re.sub(rf'\b{k}\b', v, text)
    return text


def norm(s):
    s = s.lower().replace('-', ' ')
    for k, v in {'tiep': 'typ', 'leezer': 'laser', 'betsjes': 'badges'}.items():
        s = s.replace(k, v)
    return re.sub(r'[^a-zé ]', '', s).split()


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        d[i][0] = i
    for j in range(len(h) + 1):
        d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1][-1] / max(1, len(r))


def sentences(text):
    return [p for p in re.split(r'(?<=[.!?])\s+', text.strip()) if p]


def main():
    torch.manual_seed(int(os.environ.get('SEED', '1')))
    model = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
    asr = WhisperModel('small', device='cpu', compute_type='int8')
    sr = model.sr
    segments = json.loads((HERE / os.environ.get('NARRATION', 'narration.json')).read_text(encoding='utf-8'))
    only = [x for x in os.environ.get('ONLY', '').split(',') if x]
    timing = json.loads((OUTROOT / 'timing.json').read_text(encoding='utf-8')) if only else {}
    report = []
    for seg in segments:
        if only and seg['id'] not in only:
            continue
        t = LEAD
        cues = []
        parts = []
        for sent in sentences(seg['text']):
            best = None
            for attempt in range(TRIES):
                wav = model.generate(speakable(sent), language_id='nl', audio_prompt_path=REF,
                                     exaggeration=float(os.environ.get('EXAGGERATION', '0.6')), cfg_weight=0.5, temperature=0.7)
                tmp = OUT / '_tmp.wav'
                ta.save(str(tmp), wav, sr)
                raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(tmp), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                                     capture_output=True, check=True).stdout
                segs, info = asr.transcribe(np.frombuffer(raw, dtype=np.float32), language='nl', beam_size=5)
                hyp = ' '.join(s.text.strip() for s in segs)
                score = wer(sent, hyp)
                if best is None or score < best[0]:
                    best = (score, wav, hyp)
                if score <= 0.1:
                    break
            score, wav, hyp = best
            report.append(f"{seg['id']} ({score:.0%}): {sent}  ->  {hyp}")
            audio = wav.squeeze(0).numpy()
            # stilte aan begin en eind van de zin wat inkorten
            idx = np.where(np.abs(audio) > 0.01)[0]
            if len(idx):
                audio = audio[max(0, idx[0] - int(0.05 * sr)): idx[-1] + int(0.12 * sr)]
            dur = len(audio) / sr
            parts.append(audio)
            cues.append({'start': round(t, 3), 'end': round(t + dur, 3), 'text': sent})
            t += dur + GAP
        sil = lambda s: np.zeros(int(sr * s), dtype=np.float32)  # noqa: E731
        full = [sil(LEAD)]
        for i, p in enumerate(parts):
            full += [p, sil(GAP if i < len(parts) - 1 else TAIL)]
        pcm = (np.clip(np.concatenate(full), -1, 1) * 32767).astype(np.int16)
        with wave.open(str(OUT / f"{seg['id']}.wav"), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(pcm.tobytes())
        timing[seg['id']] = {'duration': round(t - GAP + TAIL, 3), 'cues': cues, 'speed': seg.get('speed', 1), 'chapter': seg.get('chapter', '')}
        print(f"{seg['id']}: {timing[seg['id']]['duration']:.1f}s", flush=True)
    (OUT / '_tmp.wav').unlink(missing_ok=True)
    (OUTROOT / 'timing.json').write_text(json.dumps(timing, indent=1, ensure_ascii=False), encoding='utf-8')
    (OUTROOT / ('tts-report-' + '-'.join(only) + '.txt' if only else 'tts-report.txt')).write_text('\n'.join(report), encoding='utf-8')
    print('\n'.join(report))


if __name__ == '__main__':
    main()
