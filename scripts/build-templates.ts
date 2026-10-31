import {z} from 'zod';
import type {CommunityEntry} from '../src/lib/community.ts';
// Validate community templates and compile them for the app.
//
//   bun scripts/build-templates.ts          → writes public/community/** and src/data/community.json
//   bun scripts/build-templates.ts --check  → validate only (used by CI on pull requests)
//
// Each template lives in templates/<id>/template.json, with optional images in templates/<id>/images/.
// Images are resized to 128×128 WebP (SVG logos fit with padding, photos are cropped) and served from the
// Toy package itself: same origin for PNG export, and reachable from mainland China.
import {readdir, readFile, writeFile, mkdir, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, relative, resolve} from 'node:path';
import sharp from 'sharp';
import {normalizeTemplate} from '../src/lib/template.ts';
import {templateIdSchema} from '../src/lib/ids';
import {brandKeys} from '../src/components/BrandAvatar.tsx';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024, IMAGE_SIZE = 128;

const cardSchema = z.object({code: z.literal(0), data: z.object({card: z.object({name: z.string().min(1), face: z.string()})})});
/**
 * Look up a Bilibili account's nickname and avatar by UID (public card API). Resolved at build time so
 * visitors never call Bilibili APIs from the Toy. Returns null when the lookup fails; the build continues.
 */
export async function lookupBilibili(uid: string): Promise<{name: string; avatar: string} | null> {
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
      headers: {'user-agent': 'Mozilla/5.0 (tier-list build)'}, signal: AbortSignal.timeout(8000),
    });
    const {data} = cardSchema.parse(await res.json());
    const face = data.card.face.replace(/^http:/, 'https:');
    return {name: data.card.name.slice(0, 40), avatar: /^https:\/\/i\d\.hdslb\.com\/bfs\/[\w/.-]+$/.test(face) ? `${face}@96w_96h.webp` : ''};
  } catch { return null; }
}

export async function buildTemplates({root = process.cwd(), check = false, lookup = lookupBilibili} = {}) {
  const srcDir = join(root, 'templates'), outDir = join(root, 'public/community');
  const knownIcons = new Set(brandKeys), errors: string[] = [], warnings: string[] = [], index: CommunityEntry[] = [];
  const ids = (await readdir(srcDir, {withFileTypes: true})).filter(d => d.isDirectory()).map(d => d.name).sort();
  // Overwrite in place and prune stale files afterwards: wiping the folder makes a running Vite dev server
  // forget the public files until it restarts.
  const written = new Set<string>();
  if (!check) await mkdir(outDir, {recursive: true});

  for (const rawId of ids) {
    const where = `templates/${rawId}`, fail = (msg: string) => errors.push(`${where}: ${msg}`);
    const parsedId = templateIdSchema.safeParse(rawId);
    if (!parsedId.success) { fail('文件夹名只能用小写字母、数字和短横线（2–40 个字符），例如 milk-tea'); continue; }
    const id = parsedId.data;
    let raw: unknown;
    try { raw = JSON.parse(await readFile(join(srcDir, id, 'template.json'), 'utf8')); }
    catch (e) { fail(z.object({code: z.literal('ENOENT')}).safeParse(e).success ? '缺少 template.json' : `template.json 不是合法 JSON：${e instanceof Error ? e.message : String(e)}`); continue; }
    const {template, errors: problems} = normalizeTemplate(raw, {allowImages: true, knownIcons});
    if (!template) { problems.forEach(fail); continue; }

    for (const item of template.items) {
      if (!item.image) continue;
      const file = resolve(srcDir, id, item.image);
      if (!file.startsWith(resolve(srcDir, id) + '/')) { fail(`${item.image} 不在模板目录里`); continue; }
      let input;
      try {
        if ((await stat(file)).size > MAX_IMAGE_BYTES) { fail(`${item.image} 超过 2MB，请先压缩`); continue; }
        input = await readFile(file);
        // Logos (SVG) keep their shape with some padding; photos fill the square.
        const isLogo = /\.svg$/i.test(item.image), inner = isLogo ? Math.round(IMAGE_SIZE * .78) : IMAGE_SIZE, pad = (IMAGE_SIZE - inner) / 2;
        const webp = await sharp(input, {animated: false, density: 300})
          .resize(inner, inner, {fit: isLogo ? 'contain' : 'cover', background: '#0000'})
          .extend({top: Math.floor(pad), bottom: Math.ceil(pad), left: Math.floor(pad), right: Math.ceil(pad), background: '#0000'})
          .webp({quality: 82}).toBuffer();
        const name = `${createHash('sha1').update(webp).digest('hex').slice(0, 12)}.webp`;
        if (!check) { await mkdir(join(outDir, id), {recursive: true}); await writeFile(join(outDir, id, name), webp); written.add(join(id, name)); }
        item.asset = `community/${id}/${name}`;
      } catch (e) { fail(z.object({code: z.literal('ENOENT')}).safeParse(e).success ? `找不到图片 ${item.image}` : `${item.image} 读不出来（${e instanceof Error ? e.message : String(e)}）`); continue; }
      delete item.image;
    }

    if (!check) { await writeFile(join(outDir, `${id}.json`), JSON.stringify(template)); written.add(`${id}.json`); }
    // The account behind the UID decides the displayed name; `author` is only a fallback when the lookup fails.
    const account = !check && template.bilibili ? await lookup(template.bilibili) : null;
    if (!check && template.bilibili && !account) warnings.push(`${where}: 没查到 UID ${template.bilibili} 的昵称，先用 author 字段`);
    const author = account?.name ?? template.author ?? (template.bilibili && `UID ${template.bilibili}`);
    index.push({
      id, title: template.title, description: template.description, author: author || undefined, bilibili: template.bilibili,
      avatar: account?.avatar || undefined, video: template.video, tags: template.tags,
      count: template.items.length,
      preview: template.items.slice(0, 5).map(({name, emoji, icon, asset}) => ({name, emoji, icon, asset})),
    });
  }
  if (!check && !errors.length) {
    await writeFile(join(root, 'src/data/community.json'), JSON.stringify(index, null, 1) + '\n');
    for (const file of await readdir(outDir, {recursive: true, withFileTypes: true})) {
      const rel = relative(outDir, join(file.parentPath, file.name));
      if (file.isFile() && !written.has(rel)) await rm(join(outDir, rel));
    }
  }
  return {index, errors, warnings};
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  const {index, errors, warnings} = await buildTemplates({check});
  warnings.forEach(w => console.warn(`⚠️ ${w}`));
  if (errors.length) {
    console.error(`❌ ${errors.length} 个问题：\n${errors.map(e => `  - ${e}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ ${index.length} 个社区模板${check ? '校验通过' : '已生成'}：${index.map(t => t.id).join(', ')}`);
}
