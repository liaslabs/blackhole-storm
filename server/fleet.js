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

const MAX_MEMBERS = 20, DAY_CAP = 300, CALL_CAP = 80;
const CHEST = [600, 1500, 3000];                 // per member who played, at least 5 counted
const CHEST_PAY = [[150, 0], [300, 5], [600, 15]];
const RACE_PAY = [[1500, 30], [1000, 20], [600, 10], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0], [300, 0]];
const TOP3_PAY = 200, GROUP = 20, RACE_MIN = 3; // a fleet needs 3 members scoring in the race to be ranked
const MSGS = ['go', 'gj', 'done', 'rec', 'ufo'];
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
    'CREATE TABLE IF NOT EXISTS fleet_reports (fid TEXT NOT NULL, by TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (fid, by))'
  ]) await DB.prepare(q).run();
  ready = true;
}

const NAMES = () => globalThis.BHS_NAMES;
const nkey = n => NAMES().tidy(n).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
const AVS = () => globalThis.BHS_AV_KEYS || new Set();
const okEmb = e => typeof e === 'string' && AVS().has(e);
const pname = (n, clean) => clean(n);
const av = a => typeof a === 'string' && AVS().has(a) ? a : null;

async function memberOf(DB, pid) { return okPid(pid) ? await DB.prepare('SELECT * FROM fleet_members WHERE pid = ?').bind(pid).first() : null; }
async function fleetRow(DB, fid) { return await DB.prepare('SELECT * FROM fleets WHERE fid = ?').bind(fid).first(); }
async function count(DB, fid) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_members WHERE fid = ?').bind(fid).first(); return r ? r.n : 0; }
async function weekTotal(DB, wk, fid, from) {
  const r = await DB.prepare(`SELECT COALESCE(SUM(pts),0) AS s, COUNT(DISTINCT pid) AS p FROM fleet_pts WHERE wk = ? AND fid = ?${from ? ' AND day >= ?' : ''}`).bind(...(from ? [wk, fid, from] : [wk, fid])).first();
  return { pts: r ? r.s : 0, players: r ? r.p : 0 };
}
const targets = players => CHEST.map(t => t * Math.max(5, players));
const shownName = f => f.hidden ? 'FİLO-' + f.fid.slice(0, 4).toUpperCase() : f.name;
async function event(DB, fid, name, m) { await DB.prepare('INSERT INTO fleet_msgs (fid, name, m, ts) VALUES (?, ?, ?, ?)').bind(fid, name, m, Date.now()).run(); }

