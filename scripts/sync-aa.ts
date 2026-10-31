import {z} from 'zod';
import {modelIdSchema} from '../src/lib/ids';
import type {Model} from '../src/lib/catalog.ts';
// Sync the AI model catalog from Artificial Analysis public pages.
// Usage: bun scripts/sync-aa.ts   → writes src/data/models.json + src/data/models-source.json
import {writeFile} from 'node:fs/promises';

const UA = 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/130 Safari/537.36';
// Each creator's best model is a flagship if it scores at least this; any model at FRONTIER or above is too.
const FLAGSHIP_MIN = 30, FRONTIER = 49;
// AA creator slug → @lobehub/icons Avatar key (see src/BrandAvatar.tsx)
const ICONS: Record<string, string> = {
  alibaba: 'qwen', openai: 'openai', google: 'google', mistral: 'mistral', deepseek: 'deepseek', anthropic: 'anthropic',
  meta: 'meta', xai: 'xai', nvidia: 'nvidia', zai: 'zai', inclusionai: 'ling', ibm: 'ibm', liquidai: 'liquid', ai2: 'ai2',
  xiaomi: 'xiaomimimo', kimi: 'kimi', minimax: 'minimax', upstage: 'upstage', aws: 'nova', 'ai21-labs': 'ai21', cohere: 'cohere',
  perplexity: 'perplexity', stepfun: 'stepfun', lg: 'lg', 'nous-research': 'nousresearch', azure: 'microsoft', inception: 'inception',
  bytedance_seed: 'bytedance', longcat: 'longcat', tencent: 'hunyuan', baidu: 'wenxin', 'reka-ai': 'reka', kwaikat: 'kwaikat',
  arcee: 'arcee', 'tii-uae': 'tii', deepcogito: 'deepcogito', snowflake: 'snowflake', openchat: 'openchat', databricks: 'dbrx',
};

async function flight(path: string) {
  const html = await (await fetch(`https://artificialanalysis.ai${path}`, {headers: {'user-agent': UA}})).text();
  return [...html.matchAll(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs)].map(m => { const raw: unknown = JSON.parse(`"${m[1]}"`); return z.string().parse(raw); }).join('');
}
function extractArray(text: string, key: string): unknown {
  const start = text.indexOf(`"${key}":[`);
  if (start < 0) throw Error(`${key} not found — AA page layout changed`);
  const i = start + key.length + 3; let depth = 0, inStr = false;
  for (let j = i; j < text.length; j++) {
    const c = text[j];
    if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === '[' || c === '{') depth++; else if ((c === ']' || c === '}') && --depth === 0) return JSON.parse(text.slice(i, j + 1));
  }
}

const releases = z.array(z.object({
  slug: modelIdSchema, name: z.string(), creator: z.object({name: z.string(), slug: z.string()}),
  intelligenceIndex: z.number().nullish(), releaseDate: z.string(), isOpenWeights: z.boolean().nullish(), isDeprecated: z.boolean().nullish(),
})).parse(extractArray(await flight('/models/releases'), 'releases'));
const variants = z.array(z.object({modelCreatorName: z.string(), modelCreatorColor: z.string().nullish()})).parse(extractArray(await flight('/leaderboards/models'), 'initialModels'));
const colors = Object.fromEntries(variants.map(v => [v.modelCreatorName, v.modelCreatorColor ?? undefined]));

const models: Model[] = releases.map(r => ({
  id: r.slug, name: r.name, provider: r.creator.name,
  ...(ICONS[r.creator.slug] ? {icon: ICONS[r.creator.slug]} : {}),
  ...(colors[r.creator.name] ? {color: colors[r.creator.name]} : {}),
  ...(r.intelligenceIndex != null ? {score: Math.round(r.intelligenceIndex * 10) / 10} : {}),
  date: r.releaseDate,
  ...(r.isOpenWeights ? {open: true} : {}),
  ...(r.isDeprecated ? {deprecated: true} : {}),
}));
const best: Record<string, Model> = {};
for (const m of models) if (m.score && !m.deprecated && (!best[m.provider] || m.score > (best[m.provider]?.score ?? -Infinity))) best[m.provider] = m;
for (const m of models) if (m.score && !m.deprecated && (m.score >= FRONTIER || (best[m.provider] === m && m.score >= FLAGSHIP_MIN))) m.flagship = true;
models.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || Number(!!a.deprecated) - Number(!!b.deprecated) || b.date.localeCompare(a.date));

const today = new Date().toISOString().slice(0, 10);
await writeFile('src/data/models.json', JSON.stringify(models, null, 0).replace(/},{/g, '},\n{') + '\n');
await writeFile('src/data/models-source.json', JSON.stringify({
  collectedAt: today,
  sources: [
    {title: 'Artificial Analysis — Models (Releases)', url: 'https://artificialanalysis.ai/models/releases', accessedAt: today},
    {title: 'Artificial Analysis — LLM Leaderboard', url: 'https://artificialanalysis.ai/leaderboards/models', accessedAt: today},
  ],
  flagshipRule: `Each creator's highest Intelligence Index model if ≥ ${FLAGSHIP_MIN}, plus any model ≥ ${FRONTIER}. Deprecated models excluded.`,
  counts: {models: models.length, flagships: models.filter(m => m.flagship).length, scored: models.filter(m => m.score).length},
}, null, 2) + '\n');
console.log(`${models.length} models, flagships:`, models.filter(m => m.flagship).map(m => `${m.name} ${m.score}`).join(', '));
