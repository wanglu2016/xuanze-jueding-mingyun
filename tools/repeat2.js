/* 语义检查：同一局里，同一类决定不能反复出现 */
const XZ = require('./load.js');
const COH = [1980, 1985, 1990, 1995, 2000, 2005, 2010], CLS = 'ABCDEF'.split(''), POL = ['best', 'wise', 'folk', 'crowd', 'safe', 'spec', 'rand'];
const N = +process.argv[2] || 10;
const KW = { 出国: /出国|留学/, 考公: /公务员|考公|事业编|选调/, 考研: /考研|读研/, 程序员: /程序员|写代码的工作/, 创业: /创业/, 回老家: /回老家/, 复读: /复读/, 全投: /全投|全部存款|存款都/, 加杠杆: /配资|抵押贷款/ };
const cnt = {}, ex = {};
for (const c of COH) for (const k of CLS) for (const p of POL) for (let i = 0; i < N; i++) {
  const hits = {};
  const pol = (s, n, open) => { const ts = XZ.E.optionsOf(s, n).map(o => o.t).join('|'); for (const w in KW) if (KW[w].test(ts)) (hits[w] = hits[w] || []).push(s.year + n.id); return XZ.BOT[p](s, n, open); };
  XZ.E.auto({ cohort: c, cls: k, seed: i * 71 + c, fast: true }, pol);
  for (const w in hits) if (hits[w].length > 1) { const key = w + ' ×' + hits[w].length; cnt[key] = (cnt[key] || 0) + 1; ex[key] = hits[w].join(' '); }
}
Object.entries(cnt).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(6), k.padEnd(10), ex[k]));
console.log('完');
