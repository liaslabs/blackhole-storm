// Daily report from the leaderboard server's anonymous counts (1.5.1): opens, install age bands, the first-ten-minutes funnel,
// stars by screen, players at the same time, frequent errors and results near the ceilings. Only totals: no install ids.
// 1.5.2 adds: wins and losses, items and continues per ten levels, what is bought, from which screen, at which level, how long after install.
// usage: node tools/rapor.mjs [days=7] [server=https://blackhole-storm-lb.liaslabs-games.workers.dev]
//        node tools/rapor.mjs --demo file.json   (a saved {evs:[...]} list instead of the server, for trying the layout)
const DEMO = process.argv[2] === '--demo' ? JSON.parse((await import('fs')).readFileSync(process.argv[3], 'utf8')) : null;
const days = DEMO ? 7 : +process.argv[2] || 7, B = process.argv[3] || 'https://blackhole-storm-lb.liaslabs-games.workers.dev';
const get = async p => { if (DEMO) return { list: p.startsWith('/evs') ? DEMO.evs : [] }; try { const r = await fetch(B + p); return r.ok ? await r.json() : { list: [] }; } catch (e) { return { list: [] }; } };
const [pings, evs, live, errs, sus, fst] = await Promise.all([get(`/pings?days=${days}`), get(`/evs?days=${days}`), get('/live?days=3'), get(`/errs?days=${Math.min(days, 30)}`), get('/sus'), get('/fleets/stats')]);
const sum = (l, f) => l.filter(f).reduce((a, x) => a + x.n, 0);
const E = evs.list || [], P = pings.list || [], ev = k => sum(E, x => x.e === k), pct = (a, b) => b ? Math.round(a * 100 / b) + '%' : '–';
const line = (t, ...c) => console.log(t.padEnd(30) + c.map(x => String(x).padStart(10)).join(''));

console.log(`\n== Son ${days} gün ==`);
const dayList = [...new Set(P.map(x => x.day))].sort();
line('Gün', 'Açılış', 'Uygulama', 'Yeni(0)');
for (const d of dayList) line(d, sum(P, x => x.day === d), sum(P, x => x.day === d && x.p === 'app'), sum(E, x => x.day === d && x.e === 'age_0'));

console.log('\n== Kurulum yaşına göre açılış (geri dönüş) ==');
const AG = [['0', 'ilk gün'], ['1', '1. gün'], ['2', '2–3. gün'], ['4', '4–7. gün'], ['8', '8–14. gün'], ['15', '15–30. gün'], ['31', '31+ gün'], ['x', '1.5.1 öncesi']];
const a0 = ev('age_0');
for (const [k, t] of AG) line(t, ev('age_' + k), k === '0' || k === 'x' ? '' : pct(ev('age_' + k), a0));
console.log('  (oran: o banttaki açılışların, aynı dönemdeki ilk gün açılışlarına oranı; kaba bir geri dönüş göstergesi)');

console.log('\n== İlk 10 dakika hunisi (kurulum başına bir kez) ==');
const F = [['tut1', 'Eğitim: ilk dokunuş'], ['tut2', 'Eğitim: yarı yol'], ['tut3', 'Eğitim: bitti'], ['lv1', '1. seviye geçildi'], ['lv3', '3. seviye'], ['lv5', '5. seviye'], ['lv10', '10. seviye'], ['fl_join', 'Filoya katıldı']];
const f0 = ev('tut1');
for (const [k, t] of F) line(t, ev(k), pct(ev(k), f0));
const d1 = ['a', 'b', 'c', 'd'].map(k => ev('d1_' + k)), dn = d1.reduce((a, b) => a + b, 0);
line('İlk can kaybı (sn)', '0–10', '10–30', '30–60', '60+');
line('', ...d1.map(n => `${n} ${pct(n, dn)}`));

console.log('\n== Filolar (sunucudaki toplamlar) ==');
if (fst && fst.ok) { line('Filo (açık)', fst.fleets, `(${fst.open})`); line('Bu hafta / bugün kurulan', fst.newWeek, fst.newToday); line('Üye (bu hafta katılan)', fst.members, `(${fst.joinedWeek})`); } else console.log('  (alınamadı)');

