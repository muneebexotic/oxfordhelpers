/** Logo mark as standalone SVG. `bleed` fills the whole square (for maskable icons). */
export function markSvg({ size = 48, bleed = false } = {}) {
  const tile = bleed ? '<rect width="48" height="48" fill="#0f5a60"/>' : '<rect width="48" height="48" rx="12" fill="#0f5a60"/>';
  // Maskable icons need the artwork inside the central safe zone.
  const art = `<g${bleed ? ' transform="translate(24 24) scale(.78) translate(-24 -24)"' : ''}>
    <path d="M10 16.5c4.6-2 9.1-1.8 13 .9V35c-3.9-2.6-8.4-2.9-13-1Z" fill="#fff"/>
    <path d="M38 16.5c-4.6-2-9.1-1.8-13 .9V35c3.9-2.6 8.4-2.9 13-1Z" fill="#fff" fill-opacity=".82"/>
    <circle cx="24" cy="10.5" r="3.4" fill="#f0a43a"/>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">${tile}${art}</svg>`;
}

/** Wraps a single PNG in an ICO container (PNG-in-ICO is supported by all current browsers). */
export function pngToIco(png: Buffer, size: number) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, entry, png]);
}
