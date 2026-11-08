/* 棋盘：榧木、蛤碁、那智黑。只用 Canvas 画，不依赖图片。 */
(function (root) {
  'use strict';
  const XZ = root.XZ;
  const REDUCE = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function makeWood(size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), r = rng(20260105);
    const base = g.createLinearGradient(0, 0, size, size * .3);
    base.addColorStop(0, '#e7c180'); base.addColorStop(.45, '#deb36c'); base.addColorStop(1, '#d3a65e');
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    const n = Math.floor(size / 1.5);
    for (let i = 0; i < n; i++) {
      const x = r() * size, a = .018 + r() * .06, dark = r() < .72;
      g.strokeStyle = dark ? `rgba(122,76,26,${a})` : `rgba(255,238,196,${a * .9})`;
      g.lineWidth = .5 + r() * 1.5;
      g.beginPath();
      const amp = 1.5 + r() * 5, ph = r() * 6.28, fr = 1.4 + r() * 2.4;
      for (let y = 0; y <= size; y += size / 26) { const dx = Math.sin(y / size * fr + ph) * amp; y === 0 ? g.moveTo(x + dx, y) : g.lineTo(x + dx, y); }
      g.stroke();
    }
    const v = g.createRadialGradient(size * .5, size * .46, size * .25, size * .5, size * .5, size * .78);
    v.addColorStop(0, 'rgba(90,50,10,0)'); v.addColorStop(1, 'rgba(70,38,8,.2)');
    g.fillStyle = v; g.fillRect(0, 0, size, size);
    return c;
  }
  function makeStone(d, black, seed) {
    const pad = Math.ceil(d * .22), s = d + pad * 2, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d'), R = d / 2, cx = s / 2, cy = s / 2;
    g.save(); g.shadowColor = 'rgba(40,20,0,.55)'; g.shadowBlur = d * .1; g.shadowOffsetX = d * .05; g.shadowOffsetY = d * .08;
    g.fillStyle = black ? '#111' : '#d8d0bf'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.restore();
    const gr = g.createRadialGradient(cx - R * .36, cy - R * .4, R * .05, cx, cy, R * 1.02);
    if (black) { gr.addColorStop(0, '#585e66'); gr.addColorStop(.32, '#2b2f35'); gr.addColorStop(1, '#0e1012'); }
    else { gr.addColorStop(0, '#fffefa'); gr.addColorStop(.6, '#f1ebdd'); gr.addColorStop(1, '#c6bda9'); }
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    if (!black) {
      const r = rng(seed); g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
      for (let i = 0; i < 9; i++) { g.strokeStyle = `rgba(150,135,105,${.05 + r() * .09})`; g.lineWidth = .6 + r() * .8; g.beginPath(); const yy = cy - R + (i + .5) * d / 9; g.moveTo(cx - R, yy); g.quadraticCurveTo(cx, yy + d * .1 * (r() - .3), cx + R, yy + d * .04); g.stroke(); }
      g.restore();
    } else {
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(cx - R * .34, cy - R * .42, R * .3, R * .16, -.6, 0, 7); g.fill();
    }
    return { c, s };
  }

  class Goban {
    constructor(cv) {
      this.cv = cv; this.ctx = cv.getContext('2d'); this.stones = []; this.links = []; this.seen = new Set(); this.anims = new Map(); this.ghost = null; this.num = false; this.terr = null; this.hl = 0; this.last = 0; this.size = 0; this.fade = []; this.linkAnim = new Map(); this.labels = true;
      this.frame = this.frame.bind(this);
    }
    resize() {
      if (!this.cv.parentElement) return;
      const box = this.cv.parentElement.getBoundingClientRect(), css = Math.floor(root.innerWidth <= 900 ? box.width : Math.min(box.width, box.height || box.width));
      if (css < 40) return;
      const dpr = Math.min(root.devicePixelRatio || 1, 2.5), size = Math.round(css * dpr);
      if (size !== this.size) {
        this.size = size; this.dpr = dpr; this.cv.width = this.cv.height = size; this.cv.style.width = this.cv.style.height = css + 'px';
        this.m = size * .047; this.cell = (size - this.m * 2) / 18;
        this.wood = makeWood(size);
        const d = Math.round(this.cell * .95);
        this.B = makeStone(d, true, 1); this.W = [makeStone(d, false, 3), makeStone(d, false, 7), makeStone(d, false, 11)];
      }
      this.draw();
    }
    px(i) { return this.m + i * this.cell; }
    /* 把游戏状态同步到棋盘；新出现的子会落下，被提走的子会消失 */
    sync(s, quiet) {
      const live = s.stones.filter(p => !p.gone), now = performance.now();
      let delay = 0, newest = 0;
      live.forEach(p => {
        const k = p.x + ',' + p.y + ',' + p.n;
        if (!this.seen.has(k)) {
          this.seen.add(k);
          if (!quiet && !REDUCE && !p.h) { this.anims.set(k, { t: now + delay, d: 260 }); delay += 220; }
          else if (!quiet && !REDUCE && p.h) { this.anims.set(k, { t: now + delay, d: 200 }); delay += 70; }
        }
        if (p.n > newest) newest = p.n;
      });
      this.stones.forEach(p => { if (!live.includes(p) && !p.h && s.stones.find(q => q.n === p.n && q.gone) && !this.fade.find(f => f.n === p.n)) this.fade.push(Object.assign({ t: now }, p)); });
      this.stones = live; this.last = newest;
      const prev = this.links.length;
      this.links = (s.links || []).filter(l => l.fromStone && l.toStone);
      this.links.slice(prev).forEach((l, i) => this.linkAnim.set(l.fromStone + '-' + l.toStone, { t: now + delay + i * 200, d: 900 }));
      this.kick();
      return delay;
    }
    reset() { this.seen.clear(); this.anims.clear(); this.linkAnim.clear(); this.fade = []; this.links = []; this.stones = []; this.terr = null; this.num = false; this.hl = 0; this.last = 0; this.ghost = null; this.draw(); }
    kick() { if (!this.raf) this.raf = requestAnimationFrame(this.frame); }
    frame(t) { this.raf = 0; this.draw(t); const busy = this.anims.size || this.fade.length || this.linkAnim.size; if (busy) this.kick(); }
    stoneAt(p, scale, alpha) {
      const sp = p.c === 'b' ? this.B : this.W[(p.x * 7 + p.y * 3) % 3], x = this.px(p.x), y = this.px(p.y), g = this.ctx;
      const d = sp.s * (scale || 1);
      g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.drawImage(sp.c, x - d / 2, y - d / 2, d, d); g.restore();
    }
    draw(t) {
      const g = this.ctx, S = this.size; if (!S || !this.wood) return;
      const now = t || performance.now();
      g.clearRect(0, 0, S, S); g.drawImage(this.wood, 0, 0);
      /* 四个角对应人生的四块地 */
      if (this.labels) {
        g.save(); g.fillStyle = 'rgba(92,52,12,.16)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${this.cell * 3.5}px "XZ Disp","Noto Serif SC","Songti SC",serif`;
        [['学', 4.5, 4.5], ['业', 13.5, 4.5], ['家', 4.5, 13.5], ['财', 13.5, 13.5]].forEach(([c, x, y]) => g.fillText(c, this.px(x), this.px(y)));
        g.restore();
      }
      g.strokeStyle = 'rgba(46,26,8,.82)'; g.lineWidth = Math.max(1, this.cell * .036);
      g.beginPath();
      for (let i = 0; i < 19; i++) { const p = Math.round(this.px(i)) + .5; g.moveTo(p, this.px(0)); g.lineTo(p, this.px(18)); g.moveTo(this.px(0), p); g.lineTo(this.px(18), p); }
      g.stroke();
      g.lineWidth = Math.max(1.4, this.cell * .07); g.strokeRect(this.px(0), this.px(0), this.cell * 18, this.cell * 18);
      g.fillStyle = 'rgba(46,26,8,.95)';
      [3, 9, 15].forEach(a => [3, 9, 15].forEach(b => { g.beginPath(); g.arc(this.px(a), this.px(b), this.cell * .115, 0, 7); g.fill(); }));

      if (this.terr) {
        const c = this.cell * .2;
        this.terr.g.forEach((v, i) => {
          if (!v) return; const x = i % 19, y = Math.floor(i / 19);
          if (this.stones.some(p => p.x === x && p.y === y)) return;
          g.fillStyle = v > 0 ? 'rgba(18,20,23,.78)' : 'rgba(250,246,236,.92)';
          g.fillRect(this.px(x) - c / 2, this.px(y) - c / 2, c, c);
        });
      }

      /* 伏笔的连线最后画，像朱笔批在棋子上面；两颗子挨得再近，弧线也拱出来看得见 */
      const byN = {}; this.stones.forEach(p => { if (p.n) byN[p.n] = p; });
      const drawLinks = () => this.links.forEach(l => {
        const a = byN[l.fromStone], b = byN[l.toStone]; if (!a || !b) return;
        const k = l.fromStone + '-' + l.toStone, an = this.linkAnim.get(k); let f = 1;
        if (an) { f = Math.min(1, Math.max(0, (now - an.t) / an.d)); if (f >= 1) this.linkAnim.delete(k); }
        if (f <= 0) return;
        const x1 = this.px(a.x), y1 = this.px(a.y), x2 = this.px(b.x), y2 = this.px(b.y), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1, bow = Math.max(len * .2, this.cell * 1.8);
        let nx = -dy / len, ny = dx / len;
        if (nx * (this.px(9) - mx) + ny * (this.px(9) - my) < 0) { nx = -nx; ny = -ny; }
        const cx = mx + nx * bow * 2, cy = my + ny * bow * 2;
        g.save(); g.strokeStyle = 'rgba(196,40,28,.9)'; g.fillStyle = 'rgba(196,40,28,.95)'; g.lineWidth = Math.max(1.8, this.cell * .09); g.lineCap = 'round';
        g.beginPath(); g.arc(x1, y1, this.cell * .13, 0, 7); g.fill();
        g.beginPath(); g.moveTo(x1, y1);
        const N = 40; for (let i = 1; i <= N * f; i++) { const u = i / N, x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2; g.lineTo(x, y); }
        g.stroke();
        if (f >= 1) { g.beginPath(); g.arc(x2, y2, this.cell * .13, 0, 7); g.fill(); }
        g.restore();
      });

      this.fade = this.fade.filter(p => { const f = (now - p.t) / 700; if (f >= 1) return false; this.stoneAt(p, 1 + f * .25, 1 - f); return true; });

      const list = this.stones.slice().sort((a, b) => a.n - b.n);
      list.forEach(p => {
        const k = p.x + ',' + p.y + ',' + p.n, an = this.anims.get(k);
        let sc = 1, al = 1;
        if (an) { const f = (now - an.t) / an.d; if (f < 0) return; if (f >= 1) { this.anims.delete(k); if (this.onDrop && !p.h) this.onDrop(p); } else { const e = 1 - Math.pow(1 - f, 3); sc = 1.45 - .45 * e; al = Math.min(1, f * 1.6); } }
        this.stoneAt(p, sc, al);
        if (p.fut) { g.save(); g.setLineDash([this.cell * .12, this.cell * .1]); g.strokeStyle = p.c === 'b' ? 'rgba(240,235,222,.7)' : 'rgba(30,30,30,.55)'; g.lineWidth = this.cell * .04; g.beginPath(); g.arc(this.px(p.x), this.px(p.y), this.cell * .3, 0, 7); g.stroke(); g.restore(); }
        if (this.num && p.n) {
          g.save(); g.fillStyle = p.c === 'b' ? '#f3eee2' : '#1b1d20'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.font = `600 ${this.cell * (p.n > 99 ? .36 : .46)}px "Noto Serif SC","Songti SC",Georgia,serif`; g.fillText(p.n, this.px(p.x), this.px(p.y) + this.cell * .02); g.restore();
        }
      });
      drawLinks();
      const hi = this.hl || (this.num ? 0 : this.last);
      if (hi && byN[hi]) {
        const p = byN[hi]; g.save(); g.strokeStyle = '#d3392a'; g.lineWidth = this.cell * .075; g.beginPath(); g.arc(this.px(p.x), this.px(p.y), this.hl ? this.cell * .54 : this.cell * .22, 0, 7); g.stroke(); g.restore();
      }
      if (this.ghost) { const p = Object.assign({ c: 'b' }, this.ghost); this.stoneAt(p, 1, .42); }
    }
    /* 预览下一手可能的位置 */
    setGhost(p) { this.ghost = p; this.kick(); }
    yOf(n) { const p = this.stones.find(q => q.n === n); return p ? this.px(p.y) / this.dpr : 0; }
  }
  XZ.Goban = Goban;

  /* 落子声：一小段带通噪声加一个木头的闷响 */
  const Sfx = {
    on: true, ctx: null,
    init() { if (this.ctx || !root.AudioContext && !root.webkitAudioContext) return; try { this.ctx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) { this.ctx = null; } },
    click(v) {
      if (!this.on) return; this.init(); const c = this.ctx; if (!c) return; if (c.state === 'suspended') c.resume();
      const t = c.currentTime, len = Math.floor(c.sampleRate * .05), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const n = c.createBufferSource(); n.buffer = b;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.1;
      const g = c.createGain(); g.gain.value = .5 * (v || 1); n.connect(f).connect(g).connect(c.destination); n.start(t);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(120, t + .07);
      const og = c.createGain(); og.gain.setValueAtTime(.32 * (v || 1), t); og.gain.exponentialRampToValueAtTime(.001, t + .09); o.connect(og).connect(c.destination); o.start(t); o.stop(t + .1);
    },
    tick() { if (!this.on) return; this.init(); const c = this.ctx; if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.value = 1100; g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .06); }
  };
  XZ.Sfx = Sfx;
})(typeof window !== 'undefined' ? window : globalThis);
