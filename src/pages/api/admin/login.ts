import type { APIRoute } from 'astro';
import { adminEnabled, checkPassword, createSession } from '../../../lib/server/auth';
import { clientIp, rateLimit } from '../../../lib/server/http';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress, url }) => {
  if (!adminEnabled()) return redirect('/admin/login/?error=disabled', 303);
  if (!(await rateLimit(`login:${clientIp(clientAddress)}`, 5, 15 * 60_000))) {
    return redirect('/admin/login/?error=rate', 303);
  }
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  if (!checkPassword(password)) return redirect('/admin/login/?error=invalid', 303);

  const secure = url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  createSession(cookies, secure);
  return redirect('/admin/', 303);
};
