/* 界面编排 */
(function (root) {
  'use strict';
  const XZ = root.XZ, E = XZ.E, G = XZ.G, Sfx = XZ.Sfx;
  const $ = (q, r) => (r || document).querySelector(q), $$ = (q, r) => Array.from((r || document).querySelectorAll(q));
  const app = $('#app');
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 浏览器不让存就不存 */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* 同上 */ } }
  };
  const KEY = 'xzjdmy.save.v1', BOOK = 'xzjdmy.book.v1';
  const LOCKC = { '制度': 'var(--sys)', '家境': 'var(--fam)', '性别': 'var(--sex)', '时机': 'var(--time)', '分数': 'var(--time)' };
  const COH = [1980, 1985, 1990, 1995, 2000, 2005, 2010];
  const CNN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  let S = null, B = null, NODE = null, busy = false, clock = null, A = { stage: -1 };
  const setup = { cohort: 1995, mode: 'lot', cls: 'C', city: null, parents: 'harmony', gender: 'M', drawn: null };

  /* ---------- 骨架 ---------- */
  function shell() {
    app.innerHTML = `<div class="stage" id="stage"><div class="left"><div class="band" id="band" title="点一下看整盘棋"><canvas id="cv" aria-label="棋盘"></canvas></div><div class="cap" id="cap"></div><div class="hud" id="hud" hidden></div></div><main class="right" id="R"></main></div>`;
    B = new XZ.Goban($('#cv'));
    B.onDrop = p => Sfx.click(p.c === 'b' ? 1 : .75);
    B.resize();
    $('#band').addEventListener('click', () => { if (innerWidth > 900) return; $('#band').classList.toggle('open'); fit(); });
  }
  function fit() {
    if (!B) return; B.resize();
    const band = $('#band'); if (!band) return;
    if (innerWidth > 900) { B.cv.style.transform = ''; return; }
    const bh = band.clientHeight, size = parseFloat(B.cv.style.width) || band.clientWidth;
    if (band.classList.contains('open')) return;
    const y = (B.last && B.yOf(B.last)) || size / 2, off = Math.max(0, Math.min(size - bh, y - bh / 2));
    B.cv.style.transform = `translateY(${-off}px)`;
  }
  addEventListener('resize', () => { fit(); });

  /* ---------- 开局 ---------- */
  function handi(c) { const h = XZ.FAM[c].handi, n = CNN[Math.abs(h)]; return h < 0 ? `时代先摆${n}子` : h > 0 ? `你先摆${n}子` : '分先'; }
  function pct(c) { const w = XZ.weightsFor(setup.cohort), sum = Object.values(w).reduce((a, b) => a + b, 0), v = w[c] / sum * 100; return v < 1 ? '不到 1%' : `约 ${Math.round(v)}%`; }
  function home() {
    shell(); S = null; A = { stage: -1 };
    $('#hud').hidden = true;
    const save = store.get(KEY), bk = store.get(BOOK);
    $('#R').className = 'right home';
    $('#stage').classList.add('home-on');
    $('#R').innerHTML = `<div class="hero"><h1 class="logo">选择决定命运</h1><div class="hmain"><div class="say"><p class="big">你的对手是时代。<br>出身决定让几子，后面每一手都算你自己的。</p><p>黑子是你的选择，白子是时代。选项不标好坏，很多要等十年才见分晓。你随手攒下的东西，会在多年后变成一条别人看不见的<em>朱批</em>。</p>${save ? `<div><button class="go" id="resume">接着下：${save.s.name}，${save.s.year} 年</button></div>` : ''}${bk && bk.n ? `<p class="rec">你下过 ${bk.n} 局，最好的一局从${XZ.RUNGS[bk.bestFrom].n}走到${XZ.RUNGS[bk.bestTo].n}。</p>` : ''}</div><div id="setup" class="sec" style="gap:16px"></div><div class="tools" style="justify-content:flex-start;gap:18px"><button class="link" id="mth">依据与方法</button></div></div></div>`;
    if (save) $('#resume').onclick = () => resume(save);
    $('#mth').onclick = method;
    renderSetup();
    fit();
  }
  function renderSetup() {
    const c = XZ.COHORT[setup.cohort], F = XZ.FAM;
    const yrs = COH.map(y => `<button class="yb" aria-pressed="${y === setup.cohort}" data-y="${y}">${y}</button>`).join('');
    const seg = (id, list, cur) => `<div class="seg" id="${id}">${list.map(([k, t]) => `<button data-k="${k}" aria-pressed="${k === cur}">${t}</button>`).join('')}</div>`;
    let body = '';
    if (setup.mode === 'lot') {
      body = setup.drawn ? `<div class="lot">猜先的结果：你叫<b>${setup.drawn.name}</b>，${setup.drawn.gender === 'F' ? '女孩' : '男孩'}，生在${XZ.CITY[setup.drawn.city].n}的<b>${F[setup.drawn.cls].n}</b>。父母${XZ.PARENTS[setup.drawn.parents].n}。${handi(setup.drawn.cls)}。<br>${F[setup.drawn.cls].desc}</div>` : `<p class="note">按这一年的真实人口比例抽。${setup.cohort} 年的中国，城镇人口占 ${c.urb}%，所以多数人会抽到农村。</p>`;
    } else {
      const city = setup.city && F[setup.cls].cities.includes(setup.city) ? setup.city : F[setup.cls].cities[0]; setup.city = city;
      body = `<div class="cls" id="cls">${Object.keys(F).map(k => `<button class="cl1" data-c="${k}" aria-pressed="${k === setup.cls}"><b>${F[k].n}</b><em>${handi(k)}</em><span>同年出生的人里${pct(k)}。${F[k].desc}</span></button>`).join('')}</div>
      <div class="sec"><h3>城市</h3>${seg('sc', F[setup.cls].cities.map(k => [k, XZ.CITY[k].n]), city)}</div>
      <div class="sec"><h3>父母的关系</h3>${seg('sp', Object.keys(XZ.PARENTS).map(k => [k, XZ.PARENTS[k].n]), setup.parents)}<p class="note">${XZ.PARENTS[setup.parents].desc}</p></div>
      <div class="sec"><h3>性别</h3>${seg('sg', [['M', '男孩'], ['F', '女孩']], setup.gender)}</div>`;
    }
    $('#setup').innerHTML = `<div class="sec"><h3>你生在哪一年</h3><div class="years" id="yrs">${yrs}</div><p class="note">这一年全国出生${c.born}人。${c.line}</p></div>
    <div class="sec"><h3>生在什么样的家庭</h3>${seg('mode', [['lot', '猜先：随机出生'], ['pick', '自己摆棋：选择出身']], setup.mode)}</div>
    ${body}
    <div class="act">${setup.mode === 'lot' && !setup.drawn ? '<button class="go" id="draw">猜先</button>' : `<button class="go" id="start">落子</button>${setup.mode === 'lot' ? '<button class="link" id="draw">重新猜先</button>' : ''}`}</div>`;
    $$('#yrs .yb').forEach(b => (b.onclick = () => { Sfx.click(.6); setup.cohort = +b.dataset.y; setup.drawn = null; renderSetup(); }));
    $$('#mode button').forEach(b => (b.onclick = () => { setup.mode = b.dataset.k; setup.drawn = null; renderSetup(); }));
    $$('#cls .cl1').forEach(b => (b.onclick = () => { setup.cls = b.dataset.c; setup.city = null; renderSetup(); }));
    const on = (id, k) => $$(`#${id} button`).forEach(b => (b.onclick = () => { setup[k] = b.dataset.k; renderSetup(); }));
    if ($('#sc')) { on('sc', 'city'); on('sp', 'parents'); on('sg', 'gender'); }
    if ($('#draw')) $('#draw').onclick = () => { const l = E.newLife({ cohort: setup.cohort }); setup.drawn = { cls: l.cls, city: l.city, parents: l.parents, gender: l.gender, name: l.name, seed: l.seed }; Sfx.click(); renderSetup(); };
    if ($('#start')) $('#start').onclick = start;
    previewBoard();
  }
  function previewBoard() {
    const cls = setup.mode === 'lot' ? (setup.drawn ? setup.drawn.cls : null) : setup.cls;
    B.reset();
    if (cls) { const l = E.newLife({ cohort: setup.cohort, cls, seed: 1 }); B.sync(l); $('#cap').innerHTML = `<b>${XZ.FAM[cls].n}</b>：${handi(cls)}`; }
    else $('#cap').textContent = '四个角是人生的四块地：学、业、家、财。';
    fit();
  }
  function start() {
    Sfx.init();
    const cfg = setup.mode === 'lot' ? Object.assign({ cohort: setup.cohort }, setup.drawn) : { cohort: setup.cohort, cls: setup.cls, city: setup.city, parents: setup.parents, gender: setup.gender };
    S = E.newLife(cfg);
    A = { stage: -1 };
    B.reset(); B.sync(S); playShell();
    overlay('布局', [`${G.yearCN(S.cohort)}年，${XZ.CITY[S.city].n}。你叫${S.name}。`, `${XZ.FAM[S.cls].desc}${handi(S.cls)}。`, '选项不告诉你好坏。被划掉的选项，点开能看原因。红字是你的积累写下的新选项，别人看不见。', '棋盘下面的十字是你的四口气：身、钱、家、法。'], step);
    A.stage = 0;
  }
  function resume(save) {
    S = save.s; A = save.a || { stage: 0 }; XZ.REFRESH();
    shell(); B.sync(S, true); playShell();
    const n = S.cur ? XZ.nodeById(S.cur) : null;
    if (n) renderNode(n); else step();
  }
  function playShell() {
    $('#R').className = 'right'; $('#hud').hidden = false; $('#stage').classList.remove('home-on');
    $('#R').innerHTML = `<div class="tb"><span class="mv" id="mv"></span><span class="tools"><button class="link" id="snd">${Sfx.on ? '关掉声音' : '打开声音'}</button><button class="link" id="mth">依据</button><button class="link" id="quit">重开</button></span></div><div id="T"></div>`;
    $('#snd').onclick = () => { Sfx.on = !Sfx.on; $('#snd').textContent = Sfx.on ? '关掉声音' : '打开声音'; };
    $('#mth').onclick = method;
    $('#quit').onclick = () => { store.del(KEY); home(); };
    hud(); fit();
  }

  /* ---------- 局面 ---------- */
  function hud() {
    const r = XZ.rungOf(S), q = G.qi(S), kid = S.age < 18 && !S.job;
    const dot = (x, y, ok, c) => ok ? `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#9db2ab" stroke-opacity=".5" stroke-dasharray="2 2"/><text x="${x}" y="${y}">${c}</text>` : `<circle cx="${x}" cy="${y}" r="9.5" fill="#efe9db"/><text x="${x}" y="${y}" style="fill:#2a2118">${c}</text>`;
    const danger = q.shownN <= 1;
    $('#hud').innerHTML = `<div class="who"><b>${S.name}</b><span>${S.cohort} 年生，${XZ.CITY[S.city].n}</span></div>
    <div class="st"><span>${kid ? '家境' : '净资产'}</span><b>${kid ? XZ.FAM[S.cls].short : G.fmt(G.worth(S))}</b></div>
    <div class="st"><span>${S.inSchool ? '在读' : '年收入'}</span><b>${S.inSchool ? (S.uni ? '大学' : '中学') : kid ? '——' : G.fmt(G.income(S))}</b></div>
    <div class="st"><span>阶层</span><b>${XZ.RUNGS[r].n}</b></div>
    <div class="qi" title="气：身体、现金流、家庭、法律。白子填上一口气，这块棋就危险一分。"><svg viewBox="0 0 62 62" role="img" aria-label="气，还剩 ${q.shownN} 口"><path d="M31 8v46M8 31h46" stroke="${danger ? '#ec6a52' : '#9db2ab'}" stroke-opacity=".6"/><circle cx="31" cy="31" r="10" fill="#15181b" stroke="${danger ? '#ec6a52' : 'none'}"/>${dot(31, 11, q.shen, '身')}${dot(51, 31, q.qian, '钱')}${dot(31, 51, q.jia, '家')}${dot(11, 31, q.faShown, '法')}</svg></div>`;
    const m = $('#mv'); if (m) m.textContent = `第 ${S.moves.length + 1} 手`;
  }
  function stageOf() { return S.age < 18 ? 0 : S.age < 36 ? 1 : 2; }
  function step() {
    stopClock(); busy = false;
    const n = E.next(S);
    if (!n) return review();
    const stg = stageOf();
    store.set(KEY, { s: S, a: A });
    if (stg > A.stage) {
      const pre = A.stage; A.stage = stg;
      const c = { miao: 0, ben: 0, su: 0, hun: 0 }; S.moves.filter(m => m.st === undefined ? (m.st = pre, true) : false);
      S.moves.forEach(m => { if (c[m.g] !== undefined && (m.st === pre)) c[m.g]++; });
      const w = stg === 1 ? '中盘' : '官子';
      const say = stg === 1 ? [`${G.ageCN(S.age)}岁。子力开始接触，从这里起，每一手都有人应。`] : [`${G.ageCN(S.age)}岁。官子看起来都是小棋，加起来决定胜负。`];
      overlay(w, say.concat([`目前的阶层：${XZ.RUNGS[XZ.rungOf(S)].n}`]), () => renderNode(n), c);
      return;
    }
    renderNode(n);
  }
  function renderNode(n) {
    NODE = n; busy = false;
    const title = E.titleOf(S, n), lines = E.textOf(S, n).filter(Boolean), list = E.optionsOf(S, n), fut = S.year > XZ.NOW;
    const wh = S.ev.find(e => e.t === 'white');
    $('#cap').innerHTML = wh ? `白 ${wh.st.n}：<b>${wh.era}</b>` : `${G.yearCN(S.year)}年`;
    B.sync(S); fit(); hud();
    const dc = typeof n.doc === 'function' ? n.doc(S) : n.doc, doc = dc ? `<div class="doc"><h4>${dc.from}</h4>${dc.lines.map(l => `<p>${l}</p>`).join('')}</div>` : '';
    $('#T').innerHTML = `<article class="turn"><div class="yr ${fut ? 'fut' : ''}"><b>${G.yearCN(S.year)}</b><small>${G.ageCN(S.age)}岁</small></div>
      <div class="body"><h2 class="ttl">${title}${fut ? '<span class="tag">推演</span>' : ''}</h2>
      <div class="txt">${lines.map(l => `<p>${l}</p>`).join('')}</div>${doc}<div id="Q"></div><div id="O"></div><div id="Z" class="res"></div></div></article>`;
    scrollTop();
    if (n.quiz) renderQuiz(n, list); else if (list && list.length) renderOpts(n, list); else {
      const r = E.narrate(S, n); $('#Z').innerHTML = resultHtml(r.lines, r.ev, 0); nextBtn(); hud(); B.sync(S); fit();
    }
  }
  function scrollTop() { if (innerWidth <= 900) { const y = $('#R').offsetTop - $('.left').offsetHeight - 4; if (scrollY > y) scrollTo(0, Math.max(0, y)); } else scrollTo(0, 0); }
  function renderQuiz(n, list) {
    const q = n.quiz, clause = q.type === 'clause';
    $('#Q').innerHTML = `<div class="quiz"><p class="q">${q.q}</p>${clause ? `<div class="doc"><h4>${q.from}</h4>${q.opts.map((t, i) => `<button class="cl" data-i="${i}">${t}</button>`).join('')}</div>` : `<div class="calc">${q.opts.map((t, i) => `<button data-i="${i}">${t}</button>`).join('')}</div>`}<p class="exp" id="X" hidden></p></div>`;
    $$('#Q [data-i]').forEach(b => (b.onclick = () => {
      const i = +b.dataset.i, ok = E.quiz(S, n, i);
      $$('#Q [data-i]').forEach(x => { x.disabled = true; const j = +x.dataset.i; if (j === q.a) x.classList.add('ok'); else if (j === i) x.classList.add('no'); });
      const X = $('#X'); X.hidden = false; X.textContent = (ok ? '看得准。' : '') + (ok ? q.ok : q.no);
      Sfx.click(.5); renderOpts(n, list);
    }));
  }
  function renderOpts(n, list) {
    const order = list.filter(o => !o.locked && !o.written).concat(list.filter(o => o.locked), list.filter(o => o.written && !o.locked));
    let key = 0;
    const html = order.map(o => {
      if (o.locked) return `<button class="opt lock" data-l="${o.i}" style="--lc:${LOCKC[o.locked.by] || 'var(--sys)'}" aria-disabled="true"><span class="pt"></span><span class="s"><u>${o.t}</u></span><span class="by">${o.locked.by}</span></button>`;
      key++;
      return `<button class="opt ${o.written ? 'zhu' : ''}" data-i="${o.i}"><span class="pt"><i></i></span><span class="s">${o.t}${o.note ? `<small>${o.note}</small>` : ''}</span><span class="k">${key}</span></button>`;
    }).join('');
    const clockH = n.clock ? `<div class="clock"><span>读秒</span><i><b id="cb"></b></i><em id="cn"></em></div>` : '';
    $('#O').innerHTML = `${clockH}<div class="opts ${n.carrier === 'weibo' ? 'feed' : ''}" id="OL">${html}</div>`;
    $$('#OL .opt[data-i]').forEach(b => {
      b.onclick = () => pick(+b.dataset.i);
      const show = () => B.setGhost(XZ.peekStone(S, n.dom || 'ye')), hide = () => B.setGhost(null);
      b.addEventListener('pointerenter', show); b.addEventListener('pointerleave', hide); b.addEventListener('focus', show); b.addEventListener('blur', hide);
    });
    $$('#OL .opt[data-l]').forEach(b => (b.onclick = () => {
      const o = list.find(x => x.i === +b.dataset.l);
      if (!b.querySelector('.why')) b.insertAdjacentHTML('beforeend', `<span class="why">${o.locked.why}</span>`);
    }));
    if (n.clock) startClock(n, order);
  }
  function startClock(n, order) {
    const T = n.clock, t0 = performance.now(); let last = T + 1;
    const open = order.filter(o => !o.locked), dft = open[Math.min(n.dft || 0, open.length - 1)];
    const f = () => {
      const left = T - (performance.now() - t0) / 1000;
      const bar = $('#cb'), num = $('#cn'); if (!bar) return;
      bar.style.transform = `scaleX(${Math.max(0, left / T)})`;
      const sec = Math.ceil(left);
      if (sec !== last) { last = sec; num.textContent = sec > 0 ? G.ageCN(sec) : ''; if (sec <= 5 && sec > 0) Sfx.tick(); }
      if (left <= 0) { clock = null; const hint = document.createElement('p'); hint.className = 'exp'; hint.textContent = '时间到。你跟着身边的人落了子。'; $('#O').prepend(hint); pick(dft.i); return; }
      clock = requestAnimationFrame(f);
    };
    clock = requestAnimationFrame(f);
  }
  function stopClock() { if (clock) cancelAnimationFrame(clock); clock = null; }
  function pick(i) {
    if (busy) return; busy = true; stopClock(); Sfx.init();
    const n = NODE, res = E.choose(S, n, i);
    B.setGhost(null);
    $$('#OL .opt').forEach(b => { b.disabled = true; b.classList.add(+b.dataset.i === i ? 'me' : 'dim'); });
    const k = $('#OL .opt.me .k'); if (k) k.textContent = '';
    B.sync(S); fit(); hud();
    const m = $('#mv'); if (m) m.textContent = `第 ${S.moves.length} 手`;
    const cap = res.ev.find(e => e.t === 'sente');
    if (cap) $('#cap').innerHTML = `白 ${cap.st.n}：<b>时代抢到了先手</b>`;
    $('#Z').innerHTML = resultHtml(res.lines, res.ev, res.delta);
    nextBtn();
    if (innerWidth <= 900) { const z = $('#Z'); setTimeout(() => { const y = z.getBoundingClientRect().top + scrollY - $('.left').offsetHeight - 12; if (scrollY < y - 140) scrollTo({ top: y - 140, behavior: 'smooth' }); }, 60); }
  }
  function resultHtml(lines, ev, delta) {
    let h = '';
    const out = (lines || []).filter(Boolean);
    if (out.length) h += `<div class="out">${out.map(l => `<p>${l}</p>`).join('')}</div>`;
    ev.filter(e => e.t === 'pay').forEach(e => { const r = e.rec; h += `<div class="pay"><span class="s0">${r.label}</span><b>${r.from}</b><i class="ln"></i><b>${r.to}</b><p>${r.line}</p></div>`; });
    if (ev.some(e => e.t === 'cap')) h += `<p class="seedn">提子。这块棋没有了。</p>`;
    const ref = Math.max(.6, G.W(S) * .02);
    if (delta && Math.abs(delta) >= ref && S.age >= 18) h += `<p class="delta">净资产 <b class="${delta < 0 ? 'neg' : ''}">${delta > 0 ? '+' : ''}${G.fmt(delta)}</b></p>`;
    return h;
  }
  function nextBtn() {
    $('#Z').insertAdjacentHTML('beforeend', `<div class="act"><button class="go" id="nx">${S.year >= XZ.END && false ? '终局' : '下一手'}</button></div>`);
    $('#nx').onclick = step;
    if (innerWidth > 900) $('#nx').focus({ preventScroll: true });
  }
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key) && NODE && !busy && $('#OL')) { const list = $$('#OL .opt[data-i]'), b = list[+e.key - 1]; if (b) b.click(); }
  });

  /* ---------- 过场 ---------- */
  function overlay(word, lines, then, c) {
    const d = document.createElement('div'); d.className = 'ov'; d.setAttribute('role', 'dialog');
    const cnt = c ? `<div class="row">${['miao', 'ben', 'su', 'hun'].filter(k => c[k]).map(k => `<span class="seal ${k}">${XZ.GRADE[k].n}</span><span>${c[k]} 手</span>`).join('')}</div>` : '';
    d.innerHTML = `<div class="w">${word}</div><div class="c">${lines.map(l => `<p>${l}</p>`).join('')}${cnt}<div><button class="go" id="ovgo">继续</button></div></div>`;
    document.body.appendChild(d);
    const go = () => { d.remove(); then && then(); };
    $('#ovgo', d).onclick = go; $('#ovgo', d).focus({ preventScroll: true });
  }

  /* ---------- 复盘 ---------- */
  const DAN = q => (q >= 92 ? '九段' : q >= 84 ? '七段' : q >= 76 ? '五段' : q >= 68 ? '三段' : q >= 60 ? '初段' : q >= 50 ? '业余高手' : '业余初学');
  function verdict(r) {
    const d = r.d;
    const t = r.jailed && d < 2 ? '被提子' : d >= 3 ? '中盘胜' : d === 2 ? '五目半胜' : d === 1 ? '半目胜' : d === 0 ? '持和' : d === -1 ? '半目负' : '中盘负';
    return { t, c: d >= 1 ? 'win' : d < 0 || r.jailed ? 'lose' : '' };
  }
  function review() {
    store.del(KEY); stopClock(); B = null; NODE = null;
    const r = E.finish(S), v = verdict(r), F = XZ.FAM[S.cls];
    const bk = store.get(BOOK) || { n: 0, bestFrom: 1, bestTo: 1, bestD: -9 };
    bk.n++; if (r.d > bk.bestD) { bk.bestD = r.d; bk.bestFrom = S.rung0; bk.bestTo = r.rung; } store.set(BOOK, bk);
    const stages = [['布局', 0, 17], ['中盘', 18, 35], ['官子', 36, 99]];
    const rows = stages.map(([nm, a, b]) => {
      const ms = S.moves.filter(m => m.age >= a && m.age <= b); if (!ms.length) return '';
      return `<h3 class="stg">${nm}</h3>` + ms.map(moveRow).join('');
    }).join('');
    const links = S.links.filter(l => l.line);
    const seen = new Set(), chain = links.filter(l => { const k = l.from + l.label + l.to; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
    const miss = S.missed.filter(m => ['miao', 'ben'].includes(m.g)).slice(0, 7);
    const dims = Object.keys(XZ.DIMS).map(k => ({ k, v: r.dim[k] })).filter(d => d.v != null).sort((a, b) => b.v - a.v);
    const summary = lifeLine(r);
    app.innerHTML = `<div class="rv">
      <section class="vd"><div class="t">
        <p class="sub">${G.yearCN(XZ.END)}年，终局。${S.name}，${S.age} 岁。</p>
        <h1 class="rs ${v.c}">${v.t}</h1>
        <p class="sub">${summary}</p>
        <div class="lad">${[1, 2, 3, 4, 5, 6, 7].map(i => `<div class="${i === r.rung ? 'end' : ''} ${i === S.rung0 ? 'sta' : ''}"><b>${XZ.RUNGS[i].n}</b><span>${i === r.rung ? (i === S.rung0 ? '起点也是终点' : '终局') : i === S.rung0 ? `起点：${F.short}家庭` : ''}</span></div>`).join('')}</div>
        <div class="nums"><div><span>净资产</span><b>${G.fmt(r.worth)}</b></div><div><span>年收入</span><b>${G.fmt(r.income)}</b></div><div><span>棋力</span><b>${DAN(r.qq)}</b></div><div><span>做对的题</span><b>${S.quiz.ok}/${S.quiz.n}</b></div></div>
      </div><div class="bd" id="bd2"><canvas id="cv2" aria-label="终局棋谱"></canvas></div></section>

      <section class="blk"><h2>这一生下了 ${S.moves.length} 手</h2><p class="lede">2022 年新高考作文题说：“对本手理解深刻，才可能出现妙手；否则，难免下出俗手。”点开一手，看当时为什么这样判。</p>
        <div class="seg" id="flt"><button data-k="key" aria-pressed="true">只看关键手</button><button data-k="all" aria-pressed="false">全部</button></div><div id="rows">${rows}</div></section>

      <section class="two">
        <div class="blk"><h2>你接住的伏笔</h2>${chain.length ? `<ul class="chain">${chain.map(l => `<li><b>${l.from}</b><i></i><b>${l.to}</b><p>${l.line || l.label}</p></li>`).join('')}</ul>` : '<p class="lede">这一局没有一笔早年的积累在后来派上用场。下一局，试试那些看起来最无聊的选项。</p>'}</div>
        <div class="blk"><h2>你没看见的选项</h2>${miss.length ? `<ul class="miss">${miss.map(m => `<li>${m.t}<span>${m.year} 年，${m.title}。这一手要早年先有积累才看得见。</span></li>`).join('')}</ul>` : '<p class="lede">这一局该看见的你几乎都看见了。</p>'}</div>
      </section>

      <section class="two">
        <div class="blk"><h2>认知体检</h2><div>${dims.map(d => `<div class="dm ${d.v < 50 ? 'low' : ''}"><span>${XZ.DIMS[d.k].n}</span><i><b style="width:${d.v}%"></b></i><span>${d.v}</span><p>${XZ.DIMS[d.k].d}</p></div>`).join('')}</div></div>
        <div class="blk"><h2>一千个平行的你</h2><p class="lede" id="pp">正在模拟同样出身的一千种人生。</p><div class="relv" id="hist"></div></div>
      </section>

      <section class="blk"><h2>你的阶层走势</h2><p class="lede">实线是发生过的历史，虚线是推演。</p><div class="relv" id="line"></div></section>

      <section class="blk"><h2>再下一局</h2><p class="lede">换一个年份，换一个出身。上一局没看见的选项，都藏在那些不起眼的手里。</p>
        <div class="card" id="card">${shareText(r, v)}</div>
        <div class="foot"><button class="go" id="again">再下一局</button><button class="link" id="copy">复制战报</button><button class="link" id="mth">依据与方法</button></div></section>
    </div>`;
    scrollTo(0, 0);
    const B2 = new XZ.Goban($('#cv2')); B2.num = true; B2.terr = r.terr; B2.labels = false;
    const fit2 = () => { B2.resize(); }; fit2(); B2.sync(S, true); B2.draw();
    addEventListener('resize', fit2);
    $('#again').onclick = home; $('#mth').onclick = method;
    $('#copy').onclick = () => { const t = shareText(r, v), ok = () => { $('#copy').textContent = '已复制'; }; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok).catch(() => { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents($('#card')); sel.removeAllRanges(); sel.addRange(rg); $('#copy').textContent = '已选中，请手动复制'; }); };
    const applyFilter = k => { $$('#rows .mvw').forEach(w => { w.hidden = k === 'key' && w.dataset.g === 'ping'; }); };
    applyFilter('key');
    $$('#flt button').forEach(b => (b.onclick = () => { $$('#flt button').forEach(x => x.setAttribute('aria-pressed', x === b)); applyFilter(b.dataset.k); }));
    $$('#rows .mvr').forEach(b => (b.onclick = () => { const d = b.nextElementSibling; d.hidden = !d.hidden; B2.hl = d.hidden ? 0 : +b.dataset.n; B2.kick(); }));
    lineChart(); parallel(r);
  }
  function moveRow(m) {
    const srcs = (m.src || []).map(x => `<span class="lv">${x[0]}</span>${x[1]}`).join('<br>');
    return `<div class="mvw" data-g="${m.g}"><button class="mvr" data-n="${m.n}"><span class="no">${m.n}</span><span class="yy">${m.year} 年 ${m.age} 岁</span><span class="ti">${m.title}<em>${m.pick}${m.written ? '（朱批）' : ''}</em></span><span class="seal ${m.g}">${XZ.GRADE[m.g].n}</span></button><div class="mdet" hidden><p>${m.lesson || ''}</p>${m.best ? `<p class="bt">这一手更好：${m.best.t}</p>` : ''}${srcs ? `<p class="srcs">${srcs}</p>` : ''}</div></div>`;
  }
  function lifeLine(r) {
    const c = r.counts, a = [];
    a.push(`你从${XZ.RUNGS[S.rung0].n}走到了${XZ.RUNGS[r.rung].n}。`);
    a.push(`下出妙手 ${c.miao} 手，本手 ${c.ben} 手，俗手 ${c.su} 手${c.hun ? `，昏招 ${c.hun} 手` : ''}。`);
    if (r.jailed) a.push('你在铁窗里度过了几年。这段记录会跟着你和你的孩子。');
    else if (r.open.length) a.push(`${r.open[0].year} 年的那件事一直没有案发，你也一直没有睡安稳过。`);
    if (r.fam < 30) a.push('赢下了棋盘的人，不一定保得住饭桌。');
    if (r.hp < 40) a.push('你的身体替你付了一部分账。');
    return a.join('');
  }
  function shareText(r, v) { return `《选择决定命运》\n${S.cohort} 年生，${XZ.FAM[S.cls].n}，${XZ.CITY[S.city].n}。\n从${XZ.RUNGS[S.rung0].n}到${XZ.RUNGS[r.rung].n}，${v.t}。\n妙手 ${r.counts.miao}，本手 ${r.counts.ben}，俗手 ${r.counts.su}，昏招 ${r.counts.hun}。棋力：${DAN(r.qq)}。`; }

  function parallel(r) {
    const N = 1000, cfg = { cohort: S.cohort, cls: S.cls, city: S.city, parents: S.parents, gender: S.gender }, cnt = [0, 0, 0, 0, 0, 0, 0, 0];
    let i = 0, jail = 0;
    const run = () => {
      const end = Math.min(N, i + 60);
      for (; i < end; i++) { const o = E.auto(Object.assign({ seed: i * 131 + 9, fast: true }, cfg), 'folk'); cnt[o.r.rung]++; if (o.r.jailed) jail++; }
      if (i < N) return setTimeout(run, 0);
      const below = cnt.slice(1, r.rung).reduce((a, b) => a + b, 0), same = cnt[r.rung], p = Math.round((below + same / 2) / N * 100);
      $('#pp').textContent = `同样的出身、同样的城市，一千个普通玩法的你。你下得比 ${p}% 的他们好。其中 ${jail} 个人进过监狱。`;
      histChart(cnt, r.rung);
    };
    setTimeout(run, 30);
  }
  function histChart(cnt, me) {
    const W = 520, H = 216, L = 8, R = 8, T = 22, Bt = 40, max = Math.max(...cnt), bw = (W - L - R) / 7;
    const bars = [1, 2, 3, 4, 5, 6, 7].map(i => {
      const h = max ? (cnt[i] / max) * (H - T - Bt) : 0, x = L + (i - 1) * bw, y = H - Bt - h;
      return `<g data-tip="${XZ.RUNGS[i].n}：${cnt[i]} 人"><rect x="${x}" y="${T}" width="${bw}" height="${H - T - Bt}" fill="transparent"/><path d="M${x + 5} ${H - Bt}V${y + 3}a3 3 0 0 1 3-3h${bw - 16}a3 3 0 0 1 3 3V${H - Bt}Z" fill="${i === me ? '#e0b871' : '#4d7078'}"/>${cnt[i] ? `<text class="vl" x="${x + bw / 2}" y="${y - 6}" text-anchor="middle">${cnt[i]}</text>` : ''}<text x="${x + bw / 2}" y="${H - Bt + 17}" text-anchor="middle" class="${i === me ? 'lb' : ''}">${XZ.RUNGS[i].n.replace('上层', '上')}</text>${i === me ? `<text x="${x + bw / 2}" y="${H - Bt + 34}" text-anchor="middle" class="lb">你在这里</text>` : ''}</g>`;
    }).join('');
    $('#hist').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="一千个平行人生的阶层分布"><line x1="${L}" x2="${W - R}" y1="${H - Bt}" y2="${H - Bt}" stroke="#2a474d"/>${bars}</svg>`;
    hoverTips($('#hist'));
  }
  function lineChart() {
    const pts = S.hist.filter(h => h.a >= 18); if (pts.length < 2) return;
    const W = 1040, H = 240, L = 78, R = 16, T = 10, Bt = 28, y0 = pts[0].y, y1 = pts[pts.length - 1].y;
    const X = y => L + (y - y0) / Math.max(1, y1 - y0) * (W - L - R), Y = r => T + (7 - r) / 6 * (H - T - Bt);
    const path = list => list.map((p, i) => (i ? `H${X(p.y).toFixed(1)}V${Y(p.r).toFixed(1)}` : `M${X(p.y).toFixed(1)} ${Y(p.r).toFixed(1)}`)).join('');
    const past = pts.filter(p => p.y <= XZ.NOW), fut = pts.filter(p => p.y >= XZ.NOW);
    const grid = [1, 2, 3, 4, 5, 6, 7].map(r => `<line x1="${L}" x2="${W - R}" y1="${Y(r)}" y2="${Y(r)}" stroke="#2a474d" stroke-opacity=".6"/><text x="${L - 10}" y="${Y(r) + 4}" text-anchor="end">${XZ.RUNGS[r].n}</text>`).join('');
    const ticks = []; for (let y = Math.ceil(y0 / 5) * 5; y <= y1; y += 5) ticks.push(`<text x="${X(y)}" y="${H - 8}" text-anchor="middle">${y}</text>`);
    const hits = pts.map((p, i) => { const x = X(p.y), w = (W - L - R) / pts.length; return `<rect x="${x - w / 2}" y="${T}" width="${w}" height="${H - T - Bt}" fill="transparent" data-tip="${p.y} 年 ${p.a} 岁：${XZ.RUNGS[p.r].n}，净资产 ${G.fmt(p.w)}"/>`; }).join('');
    const last = pts[pts.length - 1];
    $('#line').innerHTML = `<div style="overflow-x:auto"><svg class="chart" style="min-width:560px" viewBox="0 0 ${W} ${H}" role="img" aria-label="阶层随年份的变化">${grid}${ticks.join('')}<path d="${path(past)}" fill="none" stroke="#e0b871" stroke-width="2.4"/>${fut.length > 1 ? `<path d="${path(fut)}" fill="none" stroke="#e0b871" stroke-width="2.4" stroke-dasharray="5 5"/>` : ''}<circle cx="${X(last.y)}" cy="${Y(last.r)}" r="5" fill="#e0b871" stroke="#13272b" stroke-width="2"/>${hits}</svg></div>`;
    hoverTips($('#line'));
  }
  function hoverTips(box) {
    let tip = null;
    $$('[data-tip]', box).forEach(el => {
      el.addEventListener('pointerenter', () => { if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; box.appendChild(tip); } tip.textContent = el.dataset.tip; tip.hidden = false; });
      el.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); if (tip) { tip.style.left = Math.min(r.width - 90, Math.max(90, e.clientX - r.left)) + 'px'; tip.style.top = e.clientY - r.top + 'px'; } });
      el.addEventListener('pointerleave', () => { if (tip) tip.hidden = true; });
    });
  }

  /* ---------- 依据与方法 ---------- */
  function method() {
    const seen = new Set(), srcs = [];
    XZ.NODES.forEach(n => (n.src || []).forEach(s => { if (!seen.has(s[1])) { seen.add(s[1]); srcs.push(s); } }));
    const d = document.createElement('div'); d.className = 'sheet'; d.setAttribute('role', 'dialog');
    d.innerHTML = `<div class="in"><div><button class="link" id="cl">返回棋盘</button></div>
    <h2>依据与方法</h2>
    <p>这是根据公开资料做的交互作品，不是研究报告，也不是投资或法律建议。人物和具体金额是虚构的。它受《普通中国人的一生》启发：原作让你看见选项怎样被划掉，这一局想让你看见，积累怎样写下新的选项。</p>
    <h3>棋理</h3>
    <blockquote>围棋有三个术语：本手、妙手、俗手。本手是指合乎棋理的正规下法；妙手是指出人意料的精妙下法；俗手是指貌似合理，而从全局看通常会受损的下法。……对本手理解深刻，才可能出现妙手；否则，难免下出俗手。<br>——2022 年普通高考语文新高考Ⅰ卷作文材料</blockquote>
    <ul><li>让子：出身决定开局。富裕家庭你先摆九子，农村务农家庭时代先摆六子。</li><li>气：身体、现金流、家庭、法律。法律这口气，你要懂一点法才看得见它没了。</li><li>朱批：只有早年做过相应积累的人，才看得见的选项。</li><li>划掉的选项：红是制度，蓝是家境，紫是性别，灰是时机或分数。这个做法来自原作。</li><li>一生最多接住三次转行式的机会，新工作至少要干满三年，所以风口不能全部吃到。</li></ul>
    <h3>模型</h3>
    <ul><li>收入按城镇非私营单位平均工资的倍数计算。2025 年平均工资为 129441 元。</li><li>房价按城市等级估算一套 90 平米住房的总价，股票、比特币、纳指用历年年末数据，2026 年及以后是估算。</li><li>阶层看净资产、未来收入的折现和可继承的家庭资产，按当年平均工资折算，门槛是作者设定的。</li><li>“一千个平行的你”是用同一套规则模拟出来的普通玩法，它只说明游戏规则，不代表真实统计。</li><li>2027 年以后的内容全部是推演，棋子带虚线。</li></ul>
    <h3>每一段的依据</h3><p>分四层：<span class="lv">制度</span>法律、政策原文；<span class="lv">统计</span>官方或公开数据；<span class="lv">估算</span>作者根据公开数据折算；<span class="lv">虚构</span>人物、对话、金额。</p>
    <ul>${srcs.map(s => `<li><span class="lv">${s[0]}</span>${s[1]}</li>`).join('')}</ul>
    <h3>注意</h3><p>文中引用的《刑法》条文只是为了说明风险，具体案件以法律和司法机关认定为准。选项里的违法行为都会带来后果，请勿模仿。遇到高薪招工、出借银行卡、高息理财，可以拨打全国反诈专线 96110 咨询。</p>
    </div>`;
    document.body.appendChild(d);
    $('#cl', d).onclick = () => d.remove();
  }

  /* 测试用：直接跳到某一手 */
  XZ.UI = { resume, home, review(s) { S = s; A = { stage: 2 }; review(); }, method, jump(cfg, id, patch) { S = E.newLife(cfg); Object.assign(S, patch || {}); A = { stage: 2 }; shell(); B.sync(S, true); playShell(); const n = XZ.nodeById(id); S.cur = id; renderNode(n); }, get s() { return S; } };

  /* ---------- 启动 ---------- */
  function boot(data) {
    const save = data && data.s ? data : null;
    if (save) resume(save); else home();
    try { root.claude && root.claude.hot && root.claude.hot.snapshot && root.claude.hot.snapshot(() => (S && !S.ended ? { s: S, a: A } : {})); } catch (e) { /* 只在预览器里有这个钩子 */ }
  }
  const hot = root.claude && root.claude.hot;
  const go = () => { if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {}); };
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => { if (B) B.draw(); }); }
  go();
})(window);
