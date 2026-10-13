// Performance guard: plays a few heavy levels frame by frame in Chromium and counts the draw calls that make a phone's GPU stutter.
// Fails (exit 1) when a budget is broken, so a slow-down cannot come back unnoticed.
//   node scripts/perf_guard.js [url]        (default http://127.0.0.1:8766/index.html; serve the repo root first)
// Budgets, per frame on the game canvas:
//   blur   real shadowBlur passes reaching the GPU            0  (glows go through the cheap path in game.src.html, GLOWX)
//   text   fillText/strokeText calls                          12 (calls and pop-ups are cached images, txtSprite)
//   grad   gradients created                                  40
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8766/index.html';
const LEVELS = [30, 63, 134, 137, 140], FRAMES = 360, BUDGET = { blur: 0, text: 12, grad: 40 };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let bad = 0;
  for (const lv of LEVELS) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(lv => {
      localStorage.setItem('bhs_intro', '1');
      localStorage.setItem('bhs_v7', JSON.stringify({ playerName: 'N', lastLogin: new Date().toDateString(), loginStreak: 3, savedLevel: lv, bestLevel: 300, tip: { lbName: 1 }, set: { lang: 'tr' } }));
      let sd = 777; Math.random = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      window.requestAnimationFrame = () => 1; let f = 1e6; performance.now = () => f; window.__adv = ms => { f += ms; };
      const P = CanvasRenderingContext2D.prototype, C = window.__C = { blur: 0, text: 0, grad: 0 }, bl = Object.getOwnPropertyDescriptor(P, 'shadowBlur').get;
      const game = c => c.canvas && c.canvas.id === 'fx';
      for (const m of ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText']) {
        const o = P[m]; P[m] = function (...a) { if (game(this)) { if (bl.call(this) > 0) C.blur++; if (m === 'fillText' || m === 'strokeText') C.text++; } return o.apply(this, a); };
      }
      for (const m of ['createRadialGradient', 'createLinearGradient']) { const o = P[m]; P[m] = function (...a) { if (game(this)) C.grad++; return o.apply(this, a); }; }
    }, lv);
    await p.goto(URL); await p.waitForTimeout(1500);
    await p.evaluate(lv => { for (const k in TIPS) TIPS[k] = 1; SHOP.giftLv = 1e6; HEARTS.n = 5; savedLevel = lv; saveG(); const d = document.getElementById('sDaily'); if (d) d.classList.remove('on'); hideModals(); selMode('classic'); $('startBtn').click(); }, lv);
    await p.waitForTimeout(400);
    const r = await p.evaluate(([lv, FR]) => {
      if (!(G2.on && G2.lv === lv)) { hideModals(); level = lv; v2Start('level'); } gState = 'playing';
      const peak = { blur: 0, text: 0, grad: 0 }, sum = { blur: 0, text: 0, grad: 0 }; let n = 0;
      for (let i = 0; i < FR; i++) {
        __adv(1000 / 60); if (gState === 'tip') try { v2TipOk(); } catch (e) { } if (gState !== 'playing') break; lives = 3;
        G2.tx = hX + Math.sin(i / 40) * 80; G2.ty = hY + Math.cos(i / 50) * 60;
        if (i % 90 === 45) { v2Call('YAY ONARILDI', '', '#ff8a8a', .9); v2Pop('KUSURSUZ KAÇIŞ', '#8dffcb', 16); }
        for (const k in __C) __C[k] = 0; v2Frame(1 / 60); n++;
        for (const k in __C) { sum[k] += __C[k]; peak[k] = Math.max(peak[k], __C[k]); }
      }
      const avg = {}; for (const k in sum) avg[k] = +(sum[k] / Math.max(1, n)).toFixed(2); return { n, avg, peak };
    }, [lv, FRAMES]);
    const over = Object.keys(BUDGET).filter(k => r.peak[k] > BUDGET[k]);
    if (over.length || errs.length) bad++;
    console.log(`L${lv} ${r.n} frames  avg ${JSON.stringify(r.avg)}  peak ${JSON.stringify(r.peak)}  ${over.length ? 'OVER BUDGET: ' + over.join(',') : 'ok'}${errs.length ? '  errors: ' + errs.slice(0, 2).join(' | ') : ''}`);
    await p.close();
  }
  await b.close();
  if (bad) { console.log('perf guard FAILED'); process.exit(1); } console.log('perf guard passed');
})();
