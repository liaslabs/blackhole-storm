// Fleet missions (1.5.0): three a day (easy, medium, hard), the same three for everyone on a UTC day, each played on its own
// seeded cosmos with the same kit for everyone (3 lives, the mission's shields and Supernova; no Laboratory, no avatar power,
// none of the player's own stock). A mission has three medal targets; a medal pays fleet points only (never stars, the
// ranking or the season). Three tries a mission a day, the best one counts. One file for the game and the leaderboard server
// (the game inlines it, src/build.py //@@FMIS@@; the server imports it), so both pick the same missions and the same targets.
globalThis.BHS_FMIS = (() => {
  // lv: 0 easy, 1 medium, 2 hard · m: what is measured · tg: bronze, silver, gold · max: the most a real run can show (the server's check)
  // plan: events at [second, kind] · kit: shields, Supernovas, Vortex (rage) on or off
  // targets set on 15 Oct 2026 from the recorder's bot over three seeded days (no immunity): bronze about a third of what it reached,
  // gold about its median. Re-measured on 16 Oct for the new rules: the Golden Arc's bar (the bot caught 9–13 arcs in 3 min), the
  // four-prey hunt (15–59 hits) and the antimatter storm at 2.5 times the antimatter (7–27 thousand). To be tuned with real play.
  const L = [
    { id: 'combo', lv: 0, ic: '🔗', n: 'KOMBO USTASI', d: 'Zinciri koparmadan yut, en yüksek komboya ulaş.', dur: 60, m: 'combo', tg: [12, 25, 45], max: 400 },
    { id: 'garc', lv: 0, ic: '✨', n: 'ALTIN YAY AVCISI', d: 'Yuttukça çubuk dolar, her dolduğunda bir Altın Yay gelir. 2 saniyede yakala.', dur: 180, m: 'garc', tg: [15, 35, 60], max: 300, bar: 4000, life: 2 }, // 17 Oct: a bar of 4000 — the bot with no damage caught 111–114 in 3 min, the one that gets hit 18–35 before its lives ran out
    { id: 'hunt', lv: 1, ic: '🎯', n: 'AV ZİNCİRİ', d: 'Aynı anda 4 av. Parçaladığın avın vuruşları puanın olur.', dur: 180, m: 'hunt', tg: [15, 30, 50], max: 600, hunt: 1,
      kit: { sh: 2, nova: 0, rage: 0 } },
    { id: 'eclipse', lv: 1, ic: '🌑', n: 'KARANLIKTA YUT', d: 'Tutulmalar arka arkaya. Karanlıkta cisim yut.', dur: 60, m: 'caught', tg: [45, 85, 125], max: 600,
      plan: [[3, 'eclipse'], [14, 'eclipse'], [25, 'eclipse'], [36, 'eclipse'], [47, 'eclipse']] },
    { id: 'belt', lv: 2, ic: '☄️', n: 'METEOR KUŞAĞINDAN KAÇ', d: 'Kuşaklar ara vermeden, başka yönlerden gelir. Meteorların arasında kıvrılan bir güvenli rota var, bazen iki. Arkanda bıraktığın her meteor +1. Kalkan yok, Vortex yok.', dur: 90, m: 'dodge', tg: [400, 650, 850], max: 1300,
      plan: [[2, 'belt']], chain: 18, mid: .6, kit: { sh: 0, nova: 0, rage: 0 } }, // 18 Oct: one endless belt in turns of 18 s, a loose field with a narrow winding route (two for a while now and then), faster and denser from the third belt; every meteor that gets past counts. The bot that follows the route 887–966 in 90 s (gold means lasting almost to the end), standing still 159–227 (dead in 27–33 s)
    { id: 'anti', lv: 2, ic: '⚛️', n: 'ANTİMADDE FIRTINASI', d: 'Antimadde her yerde. Dokunmadan puan topla.', dur: 60, m: 'score', tg: [4000, 9000, 18000], max: 2e6, anti: 2.5 }
  ];
  const PTS = [[10, 15, 20], [20, 30, 40], [30, 45, 60]]; // filo puanı for bronze, silver, gold (a gold medal pays the gold amount, not the sum)
  const KIT = { lives: 3, sh: 2, nova: 1, rage: 1 }, TRIES = 3;
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const byId = id => L.find(m => m.id === id) || null;
  // the day's three: one of each level, picked by the day so that neighbouring days differ
  function day(d) { const h = hash('fm:' + d); return [0, 1, 2].map((lv, i) => { const p = L.filter(m => m.lv === lv); return p[(h >>> (i * 5)) % p.length]; }); }
  const seed = (d, id) => hash(d + ':' + id);
  const kit = m => ({ ...KIT, ...(m.kit || {}) });
  const tier = (m, v) => m.tg.filter(x => v >= x).length;
  const pts = (m, t) => t ? PTS[m.lv][t - 1] : 0;
  const chainNeed = n => Math.max(6, Math.min(30, 2 * n)); // the Fleet Chain: medals the fleet earns together today
  // 18 Oct: mission points. A run is measured against the gold target (gold = 1000, at most 1500); a fleet's points for one mission
  // are the average of the members who played it, divided by at least 3, so a fleet needs three players to count in full; the day's
  // fleet points are the three missions added up. The prizes are paid by the server and shown by the game.
  const mp = (m, v) => Math.max(0, Math.min(1500, Math.round(v / m.tg[2] * 1000)));
  const avg = (sum, n) => n ? Math.round(sum / Math.max(3, n)) : 0;
  const PAY = {
    day: [[200, 10], [150, 8], [100, 5], [60, 0], [60, 0], [60, 0], [60, 0], [60, 0], [60, 0], [60, 0]], // the day's fleet ranking, to members who played all three
    star: [100, 5],                                     // the fleet's star: the member who brought the most that day
    chestAt: [6000, 12000, 19000], chest: [[150, 0], [300, 5], [600, 15]], chestDays: 3,   // the week's chests, to members with 3 full days
    champ: [[1500, 40, 2], [1000, 25, 0], [600, 15, 0]], champDays: 6                      // the week's champions (stars, gems, shields), to members with 6 full days
  };
  return { L, byId, day, seed, kit, tier, pts, chainNeed, TRIES, CHAIN_STARS: 20, mp, avg, PAY };
})();
