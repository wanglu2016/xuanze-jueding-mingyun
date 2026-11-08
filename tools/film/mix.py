# -*- coding: utf-8 -*-
"""混音：旁白、轻音乐、落子声。"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICE = os.environ.get('VOICE_LIB', os.path.expanduser('~/voice-library'))
TTS = os.environ.get('TTS_DIR', os.path.expanduser('~/tts'))
import json, subprocess
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
W_ = HERE
SR = 48000
TL = json.load(open(f'{W_}/timeline.json')); CUT = json.load(open(f'{W_}/cut.json')); SFX = json.load(open(f'{W_}/sfx.json'))
LEAD, TOTAL = CUT['lead'], CUT['total']
N = int(TOTAL * SR); rng = np.random.default_rng(2026)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{W_}/narration.wav', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
v = np.frombuffer(raw, dtype=np.float32).copy(); v /= np.max(np.abs(v)) + 1e-9
L = int(0.16 * SR); ir = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.045 * SR)); ir[0] = 0; ir *= 0.055 / np.sqrt((ir ** 2).sum()); ir[0] = 1
v = fftconvolve(v, ir)[:len(v)]
voice = np.zeros(N); a = int(LEAD * SR); voice[a:a + len(v)] = v[:N - a]; voice *= 0.72 / np.max(np.abs(voice))
act = np.zeros(N)
for e in TL['timeline']: act[int((e['a'] + LEAD) * SR):int((e['b'] + LEAD) * SR)] = 1
win = int(0.35 * SR); duck = 1 - 0.45 * np.convolve(act, np.ones(win) / win, 'same')
# 音乐：稀疏的琴声和一层很轻的长音（五声音阶，配围棋）
def pluck(f, d, amp):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(k_a * np.sin(2 * np.pi * f * k * t) for k, k_a in [(1, 1), (2, .3), (3, .1), (4, .04)])
    return amp * x * np.exp(-t / (d * .34)) * np.minimum(1, t / .01)
def pad(f, d, amp):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.003 * t) + .2 * np.sin(2 * np.pi * f * 2 * t)
    return amp * x * np.sin(np.pi * np.minimum(1, t / d)) ** 1.5
M = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [(50, [62, 64, 69, 71]), (45, [62, 64, 67, 69]), (48, [60, 64, 67, 69]), (43, [62, 67, 69, 71])]
bar = 5.4
Lb, Rb = np.zeros(N + 10 * SR), np.zeros(N + 10 * SR)
def put(buf, x, t):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i]
t, b = 0.0, 0
while t < TOTAL:
    root, notes = CH[b % 4]
    p = pad(M(root), bar * 1.25, .05); put(Lb, p, t); put(Rb, p, t)
    p2 = pad(M(notes[1]), bar * 1.25, .02); put(Lb, p2 * 1.2, t); put(Rb, p2 * .8, t)
    put(Lb, pluck(M(root), 4.5, .09), t); put(Rb, pluck(M(root), 4.5, .09), t)
    for k, m in enumerate(rng.choice(notes, 3, replace=True)):
        tt = t + (k + 1) * bar / 4 + rng.uniform(-.04, .04); x = pluck(M(int(m)), 3.0, .065); pn = rng.uniform(-.3, .3)
        put(Lb, x * (1 - pn), tt); put(Rb, x * (1 + pn), tt)
    t += bar; b += 1
music = sosfilt(butter(2, 2600, 'low', fs=SR, output='sos'), np.stack([Lb[:N], Rb[:N]]))
music *= 0.12 / np.max(np.abs(music))
g = np.ones(N)
def ramp(t0, t1, v0, v1): i, j = int(t0 * SR), min(N, int(t1 * SR)); g[i:j] = np.linspace(v0, v1, j - i)
ramp(0, 2.0, 0, 1); ramp(TOTAL - 4, TOTAL - .2, 1, 0); g[int((TOTAL - .2) * SR):] = 0
music = music * g * duck
# 音效
def stone(v):
    n = int(.11 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-t / .006)
    x = sosfilt(butter(2, [1500, 3600], 'band', fs=SR, output='sos'), x); x /= np.max(np.abs(x)) + 1e-9
    f = 320 * np.exp(-t / .05) + 110; body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .03)
    return v * (.16 * x + .11 * body)
def tap(v):
    n = int(.03 * SR); x = rng.standard_normal(n) * (1 - np.arange(n) / n) ** 3
    x = sosfilt(butter(2, [900, 4000], 'band', fs=SR, output='sos'), x); return v * .05 * x / (np.max(np.abs(x)) + 1e-9)
def tick(v):
    n = int(.06 * SR); t = np.arange(n) / SR; return v * .045 * np.sin(2 * np.pi * 1100 * t) * np.exp(-t / .015)
open_end = CUT['scene_a'].get('title', 6)
fx = np.zeros(N); last = -9
for tt, kind, vol in SFX:
    if kind == 'stone' and tt < open_end: vol *= .55          # 片头一整局落子，压轻一点
    if kind == 'stone' and tt - last < .045: continue
    if kind == 'stone': last = tt
    x = {'stone': stone, 'tap': tap, 'tick': tick}[kind](vol); i = int(tt * SR); j = min(N, i + len(x))
    if 0 <= i < N: fx[i:j] += x[:j - i]
out = np.clip(np.stack([voice + fx + music[0], voice + fx + music[1]]).T, -1, 1)
open(f'{W_}/mix.f32', 'wb').write(out.astype(np.float32).tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', f'{W_}/mix.f32', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.89,aresample=48000', '-c:a', 'pcm_s16le', f'{W_}/mix.wav'], check=True)
print('MIX_OK', TOTAL, len(SFX))
