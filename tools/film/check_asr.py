import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICE = os.environ.get('VOICE_LIB', os.path.expanduser('~/voice-library'))
TTS = os.environ.get('TTS_DIR', os.path.expanduser('~/tts'))
import sys, json, re, difflib
sys.path.insert(0, os.path.join(VOICE, 'tts')); sys.path.insert(0, HERE)
import zh_tts
from zh_tts import ZhTTS, load
import script
t = ZhTTS(TTS, VOICE)
d = json.load(open(HERE + '/timeline.json')); y, sr = load(HERE + '/narration.wav')
CJK = re.compile(r'[一-鿿]')
assert len(d['timeline']) == len(script.PARAS)
bad, phr = 0, []
for e, para, scene in zip(d['timeline'], script.PARAS, script.SCENE_OF):
    a, b = max(0, e['a'] - .1), e['b'] + .1
    seg = y[int(a * sr):int(b * sr)]
    heard = t.asr(seg, sr)
    w = t.wrong(heard, e['text'])
    if w: bad += 1
    print('X' if w else ' ', e['text'], '|', heard, '|', w or '')
    # 气口的起点：用识别出的字时间对齐稿子的字
    want = CJK.findall(''.join(para))
    got = t.asr_chars(seg, sr)
    gt = [c for c, _ in got]
    tm = [None] * len(want)
    for blk in difflib.SequenceMatcher(None, want, gt, autojunk=False).get_matching_blocks():
        for k in range(blk.size): tm[blk.a + k] = a + got[blk.b + k][1]
    # 没对上的字按前后插值
    known = [(i, x) for i, x in enumerate(tm) if x is not None]
    for i in range(len(tm)):
        if tm[i] is None:
            lo = max([k for k in known if k[0] < i], default=(-1, e['a']), key=lambda k: k[0])
            hi = min([k for k in known if k[0] > i], default=(len(tm), e['b']), key=lambda k: k[0])
            tm[i] = lo[1] + (hi[1] - lo[1]) * (i - lo[0]) / (hi[0] - lo[0])
    k = 0
    for p in para:
        n = len(CJK.findall(p))
        phr.append({'scene': scene, 'text': p, 'a': round(tm[k] if k < len(tm) else e['b'], 3), 'sa': e['a'], 'sb': e['b']})
        k += n
json.dump(phr, open(HERE + '/phrases.json', 'w'), ensure_ascii=False, indent=0)
print('BAD', bad)
