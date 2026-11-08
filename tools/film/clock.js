/* 拍片用的虚拟时钟：定时器、动画帧、CSS 动画都按逐帧推进，和机器快慢无关。 */
(() => {
  const realST = window.setTimeout.bind(window);
  let t = 0, id = 1;
  const timers = new Map(), rafs = new Map();
  let seed = 20261107;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  window.setTimeout = (fn, ms = 0, ...a) => { const i = id++; timers.set(i, { at: t + Math.max(+ms || 0, 0), fn, a }); return i; };
  window.clearTimeout = i => timers.delete(i);
  window.setInterval = (fn, ms = 0, ...a) => { const i = id++; timers.set(i, { at: t + Math.max(+ms || 1, 1), fn, a, every: Math.max(+ms || 1, 1) }); return i; };
  window.clearInterval = i => timers.delete(i);
  window.requestAnimationFrame = fn => { const i = id++; rafs.set(i, fn); return i; };
  window.cancelAnimationFrame = i => rafs.delete(i);
  Object.defineProperty(window, 'devicePixelRatio', { get: () => 2 });
  performance.now = () => t;
  const base = 1794000000000;
  Date.now = () => base + t;
  const flush = () => new Promise(r => realST(r, 0));
  window.__sfx = [];
  window.__vt = () => t;
  window.__tick = async dt => {
    t += dt;
    for (let guard = 0; guard < 5000; guard++) {
      let best = null;
      timers.forEach((v, k) => { if (v.at <= t && (!best || v.at < best[1].at)) best = [k, v]; });
      if (!best) break;
      const [k, v] = best;
      if (v.every) v.at += v.every; else timers.delete(k);
      try { v.fn(...v.a); } catch (e) { console.error(e); }
      await flush();
    }
    const list = [...rafs.values()]; rafs.clear();
    list.forEach(fn => { try { fn(t); } catch (e) { console.error(e); } });
    await Promise.resolve();
    document.getAnimations().forEach(a => {
      if (a.__t0 == null) { a.pause(); a.__t0 = t - dt; }
      const c = t - a.__t0, end = a.effect.getComputedTiming().endTime;
      if (c >= end) a.finish(); else a.currentTime = c;
    });
  };
})();
