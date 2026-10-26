# Oxford Helpers / Cambridge Helpers

Academic support website (tutoring, draft feedback, proofreading, research methods coaching) with an enquiry backend, anonymised lead reporting and a full SEO setup.

- **Frontend:** Astro 7, static pages, ~6 KB of JavaScript, self-hosted fonts, no third-party scripts.
- **Backend:** Astro server routes on Node (`@astrojs/node`), SQLite via the built-in `node:sqlite`, optional SMTP notifications.
- **Deployment:** Docker Compose with Caddy (automatic HTTPS, www/alternate-domain 301s, security headers, caching).

## Quick start (local)

```bash
npm install
npm run dev            # http://localhost:4321
```

Production build and run:

```bash
npm run build          # builds and runs the SEO audit (fails on errors)
ADMIN_PASSWORD=change-me SESSION_SECRET=$(openssl rand -hex 32) npm run preview
```

Requires Node 22.23+ (Node 24 LTS recommended).

## Switching the domain

Everything is derived from one setting in [site.config.mjs](site.config.mjs):

```bash
SITE_DOMAIN=cambridgehelpers.co.uk npm run build
```

That switches the brand name, canonical URLs, sitemap, robots.txt, structured data, Open Graph images, WhatsApp reference prefix (`OH-` / `CH-`), default email address and the non-affiliation statement. For Docker, set `SITE_DOMAIN` in `.env`.

## Configuration

Copy `.env.example` to `.env`. Contact details, business details, social links and verification codes are **build-time** settings (baked into pages), so rebuild after changing them. Empty values hide the related UI instead of showing placeholders. Secrets (`ADMIN_PASSWORD`, `SESSION_SECRET`, SMTP) are runtime-only.

Testimonials and stats render only when you add real, consented entries to `proof` in `site.config.mjs`.

## Deploying (VPS with Docker)

1. Point the domain's `A`/`AAAA` records (apex and `www`) at the server.
2. `cp .env.example .env` and fill it in. Set `ADMIN_PASSWORD`, `SESSION_SECRET` and `ACME_EMAIL` at minimum.
3. `docker compose up -d --build`

Caddy obtains TLS certificates automatically, redirects `www` → apex, and sets HSTS, CSP and the other security headers. If you own both domains, uncomment the alternate-domain block in the [Caddyfile](Caddyfile) so it 301s to the primary.

**Other hosts:** any Node host with a persistent disk works (Render, Railway, Fly.io). Run `npm ci && npm run build`, start with `npm start`, set `HOST=0.0.0.0`, `TRUST_PROXY=1` and `DATABASE_PATH` on the persistent volume.

**Backups:** the database is one SQLite file in the `app-data` volume:

```bash
docker compose stop app
docker compose cp app:/app/data/leads.sqlite ./backup-$(date +%F).sqlite
docker compose start app
```

## Lead reporting

Sign in at `/admin/` with `ADMIN_PASSWORD`. The dashboard shows counted leads (forms + callback requests + logged WhatsApp chats), WhatsApp click intent, weekly trends, breakdowns by service, tag and referrer, and exports two CSVs that contain no personal data. See [docs/evidence-reporting.md](docs/evidence-reporting.md) for the counting rules and the WhatsApp redaction procedure.

Personal data in enquiries is purged automatically after `RETENTION_DAYS` (default 180); anonymous counts are kept.

## Project structure

```
site.config.mjs          domain, brand, contact, proof, retention (single source of truth)
src/data/services.ts     all service-page content (5 categories)
src/data/content.ts      shared copy: process, FAQs, integrity lists
src/content/guides/      study guides (Markdown)
src/pages/               routes: pages, API, admin, sitemap, robots, OG images, icons
src/lib/seo.ts           titles, canonical URLs, JSON-LD builders
src/lib/server/          database, validation, rate limiting, auth, mail, reports
scripts/seo-audit.mjs    post-build SEO checks
docs/                    SEO strategy, evidence reporting, launch checklist
```

## Before launch

Work through [docs/launch-checklist.md](docs/launch-checklist.md). It lists every claim the copy makes, so you can confirm each one is true for your service.
