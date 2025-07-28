import { defineCollection, z } from 'astro:content';

const linksCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    sourceId: z.string(),
    sourceName: z.string(),
    title: z.string(),
    url: z.string().url(),
    summary: z.string(),
    content: z.string().optional(),
    publishedAt: z.string().datetime(),
    fetchedAt: z.string().datetime(),
    category: z.enum(['markets', 'macro', 'research', 'policy']),
    tags: z.array(z.string()),
    priority: z.enum(['breaking', 'high', 'normal', 'low']),
    contentHash: z.string(),
    imageUrl: z.string().url().optional(),
    author: z.string().optional()
  })
});

export const collections = {
  'links': linksCollection
};