/* 重复选择检测：同一局里，两手棋的选项是否相同或高度相似 */
const XZ = require('./load.js');
const COH = [1980, 1985, 1990, 1995, 2000, 2005, 2010], CLS = 'ABCDEF'.split(''), POL = ['best', 'wise', 'folk', 'crowd', 'safe', 'spec', 'rand'];
const N = +process.argv[2] || 12, TH = +process.argv[3] || .55;
const clean = t => String(t).replace(/[，。、：；！？“”《》（）\s]/g, '').replace(/[0-9.]+/g, '#');
const grams = t => { const g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); if (t.length < 2) g.add(t); return g; };
const sim = (a, b) => { if (a === b) return 1; const A = grams(a), B = grams(b); let c = 0; A.forEach(x => { if (B.has(x)) c++; }); return 2 * c / (A.size + B.size || 1); };
const same = {}, pair = {}; let lives = 0, dirty = 0, sameNode = 0; const perLife = [];
for (const c of COH) for (const k of CLS) for (const p of POL) for (let i = 0; i < N; i++) {
  const hist = [], pol = (s, n, open) => {
    const opts = XZ.E.optionsOf(s, n).map(o => clean(o.t));
    hist.push({ id: n.id, y: s.year, opts, raw: XZ.E.optionsOf(s, n).map(o => o.t) });
    return XZ.BOT[p](s, n, open);
  };
  XZ.E.auto({ cohort: c, cls: k, seed: i * 53 + c + k.charCodeAt(0), fast: true }, pol);
  lives++; let bad = 0;
  for (let a = 0; a < hist.length; a++) for (let b = a + 1; b < hist.length; b++) {
    const A = hist[a], B = hist[b]; let hit = 0, ex = null;
    A.opts.forEach((x, i1) => { let best = 0, j = -1; B.opts.forEach((y, i2) => { const v = sim(x, y); if (v > best) { best = v; j = i2; } }); if (best >= TH) { hit++; if (!ex || best === 1) ex = [A.raw[i1], B.raw[j], best]; } });
    if (hit) {
      bad++;
      if (A.id === B.id) sameNode++;
      const key = [A.id, B.id].sort().join(' ~ ');
      pair[key] = pair[key] || { n: 0, hit: 0, ex }; pair[key].n++; pair[key].hit = Math.max(pair[key].hit, hit);
    }
  }
  if (bad) dirty++; perLife.push(bad);
}
const list = Object.entries(pair).sort((a, b) => b[1].n - a[1].n);
console.log(`人生 ${lives}，含重复 ${dirty}（${(dirty / lives * 100).toFixed(1)}%），同一节点重复出现 ${sameNode} 次，每局平均 ${(perLife.reduce((a, b) => a + b, 0) / lives).toFixed(2)} 对`);
list.slice(0, +process.argv[4] || 45).forEach(([k, v]) => console.log(String(v.n).padStart(6), k.padEnd(26), '×' + v.hit, '|', v.ex[0].slice(0, 24), '≈', v.ex[1].slice(0, 24)));
console.log('相似对种类', list.length);
