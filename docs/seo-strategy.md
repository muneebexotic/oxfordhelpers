# SEO strategy

What is implemented in the code, how pages map to search intent, and a legitimate off-page plan. No ranking can be guaranteed. Results depend on competition, content quality, links earned over time and how search engines assess the site.

## 1. Technical SEO (implemented)

| Area | Implementation |
| --- | --- |
| Rendering | All public pages are prerendered static HTML. Content is visible without JavaScript. |
| Canonicals | Absolute, self-referencing canonical on every page, built from `SITE_DOMAIN`. One URL form: HTTPS, apex domain, trailing slash. |
| Redirects | Cloudflare: `http` → `https` (Always Use HTTPS), `www` → apex and optional alternate domain → primary (Redirect Rules, 301). App: 301s for likely/legacy paths (`/order/`, `/services/dissertation/`, `/blog/` …) and trailing-slash normalisation. |
| Sitemap | `/sitemap.xml` lists exactly the indexable pages with accurate `lastmod` dates. The build audit fails if it drifts. |
| robots.txt | Allows everything except `/admin/` and `/api/`; references the sitemap. |
| Indexing control | Thank-you, 404, admin and API responses are `noindex` (meta tag or `X-Robots-Tag`). |
| Structured data | One JSON-LD `@graph` per page: `Organization`, `WebSite`, `WebPage` (or `AboutPage`/`ContactPage`/`CollectionPage`), `BreadcrumbList`, `Service` (service pages), `FAQPage` (pages with a visible FAQ), `Article` (guides), `ItemList` (hubs). No ratings, reviews or credentials are marked up because none exist yet. Google currently shows FAQ rich results only for a small set of authoritative sites; the markup is still valid and accurate. |
| Social metadata | Open Graph and Twitter cards on every page, with a unique 1200×630 image per page generated at build time from the current brand and title. |
| Mobile | Mobile-first responsive layout, 16px gutters, 44–56px tap targets, 16px form inputs (no iOS zoom), no horizontal scroll (verified at 360 and 390px). |
| Core Web Vitals | Text-based hero, so LCP is text, not an image. Critical CSS is inlined; fonts are self-hosted, subset, preloaded, and use a metric-matched fallback (low CLS). About 6 KB of deferred JavaScript, no third-party scripts (good INP). Immutable caching for fingerprinted assets; zstd/gzip compression. |
| Images | All imagery is inline SVG or CSS (resolution-independent, near-zero bytes). OG images and icons are generated as compressed PNGs. The audit checks `alt` and dimensions on any `<img>`. |
| Security | HTTPS + HSTS, hash-based CSP, frame denial, and no mixed content. These are trust signals and protect visitors. |
| Quality gate | `npm run build` runs `scripts/seo-audit.mjs`. It fails on missing or duplicate titles and descriptions, missing or incorrect canonicals, multiple or missing H1s, broken internal links, invalid JSON-LD, missing OG images and sitemap mismatches. |

## 2. On-page SEO and search intent

Each page targets one primary intent. Titles stay under ~60 characters and descriptions under 160. There is one H1 per page, headings follow the questions people actually ask, and copy is written for people first. No keyword stuffing.

| Page | Primary intent (examples) | Notes |
| --- | --- | --- |
| `/` | academic support UK, assignment help UK, dissertation help UK | Commercial overview, routes to the five services |
| `/assignments/` | assignment help, assignment tutor, help understanding an assignment brief | Stages of help, assignment types, feedback timing |
| `/coursework/` | coursework help, A-level NEA tutor, BTEC coursework help | Explains university vs exam-board rules accurately |
| `/dissertation/` | dissertation help, dissertation coaching, dissertation proofreading | Proposal → final draft, chapter guide, referencing styles |
| `/research-work/` | SPSS help, dissertation data analysis help, NVivo help, statistics tutor | Software and methods, teach-and-check approach |
| `/report-writing/` | report writing help, business report help, lab report help | Report types and anatomy |
| `/guides/dissertation-structure/` | how to structure a dissertation | Informational, links to dissertation and research pages |
| `/guides/referencing-styles-uk/` | Harvard vs APA, OSCOLA referencing, which referencing style | Informational, links to assignments and dissertation pages |
| `/guides/university-proofreading-rules/` | what can a proofreader change, university proofreading policy | Informational, builds trust in the proofreading offer |
| `/guides/assignment-brief-marking-criteria/` | how to read an assignment brief, what "critically evaluate" means | Informational, links to the assignment page |

