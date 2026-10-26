// First-touch attribution kept in sessionStorage only (no cookies, nothing persistent).
const KEY = 'attr.v1';
const REF_KEY = 'waref.v1';
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export interface Attribution {
  first_referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

function store(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function captureAttribution() {
  const s = store();
  if (!s || s.getItem(KEY)) return;
  const params = new URLSearchParams(location.search);
  const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';
  const data: Attribution = {
    first_referrer: ref,
    utm_source: params.get('utm_source') ?? '',
    utm_medium: params.get('utm_medium') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
  };
  try {
    s.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked */
  }
}

export function getAttribution(): Attribution {
  const empty = { first_referrer: '', utm_source: '', utm_medium: '', utm_campaign: '' };
  try {
    return { ...empty, ...JSON.parse(store()?.getItem(KEY) ?? '{}') };
  } catch {
    return empty;
  }
}

/** One random reference per browsing session, so repeat clicks map to the same chat. */
export function getWhatsAppRef() {
  const s = store();
  const existing = s?.getItem(REF_KEY);
  if (existing) return existing;
  const prefix = document.documentElement.dataset.refPrefix || 'XX';
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const ref = `${prefix}-${Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('')}`;
  try {
    s?.setItem(REF_KEY, ref);
  } catch {
    /* ignore */
  }
  return ref;
}

export function track(type: 'whatsapp_click' | 'phone_click' | 'email_click', extra: { service?: string; ref?: string } = {}) {
  const body = JSON.stringify({
    type,
    page: location.pathname,
    service: extra.service,
    ref: extra.ref,
    referrer: getAttribution().first_referrer,
  });
  try {
    // A plain string is sent as text/plain, which every browser's sendBeacon accepts.
    if (!navigator.sendBeacon?.('/api/event/', body)) {
      void fetch('/api/event/', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {
    /* tracking must never break navigation */
  }
}
