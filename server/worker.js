// Blackhole Storm leaderboard: a Cloudflare Worker in front of a D1 database (binding: DB).
// Daily Storm (the survival mode's daily scenario): one best score per install per UTC day.
// The top 3 of each finished day win stars (1000 / 500 / 250), claimed once from the app.
// Endpoints (JSON):
//   POST /score   {pid,name,score,secs,day,av}   -> {ok,best,rank,total}   av: the player's avatar key (optional, 1.5.0+)
//   GET  /top?day=YYYY-MM-DD&pid=...             -> {day,list:[{r,k,name,score,me,av}],me:{rank,score}|null,total}   k: opaque row handle
//   POST /report  {day,k,by}                       -> {ok}   reports a name; three reporters hide it for that day (a reporter must have played that day, 3 reports a day)
//   GET  /prizes?pid=...                         -> {list:[{day,rank,stars}]}   (unclaimed, last 7 days)
//   POST /claim   {pid,day}                      -> {ok,stars}
//   POST /ack     {sku,token,sub}                -> {ok}   checks a Google Play purchase and acknowledges it (web/TWA version)
//   POST /err     {m,s,v,p,l}                    -> {ok}   a script error from the game (message, top of stack, build, app/web,
//                                                   language); counted per day, no personal data, kept 30 days
//   /fleet..., /fleets/top                         -> fleets (1.5.1), see server/fleet.js
//   GET  /errs?days=3                            -> {list:[{day,m,s,v,p,n}]}   the most frequent recent errors
//   POST /ping    {v,p,l}                        -> {ok}   the game was opened today (once a day per install; no id)
//   GET  /pings?days=14                          -> {list:[{day,v,p,l,n}]}   how many installs opened which version each day
//                                                   (1.5.1: the ping may carry a: the install's age band, counted as the event age_<a>)
//   POST /ev      {v,p,d,e:{key:n}}             -> {ok}   play counts since the last send (1.5.1): only these keys, summed per day,
//                                                   version and app/web; no install id. Kept 120 days
//   GET  /evs?days=14                            -> {list:[{day,v,p,e,n}]}
//   POST /live    {}                             -> {ok}   the game is open: each install says so once per 5-minute slot, so a slot's
//                                                   count is how many play at the same time (no id). Kept 3 days
//   GET  /live?days=3                            -> {list:[{slot,n}]}   slot: minutes since 1970 / 5
//   POST /itv     {pid,day,it}                   -> {ok,vf}   the app's daily device check (Play Integrity), used for fleet points
//   GET  /sus?day=YYYY-MM-DD                     -> {scores:[...],fm:[...]}   results close to the ceilings, for a look by hand
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
const MAX_SECS = 3600;        // Survival is endless since 1.4.9 (it lasted 180 s before): an hour is beyond any real run
const MAX_RATE = 4000;        // points per second no real run reaches (Rage ×2 and ×5 combos top out well below this)