console.log('\n== Kullanım ==');
for (const [k, t] of [['fm_play', 'Filo görevi oynandı'], ['shop', 'Mağaza açıldı'], ['ad', 'Ödüllü reklam izlendi'], ['ntf_y', 'Bildirim: evet'], ['ntf_n', 'Bildirim: hayır'], ['cl_found', 'Bulut: yeni kurulumda yedek bulundu'], ['cl_rest', 'Bulut: geri yüklendi'], ['cl_new', 'Bulut: yeni başladı']]) line(t, ev(k));

console.log('\n== Play Integrity (skor ve ödül istekleri) ==');
line('Geçti', ev('it_ok')); line('İstisna listesi', ev('it_trust')); line('Token yok (web ya da eski sürüm)', ev('it_none'));
for (const k of [...new Set(E.filter(x => x.e.startsWith('it_bad')).map(x => x.e))].sort()) line('Geçmedi: ' + (k.slice(7) || '(neden yok)'), ev(k));
console.log('  (http401/403: Google erişimi · hash/pkg/time: istek uyuşmadı · app_*: Play\'den gelmemiş · dev_*: cihaz güvenilir değil · err: sunucu hatası)');

console.log('\n== Yıldız: hangi ekranda kazanıldı / harcandı ==');
const src = [...new Set(E.filter(x => /^s[io]_/.test(x.e)).map(x => x.e.slice(3)))].sort();
line('Ekran', 'Kazanılan', 'Harcanan');
let ti = 0, to = 0;
for (const s of src) { const i = ev('si_' + s), o = ev('so_' + s); ti += i; to += o; line(s, i, o); }
line('TOPLAM', ti, to); console.log(`  harcanan / kazanılan: ${pct(to, ti)} (çok düşükse yıldız birikiyor: enflasyon)`);

