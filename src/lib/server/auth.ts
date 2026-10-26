import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
import type { AstroCookies } from 'astro';

const COOKIE = 'admin_session';
const MAX_AGE_S = 12 * 60 * 60;

// Without SESSION_SECRET, sessions still work but are invalidated on every restart.
const secret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

const sign = (payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

function safeEqual(a: string, b: string) {
  // Hash both sides first so lengths always match and timing doesn't leak length.
  const ha = scryptSync(a, 'admin-compare', 32);
  const hb = scryptSync(b, 'admin-compare', 32);
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !candidate) return false;
  return safeEqual(candidate, expected);
}

export function createSession(cookies: AstroCookies, secure: boolean) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE_S })).toString('base64url');
  cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export function destroySession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function isAuthenticated(cookies: AstroCookies) {
  if (!adminEnabled()) return false;
  const value = cookies.get(COOKIE)?.value;
  if (!value) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
