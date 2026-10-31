// Template primitives shared by community templates (templates/*/template.json), share links and the app.
// Pure functions: also used by scripts/build-templates.mjs under Bun.
import {COLORS, TIER_PRESETS, uid} from './board.js';

export const LIMITS = {title: 60, description: 200, author: 40, tags: 5, tag: 12, tiers: 30, label: 30, items: 200, name: 60, emoji: 8};
export const ASSET_RE = /^community\/[a-z0-9-]+\/[a-f0-9]{12}\.webp$/;
export const TEMPLATE_ID_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;
const HEX = /^#[\da-f]{6}$/i;

/**
 * Validate and normalize a template. Accepts the authoring format:
 *   tiers: 'classic' | 'cn' | 'numeric' | ['S', 'A'] | [{label, color}]
 *   items: [{name, emoji?, icon?, image?, asset?, tier?}]
 * Returns {template, errors}. `template` is null when there are errors.
 * `image` (a path inside the template folder) is only allowed when `allowImages` (build time).
 */
export function normalizeTemplate(raw, {allowImages = false, knownIcons} = {}) {
  const errors = [], err = m => errors.push(m);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {template: null, errors: ['模板必须是一个 JSON 对象']};
  const str = (v, max, field, required = false) => {
    if (v == null || v === '') { if (required) err(`缺少 ${field}`); return undefined; }
    if (typeof v !== 'string') { err(`${field} 必须是字符串`); return undefined; }
    const s = v.trim();
    if (s.length > max) err(`${field} 不能超过 ${max} 个字（现在 ${s.length}）`);
    if (required && !s) err(`${field} 不能为空`);
    return s || undefined;
  };

  const title = str(raw.title, LIMITS.title, 'title', true);
  const description = str(raw.description, LIMITS.description, 'description');
  const author = str(raw.author, LIMITS.author, 'author');
  let tags;
  if (raw.tags != null) {
    if (!Array.isArray(raw.tags) || raw.tags.length > LIMITS.tags) err(`tags 必须是最多 ${LIMITS.tags} 个字符串的数组`);
    else tags = raw.tags.map((t, i) => str(t, LIMITS.tag, `tags[${i}]`, true)).filter(Boolean);
  }

  let tiers = [];
  if (typeof raw.tiers === 'string') {
    if (!TIER_PRESETS[raw.tiers]) err(`tiers 预设只能是 ${Object.keys(TIER_PRESETS).join(' / ')}`);
    else tiers = TIER_PRESETS[raw.tiers].map((label, i) => ({label, color: COLORS[i % COLORS.length]}));
  } else if (Array.isArray(raw.tiers) && raw.tiers.length >= 1 && raw.tiers.length <= LIMITS.tiers) {
    tiers = raw.tiers.map((t, i) => {
      const tier = typeof t === 'string' ? {label: t} : t || {};
      const label = str(tier.label, LIMITS.label, `tiers[${i}].label`, true);
      if (tier.color != null && !HEX.test(tier.color)) err(`tiers[${i}].color 必须是 #RRGGBB 格式`);
      return {label, color: HEX.test(tier.color || '') ? tier.color.toLowerCase() : COLORS[i % COLORS.length]};
    });
  } else err(`tiers 必须是预设名，或 1–${LIMITS.tiers} 个等级的数组`);

  let items = [];
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > LIMITS.items) err(`items 必须是 1–${LIMITS.items} 个选手的数组`);
  else {
    const names = new Set();
    items = raw.items.map((it, i) => {
      const at = `items[${i}]`;
      if (!it || typeof it !== 'object') { err(`${at} 必须是对象`); return null; }
      const name = str(it.name, LIMITS.name, `${at}.name`, true);
      if (name && names.has(name)) err(`${at}.name「${name}」重复了`);
      names.add(name);
      const item = {name};
      const emoji = str(it.emoji, LIMITS.emoji, `${at}.emoji`);
      if (emoji) item.emoji = emoji;
      if (it.icon != null) {
        if (typeof it.icon !== 'string' || !/^[a-z0-9-]+$/.test(it.icon) || (knownIcons && !knownIcons.has(it.icon))) err(`${at}.icon「${it.icon}」不是可用的品牌 Logo`);
        else item.icon = it.icon;
      }
      if (it.image != null) {
        if (!allowImages) err(`${at}.image 只能用在社区模板仓库里`);
        else if (typeof it.image !== 'string' || !/^images\/[^/\\]+\.(png|jpe?g|webp|gif|svg)$/i.test(it.image)) err(`${at}.image 必须是 images/ 目录下的 png / jpg / webp / gif / svg 文件`);
        else item.image = it.image;
      }
      if (it.asset != null) {
        if (typeof it.asset !== 'string' || !ASSET_RE.test(it.asset)) err(`${at}.asset 格式不对`);
        else item.asset = it.asset;
      }
      if (it.tier != null) {
        if (!Number.isInteger(it.tier) || it.tier < 0 || it.tier >= tiers.length) err(`${at}.tier 必须是 0 到 ${tiers.length - 1} 的整数`);
        else item.tier = it.tier;
      }
      return item;
    });
  }
  if (errors.length) return {template: null, errors};
  return {template: {title, ...(description && {description}), ...(author && {author}), ...(tags?.length && {tags}), tiers, items}, errors};
}

