import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/server/db';
import { isStatus, isTag } from '../../../lib/server/reports';

export const prerender = false;

/** Updates workflow status / reporting tag for one enquiry. Auth is enforced in middleware. */
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = Number(form.get('id'));
  const status = String(form.get('status') ?? '');
  const tag = String(form.get('tag') ?? '');
  if (Number.isInteger(id) && isStatus(status) && isTag(tag)) {
    await getDb().prepare('UPDATE enquiries SET status = ?, tag = ? WHERE id = ?').bind(status, tag, id).run();
  }
  return redirect('/admin/#enquiries', 303);
};
