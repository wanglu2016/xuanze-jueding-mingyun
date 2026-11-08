# -*- coding: utf-8 -*-
"""按旁白时间线逐帧拍摄全部场景。用法：python3 shoot.py [场景名…]"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VOICE = os.environ.get('VOICE_LIB', os.path.expanduser('~/voice-library'))
TTS = os.environ.get('TTS_DIR', os.path.expanduser('~/tts'))
import asyncio, base64, json, os, subprocess, sys, http.server, threading, functools, time
from playwright.async_api import async_playwright
sys.path.insert(0, HERE)
import script

WORK = HERE
FPS, W, H, DSF = 30, 1120, 630, 12 / 7
LEAD, TAIL = 1.8, 4.6
ONLY = set(sys.argv[1:])
TL = json.load(open(f'{WORK}/timeline.json'))
PH = json.load(open(f'{WORK}/phrases.json'))
DUR = TL['dur']
NAMES = [n for n, _ in script.SCENES]
SCENE_A = {}
for p in PH:
    SCENE_A.setdefault(p['scene'], p['a'] + LEAD)
TOTAL = DUR + LEAD + TAIL
clean = lambda s: ''.join(c for c in s if c not in '，。？、：/ 《》')


def bounds(name):
    i = NAMES.index(name)
    a = 0.0 if i == 0 else SCENE_A[name] - 0.3
    b = TOTAL if i == len(NAMES) - 1 else SCENE_A[NAMES[i + 1]] - 0.3
    return a, b


def phrase(name, sub):
    s = clean(sub)
    for p in PH:
        if p['scene'] == name and clean(p['text']).startswith(s):
            return p['a'] + LEAD
    for p in PH:
        if p['scene'] == name and s in clean(p['text']):
            k = clean(p['text']).find(s)
            nxt = [q['a'] for q in PH if q['a'] > p['a'] and q['sa'] == p['sa']]
            end = nxt[0] if nxt else p['sb']
            return p['a'] + LEAD + (end - p['a']) * k / len(clean(p['text']))
    raise KeyError((name, sub))


SFX = []
URL = None


def serve(port=8791):
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    class Q(h.func):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{port}/index.html'


ease = lambda u: u * u * (3 - 2 * u)


class Take:
    def __init__(self, page, cdp, s):
        self.page, self.cdp, self.s, self.n, self.last = page, cdp, s, 0, None
        self.path = f'{WORK}/scenes/{s.name}.mp4'; self.tmp = self.path[:-4] + '.part.mp4'
        self.cam = [1.0, W / 2, H / 2]; self.tw = None; self.stw = None
        cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
               '-vf', 'scale=1920:1080:in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-crf', '17', '-preset', 'veryfast',
               '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-r', str(FPS), self.tmp]
        self.ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    @property
    def t(self): return self.n / FPS

    async def js(self, code, *a): return await self.page.evaluate(code, *a)

    # 镜头
    def camto(self, z, fx, fy, d=0.8):
        """fy 用文档坐标（游戏页面会滚动）；图层和依据页用视口坐标"""
        if d <= 0: self.cam = [z, fx, fy]; self.tw = None; return
        self.tw = (self.t, d, list(self.cam), [z, fx, fy])
    async def home(self, d=0.8):
        sy = await self.js('__film.sy()'); self.camto(1.0, W / 2, sy + H / 2, d)
    async def look(self, sel, z, d=0.8, nth=0, ax=.5, ay=.5):
        r = await self.js('([q,n,x,y])=>__film.focus(q,n,x,y)', [sel, nth, ax, ay])
        if r is None: print('  找不到', sel); return
        if r['app']:
            vis = H / z
            if r['f'][1] - vis * .5 < r['sy'] or r['f'][1] + vis * .5 > r['sy'] + H:
                want = max(0, min(r['max'], r['f'][1] - H / 2))
                if d <= 0: await self.js('y=>{const a=document.querySelector("#app"),k=a.style.transform;a.style.transform="";scrollTo(0,y);a.style.transform=k}', want); self.stw = None
                else: self.stw = (self.t, d, r['sy'], want)
        self.camto(z, r['f'][0], r['f'][1], d)
    async def look_xy(self, x, y, z, d=0.8): self.camto(z, x, y, d)
    def _scroll(self):
        if not self.stw: return None
        t0, d, a, b = self.stw; u = min(1, (self.t - t0) / d)
        if u >= 1: self.stw = None
        return a + (b - a) * ease(u)
    def _cam(self):
        if self.tw:
            t0, d, a, b = self.tw; u = min(1, (self.t - t0) / d); e = ease(u)
            self.cam = [a[i] + (b[i] - a[i]) * e for i in range(3)]
            if u >= 1: self.tw = None
        return self.cam

    async def shot(self):
        r = await self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 92, 'optimizeForSpeed': True})
        self.last = base64.b64decode(r['data'])

    def put(self, k=1):
        for _ in range(k): self.ff.stdin.write(self.last)
        self.n += k

    async def frame(self):
        cam = self._cam(); sy = self._scroll()
        fx = await self.js('([d,c,y])=>__film.frame(d,c,y)', [1000 / FPS, cam, sy])
        for kind, v in fx: SFX.append([round(self.s.a + self.t, 3), kind, v])
        await self.shot(); self.put()

    async def to(self, T):
        while self.n < round(T * FPS): await self.frame()

    async def hold(self, T):
        """画面静止：不推进页面时间，重复上一帧"""
        k = round(T * FPS) - self.n
        if k > 0:
            if self.last is None: await self.shot()
            self.put(k)

    async def settle(self, ms=600):
        """不拍摄，让页面先跑一会儿"""
        for _ in range(int(ms / 33)): await self.js('d=>__film.frame(d,null)', 33)

    # 光标
    async def cur(self, sel, nth=0, d=0.6, dx=None):
        await self.js('([q,n,d,x])=>__film.curTo(q,n,d,x)', [sel, nth, d, dx])
        await self.to(self.t + d + 0.04)
        x, y = await self.js('__film.pos()'); await self.page.mouse.move(x, y)
    async def cur_xy(self, x, y, d=0.6, real=True):
        await self.js('([x,y,d])=>__film.curXY(x,y,d)', [x, y, d])
        await self.to(self.t + d + 0.04)
        if real: await self.page.mouse.move(x, y)
    async def click(self):
        x, y = await self.js('__film.pos()')
        await self.js('__film.tap()')
        await self.page.mouse.click(x, y)
    async def tap(self):
        await self.js('__film.tap()')
    async def hide(self): await self.js('__film.show(false)')

    def done(self, total):
        k = round(total * FPS) - self.n
        if k > 0: self.put(k)
        self.ff.stdin.close()
        if self.ff.wait() != 0: raise RuntimeError('ffmpeg 失败 ' + self.path)
        os.replace(self.tmp, self.path)


class S:
    def __init__(self, name, page):
        self.name, self.page = name, page
        self.a, self.b = bounds(name); self.dur = self.b - self.a
    def p(self, sub): return phrase(self.name, sub) - self.a
    async def fresh(self):
        await self.page.goto(URL)
        await self.page.evaluate("document.fonts.ready")
        await self.page.add_script_tag(path=f'{WORK}/direct.js')
        await self.page.evaluate("__film.prep()")
        for _ in range(8): await self.page.evaluate('d=>__film.frame(d,null)', 33)


ZHU = "{cohort:1990,cls:'C',seed:3}"
ZOPT = "{pol:'crowd'}"
ZPICK = "{c_eng:'跟着磁带',c_pc:'代码'}"
REV = "{cohort:1990,cls:'B',seed:261}"
CASE = "{cohort:2000,cls:'B',seed:1}"
JOB = "{k:'office',n:'公司白领',sec:'office',mult:1.3,since:2015}"


async def jump(t, cfg, nid, patch='{}'):
    await t.js(f"XZ.UI.jump({cfg},'{nid}',{patch})")


# ---------------- 场景
async def sc_open(s, t):
    await s.fresh()
    await t.js(f"__film.ff({REV},{{}},null,{{pol:'folk'}})")
    await t.js("__film.openBoard(66)")
    t.camto(1.0, W / 2, H / 2, 0); t.camto(1.12, W / 2, H / 2, s.dur)
    await t.to(s.dur)


async def sc_title(s, t):
    await s.fresh()
    await t.home(0)
    await t.to(0.3); await t.look('.logo', 1.32, 2.6, ay=.42)
    await t.to(s.p('手机和电脑都能玩') - 0.1)
    await t.js(f"__film.devices('{URL}')"); await asyncio.sleep(2.5)
    t.camto(1.0, W / 2, H / 2, 0); t.camto(1.06, W / 2, H / 2, s.dur - t.t)
    await t.to(s.dur)


async def sc_board(s, t):
    await s.fresh()
    await t.js(f"__film.ff({ZHU},{ZPICK},'u_first',{ZOPT})"); await t.js("__film.load()"); await t.settle()
    await t.look('#band', 1.42, 0)
    await t.to(s.p('黑子是你的选择') - 0.2)
    n = await t.js("__film.lastStone('b')"); xy = await t.js(f"__film.stoneXY({n})")
    await t.cur_xy(xy[0], xy[1], 0.55, real=False); await t.tap()
    await t.to(s.p('白子是时代') - 0.15)
    n = await t.js("__film.lastStone('w', true)"); xy = await t.js(f"__film.stoneXY({n})")
    await t.cur_xy(xy[0], xy[1], 0.55, real=False); await t.tap()
    await t.to(s.dur - 0.5); await t.hide()
    await t.to(s.dur)


async def sc_year(s, t):
    await s.fresh()
    await t.look('#yrs', 1.0, 0)
    await t.look('#setup .sec', 1.55, 1.2, ay=.55)
    await t.to(s.p('从一九八零年') - 0.6); await t.cur('.yb[data-y="1980"]', 0, 0.5); await t.click()
    await t.to(s.p('到二零一零年') - 0.6); await t.cur('.yb[data-y="2010"]', 0, 0.6); await t.click()
    await t.to(s.p('一共七个') - 0.5); await t.cur('.yb[data-y="1990"]', 0, 0.6); await t.click()
    await t.to(s.dur)


async def sc_lot(s, t):
    await s.fresh()
    await t.js("__film.click('.yb[data-y=\"1990\"]'); __film.forceDraw(9)"); await t.settle(300)
    await t.look('#mode', 1.5, 0, ay=.3)
    await t.to(s.p('可以自己挑') - 0.6); await t.cur('#mode button[data-k=pick]', 0, 0.55); await t.click()
    await t.to(s.p('也可以随机') - 0.55); await t.cur('#mode button[data-k=lot]', 0, 0.5); await t.click()
    await t.to(s.p('随机是按那一年') - 0.3); await t.look('#setup > .note', 1.7, 0.9)
    await t.to(s.p('所以大多数人') - 0.7); await t.look('#draw', 1.4, 0.6, ay=0)
    await t.to(t.t + 0.1); await t.cur('#draw', 0, 0.5); await t.click()
    await t.to(t.t + 0.3); await t.hide(); await t.look('.lot', 1.15, 0.9, ax=.1)
    await t.to(s.dur)


async def sc_handi(s, t):
    await s.fresh()
    await t.js("__film.click('.yb[data-y=\"1990\"]')"); await t.settle(200)
    await t.js("__film.click('#mode button[data-k=pick]')"); await t.settle(200)
    await t.js("__film.into('#cls', 40)"); await t.settle(200)
    await t.home(0)
    await t.to(s.p('富裕家庭') - 0.6); await t.cur('.cl1[data-c=F]', 0, 0.55, dx=60); await t.click()
    await t.to(s.p('农村家庭') - 0.6); await t.cur('.cl1[data-c=A]', 0, 0.55, dx=60); await t.click()
    await t.to(s.dur - 0.4); await t.hide()
    await t.to(s.dur)


async def sc_play(s, t):
    await s.fresh()
    await t.js("__film.click('.yb[data-y=\"1990\"]')"); await t.settle(200)
    await t.js("__film.click('#mode button[data-k=pick]')"); await t.settle(200)
    await t.js("__film.click('.cl1[data-c=A]')"); await t.settle(800)
    await t.js("__film.into('#start', 380)"); await t.settle(100)
    await t.look('#start', 1.35, 0, ay=0)
    await t.to(0.15); await t.cur('#start', 0, 0.5)
    await t.to(s.p('然后就开始下了') + 0.5); await t.click()
    await t.to(t.t + 0.1); await t.home(0)
    await t.to(s.p('每一手') - 0.3); await t.cur('#ovgo', 0, 0.45); await t.click(); await t.hide()
    await t.to(t.t + 0.05); await t.look('.turn', 1.3, 0.7, ay=.25)
    cuts = [('二零零七年的牛市', "{cohort:1985,cls:'C',seed:5}", 'e_bull07', "{year:2007,age:22,cash:8,job:" + JOB + "}"),
            ('二零一五年的配资', "{cohort:1985,cls:'C',seed:5}", 'e_bull15', "{year:2015,age:30,cash:30,job:" + JOB + "}"),
            ('满大街的高息理财', "{cohort:1985,cls:'C',seed:5}", 'e_p2p', "{year:2014,age:29,cash:30,job:" + JOB + "}"),
            ('还有后来的人工智能', "{cohort:1990,cls:'C',seed:5}", 'e_gpt', "{year:2023,age:33,cash:50,job:" + JOB + "}")]
    for ph, cfg, nid, patch in cuts:
        await t.to(s.p(ph) - 0.15); await jump(t, cfg, nid, patch); await t.look('.turn', 1.32, 0, ay=.22)
    await t.to(s.dur)


async def sc_click(s, t):
    await s.fresh()
    await t.js(f"__film.ff({ZHU},{ZPICK},'u_first',{ZOPT})"); await t.js("__film.load()"); await t.settle()
    await t.home(0)
    await t.to(s.p('你点一个选项') - 0.1); await t.cur('#OL .opt[data-i]', 0, 0.7, dx=120)
    await t.to(s.p('棋盘上就落下') + 0.1); await t.click()
    await t.to(t.t + 0.15); await t.hide()
    n = await t.js("__film.lastStone('b')"); xy = await t.js(f"(()=>{{const a=document.querySelector('#app'),k=a.style.transform;a.style.transform='';const r=__film.stoneXY({n});a.style.transform=k;return [r[0],r[1]+scrollY]}})()")
    await t.look_xy(xy[0], xy[1], 1.55, 0.7)
    await t.to(s.p('选项不告诉你对错') - 0.2); await t.look('#Z', 1.45, 0.9, ax=.35)
    await t.to(s.dur)


async def sc_cross(s, t):
    await s.fresh()
    await jump(t, "{cohort:2005,cls:'A',seed:3}", 'zk', '{year:2020,age:15,acad:40}'); await t.settle()
    await t.look('#OL', 1.0, 0); await t.look('#OL', 1.55, 1.0, ax=.45)
    await t.to(s.p('红色是制度不允许') - 0.5); await t.cur('#OL .opt[data-l]', 1, 0.5, dx=140); await t.click()
    await t.to(s.p('蓝色是家里条件不够') - 0.5); await t.cur('#OL .opt[data-l]', 2, 0.5, dx=140); await t.click()
    await t.to(s.p('能看到原因') - 0.3); await t.hide(); await t.look('#OL .opt[data-l] .why', 1.85, 0.8, nth=1, ax=.3)
    await t.to(s.dur)


async def sc_seed(s, t):
    await s.fresh()
    await t.js(f"__film.ff({ZHU},{ZPICK},'c_eng',{ZOPT})"); await t.js("__film.load()"); await t.settle()
    await t.look('.turn', 1.3, 0, ay=.35)
    k = await t.js("__film.optN('跟着磁带')")
    await t.to(s.p('每天念十五分钟英语') - 0.2); await t.cur('#OL .opt[data-i]', k, 0.55, dx=140); await t.click()
    await t.to(s.p('自学一点编程') - 0.2)
    await t.js(f"__film.ff({ZHU},{ZPICK},'c_pc',{ZOPT})"); await t.js("__film.load()"); await t.hide()
    await t.look('.turn', 1.3, 0, ay=.35)
    k = await t.js("__film.optN('代码')")
    await t.to(t.t + 0.3); await t.cur('#OL .opt[data-i]', k, 0.55, dx=140); await t.click()
    await t.to(s.p('当时谁也看不出') + 0.2); await t.hide(); await t.look('#Z', 1.5, 0.8, ax=.35)
    await t.to(s.dur)


async def sc_zhu(s, t):
    await s.fresh()
    await t.js(f"__film.ff({ZHU},{ZPICK},'e_ago',{ZOPT})"); await t.js("__film.load()")
    await t.look('.body', 1.28, 0, ay=.2)
    await t.to(s.p('别人看不见的选项') - 0.4); await t.look('#OL .opt.zhu', 1.6, 0.9, ax=.4)
    await t.to(s.p('棋盘上会画出一条红线') - 0.5); await t.cur('#OL .opt.zhu', 0, 0.5, dx=160); await t.click()
    await t.to(t.t + 0.25); await t.hide()
    L = await t.js("__film.lastLink()")
    mid = await t.js(f"(()=>{{const a=document.querySelector('#app'),k=a.style.transform;a.style.transform='';const p=__film.stoneXY({L[0]}),q=__film.stoneXY({L[1]});a.style.transform=k;return [(p[0]+q[0])/2,(p[1]+q[1])/2+scrollY]}})()")
    await t.look_xy(mid[0], mid[1], 1.9, 0.8)
    await t.to(s.p('和现在连起来') - 0.1); await t.home(1.1)
    await t.to(s.dur)


async def sc_risk(s, t):
    await s.fresh()
    await t.js(f"__film.ff({CASE},{{e_card:'办'}},'e_card')"); await t.js("__film.load()")
    await t.look('.body', 1.3, 0, ay=.3)
    k = await t.js("__film.optN('卡是我的')")
    await t.to(s.p('一张八百块') - 0.3); await t.cur('#OL .opt[data-i]', k, 0.55, dx=150); await t.click()
    await t.to(t.t + 0.2); await t.hide(); await t.look('#Z', 1.45, 0.8, ax=.35)
    await t.to(s.p('案发可能晚好几年才来') - 0.15)
    await t.js(f"__film.ff({CASE},{{e_card:'办'}},'x_case',{{forceCase:3}})"); await t.js("__film.load()")
    await t.look('.txt', 1.5, 0, ax=.4)
    k = await t.js("__film.optN('如实供述')")
    await t.to(s.p('判决引用的') - 0.2); await t.look('.txt p:last-child', 1.85, 0.7, ax=.4)
    await t.to(s.p('是真实的法律条文') + 0.4); await t.home(0.6)
    await t.to(t.t + 0.6); await t.cur('#OL .opt[data-i]', k, 0.45, dx=150); await t.click()
    await t.to(t.t + 0.2); await t.hide()
    await t.to(s.dur)


async def sc_qi(s, t):
    await s.fresh()
    await t.js(f"__film.ff({ZHU},{ZPICK},'e_ago',{ZOPT})"); await t.js("__film.load()"); await t.settle()
    await t.look('.qi svg', 1.0, 0); await t.look('.qi svg', 2.7, 1.1)
    ring = "(i=>{const r=document.querySelector('.qi svg').getBoundingClientRect(),P=[[31,11],[51,31],[31,51],[11,31]][i],f=document.querySelector('#ftap');f.style.left=r.left+r.width*P[0]/62+'px';f.style.top=r.top+r.height*P[1]/62+'px';f.classList.remove('go');void f.offsetWidth;f.classList.add('go');__sfx.push(['tap',.6])})"
    a = s.p('身体、钱、'); b = s.p('家庭、法律')
    for i, tt in enumerate([a, a + (b - a) * .55, b, b + 0.55]):
        await t.to(tt); await t.js(f"{ring}({i})")
    await t.to(s.p('气没了') - 0.1)
    await t.js("__film.patch({hp:28,fam:18,cash:-260,job:null,spouse:null}); __film.load()")
    await t.to(s.dur)


async def sc_clock(s, t):
    await s.fresh()
    await jump(t, "{cohort:1990,cls:'C',seed:2}", 'f_fraud', "{year:2026,age:36,cash:30,job:" + JOB + "}")
    await t.look('.body', 1.35, 0, ay=.42)
    await t.to(s.p('有些地方') - 0.15)
    await jump(t, "{cohort:1995,cls:'B',seed:2}", 'u_loan', "{year:2016,age:21,inSchool:true,uni:'yi',major:'cs'}")
    await t.look('#Q .doc', 1.55, 0)
    await t.to(s.p('要你读合同') + 0.1); await t.cur('#Q .cl[data-i="1"]', 0, 0.5, dx=110); await t.click()
    await t.to(s.p('算利息') - 0.15); await t.hide()
    await jump(t, "{cohort:1985,cls:'C',seed:2}", 'e_usury', "{year:2011,age:26,cash:30,job:" + JOB + "}")
    await t.look('#Q', 1.55, 0)
    await t.to(t.t + 0.5); await t.cur('#Q [data-i="2"]', 0, 0.45); await t.click()
    await t.to(t.t + 0.2); await t.hide()
    await t.to(s.dur)


async def review_page(s, t):
    if await t.js("window.__film && __film.has('.rv')"): return
    await s.fresh()
    await t.js(f"__film.ff({REV},{{}},null,{{pol:'folk'}})"); await t.js("__film.review()")
    for _ in range(6): await t.js('d=>__film.frame(d,null)', 200)


async def sc_review(s, t):
    await review_page(s, t)
    await t.js("__film.scroll(0)")
    await t.look('.vd', 1.08, 0, ax=.38)
    await t.to(s.p('每一手都有评语') - 0.3)
    await t.js("__film.into('#flt', 70)"); await t.home(0)
    for g, ph in [('ben', '本手'), ('miao', '妙手'), ('su', '俗手'), ('hun', '还有昏招')]:
        await t.to(s.p(ph) + (0.25 if g == 'hun' else 0))
        await t.js(f"(()=>{{const i=__film.rowN('{g}');return __film.ring('#rows .mvw .seal',[...document.querySelectorAll('#rows .mvw .seal')].indexOf(document.querySelectorAll('#rows .mvw')[i].querySelector('.seal')))}})()")
    await t.to(s.p('这几个词') - 0.2); await t.look('.blk .lede', 1.75, 0.8, ax=.35)
    await t.to(s.dur)


async def sc_detail(s, t):
    await review_page(s, t)
    i = await t.js("__film.rowN('hun')")
    await t.js("__film.into('#flt', 70)"); await t.home(0)
    await t.to(0.2); await t.cur('#rows .mvw .mvr', i, 0.5, dx=260)
    sel = await t.js(f"(()=>{{const w=document.querySelectorAll('#rows .mvw')[{i}];w.querySelector('.mvr').click();__film.tap();return true}})()")
    await t.to(t.t + 0.2); await t.hide()
    await t.js(f"window.__det=document.querySelectorAll('#rows .mvw')[{i}].querySelector('.mdet');__det.id='det'")
    await t.look('#det', 1.5, 0.8, ax=.3)
    await t.to(s.p('接住了哪些伏笔') - 0.2)
    await t.js("__film.into('.two', 40)"); await t.look('.chain', 1.45, 0, ay=.35)
    await t.to(s.p('又错过了哪些选项') - 0.1); await t.look('.miss', 1.45, 0.9, ay=.35)
    await t.to(s.dur)


async def sc_thousand(s, t):
    await review_page(s, t)
    await t.js("document.querySelectorAll('.two')[1].id='two2'; __film.into('#two2', 30)")
    await t.look('#hist', 1.3, 0, ay=.6)
    await t.to(s.p('比多少人好') - 1.2); await t.look('#pp', 1.75, 0.9)
    await t.to(s.dur)


async def sc_use(s, t):
    await review_page(s, t)
    await t.js("__film.into('#line', 160)"); await t.look('#line', 1.25, 0)
    await t.to(s.p('回头看看') - 0.3)
    b = await t.js("__film.box('#line svg')")
    for k, u in enumerate([.25, .45, .62, .8]):
        await t.cur_xy(b['l'] + b['w'] * u, b['t'] + b['h'] * .5, 0.5)
        await t.to(t.t + 0.25)
    await t.to(s.p('和爸妈一起玩') - 0.15); await t.hide()
    await s.fresh()
    await t.look('#setup .sec', 1.55, 0, ay=.55)
    await t.to(t.t + 0.3); await t.cur('.yb[data-y="1980"]', 0, 0.5); await t.click()
    for ph, cfg, nid, patch, sel in [('讲理财', "{cohort:1985,cls:'C',seed:2}", 'e_index', "{year:2016,age:31,cash:30,job:" + JOB + "}", '#Q'),
                                     ('讲反诈', "{cohort:1995,cls:'B',seed:2}", 'e_kk', "{year:2019,age:24,cash:2,job:{k:'labor',n:'流水线普工',sec:'mfg',mult:.62,since:2016}}", '.body'),
                                     ('讲法律', "{cohort:1985,cls:'C',seed:2}", 'b_guar', "{year:2020,age:35,cash:60,job:" + JOB + "}", '#Q')]:
        await t.to(s.p(ph) - 0.2); await t.hide(); await jump(t, cfg, nid, patch); await t.look(sel, 1.45, 0, ay=.3)
    await t.to(s.dur)


async def sc_basis(s, t):
    await s.fresh()
    await t.js("XZ.UI.method()"); await t.settle(100)
    await t.js("(()=>{const h=[...document.querySelectorAll('.sheet h3')].find(x=>x.textContent.includes('每一段的依据'));h.id='hb';__film.sheetTo('#hb',40)})()")
    await t.look('#hb', 1.0, 0); await t.look('#hb', 1.6, 1.4, ay=1.6)
    await t.to(s.p('人物和金额是虚构的') - 0.2)
    await t.js("document.querySelector('#hb').nextElementSibling.id='hp'"); await t.look('#hp', 1.9, 0.8, ax=.5)
    await t.to(s.p('二零二七年以后的部分') - 0.15)
    await t.js("document.querySelector('.sheet').remove()")
    await jump(t, "{cohort:1995,cls:'C',seed:2}", 'f_agent', "{year:2027,age:32,cash:40,job:" + JOB + "}")
    await t.look('.turn', 1.45, 0, ay=.15)
    await t.to(s.dur)


async def sc_end(s, t):
    await s.fresh()
    await t.look('.hero .big', 1.75, 0)
    await t.to(s.p('去下一局吧') - 0.9); await t.look('#draw', 1.35, 0.7, ay=0)
    await t.to(t.t + 0.1); await t.cur('#draw', 0, 0.45); await t.click()
    await t.to(t.t + 1.4); await t.hide()
    await t.js("__film.endCard()"); t.camto(1.0, W / 2, H / 2, 0); t.camto(1.05, W / 2, H / 2, s.dur - t.t)
    await t.to(s.dur)


async def main():
    global URL
    URL = serve()
    os.makedirs(f'{WORK}/scenes', exist_ok=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--disable-gpu-vsync', '--force-color-profile=srgb'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=DSF)
        await ctx.add_init_script(path=f'{WORK}/clock.js')
        page = await ctx.new_page()
        page.on('pageerror', lambda e: print('页面错误', e))
        cdp = await ctx.new_cdp_session(page)
        for name in NAMES:
            if ONLY and name not in ONLY: continue
            s = S(name, page); t = Take(page, cdp, s); t0 = time.time()
            await globals()['sc_' + name](s, t)
            t.done(s.dur)
            print(f'{name:9s} {s.a:6.2f}-{s.b:6.2f} {s.dur:5.2f}s  拍摄 {time.time() - t0:5.1f}s', flush=True)
        await b.close()
    old = json.load(open(f'{WORK}/sfx.json')) if os.path.exists(f'{WORK}/sfx.json') else []
    keep = [x for x in old if not any(bounds(n)[0] <= x[0] < bounds(n)[1] for n in NAMES if not ONLY or n in ONLY)]
    json.dump(sorted(keep + SFX), open(f'{WORK}/sfx.json', 'w'))
    json.dump({'lead': LEAD, 'total': TOTAL, 'scene_a': {n: bounds(n)[0] for n in NAMES}}, open(f'{WORK}/cut.json', 'w'))

asyncio.run(main())
