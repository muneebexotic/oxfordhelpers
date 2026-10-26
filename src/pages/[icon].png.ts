import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { markSvg } from '../lib/brand';

const ICONS = {
  'apple-touch-icon': { size: 180, bleed: true },
  'icon-192': { size: 192, bleed: false },
  'icon-512': { size: 512, bleed: false },
  'icon-maskable-512': { size: 512, bleed: true },
} as const;

export const getStaticPaths = (() => Object.keys(ICONS).map((icon) => ({ params: { icon } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const { size, bleed } = ICONS[params.icon as keyof typeof ICONS];
  const png = await sharp(Buffer.from(markSvg({ size, bleed }))).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
