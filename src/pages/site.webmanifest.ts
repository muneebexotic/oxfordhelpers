import type { APIRoute } from 'astro';
import site from '../../site.config.mjs';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: site.brand.name,
        short_name: site.brand.name,
        description: site.brand.tagline,
        lang: 'en-GB',
        start_url: '/',
        display: 'browser',
        background_color: '#faf7f2',
        theme_color: '#0f5a60',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
