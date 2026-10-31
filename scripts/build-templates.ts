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
import {AI_TEMPLATE_ID, TOY_AUTHOR} from '../src/lib/constants.ts';
import {avatarPath} from '../src/lib/avatar.ts';
import {brandKeys} from '../src/components/BrandAvatar.tsx';

const MAX_IMAGE_BYTES = 500 * 1024, IMAGE_SIZE = 128, AVATAR_SIZE = 96;

const cardSchema = z.object({code: z.literal(0), data: z.object({card: z.object({name: z.string().min(1), face: z.string()})})});
export type Account = {name: string; avatar: Buffer | null};
/**
 * Look up a Bilibili account's nickname and avatar by UID (public card API) at build time, so visitors never
 * call Bilibili APIs from the Toy. The avatar is downloaded and shipped in the package (same origin: it can
 * be drawn into exported images). Returns null when the lookup fails; the build continues.
 */
export async function lookupBilibili(uid: string): Promise<Account | null> {
  try {
    const init = {headers: {'user-agent': 'Mozilla/5.0 (tier-list build)'}, signal: AbortSignal.timeout(8000)};
    const {data} = cardSchema.parse(await (await fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, init)).json());
    const face = data.card.face.replace(/^http:/, 'https:');
    let avatar: Buffer | null = null;
    if (/^https:\/\/i\d\.hdslb\.com\/bfs\//.test(face)) {
      const res = await fetch(face, init);
      if (res.ok) avatar = Buffer.from(await res.arrayBuffer());
    }
    return {name: data.card.name.slice(0, 40), avatar};
  } catch { return null; }
}

export async function buildTemplates({root = process.cwd(), check = false, lookup = lookupBilibili} = {}) {
  const srcDir = join(root, 'templates'), outDir = join(root, 'public/community');
  const knownIcons = new Set(brandKeys), errors: string[] = [], warnings: string[] = [], index: CommunityEntry[] = [];
  const ids = (await readdir(srcDir, {withFileTypes: true})).filter(d => d.isDirectory()).map(d => d.name).sort();
  // Overwrite in place and prune stale files afterwards: wiping the folder makes a running Vite dev server
  // forget the public files until it restarts.
  const written = new Set<string>();
  if (!check) await mkdir(join(outDir, 'avatars'), {recursive: true});
  const accounts = new Map<string, Promise<Account | null>>();
  /** Resolve a UID once per build; writes its avatar to community/avatars/<uid>.webp and returns that path. */
  const account = (uid: string) => {
    if (!accounts.has(uid)) accounts.set(uid, lookup(uid).then(async found => {
      if (!found?.avatar) return found;
      const webp = await sharp(found.avatar).resize(AVATAR_SIZE, AVATAR_SIZE, {fit: 'cover'}).webp({quality: 82}).toBuffer();
      await writeFile(join(outDir, 'avatars', `${uid}.webp`), webp);
      written.add(join('avatars', `${uid}.webp`));
      return found;
    }));
    return accounts.get(uid) ?? Promise.resolve(null);
  };

  for (const rawId of ids) {
    const where = `templates/${rawId}`, fail = (msg: string) => errors.push(`${where}: ${msg}`);
    const parsedId = templateIdSchema.safeParse(rawId);
    if (!parsedId.success) { fail('文件夹名只能用小写字母、数字和短横线（2–40 个字符），例如 milk-tea'); continue; }
    const id = parsedId.data;
    if (id === AI_TEMPLATE_ID) { fail(`${AI_TEMPLATE_ID} 是内置模板的名字，换一个文件夹名`); continue; }
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
        if ((await stat(file)).size > MAX_IMAGE_BYTES) { fail(`${item.image} 超过 500KB，先运行 bun run images ${id} 压缩`); continue; }
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

    // Image sources must be stated (CONTRIBUTING.md): rights to redistribute are on the contributor.
    if (template.items.some(item => item.asset) && !await stat(join(srcDir, id, 'NOTICE.md')).then(() => true, () => false)) {
      fail('用了图片就要在模板目录里放一个 NOTICE.md，写明图片来源（参考 templates/programming-languages/NOTICE.md）');
    }
    if (!check) { await writeFile(join(outDir, `${id}.json`), JSON.stringify(template)); written.add(`${id}.json`); }
    // The account behind the UID decides the displayed name; `author` is only a fallback when the lookup fails.
    const found = !check && template.bilibili ? await account(template.bilibili) : null;
    if (!check && template.bilibili && !found) warnings.push(`${where}: 没查到 UID ${template.bilibili} 的昵称，先用 author 字段`);
    const author = found?.name ?? template.author ?? (template.bilibili && `UID ${template.bilibili}`);
    index.push({
      id, title: template.title, description: template.description, author: author || undefined, bilibili: template.bilibili,
      ...(found?.avatar && template.bilibili && {avatar: avatarPath(template.bilibili)}), video: template.video, tags: template.tags,
      count: template.items.length,
      preview: template.items.slice(0, 5).map(({name, emoji, icon, asset}) => ({name, emoji, icon, asset})),
    });
  }
  // The Toy author's avatar (header, built-in AI template) ships the same way.
  if (!check && !await account(TOY_AUTHOR.bilibili)) warnings.push(`没查到 Toy 作者 UID ${TOY_AUTHOR.bilibili} 的头像`);
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
    // In GitHub Actions, also emit annotations so each problem shows next to the file in the PR.
    if (process.env.GITHUB_ACTIONS) for (const e of errors) {
      const [, dir = 'templates', msg = e] = /^(templates\/[^:]+): (.*)$/s.exec(e) ?? [];
      const file = await stat(join(dir, 'template.json')).then(() => `${dir}/template.json`, () => dir);
      console.log(`::error file=${file},title=模板检查::${msg.replace(/%/g, '%25').replace(/\r?\n/g, '%0A')}`);
    }
    process.exit(1);
  }
  console.log(`✅ ${index.length} 个社区模板${check ? '校验通过' : '已生成'}：${index.map(t => t.id).join(', ')}`);
}
