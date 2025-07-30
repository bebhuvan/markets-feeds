import { defineCollection, z } from 'astro:content';

const linksCollection = defineCollection({
  type: 'data',
  schema: z.array(z.object({
    id: z.string(),
    sourceId: z.string(),
    sourceName: z.string(),
    title: z.string(),
    url: z.string().url(),
    summary: z.string(),
    fullContent: z.string().optional(),
    publishedAt: z.string(),
    fetchedAt: z.string(),
    category: z.enum(['markets', 'macro', 'research', 'policy', 'technology', 'non-money', 'blogs', 'culture', 'filings', 'news', 'equities', 'videos']),
    tags: z.array(z.string()),
    priority: z.enum(['breaking', 'high', 'normal', 'low']),
    contentHash: z.string(),
    imageUrl: z.string().url().optional(),
    author: z.string().optional()
  }))
});

const discoveryCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string().default('Research Team'),
    tags: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
    media: z.object({
      type: z.enum(['link', 'video', 'image']).optional(),
      url: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional()
    }).optional()
  })
});

export const collections = {
  'links': linksCollection,
  'discoveries': discoveryCollection
};