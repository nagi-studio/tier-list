// dnd-kit identifiers remain private to this adapter. Parsing verifies registration on the live board
// and returns existing domain values; it never turns arbitrary strings into branded IDs.
import type {UniqueIdentifier} from '@dnd-kit/core';
import type {Board} from '@/lib/board';
import {POOL, TRASH} from '@/lib/ids';
import type {ContainerId, DropTarget, ItemId, RowId} from '@/lib/ids';

export type DragNode = DropTarget | {kind: 'row'; id: RowId};
export type DragSource = Extract<DragNode, {kind: 'item' | 'row'}>;
export const rowDragId = (id: RowId) => `row:${id}`;
export const itemDragId = (id: ItemId) => `item:${id}`;
export const containerDragId = (id: ContainerId) => `container:${id}`;

export function createDragParser(board: Board) {
  const nodes = new Map<UniqueIdentifier, DragNode>([
    [containerDragId(POOL), {kind: 'container', id: POOL}], [TRASH, {kind: 'trash'}],
  ]);
  for (const row of board.rows) {
    nodes.set(rowDragId(row.id), {kind: 'row', id: row.id});
    nodes.set(containerDragId(row.id), {kind: 'container', id: row.id});
    for (const item of row.items) nodes.set(itemDragId(item.id), {kind: 'item', id: item.id});
  }
  for (const item of board.pool) nodes.set(itemDragId(item.id), {kind: 'item', id: item.id});
  return (id: UniqueIdentifier): DragNode | null => nodes.get(id) ?? null;
}
