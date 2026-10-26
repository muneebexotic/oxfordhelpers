import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { markSvg, pngToIco } from '../lib/brand';

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(markSvg({ size: 32 }))).png().toBuffer();
  return new Response(new Uint8Array(pngToIco(png, 32)), { headers: { 'Content-Type': 'image/x-icon' } });
};