const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const okPid = p => typeof p === 'string' && /^[a-z0-9]{12,40}$/.test(p);
const okDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
// Names others can see: the shared filter (src/names.js, also inlined into the game): 11 languages, look-alike letters, links, phone numbers
import '../src/names.js';
import '../src/fmis.js';
import { fleetRoute, fleetHousekeeping } from './fleet.js';
const NAMES = globalThis.BHS_NAMES;
const badName = n => NAMES.bad(n);
function cleanName(n) {
  n = typeof n === 'string' ? n : '';
  n = n.replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').trim();
  n = [...n].slice(0, 11).join('');
  return n && NAMES.check(n, 'player').ok ? n : 'PİLOT';
}
// Avatars shown next to names (1.5.0): only the game's own avatar keys are kept (keep in step with AVX in src/game.src.html)
const AV_KEYS = new Set(['🚀','🔭','☄️','🌌','🪐','👾','🎧','✨','💠','🔥','🧭','🪖','🗺️','💫','⚓','🌠','🪶','🌑','🎯','🌗','🌀','👻','🌅','🦾','🛰️','🛸','📜','🌟','🧿','🧝','🤖','📺','🕷️','🔋','🕊️','🎛️','🔮','🧠','🏍️','⚙️','👽','🔺','🗡️','🧙','🐉','⚡','🐋','🐲','🔷','👹']);
const cleanAv = a => typeof a === 'string' && AV_KEYS.has(a) ? a : null;
globalThis.BHS_AV_KEYS = AV_KEYS; // fleets use the same keys for emblems and member avatars
let avReady = false;
async function ensureAv(DB) { // adds the column once to a database made before 1.5.0
  if (avReady) return;
  try { await DB.prepare('ALTER TABLE scores ADD COLUMN av TEXT').run(); } catch (e) { /* already there */ }
  // 1.5.1: vs = the day's best verified score (0: none yet); rows from before have none, and their score counts as verified
  try { await DB.prepare('ALTER TABLE scores ADD COLUMN vs INTEGER').run(); } catch (e) { /* already there */ }
  avReady = true;
}
// Players can report a name on the ranking; three different reporters hide it for everyone that day.
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
const HIDE_AT = 3, REPORTS_A_DAY = 3; // three different players hide a name for the day; each may report three names a day
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
  const r = await fetch(base, { headers: h });
  if (!r.ok) return [400, 404, 410].includes(r.status) ? { ok: false } : { ok: false, err: 'gp' + r.status }; // a bad token is refused; our access or Google failing is "ask again later" (err), so a real purchase is never turned away
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
async function integrityOk(env, it, hash) { return (await integrityWhy(env, it, hash)) === 'ok'; }
// 'ok', or why not, in a few letters (kept as the daily total it_bad_<why>, so a failing check can be told apart without logs)
async function integrityWhy(env, it, hash) {
  if (typeof it !== 'string' || it.length < 20 || it.length > 8000) return 'tok';
  if (!env.GP_SA || !env.GP_PKG) return 'cfg';
  const t = await gpToken(env, 'https://www.googleapis.com/auth/playintegrity');
  const r = await fetch('https://playintegrity.googleapis.com/v1/' + encodeURIComponent(env.GP_PKG) + ':decodeIntegrityToken', { method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ integrity_token: it }) });
  if (!r.ok) return 'http' + r.status;
  const v = (await r.json()).tokenPayloadExternal || {}, rd = v.requestDetails || {}, app = v.appIntegrity || {}, dev = (v.deviceIntegrity || {}).deviceRecognitionVerdict || [];
  if (rd.requestHash !== hash) return 'hash';
  if (rd.requestPackageName !== env.GP_PKG) return 'pkg';
  if (!(Math.abs(Date.now() - +rd.timestampMillis) < 10 * 6e4)) return 'time';
  // the app, device and licence verdicts in short (app_unevaluated.dev_none.lic_unevaluated), so a refusal says which part failed
  const sh = x => String(x || 'none').toLowerCase().replace(/^(play_|meets_)/, '').replace(/_integrity$/, '').replace(/[^a-z]/g, '').slice(0, 12);
  const all = `app_${sh(app.appRecognitionVerdict)}.dev_${dev.length ? dev.map(sh).join('+') : 'none'}.lic_${sh((v.accountDetails || {}).appLicensingVerdict)}`;
  if (app.appRecognitionVerdict !== 'PLAY_RECOGNIZED' || !dev.includes('MEETS_DEVICE_INTEGRITY')) return all;
  return 'ok';
}
// 1.5.1 trust model: 'ok' (Play vouches for the app and the device, or one of the owner's test phones), 'unv' (nobody can
// vouch: no token, the web, an unlocked or rooted phone) or 'mod' (Play does not know this build: a modified copy). Only in
// enforce mode does it change anything: 'mod' is refused, 'unv' is kept out of the main ranking, the prizes and the fleets.
async function integrityClass(env, it, what) {
  const mode = env.INTEGRITY || 'off'; if (mode === 'off') return 'ok';
  const pid = what.split('|')[0], trusted = String(env.TRUST_PIDS || '').split(',').map(x => x.trim()).filter(Boolean).includes(pid);
  let why = 'err'; try { why = await integrityWhy(env, it, await sha(what)); } catch (e) { why = 'err'; }
  if (why !== 'ok' && trusted) why = 'trust'; // the owner's own test phones (secret TRUST_PIDS), e.g. with an unlocked bootloader
  const ok = why === 'ok' || why === 'trust';
  // a daily total of the verdicts (it_ok; it_none: no token, as from the web; it_bad_<why>: a token that failed), read by tools/rapor.mjs
  try { await ensureEvs(env.DB); await evAdd(env.DB, day(), '-', '-', why === 'trust' ? 'it_trust' : ok ? 'it_ok' : it ? 'it_bad_' + why : 'it_none', 1).run(); } catch (e) {}
  if (mode === 'log') { console.log('integrity', ok ? 'pass' : 'fail', pid.slice(0, 4)); return 'ok'; }
  return ok ? 'ok' : why.startsWith('app_unrecognized') ? 'mod' : 'unv';
}
const vfOn = env => env.INTEGRITY === 'enforce'; // the main ranking shows only verified scores
// the install's device verdict for the day (POST /itv), used where a request carries no token of its own (fleet points)
let itvReady = false;
async function ensureItv(DB) {
  if (itvReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS itv (day TEXT NOT NULL, pid TEXT NOT NULL, cls TEXT NOT NULL, PRIMARY KEY (day, pid))').run();
  itvReady = true;
}
async function deviceOk(env, DB, pid) {
  if (!vfOn(env)) return true;
  if (String(env.TRUST_PIDS || '').split(',').map(x => x.trim()).includes(pid)) return true;
  await ensureItv(DB);
  const r = await DB.prepare("SELECT 1 AS x FROM itv WHERE pid = ? AND day IN (?, ?) AND cls = 'ok'").bind(pid, day(), day(Date.now() - 36e5 * 2)).first();
  return !!r;
}
let errReady = false;
// Daily opens: one count per install per UTC day (the game sends it at most once a day), by version, app/web and language. No install number.
let pingReady = false;
async function ensurePings(DB) {
  if (pingReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS pings (day TEXT NOT NULL, v TEXT NOT NULL, p TEXT NOT NULL, l TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (day, v, p, l))').run();
  pingReady = true;
}
// 1.5.1 play counts: the keys the game may send (anything else is dropped)
const EV_KEY = /^(tut[123]|lv(1|3|5|10)|d1_[abcd]|fl_join|fm_play|shop|ad|ntf_[yn]|s[io]_[a-z]{2,8}|cl_(found|rest|new)|l[wf]_\d{1,2}|u_[a-z]{2}_\d{1,2}|p_[a-z0-9_]{2,16}|ps_[a-z]{2}|pl_\d{1,2}|pa_(\d{1,2}|x)|g_[a-z]{2,6}|m_[a-z]{2,6})$/; // m_: menu buttons (18 Oct)
const AGE = /^(0|1|2|4|8|15|31|x)$/;
let evReady = false;
async function ensureEvs(DB) {
  if (evReady) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS evs (day TEXT NOT NULL, v TEXT NOT NULL, p TEXT NOT NULL, e TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, v, p, e))').run();
  await DB.prepare('CREATE TABLE IF NOT EXISTS live (slot INTEGER PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)').run();
  evReady = true;
}
const evAdd = (DB, d, v, p, e, n) => DB.prepare('INSERT INTO evs (day, v, p, e, n) VALUES (?, ?, ?, ?, ?) ON CONFLICT (day, v, p, e) DO UPDATE SET n = n + excluded.n').bind(d, v, p, e, n);
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
  await ensurePings(DB); await DB.prepare('DELETE FROM pings WHERE day < ?').bind(old).run();
  await ensureEvs(DB); await DB.prepare('DELETE FROM evs WHERE day < ?').bind(day(Date.now() - 120 * 864e5)).run();
  await DB.prepare('DELETE FROM live WHERE slot < ?').bind(Math.floor(Date.now() / 3e5) - 3 * 288).run();
  await ensureItv(DB); await DB.prepare('DELETE FROM itv WHERE day < ?').bind(day(Date.now() - 3 * 864e5)).run();
  await ensurePurchases(DB); // purchase records: two years (a consumed purchase cannot be claimed again anyway, see gpVerify)
  await DB.prepare('DELETE FROM purchases WHERE ts < ?').bind(Date.now() - 730 * 864e5).run();
  await DB.prepare('DELETE FROM purchase_installs WHERE token NOT IN (SELECT token FROM purchases)').run();
  await fleetHousekeeping(DB); // settles the finished week, hands over from away captains, removes empty fleets
}

