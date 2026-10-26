import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import site from '../../../site.config.mjs';

let db: DatabaseSync | null = null;

const SCHEMA = `
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
`;

export function getDb(): DatabaseSync {
  if (db) return db;
  const file = path.resolve(process.env.DATABASE_PATH || 'data/leads.sqlite');
  mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  purgeExpiredPersonalData();
  // Re-run the retention purge daily for long-running processes.
  setInterval(purgeExpiredPersonalData, 24 * 60 * 60 * 1000).unref();
  return db;
}

export const nowIso = () => new Date().toISOString();

/** Removes personal data from enquiries older than the retention period; keeps the anonymous row for counts. */
export function purgeExpiredPersonalData() {
  if (!db) return 0;
  const cutoff = new Date(Date.now() - site.retentionDays * 86_400_000).toISOString();
  const res = db
    .prepare(
      `UPDATE enquiries
         SET name = NULL, email = NULL, phone = NULL, subject = NULL, deadline = NULL, message = NULL, purged_at = ?
       WHERE purged_at IS NULL AND created_at < ?`,
    )
    .run(nowIso(), cutoff);
  return Number(res.changes);
}
