# -*- coding: utf-8 -*-
"""由气口时间生成字幕：srt（给平台）和 ass（压进画面）。"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICE = os.environ.get('VOICE_LIB', os.path.expanduser('~/voice-library'))
TTS = os.environ.get('TTS_DIR', os.path.expanduser('~/tts'))
import json, re
PH = json.load(open(HERE + '/phrases.json'))
CUT = json.load(open(HERE + '/cut.json'))
LEAD = CUT['lead']
DISP = [('一九八零年', '1980 年'), ('二零一零年', '2010 年'), ('二零零七年', '2007 年'), ('二零一五年', '2015 年'), ('二零二二年', '2022 年'), ('二零二七年', '2027 年'), ('选择决定命运', '《选择决定命运》')]
def disp(s):
    s = s.replace('/', '')
    for a, b in DISP: s = s.replace(a, b)
    s = re.sub(r'([\u4e00-\u9fff])(\d)', r'\1 \2', s)
    return re.sub(r'[，。]$', '', s).replace('，', '　').replace('。', '　').strip('　')
# 按句分组，再把短气口并起来
sents = []
for p in PH:
    if not sents or sents[-1][0]['sa'] != p['sa']: sents.append([])
    sents[-1].append(p)
items = []
for k, ps in enumerate(sents):
    groups, cur = [], None
    for p in ps:
        txt = disp(p['text'])
        if cur is None: cur = [p['a'], txt]
        else: cur[1] += '　' + txt
        if len(cur[1].replace('　', '')) >= 9: groups.append(cur); cur = None
    if cur:
        if groups and len(cur[1].replace('　', '')) < 5: groups[-1][1] += '　' + cur[1]
        else: groups.append(cur)
    end = ps[0]['sb'] + 0.2
    if k + 1 < len(sents): end = min(end, sents[k + 1][0]['a'] - 0.06)
    for i, (a, txt) in enumerate(groups):
        b = groups[i + 1][0] - 0.11 if i + 1 < len(groups) else end - 0.08
        items.append([a + LEAD - 0.08, b + LEAD, txt])
def ts(t, ass=False):
    h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    return f'{h}:{m:02d}:{s:05.2f}' if ass else f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.', ',')
open(HERE + '/选择决定命运.srt', 'w', encoding='utf8').write('\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i, (a, b, t) in enumerate(items)))
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: D,Noto Sans CJK SC,50,&H00FFFFFF,&H00FFFFFF,&H00141414,&H90000000,-1,0,0,0,100,100,2,0,1,3.8,0,2,80,80,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(HERE + '/subs.ass', 'w', encoding='utf8').write(head + '\n'.join(f'Dialogue: 0,{ts(a, 1)},{ts(b, 1)},D,,0,0,0,,{t}' for a, b, t in items) + '\n')
print('SUBS', len(items), max(len(t) for *_, t in items))
for a, b, t in items[:12]: print(round(a, 2), round(b, 2), t)