// ── 1.5.2: levels, items, purchases ──
const grp = g => `${g * 10 || 1}–${g * 10 + 9}`, groups = pre => [...new Set(E.filter(x => x.e.startsWith(pre)).map(x => +x.e.split('_').pop()))].sort((a, b) => a - b);
const wl = [...new Set([...groups('lw_'), ...groups('lf_')])].sort((a, b) => a - b);
if (wl.length) {
  console.log('\n== Seviyeler: kazanma / kaybetme (10\'luk gruplar, 1.5.2+) ==');
  line('Seviye grubu', 'Kazanma', 'Kaybetme', 'Kayıp %');
  for (const g of wl) { const w = ev('lw_' + g), f = ev('lf_' + g); line(grp(g), w, f, pct(f, w + f)); }
  console.log('  (kayıp oranı yüksek grup: zorluk orada; çok düşükse seviyeler kolay)');
}
const IT = [['Kalkan', ['sh', 'sb']], ['Süpernova', ['nv']], ['Hawking', ['hk']], ['Kristal', ['tm', 'te']], ['Parça', ['tc']], ['Süre', ['td', 'ts', 'ta']], ['Devam', ['lf', 'cd', 'cs', 'ca']], ['Kolay', ['ez', 'ea']]];
const ug = groups('u_');
if (ug.length) {
  console.log('\n== Eşya ve devam kullanımı (10\'luk gruplar, 1.5.2+) ==');
  const cols = IT.filter(([, ks]) => ks.some(k => ug.some(g => ev(`u_${k}_${g}`)))), cell = (ks, g) => { const v = ks.map(k => ev(`u_${k}_${g}`)); return v.every(n => !n) ? '·' : v.join('/'); };
  console.log('Seviye'.padEnd(10) + cols.map(([t]) => t.padStart(14)).join(''));
  for (const g of ug) console.log(grp(g).padEnd(10) + cols.map(([, ks]) => cell(ks, g).padStart(14)).join(''));
  console.log('TOPLAM'.padEnd(10) + cols.map(([, ks]) => ks.map(k => ug.reduce((a, g) => a + ev(`u_${k}_${g}`), 0)).join('/').padStart(14)).join(''));
  console.log('  Kalkan: stoktan/💎 ile anında · Kristal: oyunda/süre bitince · Süre: 💎/⭐/reklam · Devam: yedek can/💎/⭐/reklam · Kolay: 💎/reklam');
}
const prod = [...new Set(E.filter(x => /^p_/.test(x.e)).map(x => x.e.slice(2)))];
if (prod.length || groups('g_').length || E.some(x => x.e.startsWith('g_'))) {
  console.log('\n== Satın almalar (gerçek ödeme, 1.5.2+) ==');
  const pn = prod.reduce((a, k) => a + ev('p_' + k), 0);
  const PN = { starter: 'Başlangıç Paketi', quasar_hoard: 'Kuasar Hazinesi', vip_monthly: 'VIP Kulüp (aylık)', captain: 'Kaptan Seti', cosmic_id: 'Kozmik Kimlik', no_ads: 'Reklamsız', time_pack: '5 Zaman kristali', gems_s: '80 💎', gems_m: '250 💎', gems_l: '700 💎' };
  line('Ürün', 'Adet', 'Pay');
  for (const k of prod.sort((a, b) => ev('p_' + b) - ev('p_' + a))) line(PN[k] || k, ev('p_' + k), pct(ev('p_' + k), pn));
  const SRC = { mn: 'Menüdeki MAĞAZA', sr: 'Başlangıç şeridi', pr: 'Profil', av: 'Güçlü avatarlar', cd: 'Devam: 💎 yetmedi', td: 'Süre: 💎 yetmedi', ez: 'Kolaylaştır: 💎 yetmedi', hr: 'Yakıt: 💎 yetmedi', xx: 'Mağaza dışı (görünüm ekranı)' };
  console.log('\n  Satın alma nereden başladı:');
  for (const k of [...new Set(E.filter(x => /^ps_/.test(x.e)).map(x => x.e.slice(3)))].sort((a, b) => ev('ps_' + b) - ev('ps_' + a))) line('  ' + (SRC[k] || k), ev('ps_' + k), pct(ev('ps_' + k), pn));
  console.log('\n  Hangi seviyedeyken:');
  for (const g of groups('pl_')) line('  ' + grp(g), ev('pl_' + g), pct(ev('pl_' + g), pn));
  console.log('\n  Kurulumdan ne kadar sonra:');
  for (const [k, t] of AG) if (ev('pa_' + k)) line('  ' + t, ev('pa_' + k), pct(ev('pa_' + k), pn));
  const GI = [['shield', 'Kalkan'], ['lives', 'Yedek can'], ['time', 'Zaman kristali'], ['stars', '500 yıldız']];
  if (GI.some(([k]) => ev('g_' + k))) { console.log('\n  Elmasla alınanlar (mağaza):'); for (const [k, t] of GI) line('  ' + t, ev('g_' + k)); }
}

console.log('\n== Aynı anda oynayan (5 dk dilimleri, son 3 gün) ==');
const L = live.list || [], byDay = {};
for (const x of L) { const t = new Date(x.slot * 3e5), d = t.toISOString().slice(0, 10); if (!byDay[d] || x.n > byDay[d].n) byDay[d] = { n: x.n, at: t.toISOString().slice(11, 16) }; }
for (const d of Object.keys(byDay).sort()) line(d, `en çok ${byDay[d].n}`, `${byDay[d].at} UTC`);

console.log('\n== En sık hatalar ==');
for (const x of (errs.list || []).slice(0, 8)) console.log(`  ${String(x.n).padStart(4)}×  ${x.v}  ${x.p}  ${String(x.m).slice(0, 90)}`);

console.log(`\n== Tavana yakın sonuçlar (${sus.day || '–'}, elle bakmak için) ==`);
for (const x of sus.scores || []) console.log(`  skor  ${x.k}  ${x.name}  ${x.score} puan / ${x.secs} sn  (${Math.round(x.score / x.secs)}/sn, sınır ${sus.rate})`);
for (const x of sus.fm || []) console.log(`  görev ${x.k}  ${x.id}  ${x.best}  (${x.tries} deneme)`);
if (!(sus.scores || []).length && !(sus.fm || []).length) console.log('  yok');
