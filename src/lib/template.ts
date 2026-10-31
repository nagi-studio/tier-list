// Shared template boundary for authoring JSON, community fetches and share links.
import {z} from 'zod';
import {colorAt, TIER_PRESETS, presetSchema, creditSchema} from './board.ts';
import {newItemId, newRowId} from './ids';
import {mapNonEmpty} from './nonEmpty';
import type {Board, Credit, Item, Row, TemplateBoard} from './board.ts';

export const LIMITS = {title: 60, description: 200, author: 40, tags: 5, tag: 12, tiers: 30, label: 30, items: 200, name: 60, emoji: 8};
export const ASSET_RE = /^community\/[a-z0-9-]+\/[a-f0-9]{12}\.webp$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

const text = (max: number) => z.string({error: '必须是字符串'}).trim().max(max, {
  error: issue => `不能超过 ${max} 个字（现在 ${typeof issue.input === 'string' ? issue.input.length : 0}）`,
});
const requiredText = (max: number) => z.string({error: issue => issue.input == null ? '缺少' : '必须是字符串'})
  // Pipe preserves the distinct missing/blank diagnostics; metadata retains the input limit for JSON Schema.
  .min(1, {error: '缺少'}).pipe(text(max).min(1, {error: '不能为空'})).meta({maxLength: max});
const optionalText = (max: number) => text(max).nullish().transform(value => value || undefined);
const tierSchema = z.object({
  label: requiredText(LIMITS.label),
  color: z.string({error: '必须是 #RRGGBB 格式'}).regex(HEX, {error: '必须是 #RRGGBB 格式'}).nullish(),
});
const tierInputSchema = z.union([requiredText(LIMITS.label).transform(label => ({label, color: undefined})), tierSchema]);
const uidString = z.string().trim().regex(/^\d{1,19}$/, {
  error: '必须是 B 站 UID（空间链接 space.bilibili.com/ 后面那串数字）',
});
const bvidSchema = z.string().trim().regex(/^BV[0-9A-Za-z]{10}$/, {error: '必须是 BV 号，比如 BV1xx411c7mD'});
const templateItemSchema = z.object({
  name: requiredText(LIMITS.name).describe('选手名称'),
  emoji: optionalText(LIMITS.emoji).describe('Emoji 或 1–3 个字'),
  icon: z.string().regex(/^[a-z0-9-]+$/).nullish().describe('内置品牌 Logo，如 openai、anthropic、google'),
  image: z.string().regex(/^[iI][mM][aA][gG][eE][sS]\/[^/\\]+\.([pP][nN][gG]|[jJ][pP][eE]?[gG]|[wW][eE][bB][pP]|[gG][iI][fF]|[sS][vV][gG])$/).nullish().describe('模板目录里 images/ 下的图片'),
  asset: z.string().regex(ASSET_RE).nullish().describe('编译后的社区图片路径'),
  tier: z.number({error: '必须是整数'}).int({error: '必须是整数'}).min(0, {error: '必须是非负整数'}).nullish().describe('可选：预先放进第几级（从 0 开始）'),
}).transform(({name, emoji, icon, image, asset, tier}) => ({
  name, ...(emoji && {emoji}), ...(icon != null && {icon}), ...(image != null && {image}),
  ...(asset != null && {asset}), ...(tier != null && {tier}),
}));

type TemplateOptions = {allowImages?: boolean; knownIcons?: ReadonlySet<string>};

