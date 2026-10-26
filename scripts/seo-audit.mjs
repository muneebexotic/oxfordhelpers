// Post-build SEO audit over the generated HTML. Fails the build on errors, prints warnings.
// Usage: node scripts/seo-audit.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import site from '../site.config.mjs';

const root = existsSync('dist/client') ? 'dist/client' : 'dist';
const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const attr = (tag, name) => tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined);
const meta = (html, key, by = 'name') => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (attr(m[0], by) === key) return attr(m[0], 'content');
  return undefined;
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const htmlFiles = walk(root).filter((f) => f.endsWith('.html'));
const pages = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = '/' + path.relative(root, file).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '/');
  // Astro writes meta-refresh pages for config redirects; they are not content pages.
  if (/<meta http-equiv="refresh"/i.test(html)) continue;

  const robots = meta(html, 'robots') ?? '';
  const indexable = !/noindex/i.test(robots);
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '');
  const description = decode(meta(html, 'description') ?? '');
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i)?.[0];
  const canonicalHref = canonical ? attr(canonical, 'href') : undefined;
  const h1s = html.match(/<h1\b/gi)?.length ?? 0;
  const at = (msg) => `${rel}: ${msg}`;

  if (!title) errors.push(at('missing <title>'));
  else if (indexable && (title.length < 25 || title.length > 65)) warnings.push(at(`title length ${title.length} ("${title}")`));
  if (!description) errors.push(at('missing meta description'));
  else if (indexable && (description.length < 70 || description.length > 160)) warnings.push(at(`description length ${description.length}`));
  if (h1s !== 1) errors.push(at(`expected exactly one <h1>, found ${h1s}`));
  if (!canonicalHref) errors.push(at('missing canonical'));
  else if (!canonicalHref.startsWith(site.url + '/')) errors.push(at(`canonical not on ${site.url}: ${canonicalHref}`));
  else if (indexable && new URL(canonicalHref).pathname !== rel) errors.push(at(`canonical points elsewhere: ${canonicalHref}`));
  for (const og of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!meta(html, og, 'property')) errors.push(at(`missing ${og}`));
  }
  const ogImage = meta(html, 'og:image', 'property');
  if (ogImage && ogImage.startsWith(site.url)) {
    const local = path.join(root, new URL(ogImage).pathname);
    if (!existsSync(local)) errors.push(at(`og:image file not generated: ${ogImage}`));
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@context'] !== 'https://schema.org') errors.push(at('JSON-LD missing @context'));
    } catch (e) {
      errors.push(at(`invalid JSON-LD: ${e.message}`));
    }
  }

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], 'alt') === undefined) errors.push(at(`<img> without alt: ${m[0].slice(0, 80)}`));
    if (!attr(m[0], 'width') || !attr(m[0], 'height')) warnings.push(at(`<img> without width/height (CLS risk)`));
  }
  if (/\sstyle="/i.test(html.replace(/<svg[\s\S]*?<\/svg>/gi, ''))) warnings.push(at('inline style attribute (blocked by hash-based CSP)'));

  for (const m of html.matchAll(/<a\b[^>]*\shref="(\/[^"#?]*)[^"]*"/gi)) {
    const href = m[1];
    if (href.startsWith('/api/') || href.startsWith('/admin/')) continue;
    const target = href.endsWith('/') ? path.join(root, href, 'index.html') : path.join(root, href);
    if (!existsSync(target)) errors.push(at(`broken internal link ${href}`));
    else if (!href.endsWith('/') && !path.extname(href)) warnings.push(at(`link without trailing slash ${href}`));
  }

  pages.push({ rel, title, description, indexable });
}

// Duplicates among indexable pages
for (const key of ['title', 'description']) {
  const seen = new Map();
  for (const p of pages.filter((p) => p.indexable)) {
    if (seen.has(p[key])) errors.push(`duplicate ${key} on ${seen.get(p[key])} and ${p.rel}`);
    else seen.set(p[key], p.rel);
  }
}

// Sitemap must list exactly the indexable pages
const sitemapFile = path.join(root, 'sitemap.xml');
if (!existsSync(sitemapFile)) errors.push('sitemap.xml not generated');
else {
  const locs = new Set([...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
  for (const p of pages) {
    if (p.indexable && !locs.has(p.rel)) errors.push(`indexable page missing from sitemap: ${p.rel}`);
    if (!p.indexable && locs.has(p.rel)) errors.push(`noindex page listed in sitemap: ${p.rel}`);
  }
  for (const loc of locs) if (!pages.some((p) => p.rel === loc)) errors.push(`sitemap lists a URL with no page: ${loc}`);
}
if (!existsSync(path.join(root, 'robots.txt'))) errors.push('robots.txt not generated');

const indexable = pages.filter((p) => p.indexable).length;
console.log(`\nSEO audit: ${pages.length} pages (${indexable} indexable) for ${site.url}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s). Fix them before deploying.\n`);
  process.exit(1);
}
console.log(`  ok    no errors${warnings.length ? `, ${warnings.length} warning(s)` : ''}\n`);