/** Turn a normalized template into board fields (rows + pool), placing items that carry a tier index. */
export function templateToBoard(tpl) {
  const rows = tpl.tiers.map(t => ({id: uid(), label: t.label, color: t.color, items: []}));
  const pool = [];
  for (const {tier, ...item} of tpl.items) (tier != null ? rows[tier].items : pool).push({...item, id: uid()});
  return {title: tpl.title, rows, pool};
}

/**
 * Snapshot a board as a template. Uploaded images (data URLs) can't travel in a link, so those items
 * fall back to emoji / first letter; `droppedImages` counts them.
 */
export function boardToTemplate(board, {withPlacement = true} = {}) {
  let droppedImages = 0;
  const toItem = (it, tier) => {
    const item = {name: it.name};
    if (it.emoji) item.emoji = it.emoji;
    if (it.icon) item.icon = it.icon;
    if (it.asset) item.asset = it.asset;
    if (it.image) droppedImages++;
    if (withPlacement && tier != null) item.tier = tier;
    return item;
  };
  const items = [...board.rows.flatMap((r, i) => r.items.map(it => toItem(it, i))), ...board.pool.map(it => toItem(it))];
  return {template: {title: board.title.trim() || '我的 Tier List', tiers: board.rows.map(r => ({label: r.label, color: r.color})), items}, droppedImages};
}

// ---- Share links: compact JSON → deflate → base64url, prefixed with a format marker ----
// 'z' = deflate-raw (CompressionStream), 'j' = plain UTF-8 for browsers without CompressionStream.

const compact = tpl => ({
  t: tpl.title,
  r: tpl.tiers.map(t => [t.label, t.color.slice(1)]),
  i: tpl.items.map(it => [it.name, it.emoji || '', it.icon || '', it.asset || '', it.tier ?? -1]),
});
const expand = c => ({
  title: c.t,
  tiers: c.r.map(([label, color]) => ({label, color: `#${color}`})),
  items: c.i.map(([name, emoji, icon, asset, tier]) => ({name, ...(emoji && {emoji}), ...(icon && {icon}), ...(asset && {asset}), ...(tier >= 0 && {tier})})),
});

const toB64url = bytes => btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function encodeShare(tpl) {
  const bytes = new TextEncoder().encode(JSON.stringify(compact(tpl)));
  if (typeof CompressionStream === 'function') return `z${toB64url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  return `j${toB64url(bytes)}`;
}

/** Decode and validate a share string. Throws a user-facing Error on bad input. */
export async function decodeShare(code, options) {
  if (typeof code !== 'string' || code.length < 2 || code.length > 20000) throw Error('分享链接不完整');
  let json;
  try {
    const bytes = fromB64url(code.slice(1));
    if (code[0] === 'z') json = new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')));
    else if (code[0] === 'j') json = new TextDecoder().decode(bytes);
    else throw Error();
    json = expand(JSON.parse(json));
  } catch { throw Error('分享链接已损坏，没法读取'); }
  const {template, errors} = normalizeTemplate(json, options);
  if (!template) throw Error(`分享的模板有问题：${errors[0]}`);
  return template;
}
