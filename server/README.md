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

## Telefondan yükleme (GitHub Actions)

Bilgisayar gerekmez. Bir kez:

1. **Cloudflare API anahtarı:** dash.cloudflare.com → sağ üstte profil → **My Profile → API Tokens → Create Token** →
   "**Edit Cloudflare Workers**" şablonu → **Use template**. *Permissions* listesine **Add more** ile
   **Account · D1 · Edit** satırını da ekle. *Account Resources*: kendi hesabın. **Continue to summary → Create Token**.
   Çıkan anahtarı kopyala (bir daha gösterilmez).
2. GitHub → depo → **Settings → Secrets and variables → Actions → New repository secret**:
   `CLOUDFLARE_API_TOKEN` = 1. adımdaki anahtar. (Hesap kimliği gizli değil; `wrangler.toml` içinde yazılı.)

Her yüklemede: GitHub → **Actions → "Sunucuyu yayınla" → Run workflow**. Yeşil tik ve özetteki "Sunucu yüklendi ✓" yazısı tamam demektir.

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
| POST | `/ack` | `{sku,token,sub}` | `{ok}`: checks a Google Play purchase and acknowledges it (needs `GP_PKG` and `GP_SA` secrets, see `MONETIZATION.md`) |
| POST | `/verify` | `{pid,sku,token}` | `{ok,pending?}`: the Android app's purchase check: Google says it is real and paid, the token is recorded (no replay), then consumed or acknowledged. Same secrets |

## Daily housekeeping
`wrangler.toml` has a cron trigger (00:07 UTC): it settles the finished days' prizes and deletes rows older than 90 days.
`GET /prizes` only reads, so opening the menu costs almost nothing. `npx wrangler deploy` installs the cron with the Worker.

Checks: allowed origins (`ALLOWED` in `worker.js`), a points-per-second ceiling, 40 submissions per install per day.
A determined cheater can still post a fake score (there are no accounts); if that happens, delete the row with
`npx wrangler d1 execute blackhole-storm --remote --command "DELETE FROM scores WHERE pid='...'"`.

Fleet missions: `/fleet/fm/start` records when a try began; `/fleet/fm` refuses a result that claims more play time than has
passed since (10 s slack; the try before also counts, so a late, queued result still lands), on top of the mission's `max`.

## Play counts (1.5.1)
`POST /ev` takes anonymous daily totals from the game (only the keys in `EV_KEY`), `POST /live` counts installs open in each
5-minute slot, and the daily ping may carry the install's age band. No install id is stored. Read them all at once with
`node tools/rapor.mjs [days]`: opens, return by install age, the first-ten-minutes funnel, stars by screen, players at the same
time, frequent errors and results near the ceilings (`GET /sus`, for a look by hand; nothing is removed automatically).

## Yedek (backup)
Two layers, both free:
1. **D1 Time Travel** (built in): restores the database to any minute of the last days:
   `npx wrangler d1 time-travel info blackhole-storm`, then `... time-travel restore blackhole-storm --timestamp=<ISO time>`.
2. **Weekly export** (`.github/workflows/d1-backup.yml`, Mondays 03:17 UTC, or by hand): a full SQL export, gzipped and
   encrypted with the repository secret `BACKUP_KEY`, kept 90 days as a workflow artifact. Keep the key somewhere outside
   GitHub too; without it a backup cannot be opened, and the job refuses to run without it. The export holds install ids and
   player names, so it is never stored unencrypted. Restore: download the artifact, then
   ```
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_KEY -in d1.sql.gz.enc | gunzip > d1.sql
   npx wrangler d1 execute blackhole-storm --local --file d1.sql    # try locally first; --remote only on purpose
   ```
   A schedule only runs from the default branch, so the file must also be on `main`.