// Settle a finished day once: its top 3 get prize rows.
async function settle(DB, d) {
  if (d >= day()) return;
  const done = await DB.prepare('SELECT COUNT(*) AS n FROM prizes WHERE day = ?').bind(d).first();
  if (done && done.n) return;
  await ensureAv(DB); // verified scores only (vs; rows from before 1.5.1 count with their score)
  const top = await DB.prepare('SELECT pid FROM scores WHERE day = ? AND COALESCE(vs, score) > 0 ORDER BY COALESCE(vs, score) DESC, ts ASC LIMIT 3').bind(d).all();
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
      const fr = await fleetRoute(url, req, DB, json, cleanName, pid => deviceOk(env, DB, pid)); if (fr) return fr; // /fleet... and /fleets/top (server/fleet.js)
      if (url.pathname === '/score' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const today = day(), d = okDay(b.day) ? b.day : today;
        if (d !== today && d !== day(Date.now() - 36e5 * 2)) return json(req, { ok: false, err: 'day' }, 400); // a run that started just before midnight still counts
        if (!okPid(b.pid)) return json(req, { ok: false, err: 'pid' }, 400);
        const score = Math.floor(+b.score), secs = Math.floor(+b.secs);
        if (!(score > 0 && score < 5e7) || !(secs >= 5 && secs <= MAX_SECS) || score / secs > MAX_RATE) return json(req, { ok: false, err: 'score' }, 400);
        const cls = await integrityClass(env, b.it, `${b.pid}|${d}|${score}|${secs}`);
        if (cls === 'mod') return json(req, { ok: false, err: 'integrity' }, 403);
        const name = cleanName(b.name), av = cleanAv(b.av), now = Date.now(), vsc = cls === 'ok' ? score : 0;
        await ensureAv(DB);
        const cur = await DB.prepare('SELECT score, subs FROM scores WHERE day = ? AND pid = ?').bind(d, b.pid).first();
        if (cur && cur.subs >= MAX_SUBS) return json(req, { ok: false, err: 'rate' }, 429);
        if (cur) await DB.prepare('UPDATE scores SET vs = MAX(COALESCE(vs, score), ?) WHERE day = ? AND pid = ?').bind(vsc, d, b.pid).run();
        if (!cur) await DB.prepare('INSERT INTO scores (day, pid, name, score, secs, ts, av, vs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(d, b.pid, name, score, secs, now, av, vsc).run();
        else if (score > cur.score) await DB.prepare('UPDATE scores SET score = ?, secs = ?, ts = ?, name = ?, av = COALESCE(?, av), subs = subs + 1 WHERE day = ? AND pid = ?').bind(score, secs, now, name, av, d, b.pid).run();
        else await DB.prepare('UPDATE scores SET subs = subs + 1, name = ?, av = COALESCE(?, av) WHERE day = ? AND pid = ?').bind(name, av, d, b.pid).run();
        const best = Math.max(score, cur ? cur.score : 0);
        if (vfOn(env)) { // the main ranking counts verified scores only; an unverified best gets its place among everyone (rall)
          const v = await DB.prepare('SELECT COALESCE(vs, score) AS v FROM scores WHERE day = ? AND pid = ?').bind(d, b.pid).first(), vb = v ? v.v : 0;
          const t = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND COALESCE(vs, score) > 0').bind(d).first();
          if (vb > 0) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND COALESCE(vs, score) > ?').bind(d, vb).first(); return json(req, { ok: true, best: vb, rank: r.n + 1, total: t ? t.n : 1, vf: 1 }); }
          const ra = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, best).first();
          return json(req, { ok: true, best, rank: null, rall: ra.n + 1, total: t ? t.n : 0, vf: 0 });
        }
        const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, best).first();
        const t = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ?').bind(d).first();
        return json(req, { ok: true, best, rank: (r ? r.n : 0) + 1, total: t ? t.n : 1 });
      }
      if (url.pathname === '/top' && req.method === 'GET') {
        const d = okDay(url.searchParams.get('day')) ? url.searchParams.get('day') : day(), pid = url.searchParams.get('pid');
        await ensureAv(DB);
        const vfo = vfOn(env), SC = vfo ? 'COALESCE(vs, score)' : 'score'; // with the trust model on, only verified scores are listed
        const top = await DB.prepare(`SELECT pid, name, ${SC} AS score, av FROM scores WHERE day = ? AND ${SC} > 0 ORDER BY ${SC} DESC, ts ASC LIMIT 50`).bind(d).all();
        await ensureReports(DB);
        const rep = await DB.prepare('SELECT pid, COUNT(*) AS n FROM reports WHERE day = ? GROUP BY pid').bind(d).all(), hidden = new Set((rep.results || []).filter(x => x.n >= HIDE_AT).map(x => x.pid));
        const list = await Promise.all((top.results || []).map(async (x, i) => ({ r: i + 1, k: await rowKey(d, x.pid), name: hidden.has(x.pid) && x.pid !== pid ? 'PİLOT' : x.name, score: x.score, me: x.pid === pid, av: hidden.has(x.pid) && x.pid !== pid ? null : cleanAv(x.av) })));
        let me = null;
        if (okPid(pid)) { const m = await DB.prepare(`SELECT score, ${SC} AS v FROM scores WHERE day = ? AND pid = ?`).bind(d, pid).first();
          if (m && m.v > 0) { const r = await DB.prepare(`SELECT COUNT(*) AS n FROM scores WHERE day = ? AND ${SC} > ?`).bind(d, m.v).first(); me = { rank: r.n + 1, score: m.v }; }
          else if (m) { const r = await DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE day = ? AND score > ?').bind(d, m.score).first(); me = { rank: null, rall: r.n + 1, score: m.score, vf: 0 }; } }
        const t = await DB.prepare(`SELECT COUNT(*) AS n FROM scores WHERE day = ? AND ${SC} > 0`).bind(d).first();
        return json(req, { day: d, list, me, total: t ? t.n : 0, vfo: vfo ? 1 : 0 });
      }
      if (url.pathname === '/report' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!okDay(b.day) || !okPid(b.by) || typeof b.k !== 'string' || !/^[a-f0-9]{12}$/.test(b.k)) return json(req, { ok: false }, 400);
        const top = await DB.prepare('SELECT pid FROM scores WHERE day = ? ORDER BY score DESC, ts ASC LIMIT 50').bind(b.day).all();
        let target = null;
        for (const x of top.results || []) if (await rowKey(b.day, x.pid) === b.k) { target = x.pid; break; }
        if (!target || target === b.by) return json(req, { ok: false });
        // only someone who played the day's storm may report, and only a few names, so reports cannot be thrown around to annoy
        if (!(await DB.prepare('SELECT 1 AS x FROM scores WHERE day = ? AND pid = ?').bind(b.day, b.by).first())) return json(req, { ok: false, err: 'noplay' });
        await ensureReports(DB);
        const done = await DB.prepare('SELECT COUNT(*) AS n, SUM(pid = ?) AS same FROM reports WHERE day = ? AND by = ?').bind(target, b.day, b.by).first();
        if (done && done.same) return json(req, { ok: true });
        if (done && done.n >= REPORTS_A_DAY) return json(req, { ok: false, err: 'limit' });
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
        if ((await integrityClass(env, b.it, `${b.pid}|${b.day}|claim`)) === 'mod') return json(req, { ok: false, err: 'integrity' }, 403); // prizes go to verified scores only (settle)
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
      if (url.pathname === '/ping' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const v = typeof b.v === 'string' && /^bhs-v\d{1,4}$/.test(b.v) ? b.v : null, p = b.p === 'app' ? 'app' : 'web', l = typeof b.l === 'string' && /^[a-z]{2}$/.test(b.l) ? b.l : '--';
        if (!v) return json(req, { ok: false }, 400);
        await ensurePings(DB);
        await DB.prepare('INSERT INTO pings (day, v, p, l, n) VALUES (?, ?, ?, ?, 1) ON CONFLICT (day, v, p, l) DO UPDATE SET n = n + 1').bind(day(), v, p, l).run();
        if (typeof b.a === 'string' && AGE.test(b.a)) { await ensureEvs(DB); await evAdd(DB, day(), v, p, 'age_' + b.a, 1).run(); }
        return json(req, { ok: true });
      }
      if (url.pathname === '/itv' && req.method === 'POST') { // the app's device check, once a day (fleet points have no token of their own)
        const b = await req.json().catch(() => ({})), today = day();
        if (!okPid(b.pid) || !okDay(b.day) || (b.day !== today && b.day !== day(Date.now() - 36e5 * 2))) return json(req, { ok: false }, 400);
        const cls = await integrityClass(env, b.it, `${b.pid}|${b.day}|itv`);
        await ensureItv(DB);
        await DB.prepare('INSERT OR REPLACE INTO itv (day, pid, cls) VALUES (?, ?, ?)').bind(b.day, b.pid, cls).run();
        return json(req, { ok: true, vf: cls === 'ok' ? 1 : 0 });
      }
      if (url.pathname === '/ev' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const v = typeof b.v === 'string' && /^bhs-v\d{1,4}$/.test(b.v) ? b.v : null, p = b.p === 'app' ? 'app' : 'web', today = day();
        const d = okDay(b.d) && b.d <= today && b.d >= day(Date.now() - 3 * 864e5) ? b.d : today; // counts kept on the phone a few days still land on their day
        const e = b.e && typeof b.e === 'object' && !Array.isArray(b.e) ? Object.entries(b.e).filter(([k, n]) => EV_KEY.test(k) && Number.isFinite(+n) && +n >= 1).slice(0, 120) : [];
        if (!v || !e.length) return json(req, { ok: false }, 400);
        await ensureEvs(DB);
        await DB.batch(e.map(([k, n]) => evAdd(DB, d, v, p, k, Math.min(k[0] === 's' && k[2] === '_' ? 1e6 : 50, Math.floor(+n)))));
        return json(req, { ok: true });
      }
      if (url.pathname === '/evs' && req.method === 'GET') {
        const days = Math.min(120, Math.max(1, +url.searchParams.get('days') || 14));
        await ensureEvs(DB);
        const r = await DB.prepare('SELECT day, v, p, e, n FROM evs WHERE day >= ? ORDER BY day DESC, e').bind(day(Date.now() - (days - 1) * 864e5)).all();
        return json(req, { list: r.results || [] });
      }
      if (url.pathname === '/live' && req.method === 'POST') {
        await ensureEvs(DB);
        await DB.prepare('INSERT INTO live (slot, n) VALUES (?, 1) ON CONFLICT (slot) DO UPDATE SET n = n + 1').bind(Math.floor(Date.now() / 3e5)).run();
        return json(req, { ok: true });
      }
      if (url.pathname === '/live' && req.method === 'GET') {
        const days = Math.min(3, Math.max(1, +url.searchParams.get('days') || 1));
        await ensureEvs(DB);
        const r = await DB.prepare('SELECT slot, n FROM live WHERE slot >= ? ORDER BY slot').bind(Math.floor(Date.now() / 3e5) - days * 288).all();
        return json(req, { list: r.results || [] });
      }
      if (url.pathname === '/sus' && req.method === 'GET') { // results near the ceilings: a list to look at by hand, nothing is removed
        const d = okDay(url.searchParams.get('day')) ? url.searchParams.get('day') : day(Date.now() - 864e5);
        const sc = await DB.prepare('SELECT substr(pid, 1, 6) AS k, name, score, secs, subs FROM scores WHERE day = ? AND score > secs * ? ORDER BY score * 1.0 / secs DESC LIMIT 20').bind(d, MAX_RATE * 0.6).all();
        const F = globalThis.BHS_FMIS, ms = F ? F.day(d) : [], fm = [];
        for (const m of ms) {
          let r = { results: [] }; try { r = await DB.prepare('SELECT substr(pid, 1, 6) AS k, id, best, tries FROM fleet_fm WHERE day = ? AND id = ? AND best >= ? ORDER BY best DESC LIMIT 10').bind(d, m.id, Math.max(m.tg[2] * 2, Math.floor(m.max * 0.6))).all(); } catch (e) {}
          fm.push(...(r.results || []));
        }
        return json(req, { day: d, rate: MAX_RATE, scores: sc.results || [], fm });
      }
      if (url.pathname === '/pings' && req.method === 'GET') {
        const days = Math.min(90, Math.max(1, +url.searchParams.get('days') || 14));
        await ensurePings(DB);
        const r = await DB.prepare('SELECT day, v, p, l, n FROM pings WHERE day >= ? ORDER BY day DESC, n DESC').bind(day(Date.now() - (days - 1) * 864e5)).all();
        return json(req, { list: r.results || [] });
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
