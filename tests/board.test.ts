import {must} from './helpers';
import {test} from 'bun:test';
import assert from 'node:assert/strict';
import {initialState, moveItem, moveRowTo, allItems, boardSchema, applyTierPreset, addRow, deleteRow} from '../src/lib/board';
import {modelIdSchema, newItemId, newRowId, POOL} from '../src/lib/ids';
const start = () => initialState(['a', 'b', 'c'].map(id => ({id: modelIdSchema.parse(id), name: id, icon: 'openai'})));

test('cross-tier moves preserve every item exactly once and do not mutate source', () => {
  const board = start(), itemId = must(board.pool[0]).id;
  const next = moveItem({board, itemId, target: board.rows[0].id});
  assert.equal(board.pool.length, 3);
  assert.equal(next.pool.length, 2);
  assert.equal(must(next.rows[0].items[0]).id, itemId);
  assert.equal(new Set(allItems(next).map(item => item.id)).size, 3);
  assert.ok(boardSchema.safeParse(next).success);
});
test('same-container sorting supports forward and backward moves', () => {
  const board = start();
  const next = moveItem({board, itemId: must(board.pool[0]).id, target: POOL, overId: must(board.pool[2]).id});
  assert.deepEqual(next.pool.map(item => item.name), ['b', 'c', 'a']);
  const back = moveItem({board: next, itemId: must(next.pool[2]).id, target: POOL, overId: must(next.pool[0]).id});
  assert.deepEqual(back.pool.map(item => item.name), ['a', 'b', 'c']);
});
test('reducing tiers returns removed-tier items to pool without losing others', () => {
  const board = start();
  const ranked = moveItem({board, itemId: must(board.pool[0]).id, target: must(board.rows[5]).id});
  const next = applyTierPreset(ranked, 'cn');
  assert.equal(next.rows.length, 5);
  assert.equal(next.pool.length, 3);
  assert.ok(boardSchema.safeParse(next).success);
});
test('stale selections are harmless after an item or tier has been removed', () => {
  const board = start();
  assert.equal(moveItem({board, itemId: newItemId(), target: POOL}), board);
  assert.equal(moveItem({board, itemId: must(board.pool[0]).id, target: newRowId()}), board);
});
test('import rejects duplicated ids, reserved ids, script URLs, and malformed colors', () => {
  const board = start();
  assert.ok(boardSchema.safeParse(board).success);
  const dup = structuredClone(board);
  must(dup.pool[1]).id = must(dup.pool[0]).id;
  assert.equal(boardSchema.safeParse(dup).success, false);
  assert.equal(boardSchema.safeParse({...board, pool: [{id: POOL, name: 'reserved'}]}).success, false);
  const url = structuredClone(board);
  must(url.pool[0]).image = 'javascript:alert(1)';
  assert.equal(boardSchema.safeParse(url).success, false);
  const color = structuredClone(board);
  color.rows[0].color = 'red';
  assert.equal(boardSchema.safeParse(color).success, false);
});
test('moveRowTo reorders tiers up and down and keeps their items', () => {
  const base = start();
  const ranked = moveItem({board: base, itemId: must(base.pool[0]).id, target: base.rows[0].id});
  const down = moveRowTo({board: ranked, rowId: ranked.rows[0].id, overRowId: must(ranked.rows[3]).id});
  assert.deepEqual(down.rows.map(row => row.label), ['S', 'A', 'B', 'S+', 'C', 'D']);
  assert.equal(must(down.rows[3]).items.length, 1);
  const up = moveRowTo({board: down, rowId: must(down.rows[3]).id, overRowId: down.rows[0].id});
  assert.deepEqual(up.rows.map(row => row.label), ['S+', 'S', 'A', 'B', 'C', 'D']);
  assert.equal(moveRowTo({board: base, rowId: base.rows[0].id, overRowId: newRowId()}), base);
});
test('board boundary enforces global IDs, limits, and safe image and asset formats', () => {
  const valid = start();
  must(valid.pool[0]).image = 'data:image/webp;base64,AAAA';
  must(valid.pool[0]).asset = 'community/example/012345abcdef.webp';
  assert.ok(boardSchema.safeParse(valid).success);
  const invalid: unknown[] = [
    {...valid, rows: []},
    {...valid, rows: Array.from({length: 31}, (_, i) => ({id: `row-${i}`, label: 'S', color: '#ABCDEF', items: []}))},
    {...valid, title: 'x'.repeat(161)}, {...valid, subtitle: 'x'.repeat(501)},
    {...valid, rows: [{...valid.rows[0], label: 'x'.repeat(31)}]},
    {...valid, pool: [{id: valid.rows[0].id, name: 'collision'}]},
    {...valid, pool: [{id: 'trash', name: 'reserved'}]},
    {...valid, pool: Array.from({length: 1001}, (_, i) => ({id: `item-${i}`, name: 'x'}))},
    {...valid, pool: [{id: 'item', name: 'x', image: 'https://example.com/avatar.png'}]},
    {...valid, pool: [{id: 'item', name: 'x', image: 'data:image/svg+xml;base64,AAAA'}]},
    {...valid, pool: [{id: 'item', name: 'x', asset: 'community/example/../../image.webp'}]},
    {...valid, pool: [{id: 'item', name: 'x', asset: 'community/example/012345ABCDEF.webp'}]},
  ];
  for (const raw of invalid) assert.equal(boardSchema.safeParse(raw).success, false);
});

test('row operations construct non-empty boards and preserve the last-tier and row-limit rules', () => {
  let board = start();
  for (let i = 0; i < 40; i++) board = addRow(board, 0);
  assert.equal(board.rows.length, 30);
  assert.equal(addRow(board), board);
  for (let i = 0; i < 40; i++) board = deleteRow(board, board.rows[0].id);
  assert.equal(board.rows.length, 1);
  assert.equal(deleteRow(board, board.rows[0].id), board);
  assert.ok(boardSchema.safeParse(board).success);
});
