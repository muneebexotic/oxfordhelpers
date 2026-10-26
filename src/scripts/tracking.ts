import { captureAttribution, getWhatsAppRef, track } from './attribution';

captureAttribution();

// One delegated listener counts clicks on WhatsApp, phone and email links.
document.addEventListener(
  'click',
  (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute('href') ?? '';
    const service = link.dataset.service || undefined;

    if (link.hasAttribute('data-wa')) {
      const ref = getWhatsAppRef();
      const text = `${link.dataset.waText ?? ''} (Ref: ${ref})`.trim();
      link.href = `https://wa.me/${link.dataset.wa}?text=${encodeURIComponent(text)}`;
      track('whatsapp_click', { service, ref });
    } else if (href.startsWith('tel:')) {
      track('phone_click', { service });
    } else if (href.startsWith('mailto:')) {
      track('email_click', { service });
    }
  },
  { capture: true },
);
