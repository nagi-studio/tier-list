// Shrink a template's source images before committing them.
//
//   bun run images <template-id>    e.g. bun run images milk-tea
//
// Raster images in templates/<id>/images are resized to at most 512px on the long side (never enlarged) and
// re-encoded in their own format; a file is replaced only when the result is smaller. The Toy itself only
// ships 128px WebP (scripts/build-templates.ts), so larger sources just bloat the repository. SVGs are kept.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import sharp from 'sharp';
import {templateIdSchema} from '../src/lib/ids';

const MAX_SIDE = 512;
const id = templateIdSchema.safeParse(process.argv[2]);
if (!id.success) { console.error('用法：bun run images <模板文件夹名>，例如 bun run images milk-tea'); process.exit(1); }
const dir = join('templates', id.data, 'images');
const files = await readdir(dir).catch(() => { console.error(`找不到 ${dir}`); process.exit(1); });

let saved = 0;
for (const name of files) {
  const ext = extname(name).toLowerCase(), file = join(dir, name);
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
  const input = await readFile(file);
  const resized = sharp(input).resize(MAX_SIDE, MAX_SIDE, {fit: 'inside', withoutEnlargement: true});
  const output = await (ext === '.png' ? resized.png({palette: true, quality: 90, compressionLevel: 9})
    : ext === '.webp' ? resized.webp({quality: 85}) : resized.jpeg({quality: 85, mozjpeg: true})).toBuffer();
  if (output.length < input.length) { await writeFile(file, output); saved += input.length - output.length; }
  console.log(`${name}: ${(input.length / 1024).toFixed(0)} KB → ${(Math.min(output.length, input.length) / 1024).toFixed(0)} KB`);
}
console.log(`✅ 共省下 ${(saved / 1024).toFixed(0)} KB`);
