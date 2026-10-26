import type { APIRoute } from 'astro';
import { exportAggregates, exportWhatsappRegister } from '../../../lib/server/reports';

export const prerender = false;

/** CSV downloads for reporting. Neither export contains names, emails, numbers or message text. */
export const GET: APIRoute = ({ url }) => {
  const kind = url.searchParams.get('type') === 'whatsapp' ? 'whatsapp' : 'aggregates';
  const csv = kind === 'whatsapp' ? exportWhatsappRegister() : exportAggregates();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${kind === 'whatsapp' ? 'whatsapp-register' : 'lead-counts'}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};
