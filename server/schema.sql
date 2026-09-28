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
