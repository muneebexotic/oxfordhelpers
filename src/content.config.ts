import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(48),
    description: z.string().min(70).max(160),
    summary: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    services: z.array(z.enum(['assignments', 'coursework', 'dissertation', 'research-work', 'report-writing'])),
  }),
});

export const collections = { guides };