/** Input and normalization live in one schema; io: input also generates the contributor JSON Schema. */
export function createTemplateSchema({allowImages = false, knownIcons}: TemplateOptions = {}) {
  return z.object({
    $schema: z.string().optional(),
    title: requiredText(LIMITS.title).describe('模板标题，导入后就是榜单标题'),
    description: optionalText(LIMITS.description).describe('一句话介绍，显示在模板中心'),
    author: optionalText(LIMITS.author).describe('署名，显示在模板中心（建议用 B 站昵称）'),
    bilibili: z.union([uidString, z.number().nonnegative().multipleOf(1).lt(1e19).transform(String).pipe(uidString)]).nullish().transform(v => v ?? undefined).describe('你的 B 站 UID：space.bilibili.com/ 后面那串数字。模板中心点署名会跳到你的空间'),
    video: bvidSchema.nullish().transform(v => v ?? undefined).describe('可选：你的一个视频的 BV 号，模板中心会显示「看视频」'),
    tags: z.array(requiredText(LIMITS.tag)).max(LIMITS.tags).nullish().transform(v => v?.length ? v : undefined).describe('最多 5 个标签，每个最多 12 个字'),
    tiers: z.union([
      presetSchema.describe('classic = S+ S A B C D；cn = 夯 顶级 人上人 NPC 拉完了；numeric = T0–T4')
        .transform(key => mapNonEmpty(TIER_PRESETS[key], (label, i) => ({label, color: colorAt(i)}))),
      z.tuple([tierInputSchema], tierInputSchema)
        .refine(tiers => tiers.length <= LIMITS.tiers).meta({minItems: 1, maxItems: LIMITS.tiers})
        .transform(tiers => mapNonEmpty(tiers, (tier, i) => ({label: tier.label, color: tier.color?.toLowerCase() ?? colorAt(i)}))),
    ]).describe('等级：预设名，或自定义等级列表'),
    items: z.array(templateItemSchema).min(1).max(LIMITS.items).superRefine((items, ctx) => {
      const names = new Set<string>();
      items.forEach((item, i) => {
        if (names.has(item.name)) ctx.addIssue({code: 'custom', path: [i, 'name'], message: `「${item.name}」重复了`});
        names.add(item.name);
        if (item.icon != null && knownIcons && !knownIcons.has(item.icon)) ctx.addIssue({code: 'custom', path: [i, 'icon'], message: `「${item.icon}」不是可用的品牌 Logo`});
        if (item.image != null && !allowImages) ctx.addIssue({code: 'custom', path: [i, 'image'], message: '只能用在社区模板仓库里'});
      });
    }),
  }).superRefine((template, ctx) => {
    template.items.forEach((item, i) => {
      if (item.tier != null && item.tier >= template.tiers.length) ctx.addIssue({code: 'custom', path: ['items', i, 'tier'], message: `必须是 0 到 ${template.tiers.length - 1} 的整数`});
    });
  }).transform(({title, description, author, bilibili, video, tags, tiers, items}) => ({
    title, ...(description && {description}), ...(author && {author}), ...(bilibili && {bilibili}), ...(video && {video}), ...(tags && {tags}), tiers, items,
  }));
}
export const templateSchema = createTemplateSchema();
export const authoringTemplateSchema = createTemplateSchema({allowImages: true});
export type Template = z.infer<typeof templateSchema>;
export type TemplateItem = Template['items'][number];

const fieldPath = (path: PropertyKey[]) => path.reduce<string>((out, key) => typeof key === 'number' ? `${out}[${key}]` : `${out}${out ? '.' : ''}${String(key)}`, '');

/** Translate Zod issues at the boundary so contributors retain field paths and Chinese diagnostics. */
function templateErrors(issues: z.core.$ZodIssue[], {prefix = [], allowImages = false}: {prefix?: PropertyKey[]; allowImages?: boolean} = {}): string[] {
  return issues.flatMap(issue => {
    const keys = [...prefix, ...issue.path], path = fieldPath(keys), field = keys.at(-1);
    if (issue.code === 'invalid_union') {
      if (path === 'tiers') {
        if (typeof issue.input === 'string') return [`tiers 预设只能是 ${Object.keys(TIER_PRESETS).join(' / ')}`];
        if (Array.isArray(issue.input) && issue.input.length >= 1 && issue.input.length <= LIMITS.tiers) {
          return templateErrors(issue.errors[1] ?? [], {prefix: keys, allowImages});
        }
        return [`tiers 必须是预设名，或 1–${LIMITS.tiers} 个等级的数组`];
      }
      if (keys[0] === 'tiers' && typeof field === 'number') {
        const branch = typeof issue.input === 'string' ? 0 : 1;
        return templateErrors(issue.errors[branch] ?? [], {prefix: keys, allowImages});
      }
      if (field === 'bilibili') return [`${path} 必须是 B 站 UID（空间链接 space.bilibili.com/ 后面那串数字）`];
      if (field === 'video') return [`${path} 必须是 BV 号，比如 BV1xx411c7mD`];
    }
    if (!path) return ['模板必须是一个 JSON 对象'];
    if (issue.message === '缺少') return [`缺少 ${path}`];
    if (field === 'tags') return [`tags 必须是最多 ${LIMITS.tags} 个字符串的数组`];
    if (field === 'items') return [`items 必须是 1–${LIMITS.items} 个选手的数组`];
    if (field === 'tiers') return [`tiers 必须是预设名，或 1–${LIMITS.tiers} 个等级的数组`];
    if (field === 'icon' && issue.code !== 'custom') return [`${path}「${String(issue.input)}」不是可用的品牌 Logo`];
    if (field === 'image' && issue.code !== 'custom') return [allowImages
      ? `${path} 必须是 images/ 目录下的 png / jpg / webp / gif / svg 文件`
      : `${path} 只能用在社区模板仓库里`];
    if (field === 'asset') return [`${path} 格式不对`];
    if (typeof field === 'number' && issue.code === 'invalid_type') {
      if (keys[0] === 'items') return [`${path} 必须是对象`];
      if (keys[0] === 'tiers') return [`缺少 ${path}.label`];
    }
    return [`${path}${issue.message.startsWith('「') ? '' : ' '}${issue.message}`];
  });
}

