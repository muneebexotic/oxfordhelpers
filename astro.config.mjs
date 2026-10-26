import { defineConfig, passthroughImageService } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import site from './site.config.mjs';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  output: 'static', // marketing pages are prerendered; API + admin opt out with `prerender = false`
  adapter: cloudflare({
    // Prerender in Node so build-time OG/icon generation (satori + sharp) works.
    prerenderEnvironment: 'node',
    imageService: 'passthrough',
  }),
  session: false, // admin auth uses its own signed cookie; no KV session store needed
  build: {
    format: 'directory',
    inlineStylesheets: 'always', // one small stylesheet -> inline it, no render-blocking request
  },
  security: {
    checkOrigin: true, // uses Sec-Fetch-Site
    // Trust X-Forwarded-Host/Proto only for our own domain.
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
  // 301s for likely/legacy paths. Host-level redirects (www -> apex) are a Cloudflare Redirect Rule.
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
  },
});
