import { createHmac, randomInt } from 'node:crypto';
import site from '../../../site.config.mjs';
import { getDb } from './db';

/** Visitor IP as reported by Cloudflare (the adapter reads cf-connecting-ip into clientAddress). */
export function clientIp(clientAddress: string | undefined) {
  return clientAddress || 'unknown';
}

/** Host part of a referrer URL only (e.g. "google.com"), never the full URL. */
export function referrerHost(value: string | null | undefined) {
  if (!value) return null;
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return host === site.domain ? null : host.slice(0, 100);
  } catch {
    return null;
  }
}

/**
 * Fixed-window rate limiter shared across Worker instances via D1.
 * The key (which contains an IP) is stored only as a keyed hash, and rows expire with the window.
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hashed = createHmac('sha256', process.env.SESSION_SECRET || 'rate-limit').update(key).digest('base64url');
  const row = await getDb()
    .prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN reset_at <= ?3 THEN 1 ELSE count + 1 END,
         reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END
       RETURNING count`,
    )
    .bind(hashed, now + windowMs, now)
    .first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Short reference shown to the visitor and used to match WhatsApp chats, e.g. OH-7K2PQ. */
export function newRef() {
  let out = '';
  for (let i = 0; i < 5; i++) out += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `${site.brand.initials}-${out}`;
}

export const REF_PATTERN = /^[A-Z]{2}-[2-9A-HJKMNP-TV-Z]{5}$/;

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export function wantsJson(request: Request) {
  return (request.headers.get('accept') || '').includes('application/json');
}

/** Reads a JSON or form-encoded body into a flat record of strings (repeated keys joined with commas). */
export async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') || '';
  const out: Record<string, string> = {};
  if (type.includes('application/json')) {
    const raw = await request.text();
    if (raw.length > 20_000) throw new Error('Body too large');
    const data = JSON.parse(raw || '{}');
    for (const [k, v] of Object.entries(data ?? {})) {
      out[k] = Array.isArray(v) ? v.map(String).join(',') : v == null ? '' : String(v);
    }
    return out;
  }
  const form = await request.formData();
  for (const [k, v] of form.entries()) {
    if (typeof v !== 'string') continue;
    out[k] = out[k] ? `${out[k]},${v}` : v;
  }
  return out;
}
