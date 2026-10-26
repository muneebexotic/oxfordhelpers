import { SERVICE_OPTIONS, LEVEL_OPTIONS, SUPPORT_OPTIONS } from '../../data/services';

export interface EnquiryInput {
  channel: 'form' | 'callback';
  name: string;
  email: string | null;
  phone: string | null;
  contactPref: 'email' | 'whatsapp' | 'phone';
  service: string;
  level: string | null;
  supportTypes: string[];
  subject: string | null;
  deadline: string | null;
  message: string | null;
  page: string | null;
  utm: { source: string | null; medium: string | null; campaign: string | null };
}

export type ValidationResult =
  | { ok: true; data: EnquiryInput }
  | { ok: false; errors: Record<string, string>; spam?: boolean };

const SERVICES = new Set(SERVICE_OPTIONS.map((o) => o.value));
const LEVELS = new Set(LEVEL_OPTIONS.map((o) => o.value));
const SUPPORT = new Set(SUPPORT_OPTIONS.map((o) => o.value));

const clean = (v: string | undefined, max: number) => {
  const s = (v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return s ? s.slice(0, max) : null;
};

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,190}\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateEnquiry(body: Record<string, string>): ValidationResult {
  // Bot traps: a hidden field humans never fill, and a minimum time on page (set by JS; absent without JS).
  if (body.company_website) return { ok: false, errors: { form: 'Rejected' }, spam: true };
  const elapsed = Number(body.elapsed_ms);
  if (body.elapsed_ms && Number.isFinite(elapsed) && elapsed < 2500) return { ok: false, errors: { form: 'Rejected' }, spam: true };

  const errors: Record<string, string> = {};
  const channel = body.channel === 'callback' ? 'callback' : 'form';

  const name = clean(body.name, 80);
  if (!name || name.length < 2) errors.name = 'Please tell us your name.';

  const email = clean(body.email, 200);
  if (email && !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const phone = clean(body.phone, 24);
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Please enter a valid phone number, including the country code if outside the UK.';

  if (channel === 'form' && !email) errors.email = 'Please enter your email address.';
  if (channel === 'callback' && !phone) errors.phone = 'Please enter your WhatsApp or mobile number.';

  const prefRaw = body.contact_pref;
  const contactPref = prefRaw === 'whatsapp' || prefRaw === 'phone' ? prefRaw : channel === 'callback' ? 'whatsapp' : 'email';
  if ((contactPref === 'whatsapp' || contactPref === 'phone') && !phone) {
    errors.phone = 'Please add a number so we can contact you that way.';
  }

  const service = SERVICES.has(body.service) ? body.service : null;
  if (!service) errors.service = 'Please choose the kind of work you need help with.';

  const level = LEVELS.has(body.level) ? body.level : null;
  const supportTypes = (body.support_types || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SUPPORT.has(s));

  const subject = clean(body.subject, 120);
  const deadlineRaw = clean(body.deadline, 10);
  const deadline = deadlineRaw && DATE_RE.test(deadlineRaw) ? deadlineRaw : null;

  const message = clean(body.message, 3000);
  if (channel === 'form' && (!message || message.length < 10)) {
    errors.message = 'Please tell us a little about what you need (at least a sentence).';
  }

  if (body.consent !== 'yes' && body.consent !== 'on' && body.consent !== 'true') {
    errors.consent = 'Please confirm you’ve read how we use your details.';
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  const pagePath = clean(body.page, 200);
  return {
    ok: true,
    data: {
      channel,
      name: name!,
      email,
      phone,
      contactPref,
      service: service!,
      level,
      supportTypes,
      subject,
      deadline,
      message,
      page: pagePath && pagePath.startsWith('/') ? pagePath : null,
      utm: {
        source: clean(body.utm_source, 60),
        medium: clean(body.utm_medium, 60),
        campaign: clean(body.utm_campaign, 60),
      },
    },
  };
}