Queries asking someone to write work for submission ("write my essay for me", etc.) are deliberately not targeted. Advertising that service is an offence in England, and the site doesn't offer it. The home FAQ answers that question honestly, which serves people who search for it.

**Internal linking:** global navigation and footer; breadcrumbs; service cards on the home and hub pages; "related support" and "free guides on this topic" on every service page; guides link contextually to services and to each other; the integrity policy is linked from every service page.

**Content upkeep:** update a page's `updated` date in `src/data/services.ts` (or the guide frontmatter) only when its content materially changes. Add one useful guide a month, based on real questions from enquiries.

## 3. Off-page strategy (legitimate)

### Month 1: foundations

- Verify the domain in **Google Search Console** and **Bing Webmaster Tools** (set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`, rebuild) and submit `/sitemap.xml`.
- **Google Business Profile:** only if eligible. Google requires in-person contact with customers at a real address or within a service area, so online-only services are not eligible. Don't create a profile with a virtual-office address.
- Create consistent profiles where real clients look: LinkedIn page, Instagram, Trustpilot business profile. Use the same name, URL and contact details everywhere, and add them to `social` in `site.config.mjs` so they appear in `sameAs`.

### Months 2–3: citations and reviews

- List the business in reputable UK directories with accurate details only: Yell, FreeIndex, Thomson Local, Cylex, Hotfrog. Skip low-quality "SEO directories".
- Tutor marketplaces (Tutorful, Superprof, and MyTutor for school level) can bring direct referrals. Follow each platform's rules on off-platform contact.
- **Reviews:** after genuinely completed work, invite every client to leave a review (no cherry-picking, no incentives, no writing reviews for them). Fake or incentivised reviews are banned under the Digital Markets, Competition and Consumers Act 2024. Add real, consented quotes to `proof.testimonials`.

### Months 3–6: earn links with useful content

- The study guides are linkable assets. Expand them with downloadable resources: a referencing cheat sheet, a dissertation timeline planner and a marking-criteria checklist.
- Outreach: offer these resources to student bloggers, education newsletters, careers and skills sites, and community organisations. Pitch the resource, not a link.
- **Digital PR:** answer journalist requests (ResponseSource, Qwoted, #journorequest) on study skills, dissertations and academic integrity. Anonymised aggregate trends from your own enquiry data can support stories, if the privacy notice covers that use (it does).
- Guest articles on genuinely relevant education sites, written to be useful, with disclosed authorship.

### Ongoing: social and community

- Short study-tip posts and videos repurposed from the guides (Instagram, TikTok, LinkedIn, YouTube). Tag profile links with UTM parameters (`?utm_source=instagram&utm_medium=social`); the enquiry form records them.
- Student unions and societies often restrict adverts for paid academic services. Check and respect their policies.

### Avoid

Buying links, private blog networks, link exchanges, guest-post farms, mass directory submissions, fake or incentivised reviews, undisclosed sponsored posts (CAP Code requires clear "ad" labelling), using university names, logos or colours to imply affiliation, and spamming student groups. These risk penalties, legal problems or both.

## 4. Measurement

- **Search Console:** impressions, clicks, CTR and average position per page and query. Rewrite titles and descriptions for pages with high impressions and low CTR.
- **Admin dashboard:** enquiries by referring site, service and week; WhatsApp click-to-lead matching.
- **Monthly review:** what people search for, what they enquire about, and what content would answer it better.
