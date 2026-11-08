import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICE = os.environ.get('VOICE_LIB', os.path.expanduser('~/voice-library'))
TTS = os.environ.get('TTS_DIR', os.path.expanduser('~/tts'))
import sys, json, time
sys.path.insert(0, os.path.join(VOICE, 'tts')); sys.path.insert(0, HERE)
import zh_tts
from zh_tts import ZhTTS, save, texts_of
import script
zh_tts.RUN_FIX += [('过得', 'guo4 de5'), ('看得出', 'kan4 de5 chu1'), ('落下', 'luo4 xia4'), ('银行卡', 'yin2 hang2 ka3'),
                   ('不一样', 'bu4 yi2 yang4'), ('二零一零', 'er4 ling2 yi1 ling2'), ('一九八零', 'yi1 jiu3 ba1 ling2'),
                   ('点一下', 'dian3 yi2 xia4'), ('一共', 'yi2 gong4'), ('活一次', 'huo2 yi2 ci4'),
                   ('黑子', 'hei1 zi3'), ('白子', 'bai2 zi3'), ('颗子', 'ke1 zi3'), ('几子', 'ji3 zi3')]
t = ZhTTS(TTS, VOICE)
tx = texts_of(script.PARAS)
t.prepare(tx)
if '--report' in sys.argv:
    t.pinyin_report(tx); sys.exit()
t0 = time.time()
y, sr, tl = t.narrate(script.PARAS, beats=script.BEATS)
save(HERE + '/narration.wav', y, sr)
json.dump({'sr': sr, 'dur': len(y) / sr, 'timeline': tl}, open(HERE + '/timeline.json', 'w'), ensure_ascii=False, indent=1)
print('DONE', round(len(y) / sr, 2), 's in', round(time.time() - t0), 's')
