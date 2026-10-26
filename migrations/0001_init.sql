CREATE TABLE IF NOT EXISTS enquiries (
  id            INTEGER PRIMARY KEY,
  ref           TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL,
  channel       TEXT NOT NULL,              -- form | callback
  service       TEXT NOT NULL,
  level         TEXT,
  support_types TEXT,
  page          TEXT,
  referrer_host TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  -- personal data: purged after the retention period
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  contact_pref  TEXT,
  subject       TEXT,
  deadline      TEXT,
  message       TEXT,
  -- operator workflow
  status        TEXT NOT NULL DEFAULT 'new',      -- new | contacted | quoted | closed
  tag           TEXT NOT NULL DEFAULT 'untagged', -- untagged | in_scope | out_of_scope | duplicate | spam_test
  purged_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY,
  created_at    TEXT NOT NULL,
  type          TEXT NOT NULL,              -- whatsapp_click | phone_click | email_click | spam_blocked
  page          TEXT,
  service       TEXT,
  ref           TEXT,
  referrer_host TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_ref ON events(ref);

-- Manually logged WhatsApp conversations. Must not contain personal data.
CREATE TABLE IF NOT EXISTS whatsapp_log (
  id            INTEGER PRIMARY KEY,
  created_at    TEXT NOT NULL,
  received_on   TEXT NOT NULL,              -- YYYY-MM-DD the chat started
  ref           TEXT,                       -- site ref code if the visitor used a site button
  service       TEXT NOT NULL,
  tag           TEXT NOT NULL,
  evidence_id   TEXT,                       -- file name of the redacted screenshot
  redacted      INTEGER NOT NULL DEFAULT 0,
  note          TEXT
);
CREATE INDEX IF NOT EXISTS idx_walog_received ON whatsapp_log(received_on);

-- Fixed-window rate limiter. Keys are salted hashes, never raw IP addresses; rows expire with the window.
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,
  count         INTEGER NOT NULL,
  reset_at      INTEGER NOT NULL            -- epoch ms
);
