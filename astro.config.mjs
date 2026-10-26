import { defineConfig, passthroughImageService } from 'astro/config';
import node from '@astrojs/node';
import site from './site.config.mjs';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  output: 'static', // marketing pages are prerendered; API + admin opt out with `prerender = false`
  adapter: node({ mode: 'standalone' }),
  build: {
    format: 'directory',
    inlineStylesheets: 'always', // one small stylesheet -> inline it, no render-blocking request
  },
  security: {
    checkOrigin: true, // uses Sec-Fetch-Site, so it also works behind the TLS proxy
    // Trust X-Forwarded-Host/Proto only for our own domain (set by Caddy).
    allowedDomains: [
      { hostname: site.domain, protocol: 'https' },
      { hostname: `www.${site.domain}`, protocol: 'https' },
    ],
    // Hash-based script-src/style-src emitted as a <meta> on every page.
    csp: true,
  },
  compressHTML: true,
  // No runtime image optimisation: icons/OG images are generated at build time, so the server never loads sharp.
  image: { service: passthroughImageService() },
  markdown: { syntaxHighlight: false }, // no code blocks; Shiki's inline styles conflict with CSP
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // 301s for likely/legacy paths. Host-level redirects (www, http, alternate domain) live in the Caddyfile.
  redirects: {
    '/order/': '/contact/',
    '/order-now/': '/contact/',
    '/get-a-quote/': '/contact/',
    '/quote/': '/contact/',
    '/contact-us/': '/contact/',
    '/about-us/': '/about/',
    '/our-services/': '/services/',
    '/services/assignments/': '/assignments/',
    '/services/coursework/': '/coursework/',
    '/services/dissertation/': '/dissertation/',
    '/services/research-work/': '/research-work/',
    '/services/report-writing/': '/report-writing/',
    '/assignment-help/': '/assignments/',
    '/coursework-help/': '/coursework/',
    '/dissertation-help/': '/dissertation/',
    '/research/': '/research-work/',
    '/data-analysis/': '/research-work/',
    '/report-writing-help/': '/report-writing/',
    '/privacy-policy/': '/privacy/',
    '/blog/': '/guides/',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
    ssr: { external: ['node:sqlite'] },
  },
});
