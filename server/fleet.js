// Fleets (1.5.1): teams of up to 20 players who add up points through the week.
// Points come from the game (levels cleared, the Daily Storm), at most 300 per member per day. A fleet earns three weekly
// chests together (targets grow with the number of members who played), and races other fleets from Friday to Sunday in
// groups of up to 20 fleets of similar strength. The week runs Monday 00:00 to Sunday 23:59 UTC; it is settled once, the
// first time it is asked about after it ends (or by the daily cron), and everyone who added at least one point gets
// prize rows to claim. Install ids never leave the server: members are shown by an opaque key.
// Inactivity: a captain away for 14 days hands over to the most active member; a member away for 30 days leaves the
// fleet; a fleet is removed only when nobody is left in it (it was paid for with diamonds).
//
//   GET  /fleet?pid=                         -> {fleet,members,wall,prizes} or {none:true,open:[...],prizes}
//   POST /fleet/create {pid,name,emb,open,pname,av}   -> {ok,fleet} | {ok:false,err}
//   POST /fleet/join   {pid,code|fid,pname,av}        -> {ok} | {ok:false,err}
//   POST /fleet/leave  {pid}                          -> {ok}
//   POST /fleet/kick   {pid,k}                        -> {ok}          captain only
//   POST /fleet/rename {pid,name}                     -> {ok,free}     captain only; the first rename is free, later ones once in 30 days
//   POST /fleet/set    {pid,open,emb}                 -> {ok}          captain only
//   POST /fleet/msg    {pid,m}                        -> {ok}          m: one of the ready-made messages
//   POST /fleet/pts    {pid,day,n,src,pname,av}       -> {ok,added,today}
//   POST /fleet/report {by,fid}                       -> {ok}          two reporters hide the fleet's name
//   GET  /fleets/top?pid=                        -> {wk,race,ends,list:[{r,name,emb,n,pts,me}],me}
//   POST /fleet/claim  {pid,wk}                       -> {ok,stars,gems}
//   POST /fleet/fm/start {pid,id}                    -> {ok,tries}    one of today's fleet missions begins (a try is used)
//   POST /fleet/fm     {pid,id,v,t}                   -> {ok,best,tier,add}  its result: the best one counts, a new medal pays fleet points
//   POST /fleet/fmchain {pid}                         -> {ok,stars}     the Fleet Chain's stars, once a day, for a member who won a medal
//   GET  /fleets/fm?pid=                         -> {day:{list,n,me},week:{list,n,me}}  today's fleet ranking and the week's champions (mission points)
//   POST /fleet/dclaim {pid,day}                     -> {ok,stars,gems}  a day's prize: the fleet's place in the day's ranking, the fleet's star
// 18 Oct: the fleet missions are scored in mission points (src/fmis.js mp/avg/PAY): they fill the week's chests and decide the day's
// ranking, the fleet's star and the week's champions. Points from play (fleet_pts) now only decide the weekend race.

const MAX_MEMBERS = 20, DAY_CAP = 300, CALL_CAP = 80;
const CHEST = [600, 1500, 3000];                 // per member who played, at least 5 counted
const CHEST_PAY = [[150, 0], [300, 5], [600, 15]];
const RACE_PAY = [[1500, 30], [1000, 20], [600, 10], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0]];
const TOP3_PAY = 200, GROUP = 20, RACE_MIN = 3; // a fleet needs 3 members scoring in the race to be ranked
const MSGS = ['go', 'gj', 'done', 'rec', 'ufo', 'hi', 'chest', 'race', 'eat']; // 'ufo' stays for older apps
// news the server writes on the wall by itself: 'chest:<n>' (a weekly chest opened), 'rank:<n>' (the fleet climbed to place n in the
// weekend race, top 10 only), 'mis' (a member finished the daily fleet mission; once a day each) and 'fmg:<id>' (a member won a
// fleet mission's gold medal)
const CAP_AWAY = 14 * 864e5, MEMBER_AWAY = 30 * 864e5, LEAVE_WAIT = 24 * 36e5, MAKE_WAIT = 7 * 864e5, RENAME_WAIT = 30 * 864e5;
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const okPid = p => typeof p === 'string' && /^[a-z0-9]{12,40}$/.test(p);
const okDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
export function weekOf(t = Date.now()) { const d = new Date(t); const dow = (d.getUTCDay() + 6) % 7; return day(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)); } // its Monday
const weekEnd = wk => Date.parse(wk + 'T00:00:00Z') + 7 * 864e5;
const raceFrom = wk => day(Date.parse(wk + 'T00:00:00Z') + 4 * 864e5);   // Friday
const rnd = n => { const a = crypto.getRandomValues(new Uint8Array(n)); return a; };
const newId = () => [...rnd(8)].map(b => b.toString(16).padStart(2, '0')).join('');
const newCode = () => [...rnd(6)].map(b => CODE_ABC[b % CODE_ABC.length]).join('');
async function key(a, b) { const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(a + ':' + b))); return [...h.slice(0, 6)].map(x => x.toString(16).padStart(2, '0')).join(''); }

