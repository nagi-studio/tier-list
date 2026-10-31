import {newItemId} from '../src/lib/ids';
import {must} from './helpers';
import {test} from 'bun:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {templateIdSchema} from '../src/lib/ids';
import sharp from 'sharp';
import {normalizeTemplate, templateSchema, templateToBoard, boardToTemplate, encodeShare, decodeShare} from '../src/lib/template.ts';
import {boardSchema, initialState} from '../src/lib/board.ts';
import {buildTemplates} from '../scripts/build-templates.ts';

const sample = {title: '奶茶', tiers: 'cn', items: [{name: '蜜雪冰城', emoji: '🍦'}, {name: 'Claude', icon: 'anthropic', tier: 0}]};

test('normalize expands presets and reports readable errors', () => {
  const {template: parsed} = normalizeTemplate(sample);
  const template = must(parsed);
  assert.equal(template.tiers.length, 5);
  assert.equal(must(template.tiers[0]).label, '夯');
  const bad = normalizeTemplate({title: '', tiers: 'nope', items: [{name: 'a'}, {name: 'a', tier: 9}]});
  assert.equal(bad.template, null);
  assert.ok(bad.errors.some(e => e.includes('title')));
  assert.ok(bad.errors.some(e => e.includes('预设')));
  assert.ok(bad.errors.some(e => e.includes('重复')));
  assert.ok(must(normalizeTemplate({...sample, items: [{name: 'x', image: 'images/a.png'}]}).errors[0]).includes('社区模板仓库'));
  assert.equal(must(normalizeTemplate({...sample, bilibili: 312249633}).template).bilibili, '312249633');
  assert.ok(must(normalizeTemplate({...sample, bilibili: 'space.bilibili.com/1'}).errors[0]).includes('UID'));
  assert.ok(must(normalizeTemplate({...sample, items: [{name: 'x', icon: 'nope'}]}, {knownIcons: new Set(['anthropic'])}).errors[0]).includes('品牌'));
});

test('template → board → template keeps tiers, placements and drops uploaded images', () => {
  const {template: parsed} = normalizeTemplate(sample);
  const template = must(parsed);
  const fields = templateToBoard(template);
  const board = {...initialState(), ...fields};
  assert.ok(boardSchema.safeParse(board).success);
  assert.equal(must(must(board.rows[0]).items[0]).name, 'Claude');
  assert.equal(must(board.pool[0]).name, '蜜雪冰城');
  board.pool.push({id: newItemId(), name: '上传的', image: 'data:image/png;base64,AAAA'});
  const {template: back, droppedImages} = boardToTemplate(board);
  assert.equal(droppedImages, 1);
  assert.equal(must(back.items.find(i => i.name === 'Claude')).tier, 0);
  assert.equal(boardToTemplate(board, {withPlacement: false}).template.items.some(i => 'tier' in i), false);
});

test('share codes round-trip and reject garbage', async () => {
  const {template: parsed} = normalizeTemplate({...sample, items: Array.from({length: 40}, (_, i) => ({name: `选手 ${i}`, emoji: '🔥', tier: i % 5}))});
  const template = must(parsed);
  const code = await encodeShare(template);
  assert.match(code, /^z[A-Za-z0-9_-]+$/);
  assert.ok(code.length < 600, `code length ${code.length}`);
  const {template: back} = await decodeShare(code);
  assert.deepEqual(back.items, template.items);
  assert.deepEqual(back.tiers, template.tiers);
  await assert.rejects(decodeShare('zzzz'), /损坏/);
  await assert.rejects(decodeShare('q123'), /损坏/);
});

test('build script compiles images to webp assets and reports bad templates', async () => {
  await mkdir('artifacts', {recursive: true});
  const root = await mkdtemp(join(process.cwd(), 'artifacts/tpl-'));
  await mkdir(join(root, 'templates/milk-tea/images'), {recursive: true});
  await mkdir(join(root, 'src/data'), {recursive: true});
  await writeFile(join(root, 'templates/milk-tea/images/logo.png'), await sharp({create: {width: 400, height: 300, channels: 3, background: '#e33'}}).png().toBuffer());
  await writeFile(join(root, 'templates/milk-tea/template.json'), JSON.stringify({title: '奶茶', tiers: 'classic', items: [{name: '蜜雪', image: 'images/logo.png'}, {name: '茶百道', emoji: '🍵'}]}));
  const ok = await buildTemplates({root});
  assert.deepEqual(ok.errors, []);
  const compiled = templateSchema.parse(JSON.parse(await readFile(join(root, 'public/community/milk-tea.json'), 'utf8')));
  assert.match(must(must(compiled.items[0]).asset), /^community\/milk-tea\/[a-f0-9]{12}\.webp$/);
  assert.equal(must(compiled.items[0]).image, undefined);
  const [file] = await readdir(join(root, 'public/community/milk-tea'));
  const meta = await sharp(join(root, 'public/community/milk-tea', must(file))).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 128);

  await mkdir(join(root, 'templates/Bad_Name'));
  await mkdir(join(root, 'templates/missing-img'));
  await writeFile(join(root, 'templates/missing-img/template.json'), JSON.stringify({title: 'x', tiers: 'classic', items: [{name: 'a', image: 'images/nope.png'}]}));
  const bad = await buildTemplates({root, check: true});
  assert.ok(bad.errors.some(e => e.includes('Bad_Name') && e.includes('文件夹名')));
  assert.ok(bad.errors.some(e => e.includes('找不到图片')));
});

