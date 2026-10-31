import {z} from 'zod';
import rawCommunity from '../data/community.json';
import {bilibiliUidSchema, itemSchema} from './board';
import type {Credit} from './board';
import {templateIdSchema} from './ids';
import type {TemplateId} from './ids';
import {normalizeTemplate} from './template';

export const communityEntrySchema = z.object({
  id: templateIdSchema, title: z.string(), description: z.string().optional(),
  author: z.string().optional(), bilibili: bilibiliUidSchema.optional(),
  // Downloaded at build time (scripts/build-templates.ts): community/avatars/<uid>.webp inside the package.
  avatar: z.string().regex(/^community\/avatars\/\d{1,19}\.webp$/).optional(),
  video: z.string().regex(/^BV[0-9A-Za-z]{10}$/).optional(),
  tags: z.array(z.string()).optional(), count: z.number().int().min(1),
  preview: z.array(itemSchema.pick({name: true, emoji: true, icon: true, asset: true})),
});
export type CommunityEntry = z.infer<typeof communityEntrySchema>;
export const community = z.array(communityEntrySchema).parse(rawCommunity);

export const creditFor = (entry: CommunityEntry): Credit => ({
  template: entry.id, ...(entry.author && {author: entry.author}), ...(entry.bilibili && {bilibili: entry.bilibili}),
});

/** Fetch a compiled community template shipped in the Toy package. */
export async function loadCommunity(id: TemplateId) {
  const res = await fetch(`${import.meta.env.BASE_URL}community/${id}.json`);
  if (!res.ok) throw Error('模板加载失败，请重试');
  const raw: unknown = await res.json();
  const {template} = normalizeTemplate(raw);
  if (!template) throw Error('模板加载失败，请重试');
  return template;
}
