/* 拍片导演：镜头、光标、点击圈、快进到指定节点。只在拍片时注入。 */
(() => {
  const css = document.createElement('style');
  css.textContent = `
    :focus-visible{outline:none!important}
    .k{display:none!important}
    .left{padding-bottom:58px!important}
    .band,.hud,.cap{width:min(100%,calc(100dvh - 186px))!important}
    .right{padding-bottom:140px!important}
    #fcur{position:fixed;left:0;top:0;width:30px;height:30px;z-index:95;pointer-events:none;opacity:0;filter:drop-shadow(0 3px 4px #0009)}
    #ftap{position:fixed;z-index:94;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;border:3px solid #ec6a52;background:#ec6a5222;opacity:0;pointer-events:none}
    #ftap.go{animation:ftap .55s ease-out}
    @keyframes ftap{0%{opacity:.95;transform:scale(.45)}100%{opacity:0;transform:scale(1.3)}}
    #flayer{position:fixed;inset:0;z-index:80;background:radial-gradient(110% 90% at 50% 45%,#1f3b41 0,#13272b 70%);display:flex;align-items:center;justify-content:center;gap:42px}
    #flayer .bd{width:560px;height:560px;position:relative;box-shadow:0 26px 50px -18px #000b,0 2px 0 #8a6530,0 6px 0 #6e4e23;border-radius:3px;overflow:hidden}
    #flayer .dev{background:#0d1a1d;border-radius:16px;padding:10px;box-shadow:0 30px 60px -20px #000c,0 0 0 1px #2a474d}
    #flayer .dev iframe{display:block;border:0;border-radius:8px;transform-origin:0 0}
    #flayer .phone{border-radius:34px;padding:12px}
    #flayer .phone iframe{border-radius:24px}
    #flayer.fade{animation:fin .9s ease-out}
    @keyframes fin{from{opacity:0}}
    #flayer .endc{display:flex;flex-direction:column;align-items:center;gap:22px}
    #flayer .endc h1{font-family:var(--f-brush);font-weight:400;font-size:96px;line-height:1.1;color:var(--shell);margin:0}
    #flayer .endc p{font-family:var(--f-note);font-size:24px;color:var(--shell-2)}
  `;
  document.documentElement.appendChild(css);
  const cur = document.createElement('div'); cur.id = 'fcur';
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2l15 9.2-6.6 1.3 3.9 7.4-2.8 1.5-3.9-7.5L4 18.6z" fill="#fffdf6" stroke="#15181b" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const tap = document.createElement('div'); tap.id = 'ftap';
  document.body.append(cur, tap);
  const W = innerWidth, H = innerHeight;
  const st = { cx: W * .62, cy: H * .6, show: false, tw: null, cam: [1, W / 2, H / 2] };
  const ease = u => (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const box = (sel, nth) => { const els = document.querySelectorAll(sel), el = els[nth || 0]; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width, h: r.height }; };
  /* 镜头作用在最上层：片头和片尾的图层、依据页、或者整个游戏 */
  const target = () => document.querySelector('#flayer') || document.querySelector('.sheet') || document.querySelector('#app');
  const isApp = a => a && a.id === 'app';
  function camApply(s, fx, fyDoc) {
    const a = target(); if (!a) return;
    const fy = isApp(a) ? fyDoc - scrollY : fyDoc;
    ['#app', '.sheet', '#flayer'].forEach(q => { const e = document.querySelector(q); if (e && e !== a) e.style.transform = ''; });
    if (s <= 1.0005) { a.style.transform = ''; return; }
    let vx = fx - W / 2 / s, vy = fy - H / 2 / s;
    vx = Math.max(0, Math.min(W - W / s, vx)); vy = Math.max(0, Math.min(H - H / s, vy));
    const ox = s * vx / (s - 1), oy = s * vy / (s - 1);
    a.style.transformOrigin = `${ox}px ${oy + (a.id === 'app' ? scrollY : 0)}px`;
    a.style.transform = `scale(${s})`;
  }
  function curApply() {
    if (st.tw) {
      const tw = st.tw, u = Math.min(1, (performance.now() - tw.t0) / tw.d), b = tw.sel ? box(tw.sel, tw.nth) : null;
      const tx = b ? b.l + Math.min(b.w * .5, tw.dx != null ? tw.dx : b.w * .5) : tw.x, ty = b ? b.y : tw.y;
      const e = ease(u); st.cx = tw.fx + (tx - tw.fx) * e; st.cy = tw.fy + (ty - tw.fy) * e - Math.sin(Math.PI * e) * 22;
      if (u >= 1) st.tw = null;
    }
    cur.style.opacity = st.show ? 1 : 0;
    cur.style.transform = `translate(${st.cx - 4}px,${st.cy - 2}px)`;
  }
  window.__film = {
    prep() {
      const S = XZ.Sfx;
      S.click = v => window.__sfx.push(['stone', v || 1]);
      S.tick = () => window.__sfx.push(['tick', 1]);
      S.init = () => {};
      try { localStorage.clear(); } catch (e) {}
    },
    cam(s, fx, fy) { st.cam = [s, fx, fy]; camApply(s, fx, fy); },
    async frame(dt, cam, sy) {
      if (cam) st.cam = cam;
      if (sy != null) { const a = document.querySelector('#app'), k = a.style.transform; a.style.transform = ''; window.scrollTo(0, sy); a.style.transform = k; }
      await window.__tick(dt);
      camApply(...st.cam); curApply();
      const out = window.__sfx; window.__sfx = []; return out;
    },
    show(v) { st.show = !!v; curApply(); },
    curTo(sel, nth, dur, dx) { st.show = true; st.tw = { sel, nth, d: (dur || .6) * 1000, t0: performance.now(), fx: st.cx, fy: st.cy, dx }; },
    curXY(x, y, dur) { st.show = true; st.tw = { x, y, d: (dur || .6) * 1000, t0: performance.now(), fx: st.cx, fy: st.cy }; },
    pos() { return [st.cx, st.cy]; },
    tap() { tap.style.left = st.cx + 'px'; tap.style.top = st.cy + 'px'; tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go'); window.__sfx.push(['tap', 1]); },
    ring(sel, nth) { const b = box(sel, nth); if (!b) return false; tap.style.left = b.x + 'px'; tap.style.top = b.y + 'px'; tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go'); return true; },
    box, has: sel => !!document.querySelector(sel),
    /* 在视口坐标里给出某个元素的中心（未缩放布局），给镜头当焦点用 */
    focus(sel, nth, ax, ay) {
      const a = target(), keep = a.style.transform; a.style.transform = '';
      const b = box(sel, nth); a.style.transform = keep;
      if (!b) return null;
      const off = isApp(a) ? scrollY : 0;
      return { f: [b.l + b.w * (ax == null ? .5 : ax), b.t + b.h * (ay == null ? .5 : ay) + off], app: isApp(a), top: b.t + off, bot: b.t + b.h + off, sy: scrollY, max: document.documentElement.scrollHeight - innerHeight };
    },
    scroll(y) { window.scrollTo(0, y); },
    into(sel, off) { const a = document.querySelector('#app'), keep = a.style.transform; a.style.transform = ''; const e = document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + scrollY - (off || 0)); a.style.transform = keep; },
    click(sel, nth) { const e = document.querySelectorAll(sel)[nth || 0]; if (e) e.click(); return !!e; },
    /* 快进一生：pick 是 {节点 id: 选项文字片段}，其余按策略 */
    ff(cfg, pick, stopId, opt) {
      opt = opt || {}; pick = pick || {};
      const E = XZ.E, s = E.newLife(cfg);
      if (opt.patch) Object.assign(s, opt.patch);
      let n, g = 0;
      while ((n = E.next(s)) && g++ < 300) {
        if (stopId && n.id === stopId && (!opt.minYear || s.year >= opt.minYear)) break;
        if (n.quiz) E.quiz(s, n, n.quiz.a);
        E.textOf(s, n);
        const list = E.optionsOf(s, n);
        if (list && list.length) {
          const open = list.filter(o => !o.locked), want = pick[n.id];
          let o = typeof want === 'string' ? open.find(x => x.t.includes(want)) : null;
          if (!o) o = XZ.BOT[opt.pol || 'best'](s, n, open);
          E.choose(s, n, o.i);
        } else E.narrate(s, n);
        if (opt.forceCase) s.crimes.forEach(c => { if (!c.forced) { c.forced = 1; c.p = 1; c.from = c.year + opt.forceCase; } });
      }
      s.ev = [];
      window.__save = { s, a: { stage: s.age < 18 ? 0 : s.age < 36 ? 1 : 2 } };
      return { year: s.year, cur: n ? n.id : null, ended: !n, moves: s.moves.length, name: s.name };
    },
    load() { XZ.UI.resume(JSON.parse(JSON.stringify(window.__save))); },
    review() { XZ.UI.review(JSON.parse(JSON.stringify(window.__save.s))); },
    layer(html) { let l = document.querySelector('#flayer'); if (!l) { l = document.createElement('div'); l.id = 'flayer'; document.body.appendChild(l); } l.innerHTML = html; return l; },
    unlayer() { const l = document.querySelector('#flayer'); if (l) l.remove(); },
    /* 片头：一整局的棋子一颗颗落下 */
    openBoard(step) {
      const l = window.__film.layer('<div class="bd"><canvas></canvas></div>');
      const g = new XZ.Goban(l.querySelector('canvas'));
      g.onDrop = p => window.__sfx.push(['stone', p.c === 'b' ? 1 : .75]);
      g.resize();
      const s = window.__save.s, now = performance.now();
      g.sync(s);
      let i = 0; [...g.anims.entries()].forEach(([k, an]) => { an.t = now + 300 + i * (step || 120); i++; });
      let j = 0; g.linkAnim.forEach(an => { an.t = now + 300 + i * (step || 120) + 250 + j * 350; an.d = 700; j++; });
      window.__og = g; return i;
    },
    devices(url) {
      window.__film.layer(`<div class="dev"><iframe src="${url}" width="1120" height="630" style="width:1120px;height:630px;transform:scale(.56)"></iframe></div><div class="dev phone"><iframe src="${url}" width="390" height="844" style="width:390px;height:844px;transform:scale(.56)"></iframe></div>`);
      document.querySelectorAll('#flayer iframe').forEach(f => { f.parentElement.style.width = f.width * .56 + 20 + 'px'; f.parentElement.style.height = f.height * .56 + 20 + 'px'; });
    },
    endCard() { const l = window.__film.layer('<div class="endc"><h1>选择决定命运</h1><p>你的对手是时代。后面每一手，都算你自己的。</p></div>'); l.classList.add('fade'); },
    /* 棋盘上某颗子的视口坐标（未缩放） */
    sy() { return scrollY; },
    stoneXY(n) {
      const cv = document.querySelector(window.__cv || '#cv'), a = target(), keep = a.style.transform; a.style.transform = '';
      const r = cv.getBoundingClientRect(); a.style.transform = keep;
      const s = (window.__cvS && window.__cvS()) || XZ.UI.s, p = s.stones.find(q => q.n === n && !q.gone) || s.stones.find(q => q.n === n);
      if (!p) return null;
      const m = r.width * .047, cell = (r.width - 2 * m) / 18;
      return [r.left + m + p.x * cell, r.top + m + p.y * cell];
    },
    lastStone(c, era) { const s = XZ.UI.s, l = s.stones.filter(p => !p.gone && p.c === c && !p.h && (!era || p.era)); return l.length ? l[l.length - 1].n : null; },
    lastLink() { const l = XZ.UI.s.links.filter(x => x.fromStone && x.toStone); return l.length ? [l[l.length - 1].fromStone, l[l.length - 1].toStone] : null; },
    optN(sub) { return [...document.querySelectorAll('#OL .opt[data-i]')].findIndex(b => b.textContent.includes(sub)); },
    rowN(g) { return [...document.querySelectorAll('#rows .mvw')].findIndex(w => !w.hidden && w.dataset.g === g); },
    patch(o) { Object.assign(window.__save.s, o); },
    sheetTo(sel, off) { const sh = document.querySelector('.sheet'), e = sh && sh.querySelector(sel); if (!e) return false; sh.style.transform = ''; sh.scrollTop += e.getBoundingClientRect().top - (off || 0); return true; },
    forceDraw(seed) { const E = XZ.E, o = E.newLife; E.newLife = c => o(c && c.seed == null && !c.cls ? Object.assign({}, c, { seed }) : c); }
  };
})();