// race groups: on the first look at a week's race, fleets are sorted by last week's total and cut into groups of 20;
// a fleet that turns up later joins the last group, or opens a new one when that is full
async function groupOf(DB, wk, fid) {
  let g = await DB.prepare('SELECT grp FROM fleet_groups WHERE wk = ? AND fid = ?').bind(wk, fid).first();
  if (g) return g.grp;
  const any = await DB.prepare('SELECT COUNT(*) AS n FROM fleet_groups WHERE wk = ?').bind(wk).first();
  if (!any || !any.n) {
    const prev = day(Date.parse(wk + 'T00:00:00Z') - 7 * 864e5);
    const all = await DB.prepare('SELECT f.fid, COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s FROM fleets f ORDER BY s DESC, f.created ASC').bind(prev).all();
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

// one finished week: results per fleet and prize rows for everyone who played
export async function settleWeek(DB, wk) {
  await ensure(DB);
  if (weekEnd(wk) > Date.now()) return;
  const done = await DB.prepare('SELECT wk FROM fleet_weeks WHERE wk = ?').bind(wk).first();
  if (done) return;
  await DB.prepare('INSERT OR IGNORE INTO fleet_weeks (wk, ts) VALUES (?, ?)').bind(wk, Date.now()).run();
  const rf = raceFrom(wk);
  const fl = await DB.prepare('SELECT DISTINCT fid FROM fleet_pts WHERE wk = ?').bind(wk).all();
  const res = [];
  for (const { fid } of fl.results || []) {
    const f = await fleetRow(DB, fid); if (!f) continue;
    const t = await weekTotal(DB, wk, fid), r = await weekTotal(DB, wk, fid, rf), grp = await groupOf(DB, wk, fid);
    const tg = targets(t.players), tier = tg.filter(x => t.pts >= x).length;
    res.push({ f, fid, total: t.pts, race: r.players >= RACE_MIN ? r.pts : 0, grp, tier });
  }
  const byGrp = {};
  for (const x of res) (byGrp[x.grp] = byGrp[x.grp] || []).push(x);
  for (const g of Object.values(byGrp)) {
    g.sort((a, b) => b.race - a.race || b.total - a.total);
    g.forEach((x, i) => { x.rank = x.race > 0 ? i + 1 : 0; x.grpn = g.length; });
  }
  for (const x of res) {
    await DB.prepare('INSERT OR REPLACE INTO fleet_results (wk, fid, name, emb, total, race, rank, grpn, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(wk, x.fid, shownName(x.f), x.f.emb, x.total, x.race, x.rank, x.grpn, x.tier).run();
    const ms = await DB.prepare('SELECT pid, SUM(pts) AS s FROM fleet_pts WHERE wk = ? AND fid = ? GROUP BY pid ORDER BY s DESC').bind(wk, x.fid).all();
    const rows = (ms.results || []).filter(m => m.s > 0);
    for (let i = 0; i < rows.length; i++) {
      let stars = 0, gems = 0;
      for (let k = 0; k < x.tier; k++) { stars += CHEST_PAY[k][0]; gems += CHEST_PAY[k][1]; }
      const rp = x.rank ? RACE_PAY[x.rank - 1] : null; if (rp) { stars += rp[0]; gems += rp[1]; }
      const top3 = i < 3 ? 1 : 0; if (top3) stars += TOP3_PAY;
      if (stars || gems) await DB.prepare('INSERT OR IGNORE INTO fleet_prizes (wk, pid, fid, stars, gems, tier, rank, mine, top3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(wk, rows[i].pid, x.fid, stars, gems, x.tier, x.rank, rows[i].s, top3).run();
    }
  }
}

// daily: settle the week that ended, hand over from away captains, drop long-away members and empty fleets, trim old rows
export async function fleetHousekeeping(DB) {
  await ensure(DB);
  await settleWeek(DB, weekOf(Date.now() - 7 * 864e5));
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
  await DB.prepare('DELETE FROM fleet_groups WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_results WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_prizes WHERE wk < ?').bind(old).run();
  await DB.prepare('DELETE FROM fleet_msgs WHERE ts < ?').bind(now - 14 * 864e5).run();
  await DB.prepare('DELETE FROM fleet_reports WHERE ts < ?').bind(now - 30 * 864e5).run();
  await DB.prepare('DELETE FROM fleet_marks WHERE gone < ? AND made < ?').bind(now - MAKE_WAIT, now - MAKE_WAIT).run(); // the join and found waits are over: nothing left to keep
}

async function view(DB, pid, m) {
  const wk = weekOf(), f = await fleetRow(DB, m.fid);
  if (!f) return null;
  const t = await weekTotal(DB, wk, f.fid), race = Date.now() >= Date.parse(raceFrom(wk) + 'T00:00:00Z');
  const r = await weekTotal(DB, wk, f.fid, raceFrom(wk));
  const ms = await DB.prepare(`SELECT m.pid, m.name, m.av, m.seen, COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.pid = m.pid AND p.fid = m.fid),0) AS s,
    EXISTS (SELECT 1 FROM fleet_pts p WHERE p.day = ? AND p.pid = m.pid) AS today FROM fleet_members m WHERE m.fid = ? ORDER BY s DESC, m.joined ASC`).bind(wk, day(), f.fid).all();
  const members = [];
  for (const x of ms.results || []) members.push({ k: await key(f.fid, x.pid), name: x.name, av: x.av, pts: x.s, today: !!x.today, cap: x.pid === f.cap, me: x.pid === pid, away: x.seen < Date.now() - 21 * 864e5 });
  const wall = await DB.prepare('SELECT name, m, ts FROM fleet_msgs WHERE fid = ? ORDER BY id DESC LIMIT 12').bind(f.fid).all();
  let rank = 0, of = 0;
  if (race) {
    const grp = await groupOf(DB, wk, f.fid);
    const g = await DB.prepare('SELECT g.fid, COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = g.fid AND p.day >= ?),0) AS s FROM fleet_groups g WHERE g.wk = ? AND g.grp = ? ORDER BY s DESC').bind(wk, raceFrom(wk), wk, grp).all();
    const rows = g.results || []; of = rows.length; rank = rows.findIndex(x => x.fid === f.fid) + 1;
  } else {
    const a = await DB.prepare('SELECT COUNT(*) AS n FROM (SELECT fid, SUM(pts) AS s FROM fleet_pts WHERE wk = ? GROUP BY fid HAVING s > ?)').bind(wk, t.pts).first();
    const all = await DB.prepare('SELECT COUNT(*) AS n FROM fleets').first();
    rank = (a ? a.n : 0) + 1; of = all ? all.n : 1;
  }
  return {
    fleet: { fid: f.fid, code: f.code, name: shownName(f), hidden: !!f.hidden, emb: f.emb, open: !!f.open, cap: f.cap === pid, n: members.length, max: MAX_MEMBERS,
      pts: t.pts, race, racePts: r.pts, rank, of, targets: targets(t.players), ends: weekEnd(wk), raceFrom: Date.parse(raceFrom(wk) + 'T00:00:00Z'), freeRename: !f.renames || !!f.hidden,
      renameAt: f.renames ? f.renamed + RENAME_WAIT : 0 },
    members, wall: (wall.results || []).reverse()
  };
}
async function prizes(DB, pid) {
  await settleWeek(DB, weekOf(Date.now() - 7 * 864e5));
  const r = await DB.prepare('SELECT p.wk, p.stars, p.gems, p.tier, p.rank, p.mine, p.top3, r.name, r.emb, r.grpn, r.total FROM fleet_prizes p LEFT JOIN fleet_results r ON r.wk = p.wk AND r.fid = p.fid WHERE p.pid = ? AND p.claimed = 0 ORDER BY p.wk').bind(pid).all();
  return r.results || [];
}
async function openList(DB) {
  const wk = weekOf();
  const r = await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members m WHERE m.fid = f.fid) AS n,
    COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s FROM fleets f
    WHERE f.open = 1 AND f.last >= ? ORDER BY s DESC, f.created DESC LIMIT 30`).bind(wk, Date.now() - 30 * 864e5).all();
  return (r.results || []).filter(x => x.n < MAX_MEMBERS).slice(0, 8).map(x => ({ fid: x.fid, name: x.hidden ? 'FİLO-' + x.fid.slice(0, 4).toUpperCase() : x.name, emb: x.emb, n: x.n, pts: x.s }));
}

// the route table; returns null for paths that are not about fleets
export async function fleetRoute(url, req, DB, json, cleanName) {
  const p = url.pathname;
  if (!p.startsWith('/fleet')) return null;
  await ensure(DB);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const now = Date.now();
  if (p === '/fleet' && req.method === 'GET') {
    const pid = url.searchParams.get('pid'); if (!okPid(pid)) return json(req, { ok: false }, 400);
    const m = await memberOf(DB, pid), pz = await prizes(DB, pid);
    if (m) { await DB.prepare('UPDATE fleet_members SET seen = ? WHERE pid = ?').bind(now, pid).run(); const v = await view(DB, pid, m); if (v) return json(req, { ...v, prizes: pz }); }
    const mk = await DB.prepare('SELECT gone FROM fleet_marks WHERE pid = ?').bind(pid).first();
    return json(req, { none: true, open: await openList(DB), prizes: pz, wait: mk && mk.gone + LEAVE_WAIT > now ? mk.gone + LEAVE_WAIT : 0 });
  }
  if (p === '/fleets/top' && req.method === 'GET') {
    const pid = url.searchParams.get('pid'), wk = weekOf(), rf = raceFrom(wk), race = now >= Date.parse(rf + 'T00:00:00Z');
    const m = await memberOf(DB, pid);
    let rows;
    if (race && m) {
      const grp = await groupOf(DB, wk, m.fid);
      rows = (await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members x WHERE x.fid = f.fid) AS n, COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid AND p.day >= ?),0) AS s
        FROM fleet_groups g JOIN fleets f ON f.fid = g.fid WHERE g.wk = ? AND g.grp = ? ORDER BY s DESC LIMIT 20`).bind(wk, rf, wk, grp).all()).results || [];
    } else {
      rows = (await DB.prepare(`SELECT f.fid, f.name, f.hidden, f.emb, (SELECT COUNT(*) FROM fleet_members x WHERE x.fid = f.fid) AS n, COALESCE((SELECT SUM(pts) FROM fleet_pts p WHERE p.wk = ? AND p.fid = f.fid),0) AS s
        FROM fleets f ORDER BY s DESC, f.created ASC LIMIT 50`).bind(wk).all()).results || [];
    }
    const list = rows.map((x, i) => ({ r: i + 1, name: x.hidden ? 'FİLO-' + x.fid.slice(0, 4).toUpperCase() : x.name, emb: x.emb, n: x.n, pts: x.s, me: !!m && x.fid === m.fid }));
    return json(req, { wk, race, ends: weekEnd(wk), raceFrom: Date.parse(rf + 'T00:00:00Z'), list });
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
  if (p === '/fleet/claim' && req.method === 'POST') {
    if (!okPid(body.pid) || !okDay(body.wk)) return json(req, { ok: false }, 400);
    const z = await DB.prepare('SELECT stars, gems FROM fleet_prizes WHERE wk = ? AND pid = ? AND claimed = 0').bind(body.wk, body.pid).first();
    if (!z) return json(req, { ok: false, stars: 0, gems: 0 });
    const u = await DB.prepare('UPDATE fleet_prizes SET claimed = 1 WHERE wk = ? AND pid = ? AND claimed = 0').bind(body.wk, body.pid).run();
    const ok = !!(u.meta && u.meta.changes);
    return json(req, { ok, stars: ok ? z.stars : 0, gems: ok ? z.gems : 0 });
  }
  if (!m) return json(req, { ok: false, err: 'nomember' });
  const f = await fleetRow(DB, m.fid);
  if (p === '/fleet/pts' && req.method === 'POST') {
    const today = day(), d = okDay(body.day) ? body.day : today;
    if (d !== today && d !== day(now - 36e5 * 2)) return json(req, { ok: false, err: 'day' }, 400);
    const n = Math.max(0, Math.min(CALL_CAP, Math.floor(+body.n || 0)));
    const cur = await DB.prepare('SELECT pts FROM fleet_pts WHERE day = ? AND pid = ?').bind(d, m.pid).first();
    const have = cur ? cur.pts : 0, add = Math.max(0, Math.min(n, DAY_CAP - have));
    if (add > 0) {
      if (cur) await DB.prepare('UPDATE fleet_pts SET pts = pts + ? WHERE day = ? AND pid = ?').bind(add, d, m.pid).run();
      else await DB.prepare('INSERT INTO fleet_pts (day, pid, fid, wk, pts) VALUES (?, ?, ?, ?, ?)').bind(d, m.pid, m.fid, weekOf(Date.parse(d + 'T12:00:00Z')), add).run();
      await DB.prepare('UPDATE fleets SET last = ? WHERE fid = ?').bind(now, m.fid).run();
    }
    const nm = body.pname ? pname(body.pname, cleanName) : m.name;
    await DB.prepare('UPDATE fleet_members SET seen = ?, name = ?, av = COALESCE(?, av) WHERE pid = ?').bind(now, nm, av(body.av), m.pid).run();
    if (body.src === 'rec') await event(DB, m.fid, nm, 'prec'); // a personal record, told to the fleet
    return json(req, { ok: true, added: add, today: have + add });
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
