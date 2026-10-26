import { getCollection, type CollectionEntry } from 'astro:content';

export type Guide = CollectionEntry<'guides'> & { minutes: number };

export async function getGuides(): Promise<Guide[]> {
  const entries = await getCollection('guides');
  return entries
    .map((g) => ({ ...g, minutes: Math.max(2, Math.round((g.body ?? '').split(/\s+/).length / 230)) }))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
}
