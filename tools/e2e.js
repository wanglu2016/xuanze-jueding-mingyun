/* 真实浏览器里，七个年份各走完一局，失败即报错 */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const out = require('os').tmpdir();
  for (const y of [1980, 1985, 1990, 1995, 2000, 2005, 2010]) {
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + require('path').join(__dirname, '..', 'index.html')); await p.waitForTimeout(250);
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} XZ.Sfx.on = false; });
    await p.click(`.yb[data-y="${y}"]`); await p.click('#draw'); await p.click('#start'); await p.waitForTimeout(100);
    let t0 = Date.now(), moves = 0, stall = 0;
    while (Date.now() - t0 < 60000) {
      if (await p.$('.rv')) break;
      const did = await p.evaluate(() => {
        const q = s => document.querySelector(s), all = s => Array.from(document.querySelectorAll(s));
        if (q('#ovgo')) { q('#ovgo').click(); return 'ov'; }
        const c = all('#Q [data-i]:not([disabled])'); if (c.length) { c[Math.floor(Math.random() * c.length)].click(); }
        const o = all('#OL .opt[data-i]:not([disabled])'); if (o.length) { o[Math.floor(Math.random() * o.length)].click(); }
        if (q('#nx')) { q('#nx').click(); return 'nx'; }
        return o.length ? 'pick' : 'none';
      });
      if (did === 'none') { if (++stall > 40) { console.log('卡住', y, await p.evaluate(() => document.querySelector('#T')?.innerText?.slice(0, 200))); break; } await p.waitForTimeout(40); } else { stall = 0; if (did === 'nx') moves++; }
    }
    await p.waitForTimeout(3200);
    const info = await p.evaluate(() => ({ rs: document.querySelector('.rs')?.textContent, pp: document.querySelector('#pp')?.textContent, w: document.documentElement.scrollWidth - innerWidth, und: /undefined|NaN/.test(document.body.innerText) }));
    console.log(y, moves, JSON.stringify(info), errs.slice(0, 3));
    if (y === 1995) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: out + '/r1.png' }); await p.evaluate(() => document.querySelector('#hist').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200); await p.screenshot({ path: out + '/r2.png' }); await p.evaluate(() => document.querySelector('#rows').scrollIntoView()); await p.click('#rows .mvw:not([hidden]) .mvr'); await p.waitForTimeout(200); await p.screenshot({ path: out + '/r3.png' }); }
    await p.close();
  }
  await b.close();
})();
