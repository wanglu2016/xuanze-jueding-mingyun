const XZ = require('./load.js');
const COH = [1980, 1985, 1990, 1995, 2000, 2005, 2010], CLS = 'ABCDEF'.split(''), POL = ['best', 'wise', 'folk', 'crowd', 'safe', 'spec'];
const N = +process.argv[2] || 150;
const errs = {}; const seen = {};
const bad = {};
function run(c, k, p, seed) { try { const pol = (s, n, open) => { const scan = [...XZ.E.textOf(s, n), XZ.E.titleOf(s, n), ...open.map(o => o.t), typeof n.lesson === 'function' ? n.lesson(s) : n.lesson || ''].join('|'); if (/undefined|NaN|null|\[object/.test(scan)) bad[n.id] = scan.slice(0, 120); return XZ.BOT[p](s, n, open); }; const o = XZ.E.auto({ cohort: c, cls: k, seed, fast: true }, pol); o.s.moves.forEach(m => seen[m.id] = (seen[m.id] || 0) + 1); return o; } catch (e) { const key = e.message.slice(0, 90) + ' @' + (e.stack.split('\n')[1] || '').trim().slice(0, 70); errs[key] = (errs[key] || 0) + 1; return null; } }
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
console.log('节点总数', XZ.NODES.length);
const tbl = {};
POL.forEach(p => { tbl[p] = {}; });
let lens = [];
COH.forEach(c => {
  CLS.forEach(k => {
    POL.forEach(p => {
      const rs = [];
      for (let i = 0; i < N; i++) { const o = run(c, k, p, i * 37 + c * 11 + k.charCodeAt(0)); if (o) { rs.push({ r: o.r }); if (p === 'folk') lens.push(o.s.moves.length); } }
      const key = c + k;
      tbl[p][key] = { r: rs.reduce((a, o) => a + o.r.rung, 0) / rs.length, med: med(rs.map(o => o.r.rung)), jail: rs.filter(o => o.r.jailed).length / rs.length, up2: rs.filter(o => o.r.d >= 2).length / rs.length };
    });
  });
});
console.log('局内手数 中位', med(lens), '最少', Math.min(...lens), '最多', Math.max(...lens));
console.log('\n平均终局阶层（行：年份+出身 起点 | best folk crowd safe spec rand | 入狱率 best/spec）');
COH.forEach(c => CLS.forEach(k => { const key = c + k, row = POL.map(p => tbl[p][key].r.toFixed(1)).join('  '); console.log(key, XZ.FAM[k].rung, '|', row, '| 入狱', (tbl.best[key].jail * 100 | 0) + '%', (tbl.spec[key].jail * 100 | 0) + '%', '| best涨≥2:', (tbl.best[key].up2 * 100 | 0) + '%', 'folk:', (tbl.folk[key].up2 * 100 | 0) + '%'); }));
console.log('\n总体均值'); POL.forEach(p => { const v = Object.values(tbl[p]); console.log(p, (v.reduce((a, x) => a + x.r, 0) / v.length).toFixed(2), '入狱', (v.reduce((a, x) => a + x.jail, 0) / v.length * 100).toFixed(1) + '%'); });
console.log('\n文本异常', bad);
console.log('\n错误'); Object.entries(errs).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(e => console.log(e[1], e[0]));
const never = XZ.NODES.filter(n => !seen[n.id] && !n.trig).map(n => n.id);
console.log('\n从未出现（可能是纯叙事节点）', never.join(' '));
