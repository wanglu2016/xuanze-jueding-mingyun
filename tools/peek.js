const XZ = require('./load.js');
const [c, k, pol, seed] = [+process.argv[2] || 1980, process.argv[3] || 'A', process.argv[4] || 'best', +process.argv[5] || 7];
const o = XZ.E.auto({ cohort: c, cls: k, seed }, pol), s = o.s, G = XZ.G;
console.log(s.name, s.gender, XZ.CITY[s.city].n, s.parents, '手数', s.moves.length);
s.moves.forEach(m => console.log(m.year, m.age, m.g.padEnd(4), m.id.padEnd(12), m.pick.slice(0, 34)));
console.log('终局', 'rung', o.r.rung, '净资产', G.fmt(o.r.worth), '收入', G.fmt(o.r.income), 'scoreW', o.r.score.toFixed(0), 'job', s.job && s.job.n, s.job && s.job.mult.toFixed(2), 'tier', s.tier);
console.log('cash', G.fmt(s.cash), 'pos', Object.entries(s.pos).map(([a, b]) => a + ':' + G.fmt(b)).join(' '), 'houses', s.houses.map(h => 't' + h.t + '@' + h.bought + ' 现值' + G.fmt(G.housePrice(h.t, s.year)) + ' 贷' + G.fmt(h.loan)).join(' | '), 'biz', s.biz && s.biz.n + G.fmt(s.biz.v), 'hp', s.hp | 0, 'fam', s.fam | 0, 'qi', o.r.qq);
console.log('hist', s.hist.filter(h => h.y % 5 === 0).map(h => h.y + ':' + G.fmt(h.w) + '/r' + h.r).join('  '));
