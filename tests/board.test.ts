import {must} from './helpers';
import {test} from 'bun:test';
import assert from 'node:assert/strict';
import {initialState,moveItem,moveRowTo,allItems,boardSchema,applyTierPreset} from '../src/lib/board.ts';
const start=()=>initialState(['a','b','c'].map(id=>({id,name:id,icon:'openai'})));
test('cross-tier moves preserve every item exactly once and do not mutate source',()=>{const s=start(),id=must(s.pool[0]).id;const next=moveItem(s,id,must(s.rows[0]).id);assert.equal(s.pool.length,3);assert.equal(next.pool.length,2);assert.equal(must(must(next.rows[0]).items[0]).id,id);assert.equal(new Set(allItems(next).map(i=>i.id)).size,3);assert.ok(boardSchema.safeParse(next).success);});
test('same-container sorting supports forward and backward moves',()=>{const s=start();const next=moveItem(s,must(s.pool[0]).id,'pool',must(s.pool[2]).id);assert.deepEqual(next.pool.map(i=>i.name),['b','c','a']);const back=moveItem(next,must(next.pool[2]).id,'pool',must(next.pool[0]).id);assert.deepEqual(back.pool.map(i=>i.name),['a','b','c']);});
test('reducing tiers returns removed-tier items to pool without losing others',()=>{const s=start();const ranked=moveItem(s,must(s.pool[0]).id,must(s.rows[5]).id);const next=applyTierPreset(ranked,'cn');assert.equal(next.rows.length,5);assert.equal(next.pool.length,3);assert.ok(boardSchema.safeParse(next).success);});
test('invalid drops are harmless',()=>{const s=start();assert.equal(moveItem(s,'missing','pool'),s);assert.equal(moveItem(s,must(s.pool[0]).id,'missing'),s);});
test('import rejects duplicated ids, reserved ids, script URLs, and malformed colors',()=>{const s=start();assert.ok(boardSchema.safeParse(s).success);const dup=structuredClone(s);must(dup.pool[1]).id=must(dup.pool[0]).id;assert.equal(boardSchema.safeParse(dup).success,false);const reserved=structuredClone(s);must(reserved.pool[0]).id='pool';assert.equal(boardSchema.safeParse(reserved).success,false);const url=structuredClone(s);must(url.pool[0]).image='javascript:alert(1)';assert.equal(boardSchema.safeParse(url).success,false);const color=structuredClone(s);must(color.rows[0]).color='red';assert.equal(boardSchema.safeParse(color).success,false);});
test('moveRowTo reorders tiers up and down and keeps their items',()=>{const base=start();const ranked=moveItem(base,must(base.pool[0]).id,must(base.rows[0]).id);const down=moveRowTo(ranked,must(ranked.rows[0]).id,must(ranked.rows[3]).id);assert.deepEqual(down.rows.map(r=>r.label),['S','A','B','S+','C','D']);assert.equal(must(down.rows[3]).items.length,1);const up=moveRowTo(down,must(down.rows[3]).id,must(down.rows[0]).id);assert.deepEqual(up.rows.map(r=>r.label),['S+','S','A','B','C','D']);assert.equal(moveRowTo(base,must(base.rows[0]).id,'missing'),base);});

test('board boundary enforces global IDs, limits, and safe image and asset formats', () => {
  const valid = start();
  must(valid.pool[0]).image = 'data:image/webp;base64,AAAA';
  must(valid.pool[0]).asset = 'community/example/012345abcdef.webp';
  assert.ok(boardSchema.safeParse(valid).success);
  const invalid: unknown[] = [
    {...valid, rows: []},
    {...valid, rows: Array.from({length: 31}, (_, i) => ({id: `row-${i}`, label: 'S', color: '#ABCDEF', items: []}))},
    {...valid, title: 'x'.repeat(161)},
    {...valid, subtitle: 'x'.repeat(501)},
    {...valid, rows: [{...must(valid.rows[0]), label: 'x'.repeat(31)}]},
    {...valid, pool: [{id: must(valid.rows[0]).id, name: 'collision'}]},
    {...valid, pool: [{id: 'trash', name: 'reserved'}]},
    {...valid, pool: Array.from({length: 1001}, (_, i) => ({id: `item-${i}`, name: 'x'}))},
    {...valid, pool: [{id: 'item', name: 'x', image: 'https://example.com/avatar.png'}]},
    {...valid, pool: [{id: 'item', name: 'x', image: 'data:image/svg+xml;base64,AAAA'}]},
    {...valid, pool: [{id: 'item', name: 'x', asset: 'community/example/../../image.webp'}]},
    {...valid, pool: [{id: 'item', name: 'x', asset: 'community/example/012345ABCDEF.webp'}]},
  ];
  for (const raw of invalid) assert.equal(boardSchema.safeParse(raw).success, false);
});