test('template boundary preserves normalization and Chinese paths for nested contributor errors', () => {
  const good = must(normalizeTemplate({
    title: '  奶茶  ', description: '  ', author: null, bilibili: 123,
    tiers: ['  最爱  ', {label: '普通', color: '#ABCDEF'}],
    items: [{name: '  蜜雪  ', emoji: ' 🍦 ', tier: 1}],
  }).template);
  assert.equal(good.title, '奶茶');
  assert.equal(good.bilibili, '123');
  assert.equal('description' in good, false);
  assert.deepEqual(good.tiers, [{label: '最爱', color: '#ff7f7f'}, {label: '普通', color: '#abcdef'}]);
  assert.deepEqual(good.items, [{name: '蜜雪', emoji: '🍦', tier: 1}]);
  assert.deepEqual(normalizeTemplate({...sample, tiers: [{label: 9}]}).errors, ['tiers[0].label 必须是字符串']);
  assert.deepEqual(normalizeTemplate({...sample, tiers: [{label: 'S', color: 'red'}]}).errors, ['tiers[0].color 必须是 #RRGGBB 格式']);
  assert.deepEqual(normalizeTemplate({...sample, items: [{name: 'x', tier: 5}]}).errors, ['items[0].tier 必须是 0 到 4 的整数']);
  assert.deepEqual(normalizeTemplate({...sample, items: [{name: 'x', icon: 'BAD'}]}).errors, ['items[0].icon「BAD」不是可用的品牌 Logo']);
});

test('template boundary rejects unsafe fields, out-of-range placements and malformed compact shares', async () => {
  for (const fields of [
    {name: 'x', asset: '../logo.webp'}, {name: 'x', tier: -1}, {name: 'x', tier: 1.5},
    {name: 'x', image: 'images/../logo.png'}, {name: 'x', icon: 'bad/logo'},
    {name: 'x'.repeat(61)}, {name: 'x', emoji: 'x'.repeat(9)},
  ]) assert.equal(normalizeTemplate({...sample, items: [fields]}, {allowImages: true}).template, null);
  const malformed: unknown[] = [null, {t: 'x', r: 'cn', i: []}, {t: 'x', r: [['S', 'ff7f7f']], i: [[true, '', '', '', 0]]}];
  for (const value of malformed) await assert.rejects(decodeShare(`j${Buffer.from(JSON.stringify(value)).toString('base64url')}`), /损坏/);
  await assert.rejects(decodeShare(null), /不完整/);
});

test('share codes carry the template credit; a malformed credit is dropped, not fatal', async () => {
  const template = must(normalizeTemplate(sample).template);
  const credit = {template: templateIdSchema.parse('milk-tea'), author: '卡普迪姆', bilibili: '312249633'};
  const decoded = await decodeShare(await encodeShare(template, credit));
  assert.deepEqual(decoded.credit, credit);
  assert.deepEqual(templateToBoard(decoded.template, decoded.credit).credit, credit);
  const noCredit = await decodeShare(await encodeShare(template));
  assert.equal(noCredit.credit, undefined);
});

test('templates accept a BV video and reject other formats', () => {
  assert.equal(must(normalizeTemplate({...sample, video: 'BV1xx411c7mD'}).template).video, 'BV1xx411c7mD');
  assert.ok(normalizeTemplate({...sample, video: 'av170001'}).errors.some(e => e.includes('BV 号')));
});

test('build resolves the author name and avatar from the Bilibili UID, falling back to `author`', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tpl-uid-'));
  await mkdir(join(root, 'src/data'), {recursive: true});
  for (const [id, extra] of [['found', {bilibili: '1'}], ['missing', {bilibili: '2', author: '备用名'}], ['plain', {author: '只写了名字'}]] as const) {
    await mkdir(join(root, 'templates', id), {recursive: true});
    await writeFile(join(root, 'templates', id, 'template.json'), JSON.stringify({title: id, tiers: 'classic', items: [{name: 'a'}], ...extra}));
  }
  const lookup = async (uid: string) => uid === '1' ? {name: '真名', avatar: 'https://i0.hdslb.com/bfs/face/x.jpg@96w_96h.webp'} : null;
  const {index, errors, warnings} = await buildTemplates({root, lookup});
  assert.deepEqual(errors, []);
  const byId = Object.fromEntries(index.map(t => [t.id, t]));
  assert.equal(byId.found?.author, '真名');
  assert.match(byId.found?.avatar ?? '', /hdslb/);
  assert.equal(byId.missing?.author, '备用名');
  assert.equal(byId.plain?.author, '只写了名字');
  assert.equal(warnings.length, 1);
});
