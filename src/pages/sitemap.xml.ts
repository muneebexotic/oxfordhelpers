import type { APIRoute } from 'astro';
import { STATIC_ROUTES } from '../data/routes';
import { getGuides } from '../lib/guides';
import { absUrl } from '../lib/seo';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const guides = await getGuides();
  const entries = [
    ...STATIC_ROUTES,
    ...guides.map((g) => ({ path: `/guides/${g.id}/`, updated: g.data.updated.toISOString().slice(0, 10) })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${escape(absUrl(e.path))}</loc><lastmod>${e.updated}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
