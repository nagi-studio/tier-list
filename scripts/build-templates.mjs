// Validate community templates and compile them for the app.
//
//   bun scripts/build-templates.mjs          → writes public/community/** and src/data/community.json
//   bun scripts/build-templates.mjs --check  → validate only (used by CI on pull requests)
//
// Each template lives in templates/<id>/template.json, with optional images in templates/<id>/images/.
// Images are resized to 128×128 WebP (SVG logos fit with padding, photos are cropped) and served from the
// Toy package itself: same origin for PNG export, and reachable from mainland China.
import {readdir, readFile, writeFile, mkdir, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, resolve} from 'node:path';
import sharp from 'sharp';
import {normalizeTemplate, TEMPLATE_ID_RE} from '../src/lib/template.js';
import {brandKeys} from '../src/components/BrandAvatar.jsx';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024, IMAGE_SIZE = 128;

export async function buildTemplates({root = process.cwd(), check = false} = {}) {
  const srcDir = join(root, 'templates'), outDir = join(root, 'public/community');
  const knownIcons = new Set(brandKeys), errors = [], index = [];
  const ids = (await readdir(srcDir, {withFileTypes: true})).filter(d => d.isDirectory()).map(d => d.name).sort();
  if (!check) { await rm(outDir, {recursive: true, force: true}); await mkdir(outDir, {recursive: true}); }

  for (const id of ids) {
    const where = `templates/${id}`, fail = msg => errors.push(`${where}: ${msg}`);
    if (!TEMPLATE_ID_RE.test(id)) { fail('文件夹名只能用小写字母、数字和短横线（2–40 个字符），例如 milk-tea'); continue; }
    let raw;
    try { raw = JSON.parse(await readFile(join(srcDir, id, 'template.json'), 'utf8')); }
    catch (e) { fail(e.code === 'ENOENT' ? '缺少 template.json' : `template.json 不是合法 JSON：${e.message}`); continue; }
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
        if (!check) { await mkdir(join(outDir, id), {recursive: true}); await writeFile(join(outDir, id, name), webp); }
        item.asset = `community/${id}/${name}`;
      } catch (e) { fail(e.code === 'ENOENT' ? `找不到图片 ${item.image}` : `${item.image} 读不出来（${e.message}）`); continue; }
      delete item.image;
    }

    if (!check) await writeFile(join(outDir, `${id}.json`), JSON.stringify(template));
    index.push({
      id, title: template.title, description: template.description, author: template.author, tags: template.tags,
      count: template.items.length,
      preview: template.items.slice(0, 5).map(({name, emoji, icon, asset}) => ({name, emoji, icon, asset})),
    });
  }
  if (!check && !errors.length) await writeFile(join(root, 'src/data/community.json'), JSON.stringify(index, null, 1) + '\n');
  return {index, errors};
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  const {index, errors} = await buildTemplates({check});
  if (errors.length) {
    console.error(`❌ ${errors.length} 个问题：\n${errors.map(e => `  - ${e}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ ${index.length} 个社区模板${check ? '校验通过' : '已生成'}：${index.map(t => t.id).join(', ')}`);
}
