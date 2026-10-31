import {test} from 'bun:test';
import assert from 'node:assert/strict';
import {boardSchema, initialState} from '../src/lib/board';
import {POOL, TRASH} from '../src/lib/ids';
import {createDragParser, rowDragId, itemDragId, containerDragId} from '../src/features/board/drag';

test('drag boundary resolves only registered domain identities and separates rows from containers', () => {
  const board = boardSchema.parse({...initialState(), pool: [{id: 'item', name: 'x'}]});
  const parse = createDragParser(board), row = board.rows[0];
  assert.deepEqual(parse(rowDragId(row.id)), {kind: 'row', id: row.id});
  assert.deepEqual(parse(containerDragId(row.id)), {kind: 'container', id: row.id});
  assert.deepEqual(parse(containerDragId(POOL)), {kind: 'container', id: POOL});
  assert.deepEqual(parse(TRASH), {kind: 'trash'});
  const item = board.pool.find(item => item.name === 'x');
  assert.ok(item);
  assert.deepEqual(parse(itemDragId(item.id)), {kind: 'item', id: item.id});
  for (const raw of [item.id, row.id, POOL, 1, 'item:missing', 'row:missing']) assert.equal(parse(raw), null);
});

test('framework namespaces cannot confuse item IDs, row IDs, pool, or trash', () => {
  const board = boardSchema.parse({
    ...initialState(), rows: [{id: 'x', label: 'S', color: '#ABCDEF', items: []}],
    pool: [{id: 'row:x', name: 'looks like a row'}, {id: 'container:pool', name: 'looks like a container'}],
  });
  const parse = createDragParser(board);
  assert.equal(parse(rowDragId(board.rows[0].id))?.kind, 'row');
  for (const item of board.pool) assert.deepEqual(parse(itemDragId(item.id)), {kind: 'item', id: item.id});
  const emptyPool = createDragParser({...board, pool: []});
  for (const item of board.pool) assert.equal(emptyPool(itemDragId(item.id)), null);
});
