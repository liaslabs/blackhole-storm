# Blackhole Storm · world leaderboard (Daily Storm)

A Cloudflare Worker with a D1 (SQLite) database. Free plan is enough.
The game works without it; the world tab says "coming soon" until the Worker's URL is set.

## Deploy (one time, ~10 minutes)

1. Create a free Cloudflare account and install Node.js on your computer.
2. In this `server/` folder:
   ```
   npx wrangler login
   npx wrangler d1 create blackhole-storm
   ```
   Copy the `database_id` it prints into `wrangler.toml`.
3. Create the tables and deploy:
   ```
   npx wrangler d1 execute blackhole-storm --remote --file=schema.sql
   npx wrangler deploy
   ```
   Wrangler prints the Worker URL, e.g. `https://blackhole-storm-lb.<you>.workers.dev`.
4. Open that URL in a browser: it should answer `{"ok":true,...}`.
5. Tell the game where it is: in `src/game.src.html` the app reads `window.BHS_LB_URL`.
   Add this line near the top of the page's first `<script>` (or ask Claude to do it) and rebuild:
   ```
   window.BHS_LB_URL='https://blackhole-storm-lb.<you>.workers.dev';
   ```

## What it stores
One row per install per UTC day: random install id, player name (max 11 chars), best score, run length, time.
Prize rows for each finished day's top 3 (1000 / 500 / 250 stars). Rows older than 90 days are deleted.
This matches `privacy.html`; update both together.

## Endpoints
| Method | Path | Body / query | Answer |
|---|---|---|---|
| POST | `/score` | `{pid,name,score,secs,day}` | `{ok,best,rank,total}` |
| GET | `/top` | `?day=YYYY-MM-DD&pid=` | top 50 + your rank |
| GET | `/prizes` | `?pid=` | unclaimed prizes (last 7 days) |
| POST | `/claim` | `{pid,day}` | `{ok,stars}` once |

Checks: allowed origins (`ALLOWED` in `worker.js`), a points-per-second ceiling, 40 submissions per install per day.
A determined cheater can still post a fake score (there are no accounts); if that happens, delete the row with
`npx wrangler d1 execute blackhole-storm --remote --command "DELETE FROM scores WHERE pid='...'"`.
