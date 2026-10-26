import site from '../../site.config.mjs';
import type { Crumb, Faq } from './types';
import type { Service } from '../data/services';

export const absUrl = (path: string) => new URL(path, site.url).href;

/** Appends the brand when it fits in ~65 characters (roughly what Google displays). */
export function pageTitle(title: string, { brand = true } = {}) {
  const full = `${title} | ${site.brand.name}`;
  return brand && full.length <= 65 ? full : title;
}

export const ogImageFor = (key: string) => absUrl(`/og/${key}.png`);

const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

function sameAs() {
  return Object.values(site.social).filter(Boolean);
}

export function organizationLd() {
  const contactPoint: Record<string, unknown> = {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: site.contact.email,
    areaServed: 'GB',
    availableLanguage: ['en-GB'],
  };
  if (site.contact.phone) contactPoint.telephone = site.contact.phone;

  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.brand.name,
    ...(site.business.legalName ? { legalName: site.business.legalName } : {}),
    url: `${site.url}/`,
    logo: { '@type': 'ImageObject', url: absUrl('/icon-512.png'), width: 512, height: 512 },
    email: site.contact.email,
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(site.business.address ? { address: site.business.address } : {}),
    ...(site.business.companyNumber ? { identifier: { '@type': 'PropertyValue', propertyID: 'Companies House', value: site.business.companyNumber } } : {}),
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    contactPoint,
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
}

export function websiteLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${site.url}/`,
    name: site.brand.name,
    inLanguage: site.locale,
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbLd(crumbs: Crumb[], pageUrl: string) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  };
}

export function webPageLd(opts: {
  path: string;
  title: string;
  description: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage';
  crumbs?: Crumb[];
  image?: string;
  dateModified?: string;
}) {
  const url = absUrl(opts.path);
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: opts.title,
    description: opts.description,
    inLanguage: site.locale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    ...(opts.crumbs && opts.crumbs.length > 1 ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    ...(opts.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: opts.image } } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

export function serviceLd(service: Service) {
  const url = absUrl(`/${service.slug}/`);
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `${service.name} support`,
    serviceType: service.eyebrow,
    description: service.metaDescription,
    url,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: absUrl('/contact/'),
      availableLanguage: 'en-GB',
    },
  };
}

export function faqLd(faqs: Faq[], pageUrl: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleLd(opts: { path: string; title: string; description: string; published: Date; updated: Date; image: string }) {
  const url = absUrl(opts.path);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: opts.title,
    description: opts.description,
    image: opts.image,
    datePublished: opts.published.toISOString().slice(0, 10),
    dateModified: opts.updated.toISOString().slice(0, 10),
    inLanguage: site.locale,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
}

export function itemListLd(items: { name: string; path: string }[], pageUrl: string) {
  return {
    '@type': 'ItemList',
    '@id': `${pageUrl}#list`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: absUrl(it.path),
    })),
  };
}

/** Every page carries Organization + WebSite so entities resolve by @id. */
export function graph(...nodes: (Record<string, unknown> | null | undefined | false)[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationLd(), websiteLd(), ...nodes.filter(Boolean)],
  };
}
