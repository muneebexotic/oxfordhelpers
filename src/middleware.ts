import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/server/auth';

const PUBLIC_ADMIN = new Set(['/admin/login/', '/api/admin/login/']);

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();

  const { pathname } = context.url;
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdmin && !PUBLIC_ADMIN.has(pathname) && !isAuthenticated(context.cookies)) {
    return pathname.startsWith('/api/')
      ? new Response('Unauthorised', { status: 401, headers: { 'Cache-Control': 'no-store' } })
      : context.redirect('/admin/login/', 303);
  }

  let response = await next();
  // Redirect responses can carry immutable headers; copy before modifying.
  response = new Response(response.body, response);
  // Dynamic routes are never indexed or cached. Site-wide security headers are set by the proxy (Caddyfile).
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  if (isAdmin) response.headers.set('X-Frame-Options', 'DENY');
  return response;
});
