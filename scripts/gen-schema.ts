// The contributor schema is generated from the same Zod input used by build-templates.
import {readFile, writeFile} from 'node:fs/promises';
import {z} from 'zod';
import {authoringTemplateSchema} from '../src/lib/template.ts';

const file = new URL('../templates/schema.json', import.meta.url);
const generated = JSON.stringify({
  ...z.toJSONSchema(authoringTemplateSchema, {io: 'input'}), title: '万物皆可排 · 社区模板',
}, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (await readFile(file, 'utf8') !== generated) {
    console.error('templates/schema.json 已过期，请运行 bun run schema 并提交更新');
    process.exit(1);
  }
  console.log('✅ templates/schema.json is up to date');
} else {
  await writeFile(file, generated);
  console.log('✅ Generated templates/schema.json');
}
