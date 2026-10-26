import { getDb } from './db';

export const TAGS = [
  { value: 'untagged', label: 'Untagged' },
  { value: 'in_scope', label: 'In scope' },
  { value: 'out_of_scope', label: 'Out of scope' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'spam_test', label: 'Spam / test' },
] as const;

export const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
] as const;

export const isTag = (v: string) => TAGS.some((t) => t.value === v);
export const isStatus = (v: string) => STATUSES.some((s) => s.value === v);

// Duplicates and spam/test entries are excluded from every lead count.
const COUNTED = `tag NOT IN ('duplicate', 'spam_test')`;

const since = (days: number | null) => (days == null ? '0000' : new Date(Date.now() - days * 86_400_000).toISOString());
const sinceDate = (days: number | null) => since(days).slice(0, 10);

type Row = Record<string, string | number | null>;

async function all<T = Row>(sql: string, ...params: unknown[]) {
  const { results } = await getDb().prepare(sql).bind(...params).all<T>();
  return results;
}

export async function summary(days: number | null) {
  const [enq, [chats], ev] = await Promise.all([
    all(`SELECT channel, COUNT(*) AS n FROM enquiries WHERE created_at >= ? AND ${COUNTED} GROUP BY channel`, since(days)),
    all(`SELECT COUNT(*) AS n FROM whatsapp_log WHERE received_on >= ? AND ${COUNTED}`, sinceDate(days)),
    all(`SELECT type, COUNT(*) AS n FROM events WHERE created_at >= ? GROUP BY type`, since(days)),
  ]);

  const byChannel = Object.fromEntries(enq.map((r) => [r.channel, Number(r.n)]));
  const byEvent = Object.fromEntries(ev.map((r) => [r.type, Number(r.n)]));
  const form = byChannel.form ?? 0;
  const callback = byChannel.callback ?? 0;
  const whatsappChats = Number(chats?.n ?? 0);
  return {
    leads: form + callback + whatsappChats,
    form,
    callback,
    whatsappChats,
    whatsappClicks: byEvent.whatsapp_click ?? 0,
    phoneClicks: byEvent.phone_click ?? 0,
    emailClicks: byEvent.email_click ?? 0,
    spamBlocked: byEvent.spam_blocked ?? 0,
  };
}

/** Weekly lead counts (Monday-start weeks) by channel. */
export async function weekly(weeks = 12) {
  const start = since(weeks * 7);
  const weekStart = (col: string) => `date(${col}, '-6 days', 'weekday 1')`;
  const rows = await all(
    `SELECT week, channel, SUM(n) AS n FROM (
       SELECT ${weekStart('created_at')} AS week, channel, COUNT(*) AS n
         FROM enquiries WHERE created_at >= ? AND ${COUNTED} GROUP BY week, channel
       UNION ALL
       SELECT ${weekStart('received_on')} AS week, 'whatsapp_chat' AS channel, COUNT(*) AS n
         FROM whatsapp_log WHERE received_on >= ? AND ${COUNTED} GROUP BY week
       UNION ALL
       SELECT ${weekStart('created_at')} AS week, 'whatsapp_click' AS channel, COUNT(*) AS n
         FROM events WHERE created_at >= ? AND type = 'whatsapp_click' GROUP BY week
     ) GROUP BY week, channel ORDER BY week DESC`,
    start,
    start.slice(0, 10),
    start,
  );

  type WeekCounts = { form: number; callback: number; whatsapp_chat: number; whatsapp_click: number };
  const map = new Map<string, WeekCounts>();
  for (const r of rows) {
    const w = String(r.week);
    if (!map.has(w)) map.set(w, { form: 0, callback: 0, whatsapp_chat: 0, whatsapp_click: 0 });
    const counts = map.get(w)!;
    const channel = String(r.channel) as keyof WeekCounts;
    if (channel in counts) counts[channel] = Number(r.n);
  }
  return [...map.entries()].map(([week, c]) => ({ week, ...c, leads: c.form + c.callback + c.whatsapp_chat }));
}

export function breakdown(column: 'service' | 'tag', days: number | null) {
  const filter = column === 'tag' ? '1=1' : COUNTED;
  return all<{ key: string; n: number }>(
    `SELECT ${column} AS key, SUM(n) AS n FROM (
       SELECT ${column}, COUNT(*) AS n FROM enquiries WHERE created_at >= ? AND ${filter} GROUP BY ${column}
       UNION ALL
       SELECT ${column}, COUNT(*) AS n FROM whatsapp_log WHERE received_on >= ? AND ${filter} GROUP BY ${column}
     ) GROUP BY key ORDER BY n DESC`,
    since(days),
    sinceDate(days),
  );
}

export function referrers(days: number | null) {
  return all<{ key: string; n: number }>(
    `SELECT COALESCE(referrer_host, '(direct / unknown)') AS key, COUNT(*) AS n
       FROM enquiries WHERE created_at >= ? AND ${COUNTED} GROUP BY key ORDER BY n DESC LIMIT 10`,
    since(days),
  );
}

export function recentEnquiries(limit = 50) {
  return all(
    `SELECT id, ref, created_at, channel, service, level, support_types, subject, deadline, name, email, phone,
            contact_pref, message, status, tag, page, purged_at
       FROM enquiries ORDER BY created_at DESC LIMIT ?`,
    limit,
  );
}

export function whatsappLog(limit = 100) {
  return all(
    `SELECT w.*, (SELECT COUNT(*) FROM events e WHERE e.ref = w.ref AND e.type = 'whatsapp_click') AS matched_clicks
       FROM whatsapp_log w ORDER BY received_on DESC, id DESC LIMIT ?`,
    limit,
  );
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // Quote, and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (rows: Row[], columns: string[]) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\r\n') + '\r\n';

/** Anonymous weekly counts by channel, service and tag. Contains no personal data. */
export async function exportAggregates() {
  const weekStart = (col: string) => `date(${col}, '-6 days', 'weekday 1')`;
  const rows = await all(
    `SELECT week_start, channel, service, tag, SUM(n) AS count FROM (
       SELECT ${weekStart('created_at')} AS week_start, channel, service, tag, COUNT(*) AS n
         FROM enquiries GROUP BY 1, 2, 3, 4
       UNION ALL
       SELECT ${weekStart('received_on')}, 'whatsapp_chat', service, tag, COUNT(*)
         FROM whatsapp_log GROUP BY 1, 2, 3, 4
       UNION ALL
       SELECT ${weekStart('created_at')}, type, COALESCE(service, ''), 'n/a', COUNT(*)
         FROM events GROUP BY 1, 2, 3, 4
     ) GROUP BY 1, 2, 3, 4 ORDER BY week_start, channel, service, tag`,
  );
  return toCsv(rows, ['week_start', 'channel', 'service', 'tag', 'count']);
}

/** WhatsApp evidence register: no names or numbers are ever stored in this table. */
export async function exportWhatsappRegister() {
  const rows = await all(
    `SELECT w.received_on, w.ref, w.service, w.tag, w.redacted, w.evidence_id, w.note,
            (SELECT COUNT(*) FROM events e WHERE e.ref = w.ref AND e.type = 'whatsapp_click') AS matched_site_clicks
       FROM whatsapp_log w ORDER BY w.received_on, w.id`,
  );
  return toCsv(rows, ['received_on', 'ref', 'service', 'tag', 'redacted', 'evidence_id', 'note', 'matched_site_clicks']);
}
