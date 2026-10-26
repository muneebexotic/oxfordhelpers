import { randomInt } from 'node:crypto';
import site from '../../../site.config.mjs';

export function clientIp(request: Request, clientAddress: string | undefined) {
  if (process.env.TRUST_PROXY === '1') {
    const fwd = request.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
  }
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

/** Fixed-window in-memory rate limiter. Sufficient for a single-instance deployment. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}, 60_000).unref();

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
