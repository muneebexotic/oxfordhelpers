import type { APIRoute } from 'astro';
import { getDb, nowIso } from '../../lib/server/db';
import { REF_PATTERN, clientIp, rateLimit, referrerHost } from '../../lib/server/http';
import { SERVICE_OPTIONS } from '../../data/services';

export const prerender = false;

const TYPES = new Set(['whatsapp_click', 'phone_click', 'email_click']);
const SERVICES = new Set(SERVICE_OPTIONS.map((o) => o.value));

/**
 * Anonymous click counter for contact links (sent with navigator.sendBeacon).
 * Stores no IP address, cookie or identifier, only the event type, page, service and the
 * random WhatsApp reference that lets a logged chat be matched to a click.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const noContent = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!(await rateLimit(`event:${clientIp(clientAddress)}`, 60, 60_000))) return noContent;

  let data: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2000) return noContent;
    data = JSON.parse(raw);
  } catch {
    return noContent;
  }

  const type = String(data.type ?? '');
  if (!TYPES.has(type)) return noContent;

  const page = typeof data.page === 'string' && data.page.startsWith('/') ? data.page.slice(0, 200) : null;
  const service = typeof data.service === 'string' && SERVICES.has(data.service) ? data.service : null;
  const ref = typeof data.ref === 'string' && REF_PATTERN.test(data.ref) ? data.ref : null;

  await getDb()
    .prepare(`INSERT INTO events (created_at, type, page, service, ref, referrer_host) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(nowIso(), type, page, service, ref, referrerHost(typeof data.referrer === 'string' ? data.referrer : null))
    .run();

  return noContent;
};
