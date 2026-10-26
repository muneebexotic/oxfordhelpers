import site from '../../../site.config.mjs';
import { SERVICE_OPTIONS, LEVEL_OPTIONS, SUPPORT_OPTIONS } from '../../data/services';
import type { EnquiryInput } from './validate';

interface Mail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

/** Sends through the Resend HTTP API (Workers can't use SMTP). Without RESEND_API_KEY, email is skipped. */
async function send(mail: Mail) {
  if (!process.env.RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: from(),
      to: [mail.to],
      reply_to: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const label = (opts: { value: string; label: string }[], v: string | null) => opts.find((o) => o.value === v)?.label ?? v ?? '—';

const from = () => process.env.MAIL_FROM || `${site.brand.name} <no-reply@${site.domain}>`;

/** Notifies the operator. Failures are logged, never surfaced to the visitor (the enquiry is already saved). */
export async function notifyNewEnquiry(ref: string, e: EnquiryInput) {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return;

  const lines = [
    `Reference: ${ref}`,
    `Channel: ${e.channel === 'callback' ? 'Callback request' : 'Enquiry form'}`,
    `Service: ${label(SERVICE_OPTIONS, e.service)}`,
    `Level: ${label(LEVEL_OPTIONS, e.level)}`,
    `Support wanted: ${e.supportTypes.map((s) => label(SUPPORT_OPTIONS, s)).join(', ') || '—'}`,
    `Subject: ${e.subject ?? '—'}`,
    `Deadline: ${e.deadline ?? '—'}`,
    '',
    `Name: ${e.name}`,
    `Email: ${e.email ?? '—'}`,
    `Phone/WhatsApp: ${e.phone ?? '—'}`,
    `Preferred contact: ${e.contactPref}`,
    '',
    'Message:',
    e.message ?? '—',
    '',
    `Submitted from: ${e.page ?? '—'}`,
  ];

  try {
    await send({
      to,
      replyTo: e.email ?? undefined,
      subject: `New enquiry ${ref}: ${label(SERVICE_OPTIONS, e.service)}`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[mail] operator notification failed:', (err as Error).message);
  }
}

/** Optional acknowledgement to the visitor (AUTO_REPLY=1). */
export async function acknowledgeEnquiry(ref: string, e: EnquiryInput) {
  if (!e.email || process.env.AUTO_REPLY !== '1') return;
  const text = [
    `Hi ${e.name.split(' ')[0]},`,
    '',
    `Thanks for getting in touch with ${site.brand.name}. We’ve received your enquiry (reference ${ref}) and aim to reply ${site.contact.replyTarget}.`,
    '',
    'If you have a brief, marking criteria or a draft, you can reply to this email with them.',
    '',
    `${site.brand.name}`,
    `${site.url}/`,
    '',
    `How we handle your details: ${site.url}/privacy/`,
  ].join('\n');
  try {
    await send({
      to: e.email,
      replyTo: site.contact.email,
      subject: `We’ve received your enquiry (${ref})`,
      text,
    });
  } catch (err) {
    console.error('[mail] acknowledgement failed:', (err as Error).message);
  }
}
