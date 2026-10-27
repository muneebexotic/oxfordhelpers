# Launch checklist

## Configuration

- [ ] `SITE_DOMAIN` set to the domain you own; apex and `www` added as custom domains on the Worker; www → apex redirect rule on
- [ ] `CONTACT_EMAIL` mailbox exists and is monitored
- [x] `CONTACT_WHATSAPP` and `CONTACT_PHONE` set to the business number (+44 7412 824595: WhatsApp, calls and texts)
- [ ] `REPLY_TARGET` and `CONTACT_HOURS` reflect what you can actually deliver
- [ ] `ADMIN_PASSWORD` (long, random) and `SESSION_SECRET` (`openssl rand -hex 32`) set as Worker secrets
- [ ] `RESEND_API_KEY` secret set, sending domain verified in Resend, and `NOTIFY_EMAIL` receiving test notifications
- [ ] `npm run db:migrate:remote` applied; a test enquiry appears in `/admin/` (then tag it Spam / test)
- [ ] Business details (`BUSINESS_*`) set only where true; ICO data protection fee paid (most organisations that process personal data must pay it) and `BUSINESS_ICO_NUMBER` added

## Claims register

The copy makes these claims. Confirm each one is true for your service, or edit the text (file in brackets).

| Claim | Where |
| --- | --- |
| Free, no-obligation quote; fixed quote before work starts | Home, trust strip, process, CTA (`src/data/content.ts`, components) |
| "We aim to reply [REPLY_TARGET]" | Site-wide (`site.config.mjs`) |
| We confirm we have the right person for your subject and level before you commit | `src/data/content.ts`, service FAQs |
| Live sessions by video call; written feedback; proofreading in tracked changes | `src/data/services.ts`, integrity policy |
| A short statement of support provided, for universities that require declarations | Dissertation page, integrity policy |
| Proofreading follows common UK university limits, and the client's own policy if stricter | Services, guides, integrity policy |
| No generative AI used to produce content for assessed work | Integrity policy |
| Enquiry data deleted after [RETENTION_DAYS] days (automatic); unbooked WhatsApp chats deleted within the same period (**manual**: you must do this) | Privacy notice, FAQ |
| Quotes valid 14 days; free rescheduling with 24 hours' notice; 14-day cancellation rights | Terms |
| Data processors: hosting provider and email provider only | Privacy notice (update if you add others) |

Have the privacy notice and terms reviewed by a qualified adviser before launch.

## Brand and affiliation

- [ ] The footer and About page state that the business is not affiliated with any university. Keep those statements.
- [ ] Never use university names, crests, colours or photos of university buildings in branding, ads or social profiles.
- [ ] "Oxford" and "Cambridge" are place names, but in an academic context they can suggest a university connection. Some universities actively protect their names, so consider taking advice on the domain and brand name before investing in promotion.

## Social proof

- [ ] Add testimonials and stats to `proof` in `site.config.mjs` only when they are real, and only with the client's written consent.

## Search engines

- [ ] Google Search Console and Bing Webmaster Tools verified; sitemap submitted
- [ ] Inspect `/`, a service page and a guide with the URL Inspection tool
- [ ] Validate structured data with the Rich Results Test / Schema Markup Validator
- [ ] Run PageSpeed Insights on the home page and a service page (mobile)

## Final checks on the live site

- [ ] Submit the enquiry form, the callback widget and a WhatsApp click; confirm all three appear in `/admin/`, then tag them **Spam / test**
- [ ] `http://` and `www.` both 301 to `https://[domain]/`
- [ ] `/admin/` requires a password and is not indexed
