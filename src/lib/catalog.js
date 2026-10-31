// AI model catalog (synced from Artificial Analysis by scripts/sync-aa.mjs) and helpers to browse it.
import models from '../data/models.json';
import source from '../data/models-source.json';

export {models, source};
export const flagships = models.filter(m => m.flagship);
/** Providers ordered by how many models they have. */
const providerCounts = models.reduce((acc, m) => acc.set(m.provider, (acc.get(m.provider) || 0) + 1), new Map());
export const providers = [...providerCounts].sort((a, b) => b[1] - a[1]).map(([p]) => p);
/** Lobe icon key → provider display name. */
export const brandNames = Object.fromEntries(models.filter(m => m.icon).reverse().map(m => [m.icon, m.provider]));

const normalize = s => s.toLowerCase().replace(/[\s\-_.()]/g, '');
/** Loose match so "gpt6" finds "GPT-6" and "claude opus" finds "Claude Opus 5.5". */
export const searchModels = query => {
  const q = normalize(query);
  return models.filter(m => normalize(`${m.name}${m.provider}${m.id}`).includes(q));
};

export function formatDate(date) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  return `${y === new Date().getFullYear() ? '' : `${y}年`}${m}月${d}日`;
}