let ready = false;
async function ensure(DB) {
  if (ready) return;
  for (const q of [
    'CREATE TABLE IF NOT EXISTS fleets (fid TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, nkey TEXT NOT NULL UNIQUE, emb TEXT NOT NULL, open INTEGER NOT NULL DEFAULT 1, cap TEXT NOT NULL, created INTEGER NOT NULL, renames INTEGER NOT NULL DEFAULT 0, renamed INTEGER NOT NULL DEFAULT 0, hidden INTEGER NOT NULL DEFAULT 0, last INTEGER NOT NULL DEFAULT 0)',
    'CREATE TABLE IF NOT EXISTS fleet_members (pid TEXT PRIMARY KEY, fid TEXT NOT NULL, name TEXT NOT NULL, av TEXT, joined INTEGER NOT NULL, seen INTEGER NOT NULL)',
    'CREATE INDEX IF NOT EXISTS fleet_members_fid ON fleet_members (fid)',
    'CREATE TABLE IF NOT EXISTS fleet_pts (day TEXT NOT NULL, pid TEXT NOT NULL, fid TEXT NOT NULL, wk TEXT NOT NULL, pts INTEGER NOT NULL, PRIMARY KEY (day, pid))',
    'CREATE INDEX IF NOT EXISTS fleet_pts_wk ON fleet_pts (wk, fid)',
    'CREATE TABLE IF NOT EXISTS fleet_msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, fid TEXT NOT NULL, name TEXT NOT NULL, m TEXT NOT NULL, ts INTEGER NOT NULL)',
    'CREATE INDEX IF NOT EXISTS fleet_msgs_fid ON fleet_msgs (fid, id)',
    'CREATE TABLE IF NOT EXISTS fleet_groups (wk TEXT NOT NULL, fid TEXT NOT NULL, grp INTEGER NOT NULL, PRIMARY KEY (wk, fid))',
    'CREATE TABLE IF NOT EXISTS fleet_weeks (wk TEXT PRIMARY KEY, ts INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS fleet_results (wk TEXT NOT NULL, fid TEXT NOT NULL, name TEXT NOT NULL, emb TEXT NOT NULL, total INTEGER NOT NULL, race INTEGER NOT NULL, rank INTEGER NOT NULL, grpn INTEGER NOT NULL, tier INTEGER NOT NULL, PRIMARY KEY (wk, fid))',
    'CREATE TABLE IF NOT EXISTS fleet_prizes (wk TEXT NOT NULL, pid TEXT NOT NULL, fid TEXT NOT NULL, stars INTEGER NOT NULL, gems INTEGER NOT NULL, tier INTEGER NOT NULL, rank INTEGER NOT NULL, mine INTEGER NOT NULL, top3 INTEGER NOT NULL, claimed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (wk, pid))',
    'CREATE TABLE IF NOT EXISTS fleet_marks (pid TEXT PRIMARY KEY, gone INTEGER NOT NULL DEFAULT 0, made INTEGER NOT NULL DEFAULT 0)',
    'CREATE TABLE IF NOT EXISTS fleet_reports (fid TEXT NOT NULL, by TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (fid, by))',
    'CREATE TABLE IF NOT EXISTS fleet_fm (day TEXT NOT NULL, pid TEXT NOT NULL, fid TEXT NOT NULL, id TEXT NOT NULL, best INTEGER NOT NULL DEFAULT 0, tier INTEGER NOT NULL DEFAULT 0, tries INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, pid, id))',
    'CREATE INDEX IF NOT EXISTS fleet_fm_fid ON fleet_fm (day, fid)',
    'CREATE TABLE IF NOT EXISTS fleet_dset (day TEXT PRIMARY KEY, ts INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS fleet_dprizes (day TEXT NOT NULL, pid TEXT NOT NULL, fid TEXT NOT NULL, rank INTEGER NOT NULL DEFAULT 0, star INTEGER NOT NULL DEFAULT 0, stars INTEGER NOT NULL, gems INTEGER NOT NULL, claimed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, pid))'
  ]) await DB.prepare(q).run();
  // 1.5.1: fleet mission medals are fleet points of their own (mpts), outside the 300 a day that play brings
  try { await DB.prepare('ALTER TABLE fleet_pts ADD COLUMN mpts INTEGER NOT NULL DEFAULT 0').run(); } catch (e) { /* already there */ }
  // when the latest two tries began (ms), so a result cannot claim more play time than has passed since (a late, queued result of
  // the try before still fits the earlier one); rows from before this have none and are not checked
  for (const c of ['st', 'st0']) try { await DB.prepare(`ALTER TABLE fleet_fm ADD COLUMN ${c} INTEGER`).run(); } catch (e) { /* already there */ }
  // 18 Oct: mission points (the best run's, from a verified device), the week's mission results and the prizes that come of them
  for (const [t, c] of [['fleet_fm', 'mp'], ['fleet_results', 'mscore'], ['fleet_results', 'champ'], ['fleet_prizes', 'champ'], ['fleet_prizes', 'days'], ['fleet_prizes', 'sh']])
    try { await DB.prepare(`ALTER TABLE ${t} ADD COLUMN ${c} INTEGER NOT NULL DEFAULT 0`).run(); } catch (e) { /* already there */ }
  ready = true;
}

const NAMES = () => globalThis.BHS_NAMES;
const nkey = n => NAMES().tidy(n).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
const AVS = () => globalThis.BHS_AV_KEYS || new Set();
const FM = () => globalThis.BHS_FMIS;
const okEmb = e => typeof e === 'string' && AVS().has(e);
const pname = (n, clean) => clean(n);
const av = a => typeof a === 'string' && AVS().has(a) ? a : null;

async function memberOf(DB, pid) { return okPid(pid) ? await DB.prepare('SELECT * FROM fleet_members WHERE pid = ?').bind(pid).first() : null; }
async function fleetRow(DB, fid) { return await DB.prepare('SELECT * FROM fleets WHERE fid = ?').bind(fid).first(); }
async function count(DB, fid) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_members WHERE fid = ?').bind(fid).first(); return r ? r.n : 0; }
async function weekTotal(DB, wk, fid, from) {
  const r = await DB.prepare(`SELECT COALESCE(SUM(pts + mpts),0) AS s, COUNT(DISTINCT pid) AS p FROM fleet_pts WHERE wk = ? AND fid = ?${from ? ' AND day >= ?' : ''}`).bind(...(from ? [wk, fid, from] : [wk, fid])).first();
  return { pts: r ? r.s : 0, players: r ? r.p : 0 };
}
const targets = players => CHEST.map(t => t * Math.max(5, players));
const shownName = f => f.hidden ? 'FİLO-' + f.fid.slice(0, 4).toUpperCase() : f.name;
async function event(DB, fid, name, m) { await DB.prepare('INSERT INTO fleet_msgs (fid, name, m, ts) VALUES (?, ?, ?, ?)').bind(fid, name, m, Date.now()).run(); }

// automatic wall news after play points arrive: a climb into the race's top 10
async function news(DB, fid, add) {
  const wk = weekOf(), rf = raceFrom(wk), now = Date.now(); // 18 Oct: the chests come from the missions now (see /fleet/fm)
  if (now < Date.parse(rf + 'T00:00:00Z') || now >= weekEnd(wk)) return;
  const grp = await groupOf(DB, wk, fid);
  const rows = (await DB.prepare('SELECT g.fid, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = g.fid AND p.day >= ?),0) AS s FROM fleet_groups g WHERE g.wk = ? AND g.grp = ?').bind(wk, rf, wk, grp).all()).results || [];
  const me = rows.find(r => r.fid === fid); if (!me) return;
  const place = v => 1 + rows.filter(r => r.fid !== fid && r.s > v).length, before = place(me.s - add), after = place(me.s);
  if (after < before && after <= 10) await event(DB, fid, '', 'rank:' + after);
}

// race groups: on the first look at a week's race, fleets are sorted by last week's total and cut into groups of 20;
// a fleet that turns up later joins the last group, or opens a new one when that is full
async function groupOf(DB, wk, fid) {
  let g = await DB.prepare('SELECT grp FROM fleet_groups WHERE wk = ? AND fid = ?').bind(wk, fid).first();
  if (g) return g.grp;
  const any = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_groups WHERE wk = ?').bind(wk).first();
  if (!any || !any.n) {
    const prev = day(Date.parse(wk + 'T00:00:00Z') - 7 * 864e5);
    const all = await DB.prepare('SELECT f.fid, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s FROM fleets f ORDER BY s DESC, f.created ASC').bind(prev).all();
    const rows = all.results || [];
    for (let i = 0; i < rows.length; i++) await DB.prepare('INSERT OR IGNORE INTO fleet_groups (wk, fid, grp) VALUES (?, ?, ?)').bind(wk, rows[i].fid, Math.floor(i / GROUP)).run();
    g = await DB.prepare('SELECT grp FROM fleet_groups WHERE wk = ? AND fid = ?').bind(wk, fid).first();
    if (g) return g.grp;
  }
  const last = await DB.prepare('SELECT grp, COUNT(*) AS n FROM fleet_groups WHERE wk = ? GROUP BY grp ORDER BY grp DESC LIMIT 1').bind(wk).first();
  const grp = !last ? 0 : last.n < GROUP ? last.grp : last.grp + 1;
  await DB.prepare('INSERT OR IGNORE INTO fleet_groups (wk, fid, grp) VALUES (?, ?, ?)').bind(wk, fid, grp).run();
  return grp;
}

