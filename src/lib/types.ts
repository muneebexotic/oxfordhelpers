export interface SiteConfig {
  domain: string;
  url: string;
  locale: string;
  brand: { name: string; initials: string; place: string; tagline: string };
  contact: { email: string; whatsapp: string; phone: string; hours: string; replyTarget: string };
  business: { legalName: string; companyNumber: string; address: string; icoRegistration: string };
  social: { instagram: string; linkedin: string; facebook: string };
  verification: { google: string; bing: string };
  proof: {
    testimonials: { quote: string; name: string; context: string; source?: string }[];
    stats: { value: string; label: string }[];
  };
  pricing: { tutoringFromPerHour: number | null };
  retentionDays: number;
  legalUpdated: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Crumb {
  name: string;
  path: string;
}
