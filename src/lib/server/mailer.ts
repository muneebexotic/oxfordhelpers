import nodemailer from 'nodemailer';
import site from '../../../site.config.mjs';
import { SERVICE_OPTIONS, LEVEL_OPTIONS, SUPPORT_OPTIONS } from '../../data/services';
import type { EnquiryInput } from './validate';

let transport: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  if (!process.env.SMTP_HOST) {
    transport = null;
    return transport;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

const label = (opts: { value: string; label: string }[], v: string | null) => opts.find((o) => o.value === v)?.label ?? v ?? '—';

const from = () => process.env.MAIL_FROM || `${site.brand.name} <no-reply@${site.domain}>`;

/** Notifies the operator. Failures are logged, never surfaced to the visitor (the enquiry is already saved). */
export async function notifyNewEnquiry(ref: string, e: EnquiryInput) {
  const t = getTransport();
  const to = process.env.NOTIFY_EMAIL;
  if (!t || !to) return;

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
    await t.sendMail({
      from: from(),
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
  const t = getTransport();
  if (!t || !e.email || process.env.AUTO_REPLY !== '1') return;
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
    await t.sendMail({
      from: from(),
      to: e.email,
      replyTo: site.contact.email,
      subject: `We’ve received your enquiry (${ref})`,
      text,
    });
  } catch (err) {
    console.error('[mail] acknowledgement failed:', (err as Error).message);
  }
}
