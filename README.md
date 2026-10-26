# Oxford Helpers / Cambridge Helpers

Academic support website (tutoring, draft feedback, proofreading, research methods coaching) with an enquiry backend, anonymised lead reporting and a full SEO setup.

- **Frontend:** Astro 7, static pages, ~6 KB of JavaScript, self-hosted fonts, no third-party scripts.
- **Backend:** Astro server routes on Cloudflare Workers (`@astrojs/cloudflare`), Cloudflare D1 (SQLite) for enquiries, optional email notifications through Resend.
- **Hosting:** Cloudflare Workers. Static pages are served as assets, and the API and `/admin/` run in the Worker. Security headers are in `public/_headers`.

## Quick start (local)

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD and SESSION_SECRET
npm run db:migrate:local         # creates the local D1 database
npm run dev                      # http://localhost:4321
```

`npm run preview` builds and runs the production Worker locally with `wrangler dev`.

## Switching the domain

Everything is derived from one setting in [site.config.mjs](site.config.mjs):

```bash
SITE_DOMAIN=cambridgehelpers.co.uk npm run build
```

That switches the brand name, canonical URLs, sitemap, robots.txt, structured data, Open Graph images, WhatsApp reference prefix (`OH-` / `CH-`), default email address and the non-affiliation statement.

## Configuration

**Build-time** settings (contact details, business details, social links, verification codes) are read from environment variables when the site is built and baked into the pages; see `.env.example`. Empty values hide the related UI instead of showing placeholders. The WhatsApp number defaults to the value in `site.config.mjs`.

**Runtime** settings live on the Worker:

| Name | Type | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | secret | Password for `/admin/`. Admin is disabled until it and `SESSION_SECRET` are set. |
| `SESSION_SECRET` | secret | Random 32+ characters (`openssl rand -hex 32`). Signs admin sessions and hashes rate-limit keys. |
| `RESEND_API_KEY` | secret | Optional. Enables email notifications via [Resend](https://resend.com). |
| `NOTIFY_EMAIL`, `MAIL_FROM`, `AUTO_REPLY` | vars in `wrangler.jsonc` | Notification recipient, sender, and visitor acknowledgement (`"1"`). |

Testimonials and stats render only when you add real, consented entries to `proof` in `site.config.mjs`.

## Deploying to Cloudflare

One-off setup (the domain must already be on Cloudflare):

```bash
npx wrangler login
npm run deploy                     # builds, creates the D1 database on first deploy, uploads the Worker
```

Copy the `database_id` wrangler prints into `wrangler.jsonc` (under `d1_databases`), then:

```bash
npm run db:migrate:remote          # creates the tables in the live database
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put RESEND_API_KEY   # optional
```

Then in the Cloudflare dashboard:

1. **Workers & Pages → oxfordhelpers → Settings → Domains & Routes:** add the custom domains `oxfordhelpers.co.uk` and `www.oxfordhelpers.co.uk`.
2. **oxfordhelpers.co.uk → Rules → Redirect Rules:** use the "Redirect from WWW to root" template (301), so `www` never serves duplicate pages.
3. **SSL/TLS → Edge Certificates:** turn on "Always Use HTTPS".

Later deploys are just `npm run deploy`. New files in `migrations/` are applied with `npm run db:migrate:remote`.

**Backups:** `npx wrangler d1 export oxfordhelpers-leads --remote --output=backup-$(date +%F).sql`. D1 also keeps 30 days of point-in-time recovery (Time Travel).

## Lead reporting

Sign in at `/admin/` with `ADMIN_PASSWORD`. The dashboard shows counted leads (forms + callback requests + logged WhatsApp chats), WhatsApp click intent, weekly trends, breakdowns by service, tag and referrer, and exports two CSVs that contain no personal data. See [docs/evidence-reporting.md](docs/evidence-reporting.md) for the counting rules and the WhatsApp redaction procedure.

Personal data in enquiries is purged automatically after `RETENTION_DAYS` (default 180) by a daily cron trigger; anonymous counts are kept.

## Project structure

```
site.config.mjs          domain, brand, contact, proof, retention (single source of truth)
src/data/services.ts     all service-page content (5 categories)
src/data/content.ts      shared copy: process, FAQs, integrity lists
src/content/guides/      study guides (Markdown)
src/pages/               routes: pages, API, admin, sitemap, robots, OG images, icons
src/lib/seo.ts           titles, canonical URLs, JSON-LD builders
src/lib/server/          D1 access, validation, rate limiting, auth, mail, reports
src/worker.ts            Worker entry (requests + daily retention purge cron)
migrations/              D1 schema
scripts/seo-audit.mjs    post-build SEO checks
docs/                    SEO strategy, evidence reporting, launch checklist
```

## Before launch

Work through [docs/launch-checklist.md](docs/launch-checklist.md). It lists every claim the copy makes, so you can confirm each one is true for your service.