// mission points from the fleet_fm rows of some days (one fleet, or all): per fleet and day the day's points and each mission's sum and
// players; per member and day their points and how many of the three they played
async function fmRows(DB, from, to, fid) {
  const r = await DB.prepare(`SELECT day, fid, pid, id, mp FROM fleet_fm WHERE day >= ? AND day <= ? AND id != 'chain' AND tries > 0${fid ? ' AND fid = ?' : ''}`).bind(...(fid ? [from, to, fid] : [from, to])).all();
  const F = FM(), fl = new Map(), mem = new Map();
  for (const x of r.results || []) {
    let f = fl.get(x.fid); if (!f) fl.set(x.fid, f = new Map());
    let d = f.get(x.day); if (!d) f.set(x.day, d = { score: 0, per: {} });
    const q = d.per[x.id] || (d.per[x.id] = { s: 0, n: 0 }); q.s += x.mp || 0; q.n++;
    const k = x.fid + '|' + x.pid; let m = mem.get(k); if (!m) mem.set(k, m = new Map());
    const e = m.get(x.day) || { mp: 0, g: 0 }; e.mp += x.mp || 0; e.g++; m.set(x.day, e);
  }
  for (const f of fl.values()) for (const d of f.values()) { d.score = 0; for (const id in d.per) { const q = d.per[id]; q.avg = F.avg(q.s, q.n); d.score += q.avg; } }
  return { fl, mem };
}
const fmDayScore = (R, fid, d) => { const f = R.fl.get(fid), x = f && f.get(d); return x ? x.score : 0; };
const fmWeekScore = (R, fid) => { let t = 0; const f = R.fl.get(fid); if (f) for (const d of f.values()) t += d.score; return t; };
const weekDays = wk => Array.from({ length: 7 }, (_, i) => day(Date.parse(wk + 'T00:00:00Z') + i * 864e5));
// the day's star of each fleet: the member who brought the most mission points (an equal score goes to who got there first)
function fmStars(R, d) {
  const best = new Map();
  for (const [k, m] of R.mem) { const e = m.get(d); if (!e || !e.mp) continue; const [fid, pid] = k.split('|'), b = best.get(fid); if (!b || e.mp > b.mp) best.set(fid, { pid, mp: e.mp }); }
  return best;
}
// a finished day (2 hours after midnight UTC, when late results stop): the fleets' places and the fleets' stars, paid as prize rows
export async function settleDay(DB, d) {
  await ensure(DB);
  if (!okDay(d) || Date.now() < Date.parse(d + 'T00:00:00Z') + 864e5 + 2 * 36e5 + 6e4) return;
  if (await DB.prepare('SELECT day FROM fleet_dset WHERE day = ?').bind(d).first()) return;
  await DB.prepare('INSERT OR IGNORE INTO fleet_dset (day, ts) VALUES (?, ?)').bind(d, Date.now()).run();
  const P = FM().PAY, R = await fmRows(DB, d, d), rank = [...R.fl.keys()].map(fid => ({ fid, v: fmDayScore(R, fid, d) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const pay = async (pid, fid, r, st, stars, gems) => DB.prepare(`INSERT INTO fleet_dprizes (day, pid, fid, rank, star, stars, gems) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day, pid) DO UPDATE SET rank = MAX(rank, excluded.rank), star = MAX(star, excluded.star), stars = stars + excluded.stars, gems = gems + excluded.gems`).bind(d, pid, fid, r, st, stars, gems).run();
  for (let i = 0; i < Math.min(rank.length, P.day.length); i++) {
    const { fid } = rank[i], [st, gm] = P.day[i];
    for (const [k, m] of R.mem) { if (!k.startsWith(fid + '|')) continue; const e = m.get(d); if (e && e.g >= 3) await pay(k.split('|')[1], fid, i + 1, 0, st, gm); }
    await event(DB, fid, '', 'drank:' + (i + 1));
  }
  for (const [fid, b] of fmStars(R, d)) {
    await pay(b.pid, fid, 0, 1, P.star[0], P.star[1]);
    const mm = await memberOf(DB, b.pid); await event(DB, fid, mm ? mm.name : '', 'fstar');
  }
}
async function dprizes(DB, pid) {
  for (const k of [2, 1]) await settleDay(DB, day(Date.now() - k * 864e5));
  const r = await DB.prepare('SELECT p.day, p.rank, p.star, p.stars, p.gems, f.name, f.emb, f.hidden, f.fid FROM fleet_dprizes p LEFT JOIN fleets f ON f.fid = p.fid WHERE p.pid = ? AND p.claimed = 0 ORDER BY p.day').bind(pid).all();
  return (r.results || []).map(x => ({ day: x.day, rank: x.rank, star: x.star, stars: x.stars, gems: x.gems, name: x.fid ? shownName(x) : '', emb: x.emb || '' }));
}

// one finished week: results per fleet and prize rows for everyone who played
export async function settleWeek(DB, wk) {
  await ensure(DB);
  if (weekEnd(wk) + 2 * 36e5 + 6e4 > Date.now()) return; // late mission results of Sunday still count
  const done = await DB.prepare('SELECT wk FROM fleet_weeks WHERE wk = ?').bind(wk).first();
  if (done) return;
  await DB.prepare('INSERT OR IGNORE INTO fleet_weeks (wk, ts) VALUES (?, ?)').bind(wk, Date.now()).run();
  const rf = raceFrom(wk), P = FM().PAY, days = weekDays(wk), R = await fmRows(DB, days[0], days[6]);
  const fl = await DB.prepare('SELECT DISTINCT fid FROM fleet_pts WHERE wk = ?').bind(wk).all();
  const fids = new Set([...(fl.results || []).map(x => x.fid), ...R.fl.keys()]), res = [];
  for (const fid of fids) {
    const f = await fleetRow(DB, fid); if (!f) continue;
    const t = await weekTotal(DB, wk, fid), r = await weekTotal(DB, wk, fid, rf), grp = await groupOf(DB, wk, fid), ms = fmWeekScore(R, fid);
    res.push({ f, fid, total: t.pts, race: r.players >= RACE_MIN ? r.pts : 0, grp, ms, tier: P.chestAt.filter(x => ms >= x).length, champ: 0 });
  }
  res.filter(x => x.ms > 0).sort((a, b) => b.ms - a.ms).slice(0, P.champ.length).forEach((x, i) => { x.champ = i + 1; });
  const byGrp = {};
  for (const x of res) (byGrp[x.grp] = byGrp[x.grp] || []).push(x);
  for (const g of Object.values(byGrp)) {
    g.sort((a, b) => b.race - a.race || b.total - a.total);
    g.forEach((x, i) => { x.rank = x.race > 0 ? i + 1 : 0; x.grpn = g.length; });
  }
  for (const x of res) {
    await DB.prepare('INSERT OR REPLACE INTO fleet_results (wk, fid, name, emb, total, race, rank, grpn, tier, mscore, champ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(wk, x.fid, shownName(x.f), x.f.emb, x.total, x.race, x.rank, x.grpn, x.tier, x.ms, x.champ).run();
    const ms = await DB.prepare('SELECT pid, SUM(pts + mpts) AS s FROM fleet_pts WHERE wk = ? AND fid = ? GROUP BY pid ORDER BY s DESC').bind(wk, x.fid).all();
    const play = (ms.results || []).filter(m => m.s > 0), who = new Map(play.map((m, i) => [m.pid, { s: m.s, top3: i < 3 ? 1 : 0, days: 0 }]));
    for (const [k, m] of R.mem) { if (!k.startsWith(x.fid + '|')) continue; const pid = k.split('|')[1], n = [...m.values()].filter(e => e.g >= 3).length; const w = who.get(pid) || { s: 0, top3: 0, days: 0 }; w.days = n; who.set(pid, w); }
    for (const [pid, w] of who) {
      let stars = 0, gems = 0, sh = 0;
      const tier = w.days >= P.chestDays ? x.tier : 0, champ = w.days >= P.champDays ? x.champ : 0;
      for (let k = 0; k < tier; k++) { stars += P.chest[k][0]; gems += P.chest[k][1]; }
      if (champ) { const c = P.champ[champ - 1]; stars += c[0]; gems += c[1]; sh += c[2]; }
      const rp = w.s > 0 && x.rank ? RACE_PAY[x.rank - 1] : null; if (rp) { stars += rp[0]; gems += rp[1]; }
      if (w.top3) stars += TOP3_PAY;
      if (stars || gems || sh) await DB.prepare('INSERT OR IGNORE INTO fleet_prizes (wk, pid, fid, stars, gems, tier, rank, mine, top3, champ, days, sh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(wk, pid, x.fid, stars, gems, tier, w.s > 0 ? x.rank : 0, w.s, w.top3, champ, w.days, sh).run();
    }
  }
}

// daily: settle the week that ended, hand over from away captains, drop long-away members and empty fleets, trim old rows
export async function fleetHousekeeping(DB) {
  await ensure(DB);
  await settleWeek(DB, weekOf(Date.now() - 7 * 864e5));
  for (const k of [3, 2, 1]) await settleDay(DB, day(Date.now() - k * 864e5));
  const now = Date.now();
  const caps = await DB.prepare('SELECT f.fid, f.cap FROM fleets f JOIN fleet_members m ON m.pid = f.cap WHERE m.seen < ?').bind(now - CAP_AWAY).all();
  for (const c of caps.results || []) {
    const nx = await DB.prepare('SELECT pid FROM fleet_members WHERE fid = ? AND pid != ? AND seen >= ? ORDER BY seen DESC LIMIT 1').bind(c.fid, c.cap, now - CAP_AWAY).first();
    if (nx) { await DB.prepare('UPDATE fleets SET cap = ? WHERE fid = ?').bind(nx.pid, c.fid).run(); const m = await memberOf(DB, nx.pid); if (m) await event(DB, c.fid, m.name, 'newcap'); }
  }
  await DB.prepare('DELETE FROM fleet_members WHERE seen < ?').bind(now - MEMBER_AWAY).run();
  const lone = await DB.prepare('SELECT f.fid, f.cap FROM fleets f WHERE NOT EXISTS (SELECT 1 FROM fleet_members m WHERE m.fid = f.fid AND m.pid = f.cap)').all();
  for (const c of lone.results || []) { // the captain left with the members still there: the most active one takes over
    const nx = await DB.prepare('SELECT pid FROM fleet_members WHERE fid = ? ORDER BY seen DESC LIMIT 1').bind(c.fid).first();
    if (nx) await DB.prepare('UPDATE fleets SET cap = ? WHERE fid = ?').bind(nx.pid, c.fid).run();
  }
  await DB.prepare('DELETE FROM fleets WHERE NOT EXISTS (SELECT 1 FROM fleet_members m WHERE m.fid = fleets.fid)').run();
  const old = day(now - 42 * 864e5);
  await DB.prepare('DELETE FROM fleet_pts WHERE day < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_fm WHERE day < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_groups WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_results WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_prizes WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_dprizes WHERE day < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_dset WHERE day < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_msgs WHERE ts < ?').bind(now - 14 * 864e5).run();
  await DB.prepare('DELETE FROM fleet_reports WHERE ts < ?').bind(now - 30 * 864e5).run();
  await DB.prepare('DELETE FROM fleet_marks WHERE gone < ? AND made < ?').bind(now - MAKE_WAIT, now - MAKE_WAIT).run(); // the join and found waits are over: nothing left to keep
}

async function view(DB, pid, m) {
  const wk = weekOf(), f = await fleetRow(DB, m.fid);
  if (!f) return null;
  const t = await weekTotal(DB, wk, f.fid), race = Date.now() >= Date.parse(raceFrom(wk) + 'T00:00:00Z');
  const r = await weekTotal(DB, wk, f.fid, raceFrom(wk));
  const ms = await DB.prepare(`SELECT m.pid, m.name, m.av, m.seen, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.pid = m.pid AND p.fid = m.fid),0) AS s,
    EXISTS (SELECT 1 FROM fleet_pts p WHERE p.day = ? AND p.pid = m.pid) AS today FROM fleet_members m WHERE m.fid = ? ORDER BY s DESC, m.joined ASC`).bind(wk, day(), f.fid).all();
  const members = [];
  for (const x of ms.results || []) members.push({ k: await key(f.fid, x.pid), name: x.name, av: x.av, pts: x.s, today: !!x.today, cap: x.pid === f.cap, me: x.pid === pid, away: x.seen < Date.now() - 21 * 864e5 });
  const wall = await DB.prepare('SELECT name, m, ts FROM fleet_msgs WHERE fid = ? ORDER BY id DESC LIMIT 12').bind(f.fid).all();
  let rank = 0, of = 0;
  if (race) {
    const grp = await groupOf(DB, wk, f.fid);
    const g = await DB.prepare('SELECT g.fid, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = g.fid AND p.day >= ?),0) AS s FROM fleet_groups g WHERE g.wk = ? AND g.grp = ? ORDER BY s DESC').bind(wk, raceFrom(wk), wk, grp).all();
    const rows = g.results || []; of = rows.length; rank = rows.findIndex(x => x.fid === f.fid) + 1;
  } else {
    const a = await DB.prepare('SELECT COUNT(*) AS n FROM (SELECT fid, SUM(pts + mpts) AS s FROM fleet_pts WHERE wk = ? GROUP BY fid HAVING s > ?)').bind(wk, t.pts).first();
    const all = await DB.prepare('SELECT COUNT(*) AS n FROM fleets').first();
    rank = (a ? a.n : 0) + 1; of = all ? all.n : 1;
  }
  const mw = await fmWeek(DB, pid, f.fid, wk);
  let mi = 0; for (const x of ms.results || []) { const e = mw.today.get(x.pid); members[mi].mp = e ? e.mp : 0; members[mi].g = e ? e.g : 0; members[mi].star = mw.star === x.pid; mi++; }
  return {
    fleet: { fid: f.fid, code: f.code, name: shownName(f), hidden: !!f.hidden, emb: f.emb, open: !!f.open, cap: f.cap === pid, n: members.length, max: MAX_MEMBERS,
      pts: t.pts, race, racePts: r.pts, rank, of, targets: targets(t.players), ends: weekEnd(wk), raceFrom: Date.parse(raceFrom(wk) + 'T00:00:00Z'), freeRename: !f.renames || !!f.hidden,
      renameAt: f.renames ? f.renamed + RENAME_WAIT : 0, mis: mw.out },
    members, wall: (wall.results || []).reverse(), fm: await fmView(DB, pid, f.fid, members.length)
  };
}
// 18 Oct: the fleet's mission week as the Fleet page shows it: today's points and place among all fleets, the week's points, chests and
// place among the champions, this member's full days, today's star, and what the member has won from the fleet this week
async function fmWeek(DB, pid, fid, wk) {
  const P = FM().PAY, days = weekDays(wk), d = day(), R = await fmRows(DB, days[0], days[6]);
  const place = vs => { const me = vs.get(fid) || 0; return { v: me, r: me > 0 ? 1 + [...vs.values()].filter(v => v > me).length : 0, of: [...vs.values()].filter(v => v > 0).length }; };
  const dayV = new Map(), wkV = new Map();
  for (const k of R.fl.keys()) { dayV.set(k, fmDayScore(R, k, d)); wkV.set(k, fmWeekScore(R, k)); }
  const mine = R.mem.get(fid + '|' + pid), today = new Map();
  for (const [k, m] of R.mem) if (k.startsWith(fid + '|')) { const e = m.get(d); if (e) today.set(k.split('|')[1], e); }
  const st = fmStars(R, d).get(fid);
  const er = await DB.prepare('SELECT COALESCE(SUM(stars),0) AS s, COALESCE(SUM(gems),0) AS g FROM fleet_dprizes WHERE pid = ? AND day >= ? AND day <= ?').bind(pid, days[0], days[6]).first();
  const dd = place(dayV), ww = place(wkV), full = days.map(x => { const e = mine && mine.get(x); return x > d ? '' : e && e.g >= 3 ? 'y' : e ? 'p' : x === d ? 't' : 'n'; });
  const per = {}, td = R.fl.get(fid) && R.fl.get(fid).get(d); if (td) for (const id in td.per) per[id] = { avg: td.per[id].avg, n: td.per[id].n };
  return { today, star: st ? st.pid : '', out: { day: dd.v, drank: dd.r, dof: dd.of, week: ww.v, wrank: ww.r, wof: ww.of, chestAt: P.chestAt, days: full, per,
    star: st ? { me: st.pid === pid, mp: st.mp } : null, earned: { stars: er ? er.s : 0, gems: er ? er.g : 0 } } };
}
// today's three fleet missions, this member's tries and medals, and the Fleet Chain (medals the fleet won together today)
async function fmView(DB, pid, fid, n) {
  const F = FM(), d = day(); if (!F) return null;
  const r = (await DB.prepare('SELECT id, best, tier, tries, mp FROM fleet_fm WHERE day = ? AND pid = ?').bind(d, pid).all()).results || [];
  const me = {}; for (const x of r) me[x.id] = { best: x.best, tier: x.tier, tries: x.tries, mp: x.mp || 0 };
  const c = await DB.prepare("SELECT COALESCE(SUM(tier),0) AS n FROM fleet_fm WHERE day = ? AND fid = ? AND id != 'chain'").bind(d, fid).first();
  return { d, ids: F.day(d).map(m => m.id), me, chain: { n: c ? c.n : 0, need: F.chainNeed(n), got: !!me.chain } };
}
async function prizes(DB, pid) {
  await settleWeek(DB, weekOf(Date.now() - 7 * 864e5));
  const r = await DB.prepare('SELECT p.wk, p.stars, p.gems, p.tier, p.rank, p.mine, p.top3, p.champ, p.days, p.sh, r.name, r.emb, r.grpn, r.total, r.mscore FROM fleet_prizes p LEFT JOIN fleet_results r ON r.wk = p.wk AND r.fid = p.fid WHERE p.pid = ? AND p.claimed = 0 ORDER BY p.wk').bind(pid).all();
  return r.results || [];
}
async function openList(DB) {
  const wk = weekOf();
  const r = await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members m WHERE m.fid = f.fid) AS n,
    COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s FROM fleets f
    WHERE f.open = 1 AND f.last >= ? ORDER BY s DESC, f.created DESC LIMIT 30`).bind(wk, Date.now() - 30 * 864e5).all();
  return (r.results || []).filter(x => x.n < MAX_MEMBERS).slice(0, 8).map(x => ({ fid: x.fid, name: x.hidden ? 'FİLO-' + x.fid.slice(0, 4).toUpperCase() : x.name, emb: x.emb, n: x.n, pts: x.s }));
}

// the route table; returns null for paths that are not about fleets
export async function fleetRoute(url, req, DB, json, cleanName, deviceOk = async () => true) {
  const p = url.pathname;
  if (!p.startsWith('/fleet')) return null;
  await ensure(DB);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const now = Date.now();
  if (p === '/fleet' && req.method === 'GET') {
    const pid = url.searchParams.get('pid'); if (!okPid(pid)) return json(req, { ok: false }, 400);
    const m = await memberOf(DB, pid), pz = await prizes(DB, pid), dz = await dprizes(DB, pid);
    if (m) { await DB.prepare('UPDATE fleet_members SET seen = ? WHERE pid = ?').bind(now, pid).run(); const v = await view(DB, pid, m); if (v) return json(req, { ...v, prizes: pz, dprizes: dz }); }
    const mk = await DB.prepare('SELECT gone FROM fleet_marks WHERE pid = ?').bind(pid).first();
    return json(req, { none: true, open: await openList(DB), prizes: pz, dprizes: dz, wait: mk && mk.gone + LEAVE_WAIT > now ? mk.gone + LEAVE_WAIT : 0 });
  }
  if (p === '/fleet/fm/top' && req.method === 'GET') { // 17 Oct: a mission's ranking for the day, every player's best run (all fleets)
    const F = FM(), d = day(), id = url.searchParams.get('id'), pid = url.searchParams.get('pid'), mm = F && F.day(d).find(x => x.id === id);
    if (!mm) return json(req, { ok: false, err: 'id' });
    const rows = (await DB.prepare('SELECT x.pid, x.best, m.name, f.fid, f.emb, f.name AS fn, f.hidden FROM fleet_fm x JOIN fleet_members m ON m.pid = x.pid JOIN fleets f ON f.fid = m.fid WHERE x.day = ? AND x.id = ? AND x.best > 0 ORDER BY x.best DESC, x.rowid ASC LIMIT 10').bind(d, mm.id).all()).results || [];
    const n = ((await DB.prepare('SELECT COUNT(*) AS n FROM fleet_fm WHERE day = ? AND id = ? AND best > 0').bind(d, mm.id).first()) || {}).n || 0;
    let me = null;
    if (okPid(pid)) { const r = await DB.prepare('SELECT best FROM fleet_fm WHERE day = ? AND id = ? AND pid = ?').bind(d, mm.id, pid).first();
      if (r && r.best > 0) { const c = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_fm WHERE day = ? AND id = ? AND best > ?').bind(d, mm.id, r.best).first(); me = { rank: (c ? c.n : 0) + 1, v: r.best }; } }
    return json(req, { ok: true, n, me, list: rows.map(r => ({ name: r.name, emb: r.emb, fleet: shownName({ fid: r.fid, name: r.fn, hidden: r.hidden }), v: r.best, me: r.pid === pid })) });
  }
  if (p === '/fleets/fm' && req.method === 'GET') { // 18 Oct: today's fleet ranking and the week's champions, in mission points (all fleets)
    const pid = url.searchParams.get('pid'), m = await memberOf(DB, pid), wk = weekOf(), days = weekDays(wk), d = day(), R = await fmRows(DB, days[0], days[6]);
    const board = async get => {
      const all = [...R.fl.keys()].map(fid => ({ fid, v: get(fid) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v), top = all.slice(0, 10), out = [];
      for (let i = 0; i < top.length; i++) { const f = await fleetRow(DB, top[i].fid); if (f) out.push({ r: i + 1, name: shownName(f), emb: f.emb, n: await count(DB, f.fid), v: top[i].v, me: !!m && f.fid === m.fid }); }
      const k = m ? all.findIndex(x => x.fid === m.fid) : -1;
      return { list: out, n: all.length, me: k >= 0 ? { r: k + 1, v: all[k].v } : null };
    };
    return json(req, { ok: true, day: await board(fid => fmDayScore(R, fid, d)), week: await board(fid => fmWeekScore(R, fid)), pay: FM().PAY });
  }
  if (p === '/fleets/top' && req.method === 'GET') {
    const pid = url.searchParams.get('pid'), wk = weekOf(), rf = raceFrom(wk), race = now >= Date.parse(rf + 'T00:00:00Z');
    const m = await memberOf(DB, pid);
    let rows;
    if (race && m) {
      const grp = await groupOf(DB, wk, m.fid);
      rows = (await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members x WHERE x.fid = f.fid) AS n, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid AND p.day >= ?),0) AS s
        FROM fleet_groups g JOIN fleets f ON f.fid = g.fid WHERE g.wk = ? AND g.grp = ? ORDER BY s DESC LIMIT 20`).bind(wk, rf, wk, grp).all()).results || [];
    } else {
      rows = (await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members x WHERE x.fid = f.fid) AS n, COALESCE((SELECT SUM(pts + mpts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s
        FROM fleets f ORDER BY s DESC, f.created ASC LIMIT 50`).bind(wk).all()).results || [];
    }
    const list = rows.map((x, i) => ({ r: i + 1, name: x.hidden ? 'FİLO-' + x.fid.slice(0, 4).toUpperCase() : x.name, emb: x.emb, n: x.n, pts: x.s, me: !!m && x.fid === m.fid }));
    // 1.5.0 (16 Oct): during the race, how many of your members have scored since Friday (a fleet needs RACE_MIN to be ranked)
    const racers = race && m ? (await weekTotal(DB, wk, m.fid, rf)).players : null;
    return json(req, { wk, race, ends: weekEnd(wk), raceFrom: Date.parse(rf + 'T00:00:00Z'), list, racers, need: RACE_MIN });
  }
  if (p === '/fleet/create' && req.method === 'POST') {
    if (!okPid(body.pid)) return json(req, { ok: false }, 400);
    if (await memberOf(DB, body.pid)) return json(req, { ok: false, err: 'member' });
    const mk = await DB.prepare('SELECT gone, made FROM fleet_marks WHERE pid = ?').bind(body.pid).first();
    if (mk && mk.made + MAKE_WAIT > now) return json(req, { ok: false, err: 'made', at: mk.made + MAKE_WAIT });
    const c = NAMES().check(body.name, 'fleet'); if (!c.ok) return json(req, { ok: false, err: c.err });
    if (!okEmb(body.emb)) return json(req, { ok: false, err: 'emb' });
    if (await DB.prepare('SELECT fid FROM fleets WHERE nkey = ?').bind(nkey(c.name)).first()) return json(req, { ok: false, err: 'taken' });
    const fid = newId(); let code = newCode();
    for (let i = 0; i < 5 && await DB.prepare('SELECT fid FROM fleets WHERE code = ?').bind(code).first(); i++) code = newCode();
    await DB.prepare('INSERT INTO fleets (fid, code, name, nkey, emb, open, cap, created, last) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(fid, code, c.name, nkey(c.name), body.emb, body.open === false ? 0 : 1, body.pid, now, now).run();
    const pn = pname(body.pname, cleanName);
    await DB.prepare('INSERT INTO fleet_members (pid, fid, name, av, joined, seen) VALUES (?, ?, ?, ?, ?, ?)').bind(body.pid, fid, pn, av(body.av), now, now).run();
    await DB.prepare('INSERT INTO fleet_marks (pid, made) VALUES (?, ?) ON CONFLICT(pid) DO UPDATE SET made = excluded.made').bind(body.pid, now).run();
    await event(DB, fid, pn, 'made');
    return json(req, { ok: true, ...(await view(DB, body.pid, { fid })) });
  }
  if (p === '/fleet/join' && req.method === 'POST') {
    if (!okPid(body.pid)) return json(req, { ok: false }, 400);
    if (await memberOf(DB, body.pid)) return json(req, { ok: false, err: 'member' });
    const mk = await DB.prepare('SELECT gone FROM fleet_marks WHERE pid = ?').bind(body.pid).first();
    if (mk && mk.gone + LEAVE_WAIT > now) return json(req, { ok: false, err: 'wait', at: mk.gone + LEAVE_WAIT });
    const code = typeof body.code === 'string' ? body.code.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const f = code ? await DB.prepare('SELECT * FROM fleets WHERE code = ?').bind(code).first() : typeof body.fid === 'string' ? await fleetRow(DB, body.fid) : null;
    if (!f) return json(req, { ok: false, err: 'nofleet' });
    if (!code && !f.open) return json(req, { ok: false, err: 'closed' });
    if (await count(DB, f.fid) >= MAX_MEMBERS) return json(req, { ok: false, err: 'full' });
    const pn = pname(body.pname, cleanName);
    await DB.prepare('INSERT INTO fleet_members (pid, fid, name, av, joined, seen) VALUES (?, ?, ?, ?, ?, ?)').bind(body.pid, f.fid, pn, av(body.av), now, now).run();
    await event(DB, f.fid, pn, 'join');
    return json(req, { ok: true, ...(await view(DB, body.pid, { fid: f.fid })) });
  }
  const m = await memberOf(DB, body.pid || body.by);
  if (p === '/fleet/report' && req.method === 'POST') {
    if (!okPid(body.by) || typeof body.fid !== 'string') return json(req, { ok: false }, 400);
    await DB.prepare('INSERT OR IGNORE INTO fleet_reports (fid, by, ts) VALUES (?, ?, ?)').bind(body.fid, body.by, now).run();
    const n = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_reports WHERE fid = ?').bind(body.fid).first();
    if (n && n.n >= 2) await DB.prepare('UPDATE fleets SET hidden = 1 WHERE fid = ?').bind(body.fid).run();
    return json(req, { ok: true });
  }
  if (p === '/fleet/dclaim' && req.method === 'POST') {
    if (!okPid(body.pid) || !okDay(body.day)) return json(req, { ok: false }, 400);
    const z = await DB.prepare('SELECT stars, gems FROM fleet_dprizes WHERE day = ? AND pid = ? AND claimed = 0').bind(body.day, body.pid).first();
    if (!z) return json(req, { ok: false, stars: 0, gems: 0 });
    const u = await DB.prepare('UPDATE fleet_dprizes SET claimed = 1 WHERE day = ? AND pid = ? AND claimed = 0').bind(body.day, body.pid).run();
    const ok = !!(u.meta && u.meta.changes);
    return json(req, { ok, stars: ok ? z.stars : 0, gems: ok ? z.gems : 0 });
  }
  if (p === '/fleet/claim' && req.method === 'POST') {
    if (!okPid(body.pid) || !okDay(body.wk)) return json(req, { ok: false }, 400);
    const z = await DB.prepare('SELECT stars, gems, sh FROM fleet_prizes WHERE wk = ? AND pid = ? AND claimed = 0').bind(body.wk, body.pid).first();
    if (!z) return json(req, { ok: false, stars: 0, gems: 0 });
    const u = await DB.prepare('UPDATE fleet_prizes SET claimed = 1 WHERE wk = ? AND pid = ? AND claimed = 0').bind(body.wk, body.pid).run();
    const ok = !!(u.meta && u.meta.changes);
    return json(req, { ok, stars: ok ? z.stars : 0, gems: ok ? z.gems : 0, sh: ok ? z.sh || 0 : 0 });
  }
  if (!m) return json(req, { ok: false, err: 'nomember' });
  const f = await fleetRow(DB, m.fid);
  if (p === '/fleet/pts' && req.method === 'POST') {
    const today = day(), d = okDay(body.day) ? body.day : today;
    if (d !== today && d !== day(now - 36e5 * 2)) return json(req, { ok: false, err: 'day' }, 400);
    const n = Math.max(0, Math.min(CALL_CAP, Math.floor(+body.n || 0)));
    const cur = await DB.prepare('SELECT pts FROM fleet_pts WHERE day = ? AND pid = ?').bind(d, m.pid).first();
    const vok = await deviceOk(m.pid); // 1.5.1 trust model: an unverified device's play is not counted for the fleet
    const have = cur ? cur.pts : 0, add = vok ? Math.max(0, Math.min(n, DAY_CAP - have)) : 0;
    if (add > 0) {
      if (cur) await DB.prepare('UPDATE fleet_pts SET pts = pts + ? WHERE day = ? AND pid = ?').bind(add, d, m.pid).run();
      else await DB.prepare('INSERT INTO fleet_pts (day, pid, fid, wk, pts) VALUES (?, ?, ?, ?, ?)').bind(d, m.pid, m.fid, weekOf(Date.parse(d + 'T12:00:00Z')), add).run();
      await DB.prepare('UPDATE fleets SET last = ? WHERE fid = ?').bind(now, m.fid).run();
      if (d === today) await news(DB, m.fid, add);
    }
    const nm = body.pname ? pname(body.pname, cleanName) : m.name;
    await DB.prepare('UPDATE fleet_members SET seen = ?, name = ?, av = COALESCE(?, av) WHERE pid = ?').bind(now, nm, av(body.av), m.pid).run();
    if (body.src === 'rec') await event(DB, m.fid, nm, 'prec'); // a personal record, told to the fleet
    if (body.mis === 1) { // the daily fleet mission is done: told once a day
      const seen = await DB.prepare("SELECT id FROM fleet_msgs WHERE fid = ? AND name = ? AND m = 'mis' AND ts >= ?").bind(m.fid, nm, Date.parse(today + 'T00:00:00Z')).first();
      if (!seen) await event(DB, m.fid, nm, 'mis');
    }
    return json(req, { ok: true, added: add, today: have + add, ...(vok ? {} : { vf: 0 }) });
  }
  if (p === '/fleet/fm/start' && req.method === 'POST') { // a try is used when the run begins, so quitting a bad run does not give it back
    const F = FM(), d = day(), mm = F && F.day(d).find(x => x.id === body.id);
    if (!mm) return json(req, { ok: false, err: 'id' });
    const cur = await DB.prepare('SELECT tries FROM fleet_fm WHERE day = ? AND pid = ? AND id = ?').bind(d, m.pid, mm.id).first();
    if (cur && cur.tries >= F.TRIES) return json(req, { ok: false, err: 'tries', tries: cur.tries });
    if (cur) await DB.prepare('UPDATE fleet_fm SET tries = tries + 1, st0 = st, st = ? WHERE day = ? AND pid = ? AND id = ?').bind(now, d, m.pid, mm.id).run();
    else await DB.prepare('INSERT INTO fleet_fm (day, pid, fid, id, tries, st) VALUES (?, ?, ?, ?, 1, ?)').bind(d, m.pid, m.fid, mm.id, now).run();
    await DB.prepare('UPDATE fleet_members SET seen = ? WHERE pid = ?').bind(now, m.pid).run();
    return json(req, { ok: true, tries: (cur ? cur.tries : 0) + 1, d });
  }
  if (p === '/fleet/fm' && req.method === 'POST') {
    const F = FM(), today = day(), d = okDay(body.day) ? body.day : today;
    if (d !== today && d !== day(now - 36e5 * 2)) return json(req, { ok: false, err: 'day' }, 400); // a run begun just before midnight UTC still counts
    const mm = F && F.day(d).find(x => x.id === body.id); if (!mm) return json(req, { ok: false, err: 'id' });
    const cur = await DB.prepare('SELECT best, tier, tries, st, st0, mp, fid FROM fleet_fm WHERE day = ? AND pid = ? AND id = ?').bind(d, m.pid, mm.id).first();
    if (!cur || !cur.tries) return json(req, { ok: false, err: 'nostart' });
    const t = Math.max(0, +body.t || 0), v = Math.max(0, Math.floor(+body.v || 0));
    if (!(t <= mm.dur + 5) || v > mm.max || (mm.m === 'time' && v > t + 1) || (mm.m === 'dodge' && v > t * 18 + 20)) return json(req, { ok: false, err: 'bad' }); // more than the mission allows
    const since = Math.max(cur.st ? now - cur.st : Infinity, cur.st0 ? now - cur.st0 : -1);
    if (since < (t - 10) * 1000) return json(req, { ok: false, err: 'bad' }); // claims more play than has passed since the try began
    const vok = await deviceOk(m.pid); // an unverified device keeps its result but wins no medal and no mission points for the fleet
    const best = Math.max(cur.best, v), tier = vok ? F.tier(mm, best) : cur.tier, mp = vok ? F.mp(mm, best) : cur.mp || 0;
    const wk = weekOf(Date.parse(d + 'T12:00:00Z')), days = weekDays(wk), before = vok && mp > (cur.mp || 0) ? fmWeekScore(await fmRows(DB, days[0], days[6], cur.fid || m.fid), cur.fid || m.fid) : 0;
    if (best > cur.best || tier !== cur.tier || mp !== (cur.mp || 0)) await DB.prepare('UPDATE fleet_fm SET best = ?, tier = ?, mp = ? WHERE day = ? AND pid = ? AND id = ?').bind(best, tier, mp, d, m.pid, mm.id).run();
    if (tier === 3 && cur.tier < 3) await event(DB, m.fid, m.name, 'fmg:' + mm.id);
    if (mp > (cur.mp || 0)) await DB.prepare('UPDATE fleets SET last = ? WHERE fid = ?').bind(now, m.fid).run();
    // 18 Oct: no medal points any more; the mission points fill the week's chests (told on the wall) and decide the day's ranking
    const R = await fmRows(DB, days[0], days[6], cur.fid || m.fid), fid = cur.fid || m.fid, after = fmWeekScore(R, fid), td = R.fl.get(fid) && R.fl.get(fid).get(d), q = td && td.per[mm.id];
    if (vok && after > before) for (const [i, x] of F.PAY.chestAt.entries()) if (before < x && after >= x) await event(DB, fid, '', 'chest:' + (i + 1));
    const e = R.mem.get(fid + '|' + m.pid), mine = e && e.get(d), st = fmStars(R, d).get(fid);
    return json(req, { ok: true, best, tier, add: 0, mp, avg: q ? q.avg : 0, n: q ? q.n : 0, my: mine ? mine.mp : 0, g: mine ? mine.g : 0, fday: td ? td.score : 0, star: !!st && st.pid === m.pid, ...(vok ? {} : { vf: 0 }) });
  }
  if (p === '/fleet/fmchain' && req.method === 'POST') { // the Fleet Chain's stars: once a day, for a member who won at least one medal toward it
    const F = FM(), d = day(), n = await count(DB, m.fid);
    const mine = await DB.prepare("SELECT COALESCE(SUM(tier),0) AS n FROM fleet_fm WHERE day = ? AND pid = ? AND id != 'chain'").bind(d, m.pid).first();
    const all = await DB.prepare("SELECT COALESCE(SUM(tier),0) AS n FROM fleet_fm WHERE day = ? AND fid = ? AND id != 'chain'").bind(d, m.fid).first();
    if (!F || !mine || !mine.n || !all || all.n < F.chainNeed(n)) return json(req, { ok: false, stars: 0 });
    const r = await DB.prepare("INSERT OR IGNORE INTO fleet_fm (day, pid, fid, id, tries) VALUES (?, ?, ?, 'chain', 1)").bind(d, m.pid, m.fid).run();
    const ok = !!(r.meta && r.meta.changes);
    return json(req, { ok, stars: ok ? F.CHAIN_STARS : 0 });
  }
  if (p === '/fleet/msg' && req.method === 'POST') {
    if (!MSGS.includes(body.m)) return json(req, { ok: false }, 400);
    const last = await DB.prepare(`SELECT ts FROM fleet_msgs WHERE fid = ? AND name = ? AND m IN (${MSGS.map(() => '?').join(',')}) ORDER BY id DESC LIMIT 1`).bind(m.fid, m.name, ...MSGS).first();
    if (last && last.ts > now - 20e3) return json(req, { ok: false, err: 'slow' });
    await event(DB, m.fid, m.name, body.m);
    return json(req, { ok: true });
  }
  if (p === '/fleet/leave' && req.method === 'POST') {
    await DB.prepare('DELETE FROM fleet_members WHERE pid = ?').bind(m.pid).run();
    await DB.prepare('INSERT INTO fleet_marks (pid, gone) VALUES (?, ?) ON CONFLICT(pid) DO UPDATE SET gone = excluded.gone').bind(m.pid, now).run();
    if (f && f.cap === m.pid) { const nx = await DB.prepare('SELECT pid FROM fleet_members WHERE fid = ? ORDER BY seen DESC LIMIT 1').bind(m.fid).first(); if (nx) await DB.prepare('UPDATE fleets SET cap = ? WHERE fid = ?').bind(nx.pid, m.fid).run(); }
    if (!(await count(DB, m.fid))) await DB.prepare('DELETE FROM fleets WHERE fid = ?').bind(m.fid).run(); else await event(DB, m.fid, m.name, 'left');
    return json(req, { ok: true });
  }
  if (!f || f.cap !== m.pid) return json(req, { ok: false, err: 'notcap' });
  if (p === '/fleet/kick' && req.method === 'POST') {
    const ms = await DB.prepare('SELECT pid, name FROM fleet_members WHERE fid = ?').bind(f.fid).all();
    for (const x of ms.results || []) if (x.pid !== m.pid && await key(f.fid, x.pid) === body.k) {
      await DB.prepare('DELETE FROM fleet_members WHERE pid = ?').bind(x.pid).run();
      await DB.prepare('INSERT INTO fleet_marks (pid, gone) VALUES (?, ?) ON CONFLICT(pid) DO UPDATE SET gone = excluded.gone').bind(x.pid, now).run();
      await event(DB, f.fid, x.name, 'kicked');
      return json(req, { ok: true });
    }
    return json(req, { ok: false });
  }
  if (p === '/fleet/rename' && req.method === 'POST') {
    if (f.renames && !f.hidden && f.renamed + RENAME_WAIT > now) return json(req, { ok: false, err: 'soon', at: f.renamed + RENAME_WAIT }); // a reported name can be changed at once
    const c = NAMES().check(body.name, 'fleet'); if (!c.ok) return json(req, { ok: false, err: c.err });
    const t = await DB.prepare('SELECT fid FROM fleets WHERE nkey = ?').bind(nkey(c.name)).first(); if (t && t.fid !== f.fid) return json(req, { ok: false, err: 'taken' });
    await DB.prepare('UPDATE fleets SET name = ?, nkey = ?, renames = renames + 1, renamed = ?, hidden = 0 WHERE fid = ?').bind(c.name, nkey(c.name), now, f.fid).run();
    await DB.prepare('DELETE FROM fleet_reports WHERE fid = ?').bind(f.fid).run();
    return json(req, { ok: true, free: !f.renames || !!f.hidden });
  }
  if (p === '/fleet/set' && req.method === 'POST') {
    if (body.emb !== undefined && !okEmb(body.emb)) return json(req, { ok: false, err: 'emb' });
    await DB.prepare('UPDATE fleets SET open = COALESCE(?, open), emb = COALESCE(?, emb) WHERE fid = ?').bind(typeof body.open === 'boolean' ? (body.open ? 1 : 0) : null, body.emb === undefined ? null : body.emb, f.fid).run();
    return json(req, { ok: true });
  }
  return json(req, { ok: false, err: 'not found' }, 404);
}
