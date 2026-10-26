import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import site from '../../../site.config.mjs';
import { services } from '../../data/services';
import { getGuides } from '../../lib/guides';
import { markSvg } from '../../lib/brand';

type Card = {
  key: string;
  eyebrow: string;
  title: string;
};

export const getStaticPaths = (async () => {
  const guides = await getGuides();
  const cards: Card[] = [
    { key: 'default', eyebrow: 'Academic support', title: site.brand.tagline },
    { key: 'home', eyebrow: 'Tutoring · Feedback · Proofreading', title: 'Academic support that makes your work stronger' },
    { key: 'about', eyebrow: 'About us', title: 'Support that helps students do their best work' },
    { key: 'services', eyebrow: 'Our services', title: 'Assignments, coursework, dissertations, research and reports' },
    { key: 'contact', eyebrow: 'Free quote', title: 'Tell us what you’re working on' },
    { key: 'guides', eyebrow: 'Study guides', title: 'Free, practical study guides for UK students' },
    ...services.map((s) => ({ key: s.slug, eyebrow: s.eyebrow, title: s.h1 })),
    ...guides.map((g) => ({ key: `guide-${g.id}`, eyebrow: 'Study guide', title: g.data.title })),
  ];
  return cards.map((card) => ({ params: { key: card.key }, props: card }));
}) satisfies GetStaticPaths;

const font = (pkg: string, file: string) => readFileSync(path.resolve('node_modules', pkg, 'files', file));
let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
const getFonts = () =>
  (fonts ??= [
    { name: 'Inter', data: font('@fontsource/inter', 'inter-latin-500-normal.woff'), weight: 500, style: 'normal' },
    { name: 'Inter', data: font('@fontsource/inter', 'inter-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Fraunces', data: font('@fontsource/fraunces', 'fraunces-latin-600-normal.woff'), weight: 600, style: 'normal' },
  ]);

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title } = props as Card;
  const titleSize = title.length > 70 ? 54 : title.length > 50 ? 62 : 70;
  const logo = `data:image/svg+xml;base64,${Buffer.from(markSvg({ size: 72 })).toString('base64')}`;

  const tree = el(
    'div',
    {
      // Satori sizes boxes as content-box: content + padding must equal 1200x630 exactly.
      width: 1200 - 72 * 2,
      height: 630 - 64 * 2,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: '#072f33',
      backgroundImage: 'linear-gradient(135deg, #0f5a60 0%, #072f33 100%)',
      color: '#ffffff',
      fontFamily: 'Inter',
      position: 'relative',
    },
    [
      el('div', {
        position: 'absolute',
        top: -220,
        right: -180,
        width: 620,
        height: 620,
        borderRadius: 620,
        backgroundImage: 'radial-gradient(circle, rgba(240,164,58,0.30) 0%, rgba(240,164,58,0) 65%)',
      }),
      el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
        el('img', { width: 72, height: 72 }, undefined, { src: logo, width: 72, height: 72 }),
        el('div', { fontFamily: 'Fraunces', fontSize: 40, fontWeight: 600 }, site.brand.name),
      ]),
      el('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        el('div', { fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#f6b85c' }, eyebrow),
        el('div', { fontFamily: 'Fraunces', fontSize: titleSize, fontWeight: 600, lineHeight: 1.1, maxWidth: 1000 }, title),
      ]),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }, [
        el('div', {}, site.domain),
        el('div', { display: 'flex', padding: '10px 22px', borderRadius: 999, backgroundColor: '#f0a43a', color: '#141a22', fontWeight: 700 }, 'Free, no-obligation quote'),
      ]),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: getFonts() });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
