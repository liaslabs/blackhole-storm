// Blackhole Storm leaderboard: a Cloudflare Worker in front of a D1 database (binding: DB).
// Daily Storm (the survival mode's daily scenario): one best score per install per UTC day.
// The top 3 of each finished day win stars (1000 / 500 / 250), claimed once from the app.
// Endpoints (JSON):
//   POST /score   {pid,name,score,secs,day}      -> {ok,best,rank,total}
//   GET  /top?day=YYYY-MM-DD&pid=...             -> {day,list:[{r,name,score,me}],me:{rank,score}|null,total}
//   GET  /prizes?pid=...                         -> {list:[{day,rank,stars}]}   (unclaimed, last 7 days)
//   POST /claim   {pid,day}                      -> {ok,stars}
const PRIZE = [1000, 500, 250];
const ALLOWED = ['https://liaslabs.github.io', 'http://localhost:8766', 'http://127.0.0.1:8766'];
const MAX_SUBS = 40;          // submissions per install per day
const MAX_RATE = 4000;        // points per second no real run reaches (Rage ×2 and ×5 combos top out well below this)

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const okPid = p => typeof p === 'string' && /^[a-z0-9]{12,40}$/.test(p);
const okDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
function cleanName(n) {
  n = typeof n === 'string' ? n : '';
  n = n.replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').trim();
  return [...n].slice(0, 11).join('') || 'PİLOT';
}
function cors(req) {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED.includes(o) ? o : ALLOWED[0], 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

// Settle a finished day once: its top 3 get prize rows.
async function settle(DB, d) {
  if (d >= day()) return;
  const done = await DB.prepare('SELECT COUNT(*) AS n FROM prizes WHERE day = ?').bind(d).first();
  if (done && done.n) return;
  const top = await DB.prepare('SELECT pid FROM scores WHERE day = ? ORDER BY score DESC, ts ASC LIMIT 3').bind(d).all();
  const rows = top.results || [];
  for (let i = 0; i < rows.length; i++)
    await DB.prepare('INSERT OR IGNORE INTO prizes (day, pid, rank, stars) VALUES (?, ?, ?, ?)').bind(d, rows[i].pid, i + 1, PRIZE[i]).run();
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url), DB = env.DB;
    try {
      if (url.pathname === '/score' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const today = day(), d = okDay(b.day) ? b.day : today;
        if (d !== today && d !== day(Date.now() - 36e5 * 2)) return json(req, { ok: false, err: 'day' }, 400); // a run that started just before midnight still counts
        if (!okPid(b.pid)) return json(req, { ok: false, err: 'pid' }, 400);
        const score = Math.floor(+b.score), secs = Math.floor(+b.secs);
        if (!(score > 0 && score < 5e7) || !(secs >= 5 && secs < 36000) || score / secs > MAX_RATE) return json(req, { ok: false, err: 'score' }, 400);
        const name = cleanName(b.name), now = Date.now();
        const cur = await DB.prepare('SELECT score, subs FROM scores WHERE day = ? AND pid = ?').bind(d, b.pid).first();
        if (cur && cur.subs >= MAX_SUBS) return json(req, { ok: false, err: 'rate' }, 429);
        if (!cur) await DB.prepare('INSERT INTO scores (day, pid, name, score, secs, ts) VALUES (?, ?, ?, ?, ?, ?)').bind(d, b.pid, name, score, secs, now).run();
        else if (score > cur.score) await DB.prepare('UPDATE scores SET score = ?, secs = ?, ts = ?, name = ?, subs = subs + 1 WHERE day = ? AND pid = ?').bind(score, secs, now, name, d, b.pid).run();
        else await DB.prepare('UPDATE scores SET subs = subs + 1, name = ? WHERE day = ? AND pid = ?').bind(name, d, b.pid).run();
        const best = Math.max(score, cur ? cur.score : 0);
        const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, best).first();
        const t = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ?').bind(d).first();
        return json(req, { ok: true, best, rank: (r ? r.n : 0) + 1, total: t ? t.n : 1 });
      }
      if (url.pathname === '/top' && req.method === 'GET') {
        const d = okDay(url.searchParams.get('day')) ? url.searchParams.get('day') : day(), pid = url.searchParams.get('pid');
        const top = await DB.prepare('SELECT pid, name, score FROM scores WHERE day = ? ORDER BY score DESC, ts ASC LIMIT 50').bind(d).all();
        const list = (top.results || []).map((x, i) => ({ r: i + 1, name: x.name, score: x.score, me: x.pid === pid }));
        let me = null;
        if (okPid(pid)) { const m = await DB.prepare('SELECT score FROM scores WHERE day = ? AND pid = ?').bind(d, pid).first();
          if (m) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, m.score).first(); me = { rank: r.n + 1, score: m.score }; } }
        const t = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ?').bind(d).first();
        return json(req, { day: d, list, me, total: t ? t.n : 0 });
      }
      if (url.pathname === '/prizes' && req.method === 'GET') {
        const pid = url.searchParams.get('pid'); if (!okPid(pid)) return json(req, { list: [] });
        for (let i = 1; i <= 7; i++) await settle(DB, day(Date.now() - i * 864e5));
        const old = day(Date.now() - 90 * 864e5); // keep at most 90 days (privacy policy)
        await DB.prepare('DELETE FROM scores WHERE day < ?').bind(old).run(); await DB.prepare('DELETE FROM prizes WHERE day < ?').bind(old).run();
        const r = await DB.prepare('SELECT day, rank, stars FROM prizes WHERE pid = ? AND claimed = 0 AND day >= ? ORDER BY day').bind(pid, day(Date.now() - 7 * 864e5)).all();
        return json(req, { list: r.results || [] });
      }
      if (url.pathname === '/claim' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!okPid(b.pid) || !okDay(b.day)) return json(req, { ok: false }, 400);
        const p = await DB.prepare('SELECT stars, claimed FROM prizes WHERE day = ? AND pid = ?').bind(b.day, b.pid).first();
        if (!p || p.claimed) return json(req, { ok: false, stars: 0 });
        const u = await DB.prepare('UPDATE prizes SET claimed = 1 WHERE day = ? AND pid = ? AND claimed = 0').bind(b.day, b.pid).run();
        return json(req, { ok: !!(u.meta && u.meta.changes), stars: u.meta && u.meta.changes ? p.stars : 0 });
      }
      if (url.pathname === '/' ) return json(req, { ok: true, service: 'blackhole-storm-leaderboard', day: day() });
      return json(req, { ok: false, err: 'not found' }, 404);
    } catch (e) { return json(req, { ok: false, err: 'server' }, 500); }
  }
};
