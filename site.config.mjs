// Single source of truth for domain, brand and contact details.
// Change the domain with the SITE_DOMAIN env var (or edit DEFAULT_DOMAIN) and rebuild:
//   SITE_DOMAIN=cambridgehelpers.co.uk npm run build
// Everything else (canonical URLs, sitemap, robots.txt, structured data, OG images,
// WhatsApp ref codes, email addresses) is derived from this file.

const DEFAULT_DOMAIN = 'oxfordhelpers.co.uk';

const PRESETS = {
  'oxfordhelpers.co.uk': { name: 'Oxford Helpers', initials: 'OH', place: 'Oxford' },
  'cambridgehelpers.co.uk': { name: 'Cambridge Helpers', initials: 'CH', place: 'Cambridge' },
};

const env = (key, fallback = '') => (process.env[key] ?? '').trim() || fallback;

const domain = env('SITE_DOMAIN', DEFAULT_DOMAIN).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const preset = PRESETS[domain] ?? { name: 'Academic Helpers', initials: 'AH', place: '' };

/** @type {import('./src/lib/types').SiteConfig} */
const config = {
  domain,
  url: `https://${domain}`,
  locale: 'en-GB',

  brand: {
    name: env('BRAND_NAME', preset.name),
    initials: preset.initials,
    place: preset.place,
    tagline: 'Academic support that keeps your work your own.',
  },

  // Fill these in before launch. Empty values hide the related UI rather than
  // showing placeholders to visitors.
  contact: {
    email: env('CONTACT_EMAIL', `hello@${domain}`),
    // International format, digits only, e.g. 447700900123. Leave empty to hide WhatsApp.
    whatsapp: env('CONTACT_WHATSAPP', '447412824595'),
    // Display format, e.g. "+44 7700 900123". Used for call and text links. Leave empty to hide them.
    phone: env('CONTACT_PHONE', '+44 7412 824595'),
    hours: env('CONTACT_HOURS', 'Monday to Saturday, 9am to 8pm (UK time)'),
    // Only promise what you can actually meet.
    replyTarget: env('REPLY_TARGET', 'within one working day'),
  },

  // Optional business details. Only set what is true and verifiable.
  business: {
    legalName: env('BUSINESS_LEGAL_NAME', ''),
    companyNumber: env('BUSINESS_COMPANY_NUMBER', ''),
    // Set a full postal address only if visitors can genuinely reach you there.
    address: env('BUSINESS_ADDRESS', '10 Milk Street, London EC2V 8AN, United Kingdom'),
    icoRegistration: env('BUSINESS_ICO_NUMBER', ''),
  },

  social: {
    instagram: env('SOCIAL_INSTAGRAM', ''),
    linkedin: env('SOCIAL_LINKEDIN', ''),
    facebook: env('SOCIAL_FACEBOOK', ''),
  },

  verification: {
    google: env('GOOGLE_SITE_VERIFICATION', ''),
    bing: env('BING_SITE_VERIFICATION', ''),
  },

  // Social proof is rendered only when you add real, consented entries here.
  // Never add invented reviews or numbers.
  proof: {
    /** @type {{ quote: string, name: string, context: string, source?: string }[]} */
    testimonials: [
      {
        quote:
          'I had done the research, but bringing my dissertation together felt overwhelming. OxfordHelpers helped me spot gaps, organize my chapters, and strengthen my referencing. Their clear, practical feedback made the revisions manageable, and I finally felt confident about submitting my work. The result was a polished, thoroughly researched dissertation with clear arguments and careful referencing, and I couldn’t have been happier with the outcome.',
        name: 'George',
        context: 'MSc student',
      },
      {
        quote:
          'With my deadline approaching, I needed more than a quick spellcheck. OxfordHelpers picked up unclear wording, inconsistent references, and mistakes I had overlooked. The editing was thorough, communication was straightforward, and I submitted on time without losing my own voice.',
        name: 'Alia',
        context: 'PhD scholar',
      },
      {
        quote:
          'I understood the topic, but my essay wasn’t making a convincing argument. OxfordHelpers helped me see where my reasoning needed work and how to connect my ideas. The explanations made a real difference, I finished with a stronger essay and a better understanding of how to approach the next one.',
        name: 'Jose',
        context: 'Undergraduate student',
      },
    ],
    /** @type {{ value: string, label: string }[]} */
    stats: [],
  },

  pricing: {
    // e.g. 35 renders "Tutoring from £35 per hour". null hides it.
    tutoringFromPerHour: null,
  },

  // How long personal data from enquiries is kept before being purged
  // (aggregate counts are kept). Mirrored in the privacy notice.
  retentionDays: Number(env('RETENTION_DAYS', '180')),

  // Date the legal pages were last reviewed (shown on the pages).
  legalUpdated: '2026-10-26',
};

export default config;