type TemplateResult =
  | {status: 'valid'; template: Template; errors: []}
  | {status: 'invalid'; template: null; errors: string[]};
export function normalizeTemplate(raw: unknown, options: TemplateOptions = {}): TemplateResult {
  const result = createTemplateSchema(options).safeParse(raw, {reportInput: true});
  return result.success ? {status: 'valid', template: result.data, errors: []}
    : {status: 'invalid', template: null, errors: templateErrors(result.error.issues, options)};
}

export function templateToBoard(tpl: Template, credit?: Credit): TemplateBoard {
  const toItem = ({tier: _tier, ...item}: TemplateItem): Item => ({...item, id: newItemId()});
  const rows = mapNonEmpty(tpl.tiers, (tier, index): Row => ({
    id: newRowId(), label: tier.label, color: tier.color,
    items: tpl.items.filter(item => item.tier === index).map(toItem),
  }));
  const pool = tpl.items.filter(item => item.tier == null).map(toItem);
  return {title: tpl.title, rows, pool, ...(credit && {credit})};
}

export function boardToTemplate(board: Board, {withPlacement = true} = {}): {template: Template; droppedImages: number} {
  let droppedImages = 0;
  const toItem = (it: Item, tier?: number): TemplateItem => {
    if (it.image) droppedImages++;
    return {name: it.name, ...(it.emoji && {emoji: it.emoji}), ...(it.icon && {icon: it.icon}), ...(it.asset && {asset: it.asset}), ...(withPlacement && tier != null && {tier})};
  };
  const items = [...board.rows.flatMap((r, i) => r.items.map(it => toItem(it, i))), ...board.pool.map(it => toItem(it))];
  return {template: {title: board.title.trim() || '我的 Tier List', tiers: mapNonEmpty(board.rows, r => ({label: r.label, color: r.color})), items}, droppedImages};
}

// Compact JSON → deflate → base64url, with z (deflate-raw) or j (plain UTF-8) marker.
const compact = (tpl: Template, credit?: Credit) => ({
  ...(credit && {c: [credit.template, credit.author ?? '', credit.bilibili ?? '']}),
  t: tpl.title, r: tpl.tiers.map(t => [t.label, t.color.slice(1)]),
  i: tpl.items.map(it => [it.name, it.emoji || '', it.icon || '', it.asset || '', it.tier ?? -1]),
});
const compactSchema = z.object({
  c: z.tuple([z.string(), z.string(), z.string()]).optional(),
  t: z.string(), r: z.array(z.tuple([z.string(), z.string()])),
  i: z.array(z.tuple([z.string(), z.string(), z.string(), z.string(), z.number()])),
});
const expand = (c: z.infer<typeof compactSchema>) => ({
  title: c.t, tiers: c.r.map(([label, color]) => ({label, color: `#${color}`})),
  items: c.i.map(([name, emoji, icon, asset, tier]) => ({name, ...(emoji && {emoji}), ...(icon && {icon}), ...(asset && {asset}), ...(tier >= 0 && {tier})})),
});
const toB64url = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
export async function encodeShare(tpl: Template, credit?: Credit) {
  const bytes = new TextEncoder().encode(JSON.stringify(compact(tpl, credit)));
  if (typeof CompressionStream === 'function') return `z${toB64url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  return `j${toB64url(bytes)}`;
}
/** Decode a share code. A malformed credit is dropped rather than failing the whole link. */
export async function decodeShare(code: unknown, options?: TemplateOptions): Promise<{template: Template; credit?: Credit}> {
  const parsedCode = z.string().min(2).max(20000).safeParse(code);
  if (!parsedCode.success) throw Error('分享链接不完整');
  let raw: unknown, credit: Credit | undefined;
  try {
    const value = parsedCode.data, bytes = fromB64url(value.slice(1));
    let json: string;
    if (value[0] === 'z') json = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')));
    else if (value[0] === 'j') json = new TextDecoder().decode(bytes);
    else throw Error();
    const compactData: unknown = JSON.parse(json);
    const parsed = compactSchema.parse(compactData);
    raw = expand(parsed);
    if (parsed.c) {
      const [template, author, bilibili] = parsed.c;
      const result = creditSchema.safeParse({template, ...(author && {author}), ...(bilibili && {bilibili})});
      if (result.success) credit = result.data;
    }
  } catch { throw Error('分享链接已损坏，没法读取'); }
  const {template, errors} = normalizeTemplate(raw, options);
  if (!template) throw Error(`分享的模板有问题：${errors[0]}`);
  return {template, ...(credit && {credit})};
}
