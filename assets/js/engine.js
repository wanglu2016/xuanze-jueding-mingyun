/* 人生引擎：不依赖 DOM，可在 Node 中批量模拟。状态 s 全部可 JSON 序列化。 */
(function (root) {
  'use strict';
  const XZ = (root.XZ = root.XZ || {});
  const NODES = (XZ.NODES = []);
  XZ.N = o => { NODES.push(o); return o; };
  const END = (XZ.END = 2036), NOW = (XZ.NOW = 2026);
  const GR = { M: 'miao', B: 'ben', P: 'ping', S: 'su', H: 'hun' };
  const GV = { miao: 2, ben: 1, ping: 0, su: -1, hun: -2 };
  const HOSHI = [[15, 3], [3, 15], [15, 15], [3, 3], [9, 9], [3, 9], [15, 9], [9, 3], [9, 15]];
  const HANDI_ORDER = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6], 8: [0, 1, 2, 3, 5, 6, 7, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
  const ANCH = { xue: [3, 3], ye: [15, 3], jia: [3, 15], cai: [15, 15] };
  const DOMN = { xue: '学', ye: '业', jia: '家', cai: '财' };
  XZ.DOMN = DOMN;

  function mul(a) { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function rand(s) { s.rc = (s.rc || 0) + 1; return mul(s.seed + s.rc * 7919); }
  function roll(s, p) { return rand(s) < p; }
  function pickOf(s, a) { return a[Math.floor(rand(s) * a.length) % a.length]; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const W = y => XZ.val('wage', y);
  const CN = '〇一二三四五六七八九';
  const yearCN = y => String(y).split('').map(c => CN[+c]).join('');
  function ageCN(n) {
    if (n <= 10) return ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'][n];
    if (n < 20) return '十' + (n % 10 ? '一二三四五六七八九'[n % 10 - 1] : '');
    const t = '一二三四五六七八九'[Math.floor(n / 10) - 1], u = n % 10;
    return t + '十' + (u ? '一二三四五六七八九'[u - 1] : '');
  }
  function fmt(v) {
    const a = Math.abs(v), sign = v < 0 ? '-' : '';
    if (a >= 10000) return sign + (a / 10000).toFixed(a >= 100000 ? 1 : 2) + ' 亿';
    if (a >= 100) return sign + Math.round(a) + ' 万';
    if (a >= 10) return sign + a.toFixed(1).replace(/\.0$/, '') + ' 万';
    if (a >= 1) return sign + a.toFixed(1).replace(/\.0$/, '') + ' 万';
    return sign + Math.round(a * 10000 / 100) * 100 + ' 元';
  }

  /* ---------- 工作 ---------- */
  const JOBS = {
    farm: { n: '务农', mult: .32, sec: 'farm' }, labor: { n: '流水线普工', mult: .62, sec: 'mfg' }, svc: { n: '服务业店员', mult: .58, sec: 'svc' },
    rider: { n: '骑手或司机', mult: .8, sec: 'gig' }, tech: { n: '技工', mult: .95, sec: 'mfg' }, clerk: { n: '普通文员', mult: .78, sec: 'office' },
    office: { n: '公司白领', mult: 1.1, sec: 'office' }, soe: { n: '国企员工', mult: 1.25, sec: 'soe' }, gov: { n: '公务员', mult: 1.2, sec: 'gov' },
    teacher: { n: '教师', mult: 1.1, sec: 'gov' }, doctor: { n: '医生', mult: 1.45, sec: 'med' }, civil: { n: '土木工程师', mult: 1.55, sec: 're' },
    fin: { n: '金融从业者', mult: 1.9, sec: 'fin' }, dev: { n: '程序员', mult: 1.9, sec: 'net' }, pm: { n: '互联网运营', mult: 1.5, sec: 'net' },
    ee: { n: '电气工程师', mult: 1.45, sec: 'mfg' }, ev: { n: '新能源工程师', mult: 2.1, sec: 'ev' }, ai: { n: '算法工程师', mult: 3.6, sec: 'ai' },
    trade: { n: '外贸业务员', mult: 1.2, sec: 'trade' }, media: { n: '媒体从业者', mult: 1.05, sec: 'media' }, edu: { n: '培训机构老师', mult: 1.5, sec: 'edu' },
    boss: { n: '小老板', mult: 2.1, sec: 'own' }, sales: { n: '销售', mult: 1, sec: 'office' }, chip: { n: '芯片工程师', mult: 2.3, sec: 'chip' },
    nurse: { n: '护士', mult: .95, sec: 'med' }, lawyer: { n: '律师', mult: 1.7, sec: 'office' }
  };
  XZ.JOBS = JOBS;

  /* ---------- 新人生 ---------- */
  function weightsFor(cohort) {
    const u = XZ.COHORT[cohort].urb / 100;
    return { A: (1 - u) * .85, B: (1 - u) * .15 + u * .35, C: u * .35, D: u * .18, E: u * .10, F: u * .02 };
  }
  XZ.weightsFor = weightsFor;
  const SUR = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗'.split('');
  const GIV = { M: ['建军', '伟', '强', '磊', '浩', '宇轩', '子涵', '博文', '俊杰', '一鸣', '浩然', '泽宇'], F: ['丽', '静', '敏', '婷', '雪', '欣怡', '雨桐', '诗涵', '梓涵', '佳怡', '晓燕', '若曦'] };
  const OLD = { 1980: [0, 1, 2, 3, 4], 1985: [1, 2, 3, 4, 8], 1990: [1, 2, 3, 4, 8], 1995: [2, 3, 7, 8, 10], 2000: [5, 6, 7, 8, 9], 2005: [5, 6, 7, 9, 11], 2010: [5, 6, 9, 10, 11] };

  function newLife(cfg) {
    cfg = cfg || {};
    const seed = cfg.seed != null ? cfg.seed : Math.floor(Math.random() * 2147483647);
    const s0 = { seed, rc: 11 };
    const cohort = cfg.cohort || 1990;
    let cls = cfg.cls;
    if (!cls) { const w = weightsFor(cohort), ks = Object.keys(w), sum = ks.reduce((a, k) => a + w[k], 0); let x = rand(s0) * sum; for (const k of ks) { x -= w[k]; if (x <= 0) { cls = k; break; } } cls = cls || 'A'; }
    const F = XZ.FAM[cls];
    const city = cfg.city || pickOf(s0, F.cities);
    const pw = cls === 'A' || cls === 'B' ? ['harmony', 'cold', 'fight', 'absent', 'absent', 'divorce'] : ['harmony', 'harmony', 'cold', 'fight', 'divorce'];
    const parents = cfg.parents || pickOf(s0, pw);
    const gender = cfg.gender || (roll(s0, .515) ? 'M' : 'F');
    const sur = pickOf(s0, SUR), gi = OLD[cohort], given = GIV[gender][gi[Math.floor(rand(s0) * gi.length) % gi.length]];
    const C = XZ.CITY[city], P = XZ.PARENTS[parents];
    const s = {
      v: 1, seed, rc: s0.rc + 3, cohort, year: cohort, age: 0, cls, city, parents, gender, name: sur + given,
      rung0: F.rung, acad: clamp(F.acad + P.acad + Math.round((rand(s0) - .5) * 12), 20, 80), sec: P.sec, hp: 82, fam: 55,
      tier: C.t, cash: 0, pos: {}, houses: [], biz: null, job: null, spouse: null, kids: 0, edu: 0, uni: null, major: null, inSchool: false, gradY: 0,
      estateMul: 1, aidUsed: false, seeds: {}, dims: {}, stones: [], moves: [], log: [], crimes: [], later: [], f: {}, done: {}, yc: {}, missed: [], links: [], ev: [], jail: 0, seal: false, peak: 0, quiz: { ok: 0, n: 0 }, ended: false, hist: []
    };
    Object.keys(XZ.DIMS).forEach(k => (s.dims[k] = { sum: 0, n: 0 }));
    const h = F.handi;
    if (h) {
      const n = Math.abs(h), c = h > 0 ? 'b' : 'w';
      (HANDI_ORDER[n] || []).forEach(i => { const p = HOSHI[i]; s.stones.push({ c, x: p[0], y: p[1], h: 1, n: 0 }); });
    }
    return s;
  }

  /* ---------- 帮助函数（内容文件用） ---------- */
  const G = {
    GR, W: s => W(s.year), w: (s, m) => W(s.year) * m, roll, rand, pick: pickOf, fmt, yearCN, ageCN, clamp,
    has: (s, k) => (Array.isArray(k) ? k.some(x => !!s.seeds[x]) : !!s.seeds[k]),
    f: (s, k) => s.f[k], setf(s, k, v) { s.f[k] = v === undefined ? true : v; },
    seed(s, k, label) { if (!s.seeds[k]) { s.seeds[k] = { label, year: s.year, age: s.age, stone: s.curStone || 0, used: 0 }; s.ev.push({ t: 'seed', k, label }); } },
    /* 伏笔回收：把多年前的落子和现在连起来 */
    pay(s, k, line) {
      const keys = Array.isArray(k) ? k : [k];
      const key = keys.find(x => s.seeds[x]);
      if (!key) return false;
      const sd = s.seeds[key]; sd.used++;
      const rec = { key, label: sd.label, from: sd.year, fromStone: sd.stone, to: s.year, toStone: null, line: line || '' };
      s.links.push(rec); s.ev.push({ t: 'pay', rec });
      return true;
    },
    money(s, v) { s.cash += v; },
    hp(s, d) { s.hp = clamp(s.hp + d, 0, 100); },
    fam(s, d) { s.fam = clamp(s.fam + d, 0, 100); },
    acad(s, d) { s.acad = clamp(s.acad + d, 0, 100); },
    sec(s, d) { s.sec = clamp(s.sec + d, 0, 100); },
    job(s, k, m, name) { const j = JOBS[k]; s.job = { k, n: name || j.n, sec: j.sec, mult: m != null ? m : j.mult, since: s.year }; s.inSchool = false; },
    bump(s, r) { if (s.job) s.job.mult *= r; },
    nojob(s) { s.job = null; },
    biz(s, n, v) { s.biz = { n, v }; },
    buy(s, k, amt) { amt = Math.min(amt, Math.max(0, s.cash)); s.cash -= amt; s.pos[k] = (s.pos[k] || 0) + amt; return amt; },
    sell(s, k, pct) { const v = (s.pos[k] || 0) * pct; s.pos[k] = (s.pos[k] || 0) - v; s.cash += v; return v; },
    cut(s, k, r) { s.pos[k] = (s.pos[k] || 0) * r; },
    /* 年内重新标价：下一次 tick 会扣回这部分，避免重复计算 */
    mark(s, k, r) { s.pos[k] = (s.pos[k] || 0) * r; s.mk = s.mk || {}; s.mk[k] = (s.mk[k] || 1) * r; },
    side(s, m) { s.sideM = (s.sideM || 0) + m; },
    /* 记录违法行为，案发时间由 tick 决定 */
    crime(s, c) { s.crimes.push(Object.assign({ from: s.year + 1, p: .25, term: 3, year: s.year, gain: 0, exposed: false, closed: false }, c)); },
    later(s, y, id) { s.later.push({ y, id }); },
    jail(s, yrs) { s.jail = s.year + yrs; s.seal = true; G.nojob(s); },
    capture(s, dom, n) { capture(s, dom, n); },
    housePrice: (t, y) => XZ.val('t' + t, y),
    rate(y) { return y < 2008 ? .056 : y < 2015 ? .062 : y < 2020 ? .052 : y < 2023 ? .05 : .037; },
    /* 买房：down 首付比例，返回 false 表示买不起 */
    afford(s, t, down) { const p = G.housePrice(t, s.year), need = p * (down + .03); return { p, need, aid: G.aid(s) }; },
    aid(s) { return s.aidUsed ? 0 : XZ.FAM[s.cls].aid * W(s.year) * s.estateMul; },
    /* k 是价格系数：远郊、打折、法拍房都不是标准总价 */
    buyHouse(s, t, down, k) {
      k = k || 1;
      const p = G.housePrice(t, s.year) * k, need = p * (down + .03), a = G.aid(s), useAid = Math.max(0, Math.min(a, need - Math.max(0, s.cash)));
      if (useAid > 0) { s.aidUsed = true; s.cash += useAid; }
      s.cash -= need;
      const loan = p * (1 - down), r = G.rate(s.year), n = 30, pay = loan * r / (1 - Math.pow(1 + r, -n));
      s.houses.push({ t, k, cost: p, bought: s.year, loan, pay, r });
      return { p, loan, pay };
    },
    sellHouse(s, i) { const h = s.houses[i]; const v = G.housePrice(h.t, s.year) * (h.k || 1); s.cash += v - h.loan; s.houses.splice(i, 1); return v; },
    worth, income, living, qi, tierName: t => ['', '一线城市', '省会城市', '县城'][t],
    near: (s, a, b) => s.age >= a && s.age <= b,
    he: s => (s.gender === 'F' ? '她' : '他'),
    ma: s => '妈', ba: s => '爸',
    cityN: s => XZ.CITY[s.city].n
  };
  XZ.G = G;

  function houseVal(s) { return s.houses.reduce((a, h) => a + G.housePrice(h.t, s.year) * (h.k || 1) - h.loan, 0); }
  function posVal(s) { return Object.keys(s.pos).reduce((a, k) => a + s.pos[k], 0); }
  function worth(s) { return s.cash + posVal(s) + houseVal(s) + (s.biz ? s.biz.v : 0); }
  function income(s) {
    let i = s.job ? W(s.year) * s.job.mult : 0;
    if (s.spouse) i += W(s.year) * s.spouse.mult;
    if (s.sideM) i += W(s.year) * s.sideM;
    return i;
  }
  function living(s) {
    const w = W(s.year), t = [0, 1.25, 1, .72][s.tier] || 1;
    if (s.inSchool) return s.cls === 'A' ? w * .06 : 0;
    if (s.age < 18) return 0;
    let v = w * .4 * t;
    if (!s.houses.length && s.age >= 21 && !s.f.atHome) v += w * [0, .28, .15, .06][s.tier];
    if (s.spouse) v += w * .2 * t;
    v += w * .2 * s.kids * t;
    if (s.cls === 'A') v += w * .1; else if (s.cls === 'B') v += w * .04;
    return v;
  }
  function qi(s) {
    const y = living(s) + s.houses.reduce((a, h) => a + h.pay, 0);
    const q = {
      shen: s.hp >= 42,
      qian: s.age < 18 || s.inSchool || (s.cash + posVal(s) * .5) >= y * .5 || income(s) > y * 1.5,
      jia: s.fam >= 32,
      fa: !s.crimes.some(c => !c.closed),
      faShown: !s.crimes.some(c => !c.closed) || !!s.seeds.law
    };
    q.n = [q.shen, q.qian, q.jia, q.fa].filter(Boolean).length;
    q.shownN = [q.shen, q.qian, q.jia, q.faShown].filter(Boolean).length;
    return q;
  }

  /* ---------- 棋盘落子 ---------- */
  const occupied = (s, x, y) => s.stones.some(p => !p.gone && p.x === x && p.y === y);
  function inDom(dom, x, y) {
    if (x < 0 || y < 0 || x > 18 || y > 18) return false;
    const L = x <= 10, T = y <= 10, R = x >= 8, B = y >= 8;
    return dom === 'xue' ? L && T : dom === 'ye' ? R && T : dom === 'jia' ? L && B : R && B;
  }
  function placeB(s, dom) {
    const mine = s.stones.filter(p => !p.gone && p.c === 'b' && !p.h && p.dom === dom);
    const [ax, ay] = ANCH[dom];
    if (!mine.length && !occupied(s, ax, ay)) return [ax, ay];
    const shape = [[1, 0, 1], [0, 1, 1], [-1, 0, 1], [0, -1, 1], [1, 1, .9], [1, -1, .9], [-1, 1, .9], [-1, -1, .9], [2, 0, 1.15], [0, 2, 1.15], [-2, 0, 1.15], [0, -2, 1.15], [2, 1, 1.05], [1, 2, 1.05], [-2, 1, 1.05], [-1, 2, 1.05], [2, -1, 1.05], [1, -2, 1.05], [-2, -1, 1.05], [-1, -2, 1.05]];
    const base = mine.length ? mine : [{ x: ax, y: ay }];
    let best = null, bv = -1e9;
    base.forEach(m => shape.forEach(([dx, dy, wt]) => {
      const x = m.x + dx, y = m.y + dy;
      if (!inDom(dom, x, y) || occupied(s, x, y)) return;
      if (x === 0 || y === 0 || x === 18 || y === 18) return;
      const d = Math.abs(x - ax) + Math.abs(y - ay);
      const v = wt * 2 - d * .42 + rand(s) * 1.6;
      if (v > bv) { bv = v; best = [x, y]; }
    }));
    if (best) return best;
    for (let i = 0; i < 400; i++) { const x = 1 + Math.floor(rand(s) * 17), y = 1 + Math.floor(rand(s) * 17); if (!occupied(s, x, y)) return [x, y]; }
    return [9, 9];
  }
  function placeW(s, near) {
    let best = null, bv = -1e9;
    const blacks = s.stones.filter(p => !p.gone && p.c === 'b');
    const anchor = near || (blacks.length ? blacks[blacks.length - 1] : { x: 9, y: 9 });
    for (let x = 1; x < 18; x++) for (let y = 1; y < 18; y++) {
      if (occupied(s, x, y)) continue;
      const d = Math.abs(x - anchor.x) + Math.abs(y - anchor.y);
      if (d < 1 || d > 4) continue;
      const toC = Math.abs(x - 9) + Math.abs(y - 9);
      const v = -Math.abs(d - 2) * .8 - toC * .08 + rand(s) * 1.5;
      if (v > bv) { bv = v; best = [x, y]; }
    }
    return best || [9, 9];
  }
  function putStone(s, c, dom, extra) {
    s.mv = (s.mv || 0) + 1;
    if (s.fast) return { n: s.mv, c, x: 0, y: 0 };
    const [x, y] = c === 'b' ? placeB(s, dom) : placeW(s, extra && extra.near);
    const st = Object.assign({ c, x, y, n: s.mv, dom, year: s.year, fut: s.year > NOW ? 1 : 0 }, extra || {});
    delete st.near;
    s.stones.push(st); return st;
  }
  function capture(s, dom, n) {
    if (s.fast) return;
    const list = s.stones.filter(p => !p.gone && p.c === 'b' && !p.h && (!dom || p.dom === dom)).slice(-n);
    list.forEach(p => { p.gone = s.year; });
    s.ev.push({ t: 'cap', ns: list.map(p => p.n) });
  }
  /* 悬停时预览下一手的落点，不消耗随机数 */
  XZ.peekStone = function (s, dom) { const rc = s.rc, p = placeB(s, dom); s.rc = rc; return { x: p[0], y: p[1], c: 'b' }; };
  XZ.territory = function (s) {
    const live = s.stones.filter(p => !p.gone);
    const g = []; let b = 0, w = 0;
    for (let y = 0; y < 19; y++) for (let x = 0; x < 19; x++) {
      let db = 99, dw = 99;
      live.forEach(p => { const d = Math.abs(p.x - x) + Math.abs(p.y - y); if (p.c === 'b') db = Math.min(db, d); else dw = Math.min(dw, d); });
      const v = db === dw ? 0 : db < dw ? 1 : -1; g.push(v);
      if (v > 0) b++; if (v < 0) w++;
    }
    return { g, b, w };
  };

  /* ---------- 时间 ---------- */
  function tick(s) {
    const y = s.year, w = W(y);
    if (s.age > 32) s.hp = clamp(s.hp - .55 - (s.f.overwork ? 1.1 : 0) + (s.f.exercise ? .7 : 0), 0, 100);
    Object.keys(s.pos).forEach(k => {
      if (k === 'p2p') s.pos[k] *= 1.1;
      else if (k === 'dep') s.pos[k] *= 1.03;
      else { s.pos[k] *= XZ.val(k, y - 1) / XZ.val(k, y - 2) / ((s.mk || {})[k] || 1); if (s.mk) s.mk[k] = 1; }
    });
    if (s.jail > y) { s.fam = clamp(s.fam - 2, 0, 100); s.hp = clamp(s.hp - 1, 0, 100); return; }
    if (s.age >= 16 || s.job) {
      let net = income(s) * .85 - living(s);
      s.houses.forEach(h => {
        const int = h.loan * h.r, pr = Math.max(0, Math.min(h.loan, h.pay - int));
        net -= h.loan > .001 ? h.pay : 0; h.loan -= pr;
      });
      if (s.age >= 22 && s.houses.length > 1) net += s.houses.slice(1).reduce((a, h) => a + G.housePrice(h.t, y) * (h.k || 1) * .018, 0);
      s.cash += net;
    }
    s.cash *= s.cash > 0 ? 1.018 : 1.07;
    if (s.job && s.age < 40) s.job.mult *= 1.022;
    if (s.job && s.age > 50 && s.job.sec !== 'gov' && s.job.sec !== 'own') s.job.mult *= .985;
    s.crimes.forEach(c => {
      if (c.closed || c.exposed || y < c.from || y > c.year + 8) return;
      if (roll(s, c.p + (c.camp && c.camp.includes(y) ? .35 : 0))) { c.exposed = true; s.later.push({ y, id: 'x_case' }); }
    });
    const wn = worth(s);
    s.peak = Math.max(s.peak, wn);
    s.hist.push({ y, a: s.age, w: wn, i: income(s), r: rungOf(s) });
  }

  function scoreW(s) {
    const y = s.year, w = W(y), years = clamp(60 - s.age, 4, 24);
    const human = income(s) * .34 * years;
    const est = XZ.FAM[s.cls].estate * w * s.estateMul * (.45 + clamp(60 - s.age, 0, 34) / 100);
    let v = (worth(s) + human + est) / w;
    if (s.seal) v *= .62;                                   /* 案底压低的是未来的机会 */
    else if (s.crimes.some(c => !c.closed)) v *= .85;        /* 没有案发的事也要算风险 */
    return v;
  }
  const CUT = [4, 11, 26, 62, 170, 520];
  function rungOf(s) {
    if (s.age < 18) return s.rung0;
    const x = scoreW(s); let r = 1;
    CUT.forEach((c, i) => { if (x >= c) r = i + 2; });
    if (s.jail > s.year) r = Math.max(1, r - 1);
    return r;
  }
  XZ.rungOf = rungOf; XZ.scoreW = scoreW;

  /* ---------- 节点调度 ---------- */
  function matches(n, s) {
    if (s.done[n.id] && !n.repeat) return false;
    if (n.trig) return false;
    if (n.pivot && ((s.pv || 0) >= 3 || (s.job && s.year - s.job.since < 3) || (s.f.pivotY && s.year - s.f.pivotY < 3))) return false;
    const yr = s.year, a = s.age;
    if (n.y !== undefined) { if (Array.isArray(n.y)) { if (yr < n.y[0] || yr > n.y[1]) return false; } else if (yr !== n.y) return false; }
    if (n.age !== undefined) { if (Array.isArray(n.age)) { if (a < n.age[0] || a > n.age[1]) return false; } else if (a !== n.age) return false; }
    return !n.when || !!n.when(s);
  }
  const byId = {};
  function nodeById(id) { if (!byId[id]) NODES.forEach(n => (byId[n.id] = n)); return byId[id]; }
  XZ.nodeById = nodeById;

  function pickNode(s) {
    const due = s.later.findIndex(l => l.y <= s.year);
    if (due >= 0) { const l = s.later.splice(due, 1)[0]; if (l.id === 'x_case' && s.f.caseN) l.id = 'x_case2'; const n = nodeById(l.id); if (n && (!n.when || n.when(s))) return n; return pickNode(s); }
    if (s.jail > s.year) return null;
    const used = s.yc[s.year] || 0;
    if (used >= 2) return null;
    let best = null, bp = -1e9;
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i]; if (!matches(n, s)) continue;
      const p = n.p || 0;
      if (used >= 1 && p < 70) continue;
      if (s.moves.length >= 38 && p < 70) continue;
      if (p > bp) { bp = p; best = n; }
    }
    return best;
  }

  function next(s) {
    let guard = 0;
    while (guard++ < 400) {
      const n = pickNode(s);
      if (n) { s.done[n.id] = (s.done[n.id] || 0) + 1; s.yc[s.year] = (s.yc[s.year] || 0) + 1; s.cur = n.id; beginNode(s, n); return n; }
      if (s.year >= END) { s.ended = true; s.cur = null; return null; }
      s.year++; s.age++; tick(s);
    }
    throw new Error('调度卡死 ' + s.year);
  }

  function beginNode(s, n) {
    s.ev = s.ev || [];
    if (n.pivot) s.f.pivotY = s.year;
    const era = typeof n.era === 'function' ? n.era(s) : n.era;
    if (era) { const st = putStone(s, 'w', n.dom || 'ye', { era, node: n.id, atk: n.atk ? 1 : 0 }); s.ev.push({ t: 'white', st, era }); }
  }

  const txt = (x, s) => (typeof x === 'function' ? x(s) : x);
  function textOf(s, n) { const t = txt(n.text, s); return Array.isArray(t) ? t : t ? [t] : []; }
  function titleOf(s, n) { return txt(n.title, s); }

  let cache = { id: null, key: null, list: null };
  function optionsOf(s, n) {
    const key = s.mv + ':' + (s.moves.length);
    if (cache.id === n.id && cache.key === key && cache.seed === s.seed) return cache.list;
    const raw = txt(n.opts, s);
    if (!raw) return null;
    const list = [];
    raw.forEach((o, i) => {
      if (o.only && !o.only(s)) return;
      const need = o.need ? (Array.isArray(o.need) ? o.need : [o.need]) : null;
      const opt = { i, id: o.id || 'o' + i, t: txt(o.t, s), raw: o, written: false, locked: null, note: null, c: o.c, x: o.x, z: o.z };
      if (need) {
        const k = need.find(q => s.seeds[q]);
        if (!k) { if (!s.missed.some(m => m.t === opt.t)) s.missed.push({ node: n.id, year: s.year, t: opt.t, need, title: titleOf(s, n), g: gradeOf(s, o) }); return; }
        opt.written = true;
        opt.note = `${s.seeds[k].year} 年${s.seeds[k].label}，你才看得见这一手`;
      }
      const l = o.lock ? o.lock(s) : null;
      if (l) opt.locked = { by: l[0], why: l[1] };
      list.push(opt);
    });
    cache = { id: n.id, key, seed: s.seed, list };
    return list;
  }
  function gradeOf(s, o) { return (typeof o.g === 'function' ? o.g(s) : o.g) || 'ping'; }

  function bestText(s, list) {
    let b = null, bv = -9;
    list.forEach(o => { const v = GV[gradeOf(s, o.raw)]; if (!o.locked && v > bv) { bv = v; b = o; } });
    return b ? { t: b.t, g: gradeOf(s, b.raw) } : null;
  }

  function choose(s, n, optIdx) {
    const list = optionsOf(s, n), o = list.find(x => x.i === optIdx) || list.find(x => !x.locked);
    const g = gradeOf(s, o.raw), best = bestText(s, list);
    const stn = putStone(s, 'b', n.dom || 'ye', { g, node: n.id });
    s.curStone = stn.n;
    const before = worth(s), jobBefore = s.job && s.job.since;
    let out = o.raw.do ? o.raw.do(s) : null;
    if (n.pivot && s.job && s.job.since === s.year && jobBefore !== s.year) s.pv = (s.pv || 0) + 1;
    if (out === undefined || out === null) out = o.raw.r ? txt(o.raw.r, s) : [];
    if (!Array.isArray(out)) out = [out];
    if (o.raw.r && o.raw.do && typeof o.raw.r !== 'undefined' && out.length === 0) out = [txt(o.raw.r, s)];
    (o.raw.d || n.d || []).forEach(k => { const d = s.dims[k]; if (d && g !== 'ping') { d.sum += GV[g]; d.n += 1; } else if (d) { d.n += .5; } });
    s.links.forEach(l => { if (l.toStone == null) l.toStone = stn.n; });
    const ev = s.ev; s.ev = [];
    ev.unshift({ t: 'stone', st: stn });
    if (g === 'su' || g === 'hun') { const st = putStone(s, 'w', n.dom || 'ye', { atk: 1, near: stn, sente: 1 }); ev.push({ t: 'sente', st }); }
    if (g === 'hun') { const st = putStone(s, 'w', n.dom || 'ye', { atk: 1, near: stn, sente: 1 }); ev.push({ t: 'sente', st }); }
    const after = worth(s);
    s.moves.push({ n: stn.n, id: n.id, year: s.year, age: s.age, title: titleOf(s, n), pick: o.t, g, written: o.written, lesson: txt(n.lesson, s), best: best && best.t !== o.t ? best : null, dom: n.dom || 'ye', src: n.src || null });
    return { lines: out, ev, delta: after - before };
  }

  function narrate(s, n) {
    const out = n.run ? n.run(s) : null;
    (n.d || []).forEach(() => {});
    const ev = s.ev; s.ev = [];
    return { lines: out ? (Array.isArray(out) ? out : [out]) : [], ev };
  }

  function quiz(s, n, idx) {
    const q = n.quiz, ok = idx === q.a;
    s.quiz.n++; if (ok) s.quiz.ok++;
    (q.d || n.d || []).forEach(k => { const d = s.dims[k]; if (d) { d.n += 1; d.sum += ok ? 1 : -.5; } });
    if (ok && q.ok_do) q.ok_do(s);
    return ok;
  }

  function finish(s) {
    const rung = rungOf(s), d = rung - s.rung0;
    const open = s.crimes.filter(c => !c.closed);
    const dim = {};
    Object.keys(s.dims).forEach(k => { const v = s.dims[k]; dim[k] = v.n ? clamp(Math.round(50 + (v.sum / v.n) * 42), 4, 100) : null; });
    const counts = { miao: 0, ben: 0, ping: 0, su: 0, hun: 0 };
    s.moves.forEach(m => counts[m.g]++);
    const vals = Object.values(dim).filter(v => v != null);
    const qq = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
    return { rung, d, worth: worth(s), income: income(s), open, dim, counts, qq, jailed: s.seal, terr: s.fast ? null : XZ.territory(s), score: scoreW(s), hp: s.hp, fam: s.fam };
  }

  const BOT = {
    best(s, n, open) { let b = [], bv = -9; open.forEach(o => { const v = GV[gradeOf(s, o.raw)]; if (v > bv) { bv = v; b = [o]; } else if (v === bv) b.push(o); }); return pickOf(s, b); },
    worst(s, n, open) { let b = [], bv = 9; open.forEach(o => { const v = GV[gradeOf(s, o.raw)]; if (v < bv) { bv = v; b = [o]; } else if (v === bv) b.push(o); }); return pickOf(s, b); },
    rand(s, n, open) { return pickOf(s, open); },
    spec(s, n, open) { const a = open.filter(o => o.x); return a.length ? pickOf(s, a) : pickOf(s, open); },
    safe(s, n, open) { const a = open.filter(o => o.z); return a.length ? pickOf(s, a) : pickOf(s, open); },
    crowd(s, n, open) { const a0 = open.filter(o => o.c), a = a0.filter(o => gradeOf(s, o.raw) !== 'hun'); const b = a.length ? a : a0.length && rand(s) < .03 ? a0 : open.filter(o => gradeOf(s, o.raw) !== 'hun'); return pickOf(s, b.length ? b : open); },
    /* 一个普通人：大多跟大流，偶尔对，偶尔错 */
    folk(s, n, open) { const r = rand(s), a = open.filter(o => gradeOf(s, o.raw) !== 'hun'); if (r < .62) return BOT.crowd(s, n, open); if (r < .8) return BOT.best(s, n, open); if (r < .995 || !a.length) return pickOf(s, a.length ? a : open); return BOT.spec(s, n, open); },
    /* 一个肯动脑子的玩家：大半下得对，也会犯错 */
    wise(s, n, open) { const r = rand(s); return r < .62 ? BOT.best(s, n, open) : BOT.folk(s, n, open); }
  };
  XZ.BOT = BOT;

  function auto(cfg, policy) {
    const s = newLife(cfg), fn = typeof policy === 'function' ? policy : BOT[policy || 'folk'];
    s.fast = !!cfg.fast;
    let n, guard = 0;
    while ((n = next(s)) && guard++ < 200) {
      if (n.quiz) { const q = n.quiz; const p = policy === 'best' ? .9 : .4; quiz(s, n, roll(s, p) ? q.a : (q.a + 1) % q.opts.length); }
      textOf(s, n);
      const list = optionsOf(s, n);
      if (list && list.length) {
        const open = list.filter(o => !o.locked);
        if (!open.length) throw new Error('无可选项 ' + n.id + ' ' + s.year);
        const o = fn(s, n, open);
        const r = choose(s, n, o.i);
        if (!Array.isArray(r.lines)) throw new Error('结果不是数组 ' + n.id);
      } else narrate(s, n);
    }
    return { s, r: finish(s) };
  }

  XZ.E = { newLife, next, choose, narrate, quiz, optionsOf, textOf, titleOf, finish, auto, tick, gradeOf };
  XZ.REFRESH = () => { cache = { id: null }; };
})(typeof window !== 'undefined' ? window : globalThis);
