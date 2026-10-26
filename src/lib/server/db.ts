import { env } from 'cloudflare:workers';
import site from '../../../site.config.mjs';

// Schema lives in migrations/ and is applied with `npm run db:migrate:local` / `db:migrate:remote`.
export const getDb = (): D1Database => env.DB;

export const nowIso = () => new Date().toISOString();

/** Removes personal data from enquiries older than the retention period; keeps the anonymous row for counts. */
export async function purgeExpiredPersonalData() {
  const cutoff = new Date(Date.now() - site.retentionDays * 86_400_000).toISOString();
  const res = await getDb()
    .prepare(
      `UPDATE enquiries
         SET name = NULL, email = NULL, phone = NULL, subject = NULL, deadline = NULL, message = NULL, purged_at = ?
       WHERE purged_at IS NULL AND created_at < ?`,
    )
    .bind(nowIso(), cutoff)
    .run();
  return res.meta.changes;
}

/** Drops expired rate-limit windows. */
export async function purgeRateLimits() {
  await getDb().prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(Date.now()).run();
}
