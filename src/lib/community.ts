import {z} from 'zod';
import rawCommunity from '../data/community.json';
import {itemSchema} from './board';
import {templateIdSchema} from './ids';

export const communityEntrySchema = z.object({
  id: templateIdSchema, title: z.string(), description: z.string().optional(),
  author: z.string().optional(), bilibili: z.string().regex(/^\d{1,19}$/).optional(),
  tags: z.array(z.string()).optional(), count: z.number().int().min(1),
  preview: z.array(itemSchema.pick({name: true, emoji: true, icon: true, asset: true})),
});
export type CommunityEntry = z.infer<typeof communityEntrySchema>;
export const community = z.array(communityEntrySchema).parse(rawCommunity);
