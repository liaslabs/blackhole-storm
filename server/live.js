// Live content (18 Oct): the campaigns GET /camp hands to the game. Data only; the game checks every field and keeps its own ceilings
// (src/game.src.html, LIVE_FX and LIVE_RW): effects lvStars (level stars, at most ×3) and sp (season points, at most ×2); up to 4 tasks
// built on the daily-mission counters (catch, perfect, combo, clean, rescue, comet, score, surv, edge, diamond, rulelv, hunt, boss,
// crack, atlas, rival, spec, jet, cons, guard) with rewards in stars (≤2000), gems (≤50), lives (spare lives, ≤5), shield (≤5), time (≤5);
// go: play | shop | fleet | lab | season | daily. Texts: one entry per language, the game falls back to en, then tr.
// A campaign is sent from two days before it starts until it ends, so phones have it even if they go offline.
//
// Example (not live):
// { id: 'hafta-sonu-firtinasi-1', from: '2026-10-24T00:00:00Z', to: '2026-10-27T00:00:00Z', ic: '☄️', col: '#ff8a4c',
//   t: { tr: 'HAFTA SONU FIRTINASI', en: 'WEEKEND STORM' }, d: { tr: '...', en: '...' },
//   fx: { lvStars: 2, sp: 1.5 }, tasks: [{ id: 'catch', n: 300, r: { stars: 300 } }, { id: 'clean', n: 5, r: { gems: 10 } }], go: 'play' }
export default [];
