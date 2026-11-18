"""Monteert de uitlegvideo uit de opgenomen schermbeelden en de voice-over.

Stappen: python3 video/tts.py  ->  node video/record.cjs  ->  python3 video/build.py
Resultaat: video/out/uitleg.mp4 (1920x1080, H.264 + AAC, ondertitels ingebrand).
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'out'
SEG = OUT / 'segments'
SEG.mkdir(parents=True, exist_ok=True)
FPS = 30
FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def esc_draw(text):
    return text.replace('\\', '\\\\').replace(':', '\\:').replace("'", '’').replace('%', '\\%')


def build_segment(sid, info):
    meta = json.loads((OUT / 'frames' / sid / 'frames.json').read_text())
    frames = meta['frames']
    speed = info.get('speed', 1)
    fast_from = meta.get('marks', {}).get('fastFrom')
    fast_to = meta.get('marks', {}).get('fastTo')

    def vt(t):
        """Echte tijd (ms) -> videotijd (s), met versneld stuk."""
        t = t - meta['start']
        if not (fast_from and fast_to and speed > 1):
            return t / 1000
        a = fast_from - meta['start']
        b = fast_to - meta['start']
        if t <= a:
            return t / 1000
        if t <= b:
            return (a + (t - a) / speed) / 1000
        return (a + (b - a) / speed + (t - b)) / 1000

    lines = []
    times = [max(meta['start'], f['t']) for f in frames]
    for i, f in enumerate(frames):
        nxt = times[i + 1] if i + 1 < len(frames) else meta['end']
        dur = max(0.001, vt(nxt) - vt(times[i]))
        lines.append(f"file '{(OUT / 'frames' / sid / f['file']).as_posix()}'\nduration {dur:.4f}")
    lines.append(f"file '{(OUT / 'frames' / sid / frames[-1]['file']).as_posix()}'")
    first_gap = vt(times[0])
    (SEG / f'{sid}.txt').write_text('\n'.join(lines))
    video_len = vt(meta['end'])
    audio_len = info['duration']
    length = max(video_len, audio_len + 0.3)

    filters = [f'tpad=start_duration={first_gap:.3f}:start_mode=clone:stop_mode=clone:stop_duration={max(0, length - video_len) + 0.5:.3f}',
               f'fps={FPS}', 'scale=1920:1080:flags=lanczos', 'format=yuv420p']
    if fast_from and fast_to and speed > 1:
        a = vt(fast_from) + first_gap
        b = vt(fast_to) + first_gap
        label = esc_draw(f'{speed}x versneld')
        filters.append(f"drawtext=fontfile={FONT}:text='{label}':x=w-tw-40:y=34:fontsize=34:fontcolor=white:box=1:boxcolor=0x0b1230@0.75:boxborderw=14:enable='between(t,{a:.2f},{b:.2f})'")
    chapter = info.get('chapter')
    if chapter and sid not in ('s01', 's13'):
        filters.append(f"drawtext=fontfile={FONT}:text='{esc_draw(chapter)}':x=40:y=h-th-40:fontsize=30:fontcolor=white:box=1:boxcolor=0x2a78d6@0.88:boxborderw=14:enable='lt(t,4.5)'")
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(SEG / f'{sid}.txt'),
         '-i', str(OUT / 'audio' / f'{sid}.wav'),
         '-filter_complex', f"[0:v]{','.join(filters)}[v];[1:a]aresample=48000,apad[a]",
         '-map', '[v]', '-map', '[a]', '-t', f'{length:.3f}',
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-r', str(FPS), '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '160k', '-ac', '2', str(SEG / f'{sid}.mp4')])
    return length


def ts(t, sep='.'):
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    return f'{h:d}:{m:02d}:{s:05.2f}' if sep == 'ass' else f'{h:02d}:{m:02d}:{s:06.3f}'


def main():
    timing = json.loads((OUT / 'timing.json').read_text(encoding='utf-8'))
    offset = 0.0
    ass_events = []
    vtt = ['WEBVTT', '']
    concat = []
    for sid, info in timing.items():
        length = build_segment(sid, info)
        print(f'{sid}: {length:.1f}s')
        for c in info['cues']:
            a = offset + c['start']
            b = offset + c['end'] + 0.25
            ass_events.append(f"Dialogue: 0,{ts(a, 'ass')},{ts(b, 'ass')},Sub,,0,0,0,,{c['text']}")
            vtt += [f'{ts(a)} --> {ts(b)}', c['text'], '']
        concat.append(f"file '{(SEG / f'{sid}.mp4').as_posix()}'")
        offset += length
    (OUT / 'concat.txt').write_text('\n'.join(concat))
    (OUT / 'uitleg.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter,44,&H00FFFFFF,&H00FFFFFF,&H00000000,&H50101010,0,0,0,0,100,100,0,0,3,14,0,2,220,220,46,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ass_events) + '\n'
    (OUT / 'subs.ass').write_text(ass, encoding='utf-8')
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(OUT / 'concat.txt'), '-c', 'copy', str(OUT / 'joined.mp4')])
    run(['ffmpeg', '-y', '-i', str(OUT / 'joined.mp4'),
         '-vf', f"ass={(OUT / 'subs.ass').as_posix()},fade=t=in:st=0:d=0.6,fade=t=out:st={offset - 1:.2f}:d=1",
         '-af', f'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={offset - 1:.2f}:d=1',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
         '-c:a', 'aac', '-b:a', '160k', str(OUT / 'uitleg.mp4')])
    run(['ffmpeg', '-y', '-ss', '1.5', '-i', str(SEG / 's01.mp4'), '-frames:v', '1', '-q:v', '3', '-vf', 'scale=1280:-2', str(OUT / 'poster.jpg')])
    print(f'Klaar: {OUT / "uitleg.mp4"} ({offset:.0f} s)')


if __name__ == '__main__':
    main()
