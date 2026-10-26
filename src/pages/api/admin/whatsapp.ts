import type { APIRoute } from 'astro';
import { getDb, nowIso } from '../../../lib/server/db';
import { isTag } from '../../../lib/server/reports';
import { REF_PATTERN } from '../../../lib/server/http';
import { SERVICE_OPTIONS } from '../../../data/services';

export const prerender = false;

const SERVICES = new Set(SERVICE_OPTIONS.map((o) => o.value));
// Strip anything that looks like a phone number or email from free-text notes.
const scrub = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email removed]')
    .replace(/\+?\d[\d\s()-]{7,}\d/g, '[number removed]')
    .slice(0, 300);

/** Adds or deletes a manually logged WhatsApp conversation (evidence register). */
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const db = getDb();
  const action = String(form.get('action') ?? 'add');

  if (action === 'delete') {
    const id = Number(form.get('id'));
    if (Number.isInteger(id)) db.prepare('DELETE FROM whatsapp_log WHERE id = ?').run(id);
    return redirect('/admin/#whatsapp', 303);
  }

  const receivedOn = String(form.get('received_on') ?? '');
  const service = String(form.get('service') ?? '');
  const tag = String(form.get('tag') ?? '');
  const refRaw = String(form.get('ref') ?? '').trim().toUpperCase();
  const ref = REF_PATTERN.test(refRaw) ? refRaw : null;
  const evidence = String(form.get('evidence_id') ?? '').replace(/[^\w.\-]/g, '').slice(0, 120) || null;
  const redacted = form.get('redacted') ? 1 : 0;
  const note = scrub(String(form.get('note') ?? '').trim()) || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn) || !SERVICES.has(service) || !isTag(tag)) {
    return redirect('/admin/?wa_error=1#whatsapp', 303);
  }

  db.prepare(
    `INSERT INTO whatsapp_log (created_at, received_on, ref, service, tag, evidence_id, redacted, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(nowIso(), receivedOn, ref, service, tag, evidence, redacted, note);

  return redirect('/admin/#whatsapp', 303);
};
