import type { APIRoute } from 'astro';
import { getDb, nowIso } from '../../lib/server/db';
import { clientIp, json, newRef, rateLimit, readBody, referrerHost, wantsJson } from '../../lib/server/http';
import { validateEnquiry } from '../../lib/server/validate';
import { acknowledgeEnquiry, notifyNewEnquiry } from '../../lib/server/mailer';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, redirect, locals }) => {
  const asJson = wantsJson(request);
  const fail = (status: number, errors: Record<string, string>) =>
    asJson ? json({ ok: false, errors }, status) : redirect(`/contact/?error=${status === 429 ? 'rate' : 'invalid'}#enquiry`, 303);

  const ip = clientIp(clientAddress);
  if (!(await rateLimit(`enquiry:${ip}`, 5, 10 * 60_000))) {
    return fail(429, { form: 'Too many submissions. Please wait a few minutes or message us on WhatsApp.' });
  }

  let body: Record<string, string>;
  try {
    body = await readBody(request);
  } catch {
    return fail(400, { form: 'We couldn’t read that submission. Please try again.' });
  }

  const result = validateEnquiry(body);
  const db = getDb();

  if (!result.ok) {
    if (result.spam) {
      // Pretend success so bots learn nothing; record only an anonymous counter.
      await db
        .prepare(`INSERT INTO events (created_at, type, page) VALUES (?, 'spam_blocked', ?)`)
        .bind(nowIso(), body.page?.slice(0, 200) ?? null)
        .run();
      return asJson ? json({ ok: true, ref: null }) : redirect('/contact/thanks/', 303);
    }
    return fail(422, result.errors);
  }

  const e = result.data;
  const ref = newRef();
  await db
    .prepare(
    `INSERT INTO enquiries
       (ref, created_at, channel, service, level, support_types, page, referrer_host, utm_source, utm_medium, utm_campaign,
        name, email, phone, contact_pref, subject, deadline, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
    ref,
    nowIso(),
    e.channel,
    e.service,
    e.level,
    e.supportTypes.join(',') || null,
    e.page,
    referrerHost(body.first_referrer),
    e.utm.source,
    e.utm.medium,
    e.utm.campaign,
    e.name,
    e.email,
    e.phone,
    e.contactPref,
    e.subject,
    e.deadline,
    e.message,
  )
    .run();

  // Sent after the response: email delivery must never block or fail the visitor's submission.
  locals.cfContext.waitUntil(Promise.all([notifyNewEnquiry(ref, e), acknowledgeEnquiry(ref, e)]));

  return asJson ? json({ ok: true, ref }) : redirect(`/contact/thanks/?ref=${encodeURIComponent(ref)}`, 303);
};
