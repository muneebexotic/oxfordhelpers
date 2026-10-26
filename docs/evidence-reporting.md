# Evidence reporting: lead counts and redacted WhatsApp messages

How inbound enquiries are recorded and counted, and how to prepare anonymised counts and redacted WhatsApp excerpts for an evidence submission.

## What gets recorded

| Source | Recorded automatically | Personal data? |
| --- | --- | --- |
| Enquiry form (`/contact/` and service pages) | Yes, in `enquiries` with channel `form` | Yes: purged after `RETENTION_DAYS` |
| "Message me back" widget | Yes, in `enquiries` with channel `callback` | Yes: purged after `RETENTION_DAYS` |
| WhatsApp button click | Yes, in `events` as `whatsapp_click`, with a random reference code | No |
| Phone / email link click | Yes, in `events` | No |
| Bot submissions caught by the spam traps | Yes, in `events` as `spam_blocked` | No |
| WhatsApp conversation | **Manually**, in the admin "Log a WhatsApp conversation" form | No (never enter names, numbers or message text) |

Every WhatsApp button pre-fills a message ending in a reference such as `(Ref: OH-7K2PQ)`. When you log the chat with that reference, the register shows it was matched to a site click. That's useful for showing the conversation came from the website.

## Counting rules

- **Counted lead** = enquiry form + callback request + logged WhatsApp conversation.
- WhatsApp **clicks** are reported separately as intent, not as leads.
- Tag every enquiry and chat in the admin:
  - **In scope:** a genuine enquiry for the support offered.
  - **Out of scope:** a genuine enquiry for something you don't offer.
  - **Duplicate:** the same person contacting through more than one channel. Keep one, tag the rest duplicate.
  - **Spam / test:** bots, junk and **your own tests**.
- Duplicates and spam/test entries are excluded from every count and from the "counted leads" figure.

## Daily workflow

1. Reply to new enquiries from the dashboard (or the notification email).
2. Set each enquiry's status and tag.
3. For each new WhatsApp conversation:
   1. Note the reference code from the first message, if present.
   2. Take a screenshot of the relevant messages.
   3. Redact it (below) and save it as `WA-YYYY-MM-DD-NN-redacted.png`.
   4. Log it in the admin: date, reference, service, tag, file name, and tick "Screenshot redacted".

## Redaction procedure

Remove everything that could identify the person, directly or in combination:

- Name and profile name, profile photo, phone number
- Email addresses, social handles, links to personal profiles
- University or college name, module codes, student ID, supervisor names
- Locations, dates of birth, and any health or personal circumstances
- Names of attached files, voice notes, images or documents

Keep only what the evidence needs: the date, and the substance of the request (for example "asked for help with SPSS for a Master's dissertation").

How to redact safely:

- Use **solid opaque boxes**, not blur or pixelation, which can sometimes be reversed.
- **Flatten** the result: export or re-screenshot it as a new PNG so the boxes can't be removed.
- Check the final file at full size, and strip metadata before sharing.
- Have a second person check a sample of redacted files.

## Storage and retention

- Unredacted originals stay only on the business phone or WhatsApp account. Delete conversations that didn't lead to a booking within `RETENTION_DAYS` of the last message, as the privacy notice promises.
- Keep redacted files in one evidence folder with restricted access, and back it up.
- Enquiry personal data in the database is purged automatically; anonymous rows remain for counting.

## Exporting

From the dashboard:

- **Weekly counts (CSV):** `week_start, channel, service, tag, count` for every channel, including clicks and blocked spam.
- **WhatsApp evidence register (CSV):** `received_on, ref, service, tag, redacted, evidence_id, note, matched_site_clicks`.

Neither file contains names, contact details or message text.

## Method statement template

Adapt this for the submission:

> Between [start date] and [end date], the website [domain] received [N] enquiries counted under the following rules. An enquiry is a submitted enquiry form, a callback request, or a WhatsApp conversation logged by the operator. Entries identified as duplicates (the same person using more than one channel), spam, or operator tests were excluded ([n] duplicates, [n] spam/test). WhatsApp button clicks ([n]) are reported separately and are not counted as enquiries; [n] logged WhatsApp conversations carried a website reference code matching a recorded click. Enquiries are broken down by service category and week in the attached CSV. Redacted WhatsApp excerpts ([n] files) have had all names, numbers, profile images, institution names and other identifying details removed. Visitors were told in the site's privacy notice that anonymised statistics and redacted excerpts may be used in research and evidence submissions, and could ask for their enquiry to be excluded.
>
> Limitations: some WhatsApp users delete the pre-filled reference, so not every chat can be matched to a click; counts reflect enquiries, not completed bookings.

Fill in the numbers from the exports rather than estimating them.
