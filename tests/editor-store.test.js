import {test} from 'bun:test';
import assert from 'node:assert/strict';
import {editorReducer, createInitialState, createEditorStore} from '../src/store/editor.js';
import {initialState, allItems} from '../src/lib/board.js';

const start = () => createInitialState(initialState(['a', 'b', 'c'].map(id => ({id, name: id}))));
const memoryStorage = () => { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), data: m}; };

test('edits push history; undo and redo walk it', () => {
  let s = start();
  s = editorReducer(s, {type: 'setTitle', title: 'x'});
  s = editorReducer(s, {type: 'addRow'});
  assert.equal(s.past.length, 2);
  s = editorReducer(s, {type: 'undo'});
  assert.equal(s.board.rows.length, 6);
  assert.equal(s.board.title, 'x');
  s = editorReducer(s, {type: 'redo'});
  assert.equal(s.board.rows.length, 7);
  assert.equal(s.future.length, 0);
});

test('no-op edits return the same state', () => {
  const s = start();
  assert.equal(editorReducer(s, {type: 'moveRow', id: s.board.rows[0].id, delta: -1}), s);
  assert.equal(editorReducer(s, {type: 'undo'}), s);
  assert.equal(editorReducer(s, {type: 'nope'}), s);
});

test('a drag across tiers is one undo step; cancel restores the snapshot', () => {
  let s = start();
  const id = s.board.pool[0].id, row = s.board.rows[0].id;
  s = editorReducer(s, {type: 'dragStart', id});
  s = editorReducer(s, {type: 'dragOver', overId: row});
  assert.equal(s.board.rows[0].items[0].id, id);
  assert.equal(s.past.length, 0);
  s = editorReducer(s, {type: 'dragEnd', overId: row});
  assert.equal(s.drag, null);
  assert.equal(s.past.length, 1);
  s = editorReducer(s, {type: 'undo'});
  assert.equal(s.board.pool[0].id, id);

  let c = editorReducer(start(), {type: 'dragStart', id});
  const before = c.drag.snapshot;
  c = editorReducer(c, {type: 'dragOver', overId: row});
  c = editorReducer(c, {type: 'dragCancel'});
  assert.equal(c.board, before);
});

test('deleting a tier returns its items to the pool', () => {
  let s = start();
  const id = s.board.pool[0].id, row = s.board.rows[2].id;
  s = editorReducer(s, {type: 'updateItem', item: {...s.board.pool[0], name: 'A'}, target: row});
  assert.equal(s.board.rows[2].items[0].name, 'A');
  s = editorReducer(s, {type: 'deleteRow', id: row});
  assert.ok(s.board.pool.some(i => i.id === id));
  assert.equal(allItems(s.board).length, 3);
});

test('store persists committed boards, skips live drag frames, and falls back on bad data', () => {
  const storage = memoryStorage();
  storage.setItem('k', '{"broken":');
  const themes = [];
  const store = createEditorStore({storage, key: 'k', fallback: () => initialState([{id: 'a', name: 'a'}]), onBoardChange: b => themes.push(b.theme)});
  assert.equal(store.getState().board.pool.length, 1);
  store.dispatch({type: 'toggleTheme'});
  assert.equal(JSON.parse(storage.getItem('k')).theme, 'light');
  assert.deepEqual(themes, ['dark', 'light']);
  const id = store.getState().board.pool[0].id, row = store.getState().board.rows[0].id;
  store.dispatch({type: 'dragStart', id});
  store.dispatch({type: 'dragOver', overId: row});
  assert.equal(JSON.parse(storage.getItem('k')).rows[0].items.length, 0);
  store.dispatch({type: 'dragOver', overId: id}); // pointer ends over the tile itself: no further move
  store.dispatch({type: 'dragEnd', overId: id});
  assert.equal(JSON.parse(storage.getItem('k')).rows[0].items.length, 1);
});

test('dropping a tile on the trash deletes it in one undoable step', () => {
  let s = start();
  const id = s.board.pool[0].id;
  s = editorReducer(s, {type: 'dragStart', id});
  s = editorReducer(s, {type: 'dragOver', overId: s.board.rows[1].id});
  s = editorReducer(s, {type: 'dragEnd', overId: 'trash'});
  assert.equal(allItems(s.board).length, 2);
  assert.equal(s.past.length, 1);
  s = editorReducer(s, {type: 'undo'});
  assert.equal(s.board.pool[0].id, id);
});

test('insert tiers at a position and clear a tier back to the pool', () => {
  let s = start();
  s = editorReducer(s, {type: 'addRow', index: 1});
  assert.equal(s.board.rows[1].label, '新等级');
  assert.equal(s.board.rows.length, 7);
  const row = s.board.rows[0].id;
  s = editorReducer(s, {type: 'updateItem', item: s.board.pool[0], target: row});
  s = editorReducer(s, {type: 'clearRow', id: row});
  assert.equal(s.board.rows[0].items.length, 0);
  assert.equal(s.board.pool.length, 3);
});
