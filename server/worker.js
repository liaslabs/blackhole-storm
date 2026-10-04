// Blackhole Storm leaderboard: a Cloudflare Worker in front of a D1 database (binding: DB).
// Daily Storm (the survival mode's daily scenario): one best score per install per UTC day.
// The top 3 of each finished day win stars (1000 / 500 / 250), claimed once from the app.
// Endpoints (JSON):
//   POST /score   {pid,name,score,secs,day}      -> {ok,best,rank,total}
//   GET  /top?day=YYYY-MM-DD&pid=...             -> {day,list:[{r,k,name,score,me}],me:{rank,score}|null,total}   k: opaque row handle
//   POST /report  {day,k,by}                       -> {ok}   reports a name; two reporters hide it for that day
//   GET  /prizes?pid=...                         -> {list:[{day,rank,stars}]}   (unclaimed, last 7 days)
//   POST /claim   {pid,day}                      -> {ok,stars}
//   POST /ack     {sku,token,sub}                -> {ok}   checks a Google Play purchase and acknowledges it (web/TWA version)
//   POST /err     {m,s,v,p,l}                    -> {ok}   a script error from the game (message, top of stack, build, app/web,
//                                                   language); counted per day, no personal data, kept 30 days
//   GET  /errs?days=3                            -> {list:[{day,m,s,v,p,n}]}   the most frequent recent errors
//   POST /verify  {pid,sku,token}                -> {ok,pending?}   the app's purchase check: asks Google whether the purchase is real
//                                                   and paid, records the token (a consumable token counts once, for the install
//                                                   that bought it), then acknowledges or consumes it. The app grants nothing without ok.
// Cron (wrangler.toml [triggers]): once a day settles the finished days and drops rows older than 90 days,
// so reading prizes costs nothing extra.
// Purchase checks need two secrets: GP_PKG (the app's package name) and GP_SA (the Play service account JSON key).
// Play Integrity (optional): variable INTEGRITY = off | log | enforce. With "enforce", /score and /claim need a valid
// integrity token from the genuine Play app (modified copies, emulators and the web version cannot post scores or claim prizes);
// "log" only writes the verdicts to the Worker log so they can be watched before switching on. Uses GP_SA as well.
const PRIZE = [1000, 500, 250];
const ALLOWED = ['https://liaslabs.github.io', 'https://localhost', 'http://localhost:8766', 'http://127.0.0.1:8766']; // https://localhost: the Android app (Capacitor)
const MAX_SUBS = 40;          // submissions per install per day
const MAX_SECS = 200;         // the Daily Storm lasts 180 s: a longer run is not a real one
const MAX_RATE = 4000;        // points per second no real run reaches (Rage ×2 and ×5 combos top out well below this)

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const okPid = p => typeof p === 'string' && /^[a-z0-9]{12,40}$/.test(p);
const okDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
// Names others can see: a small word filter (keep the same list as badName() in src/game.src.html)
const BAD_SUB = ['orospu','orspu','siktir','sikerim','sikeyim','sikik','sikis','yarrak','yarak','amcik','aminakoy','aminako','gotveren','pezevenk','kahpe','kaltak','ibne','gavat','yavsak','serefsiz','fuck','shit','bitch','cunt','nigger','nigga','faggot','whore','slut','dick','pussy','asshole','bastard','hitler','porno','porn'];
const BAD_WORD = ['sik','pic','amk','aq','oc','mk','got','ass','nazi','sex','fag','cum','rape','anan','ananı','ananin'];
function badName(n) {
  const s = String(n || '').toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's');
  const flat = s.replace(/[^a-z]/g, '');
  if (BAD_SUB.some(w => flat.includes(w))) return true;
  return s.split(/[^a-z]+/).some(w => BAD_WORD.includes(w)) || BAD_WORD.includes(flat);
}
function cleanName(n) {
  n = typeof n === 'string' ? n : '';
  n = n.replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').trim();
  n = [...n].slice(0, 11).join('');
  return n && !badName(n) ? n : 'PİLOT';
}
// Players can report a name on the ranking; two different reporters hide it for everyone that day.
let repReady = false;
async function ensureReports(DB) {
  if (repReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS reports (day TEXT NOT NULL, pid TEXT NOT NULL, by TEXT NOT NULL, ts INTEGER NOT NULL, PRIMARY KEY (day, pid, by))').run();
  repReady = true;
}
async function rowKey(d, pid) { // an opaque per-day handle, so other players' install ids never leave the server
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(d + ':' + pid)));
  return [...h.slice(0, 6)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const HIDE_AT = 2;
function cors(req) {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED.includes(o) ? o : ALLOWED[0], 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

// one-time products and the subscription that the app sends for acknowledgement
const ACK_SKUS = ['quasar_hoard', 'starter', 'cosmic_id', 'no_ads', 'vip_monthly'];
const GP = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/';
// kinds: o = one-time (kept, acknowledged), c = consumable (consumed, counted once), s = subscription
const SKUS = { quasar_hoard: 'o', starter: 'o', cosmic_id: 'o', no_ads: 'o', vip_monthly: 's', captain: 'c', gems_s: 'c', gems_m: 'c', gems_l: 'c', stars_pack: 'c', lives_pack: 'c', time_pack: 'c' };
const gpTok = {}; // cached OAuth tokens, one per scope
const MAX_INSTALLS = 5;
const b64u = b => btoa(typeof b === 'string' ? b : String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function gpToken(env, scope = 'https://www.googleapis.com/auth/androidpublisher') {
  const c = gpTok[scope]; if (c && c.exp > Date.now() + 6e4) return c.t;
  const sa = JSON.parse(env.GP_SA), now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + body));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + head + '.' + body + '.' + b64u(sig) });
  const j = await r.json(); if (!j.access_token) throw new Error('token');
  gpTok[scope] = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; return j.access_token;
}
// valid purchase -> acknowledged (a no-op when it already is); anything else -> ok:false
async function gpAck(env, sku, token, sub) {
  const t = await gpToken(env), h = { Authorization: 'Bearer ' + t };
  const base = GP + encodeURIComponent(env.GP_PKG) + (sub ? '/purchases/subscriptions/' : '/purchases/products/') + encodeURIComponent(sku) + '/tokens/' + encodeURIComponent(token);
  const r = await fetch(base, { headers: h }); if (!r.ok) return false;
  const p = await r.json();
  const paid = sub ? (p.paymentState === 1 || p.paymentState === 2) && +p.expiryTimeMillis > Date.now() : p.purchaseState === 0;
  if (!paid) return false;
  if (p.acknowledgementState === 1) return true;
  const a = await fetch(base + ':acknowledge', { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: '{}' });
  return a.ok;
}
// The app's purchase check. Returns {ok:true} only for a real, paid purchase this install may claim.
let purReady = false;
async function ensurePurchases(DB) {
  if (purReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS purchases (token TEXT PRIMARY KEY, sku TEXT NOT NULL, pid TEXT NOT NULL, ts INTEGER NOT NULL)').run();
  await DB.prepare('CREATE TABLE IF NOT EXISTS purchase_installs (token TEXT NOT NULL, pid TEXT NOT NULL, PRIMARY KEY (token, pid))').run();
  purReady = true;
}
async function gpVerify(env, DB, pid, sku, token) {
  const kind = SKUS[sku];
  const t = await gpToken(env), h = { Authorization: 'Bearer ' + t };
  const base = GP + encodeURIComponent(env.GP_PKG) + (kind === 's' ? '/purchases/subscriptions/' : '/purchases/products/') + encodeURIComponent(sku) + '/tokens/' + encodeURIComponent(token);
  const r = await fetch(base, { headers: h }); if (!r.ok) return { ok: false };
  const p = await r.json();
  if (kind === 's') { if (!((p.paymentState === 1 || p.paymentState === 2) && +p.expiryTimeMillis > Date.now())) return { ok: false }; }
  else if (p.purchaseState === 2) return { ok: false, pending: true };   // paid later (cash, bank transfer): the app asks again
  else if (p.purchaseState !== 0) return { ok: false };                  // cancelled or refunded
  const acc = p.obfuscatedExternalAccountId || '';
  if (kind === 'c' && acc && acc !== pid) return { ok: false };           // someone else's consumable
  await ensurePurchases(DB);
  const prev = await DB.prepare('SELECT 1 AS x FROM purchases WHERE token = ?').bind(token).first();
  if (kind === 'c' && !prev && p.consumptionState === 1) return { ok: false };   // consumed somewhere this server never saw: not ours to grant
  await DB.prepare('INSERT OR IGNORE INTO purchases (token, sku, pid, ts) VALUES (?, ?, ?, ?)').bind(token, sku, pid, Date.now()).run();
  const row = await DB.prepare('SELECT sku, pid FROM purchases WHERE token = ?').bind(token).first();
  if (!row || row.sku !== sku) return { ok: false };
  if (kind === 'c') {
    if (row.pid !== pid) return { ok: false };                           // a consumable counts once, for the install that bought it
    if (p.consumptionState !== 1) await fetch(base + ':consume', { method: 'POST', headers: h });
  } else {
    // one-time products and subscriptions come back on a new install of the same Google account, but a token passed
    // around cannot unlock them for everyone: at most 5 installs per purchase
    await DB.prepare('INSERT OR IGNORE INTO purchase_installs (token, pid) VALUES (?, ?)').bind(token, pid).run();
    const n = await DB.prepare('SELECT COUNT(*) AS n FROM purchase_installs WHERE token = ?').bind(token).first();
    if (n && n.n > MAX_INSTALLS) { await DB.prepare('DELETE FROM purchase_installs WHERE token = ? AND pid = ?').bind(token, pid).run(); return { ok: false }; }
  }
  if (kind !== 'c' && p.acknowledgementState !== 1) {
    await fetch(base + ':acknowledge', { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: '{}' });
  }
  return { ok: true };
}
// Play Integrity: the request hash ties a token to one request, so a token cannot be reused for another score
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
async function integrityOk(env, it, hash) {
  if (typeof it !== 'string' || it.length < 20 || it.length > 8000 || !env.GP_SA || !env.GP_PKG) return false;
  const t = await gpToken(env, 'https://www.googleapis.com/auth/playintegrity');
  const r = await fetch('https://playintegrity.googleapis.com/v1/' + encodeURIComponent(env.GP_PKG) + ':decodeIntegrityToken', { method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ integrity_token: it }) });
  if (!r.ok) return false;
  const v = (await r.json()).tokenPayloadExternal || {}, rd = v.requestDetails || {}, app = v.appIntegrity || {}, dev = (v.deviceIntegrity || {}).deviceRecognitionVerdict || [];
  return rd.requestHash === hash && rd.requestPackageName === env.GP_PKG && Math.abs(Date.now() - +rd.timestampMillis) < 10 * 6e4
    && app.appRecognitionVerdict === 'PLAY_RECOGNIZED' && dev.includes('MEETS_DEVICE_INTEGRITY');
}
async function integrityGate(env, it, what) {
  const mode = env.INTEGRITY || 'off'; if (mode === 'off') return true;
  let ok = false; try { ok = await integrityOk(env, it, await sha(what)); } catch (e) {}
  if (mode === 'log') { console.log('integrity', ok ? 'pass' : 'fail', what.split('|')[0].slice(0, 4)); return true; }
  return ok;
}
let errReady = false;
async function ensureErrs(DB) {
  if (errReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS errs (day TEXT NOT NULL, h TEXT NOT NULL, m TEXT NOT NULL, s TEXT NOT NULL, v TEXT NOT NULL, p TEXT NOT NULL, l TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (day, h))').run();
  errReady = true;
}
const clip = (x, n) => (typeof x === 'string' ? x : '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, n);
async function housekeeping(DB) {
  for (let i = 1; i <= 7; i++) await settle(DB, day(Date.now() - i * 864e5));
  const old = day(Date.now() - 90 * 864e5); // keep at most 90 days (privacy policy)
  await DB.prepare('DELETE FROM scores WHERE day < ?').bind(old).run(); await DB.prepare('DELETE FROM prizes WHERE day < ?').bind(old).run();
  await ensureReports(DB); await DB.prepare('DELETE FROM reports WHERE day < ?').bind(old).run();
  await ensureErrs(DB); await DB.prepare('DELETE FROM errs WHERE day < ?').bind(day(Date.now() - 30 * 864e5)).run();
  await ensurePurchases(DB); // purchase records: two years (a consumed purchase cannot be claimed again anyway, see gpVerify)
  await DB.prepare('DELETE FROM purchases WHERE ts < ?').bind(Date.now() - 730 * 864e5).run();
  await DB.prepare('DELETE FROM purchase_installs WHERE token NOT IN (SELECT token FROM purchases)').run();
}

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
  async scheduled(evt, env, ctx) { ctx.waitUntil(housekeeping(env.DB)); },
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
        if (!(score > 0 && score < 5e7) || !(secs >= 5 && secs <= MAX_SECS) || score / secs > MAX_RATE) return json(req, { ok: false, err: 'score' }, 400);
        if (!(await integrityGate(env, b.it, `${b.pid}|${d}|${score}|${secs}`))) return json(req, { ok: false, err: 'integrity' }, 403);
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
        await ensureReports(DB);
        const rep = await DB.prepare('SELECT pid, COUNT(*) AS n FROM reports WHERE day = ? GROUP BY pid').bind(d).all(), hidden = new Set((rep.results || []).filter(x => x.n >= HIDE_AT).map(x => x.pid));
        const list = await Promise.all((top.results || []).map(async (x, i) => ({ r: i + 1, k: await rowKey(d, x.pid), name: hidden.has(x.pid) && x.pid !== pid ? 'PİLOT' : x.name, score: x.score, me: x.pid === pid })));
        let me = null;
        if (okPid(pid)) { const m = await DB.prepare('SELECT score FROM scores WHERE day = ? AND pid = ?').bind(d, pid).first();
          if (m) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, m.score).first(); me = { rank: r.n + 1, score: m.score }; } }
        const t = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ?').bind(d).first();
        return json(req, { day: d, list, me, total: t ? t.n : 0 });
      }
      if (url.pathname === '/report' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!okDay(b.day) || !okPid(b.by) || typeof b.k !== 'string' || !/^[a-f0-9]{12}$/.test(b.k)) return json(req, { ok: false }, 400);
        const top = await DB.prepare('SELECT pid FROM scores WHERE day = ? ORDER BY score DESC, ts ASC LIMIT 50').bind(b.day).all();
        let target = null;
        for (const x of top.results || []) if (await rowKey(b.day, x.pid) === b.k) { target = x.pid; break; }
        if (!target || target === b.by) return json(req, { ok: false });
        await ensureReports(DB);
        await DB.prepare('INSERT OR IGNORE INTO reports (day, pid, by, ts) VALUES (?, ?, ?, ?)').bind(b.day, target, b.by, Date.now()).run();
        return json(req, { ok: true });
      }
      if (url.pathname === '/prizes' && req.method === 'GET') {
        const pid = url.searchParams.get('pid'); if (!okPid(pid)) return json(req, { list: [] });
        await settle(DB, day(Date.now() - 864e5)); // yesterday, in case the daily cron has not run yet (one cheap read once it has)
        const r = await DB.prepare('SELECT day, rank, stars FROM prizes WHERE pid = ? AND claimed = 0 AND day >= ? ORDER BY day').bind(pid, day(Date.now() - 7 * 864e5)).all();
        return json(req, { list: r.results || [] });
      }
      if (url.pathname === '/claim' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!okPid(b.pid) || !okDay(b.day)) return json(req, { ok: false }, 400);
        if (!(await integrityGate(env, b.it, `${b.pid}|${b.day}|claim`))) return json(req, { ok: false, err: 'integrity' }, 403);
        const p = await DB.prepare('SELECT stars, claimed FROM prizes WHERE day = ? AND pid = ?').bind(b.day, b.pid).first();
        if (!p || p.claimed) return json(req, { ok: false, stars: 0 });
        const u = await DB.prepare('UPDATE prizes SET claimed = 1 WHERE day = ? AND pid = ? AND claimed = 0').bind(b.day, b.pid).run();
        return json(req, { ok: !!(u.meta && u.meta.changes), stars: u.meta && u.meta.changes ? p.stars : 0 });
      }
      if (url.pathname === '/ack' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!ACK_SKUS.includes(b.sku) || typeof b.token !== 'string' || b.token.length < 10 || b.token.length > 600) return json(req, { ok: false }, 400);
        if (!env.GP_SA || !env.GP_PKG) return json(req, { ok: false, err: 'not configured' }, 503);
        return json(req, { ok: await gpAck(env, b.sku, b.token, !!b.sub) });
      }
      if (url.pathname === '/err' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const m = clip(b.m, 300); if (!m) return json(req, { ok: false }, 400);
        const s2 = clip(b.s, 900), v = clip(b.v, 20), p = b.p === 'app' ? 'app' : 'web', l = clip(b.l, 5), d = day();
        await ensureErrs(DB);
        const h = (await sha(m + '|' + s2.split('\n')[0] + '|' + v + '|' + p)).slice(0, 16);
        const up = await DB.prepare('UPDATE errs SET n = n + 1 WHERE day = ? AND h = ?').bind(d, h).run();
        if (!(up.meta && up.meta.changes)) {
          const c = await DB.prepare('SELECT COUNT(*) AS n FROM errs WHERE day = ?').bind(d).first();
          if (!c || c.n < 300) await DB.prepare('INSERT OR IGNORE INTO errs (day, h, m, s, v, p, l) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(d, h, m, s2, v, p, l).run();
        }
        return json(req, { ok: true });
      }
      if (url.pathname === '/errs' && req.method === 'GET') {
        const days = Math.min(30, Math.max(1, +url.searchParams.get('days') || 3));
        await ensureErrs(DB);
        const r = await DB.prepare('SELECT day, m, s, v, p, n FROM errs WHERE day >= ? ORDER BY n DESC LIMIT 60').bind(day(Date.now() - (days - 1) * 864e5)).all();
        return json(req, { list: r.results || [] });
      }
      if (url.pathname === '/verify' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!okPid(b.pid) || !SKUS[b.sku] || typeof b.token !== 'string' || b.token.length < 10 || b.token.length > 600) return json(req, { ok: false }, 400);
        if (!env.GP_SA || !env.GP_PKG) return json(req, { ok: false, err: 'not configured' }, 503);
        return json(req, await gpVerify(env, DB, b.pid, b.sku, b.token));
      }
      if (url.pathname === '/' ) return json(req, { ok: true, service: 'blackhole-storm-leaderboard', day: day() });
      return json(req, { ok: false, err: 'not found' }, 404);
    } catch (e) { return json(req, { ok: false, err: 'server' }, 500); }
  }
};
