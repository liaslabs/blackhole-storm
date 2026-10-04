-- Blackhole Storm leaderboard (Cloudflare D1)
-- One row per player per day: only the best Daily Storm score counts.
CREATE TABLE IF NOT EXISTS scores (
  day   TEXT    NOT NULL,          -- UTC date, YYYY-MM-DD
  pid   TEXT    NOT NULL,          -- random install id made by the app (no account, no personal data)
  name  TEXT    NOT NULL,          -- player name as typed in the app (max 11 characters)
  score INTEGER NOT NULL,
  secs  INTEGER NOT NULL,          -- how long the run lasted
  ts    INTEGER NOT NULL,          -- unix ms of the best submission
  subs  INTEGER NOT NULL DEFAULT 1,-- submissions that day (rate limit)
  PRIMARY KEY (day, pid)
);
CREATE INDEX IF NOT EXISTS scores_day_score ON scores (day, score DESC);

-- Daily prizes for the top 3 of a finished day; claimed once from the app.
CREATE TABLE IF NOT EXISTS prizes (
  day     TEXT    NOT NULL,
  pid     TEXT    NOT NULL,
  rank    INTEGER NOT NULL,
  stars   INTEGER NOT NULL,
  claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, pid)
);

-- Reported names: two different players reporting a name hides it on that day's ranking.
CREATE TABLE IF NOT EXISTS reports (
  day TEXT    NOT NULL,
  pid TEXT    NOT NULL,          -- the reported player's install id
  by  TEXT    NOT NULL,          -- the reporter's install id (one report each)
  ts  INTEGER NOT NULL,
  PRIMARY KEY (day, pid, by)
);

-- Google Play purchases the app has had checked (POST /verify). A consumable token is granted once, to the install
-- that bought it; one-time products may be restored on a new install. Kept so a token cannot be replayed.
CREATE TABLE IF NOT EXISTS purchases (
  token TEXT    PRIMARY KEY,       -- Google Play purchase token
  sku   TEXT    NOT NULL,
  pid   TEXT    NOT NULL,          -- install id that first claimed it
  ts    INTEGER NOT NULL
);

-- Installs that restored a one-time product or subscription (at most 5 per purchase).
CREATE TABLE IF NOT EXISTS purchase_installs (
  token TEXT NOT NULL,
  pid   TEXT NOT NULL,
  PRIMARY KEY (token, pid)
);

-- Script errors reported by the game (no personal data): one row per distinct error per day with a count; 30 days.
CREATE TABLE IF NOT EXISTS errs (
  day TEXT NOT NULL, h TEXT NOT NULL, m TEXT NOT NULL, s TEXT NOT NULL, v TEXT NOT NULL, p TEXT NOT NULL, l TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (day, h)
);
