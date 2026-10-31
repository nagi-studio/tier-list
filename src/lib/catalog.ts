// AI model catalog (synced from Artificial Analysis by scripts/sync-aa.ts) and helpers to browse it.
import {z} from 'zod';
import {modelIdSchema} from './ids';
import {itemSchema} from './board.ts';
import rawModels from '../data/models.json';
import rawSource from '../data/models-source.json';

export const modelSchema = itemSchema.omit({id: true, catalogId: true}).extend({id: modelIdSchema, provider: z.string(), date: z.string()});
export type Model = z.infer<typeof modelSchema>;
export const models = z.array(modelSchema).parse(rawModels);
export const source = z.object({
  collectedAt: z.string(),
  sources: z.array(z.object({title: z.string(), url: z.url(), accessedAt: z.string()})),
  flagshipRule: z.string(), counts: z.object({models: z.number(), flagships: z.number(), scored: z.number()}),
}).parse(rawSource);

export const flagships = models.filter(m => m.flagship);
/** The top model of each provider, best first: a varied sample for previews (no two Claudes side by side). */
export const onePerProvider = (list: Model[], n: number) => list.filter((m, i) => list.findIndex(o => o.provider === m.provider) === i).slice(0, n);
/** Providers ordered by how many models they have. */
export const providerCounts = models.reduce((acc, m) => acc.set(m.provider, (acc.get(m.provider) || 0) + 1), new Map<string, number>());
export const providers = [...providerCounts].sort((a, b) => b[1] - a[1]).map(([p]) => p);
/** A brand logo key per provider, for showing logos next to provider names. */
export const providerIcons = new Map(models.filter(m => m.icon).map(m => [m.provider, m.icon]));
/** Lobe icon key → provider display name. */
export const brandNames: ReadonlyMap<string, string> = models.toReversed().reduce((names, model) => {
  if (model.icon) names.set(model.icon, model.provider);
  return names;
}, new Map<string, string>());

const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_.()]/g, '');
/** Loose match so "gpt6" finds "GPT-6" and "claude opus" finds "Claude Opus 5.5". */
export const searchModels = (query: string) => {
  const q = normalize(query);
  return models.filter(m => normalize(`${m.name}${m.provider}${m.id}`).includes(q));
};

export function formatDate(date?: string) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  return `${y === new Date().getFullYear() ? '' : `${y}年`}${m}月${d}日`;
}
