import type {Ref} from 'react';
import type {Active, CollisionDetection, DndContextProps, UniqueIdentifier} from '@dnd-kit/core';
import type {Board as BoardState, Item, Row} from '@/lib/board';
import {rowIdOf} from './drag';
import {DndContext, DragOverlay, MeasuringStrategy, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, rectIntersection, closestCenter} from '@dnd-kit/core';
import {SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Plus} from 'lucide-react';
import TierRow, {rowDragId} from './TierRow';
import Pool from './Pool';
import {TileFace} from './Tile';
import BrandMark from '@/components/BrandMark';
import {allItems, containerOf, MAX_ROWS, TRASH_ID} from '@/lib/board';
import {deleteRow, endItemDrag} from '@/lib/actions';
import {dispatch, getEditorState} from '@/store/editor';

const isRow = (node: Pick<Active, 'data'>) => rowIdOf(node) != null;
const isTrash = (node: {id: UniqueIdentifier}) => node.id === TRASH_ID;

// The trash only counts when the pointer is actually on it, so a sloppy drop never deletes.
// Tier drags then only see other tiers. Tile drags prefer item hits under the pointer so tiles reorder,
// then fall back to containers, then the nearest target.
const collision: CollisionDetection = args => {
  const trash = pointerWithin({...args, droppableContainers: args.droppableContainers.filter(isTrash)});
  if (trash.length) return trash;
  const rest = args.droppableContainers.filter(c => !isTrash(c));
  if (isRow(args.active)) return closestCenter({...args, droppableContainers: rest.filter(isRow)});
  args = {...args, droppableContainers: rest.filter(c => !isRow(c))};
  const hits = pointerWithin(args);
  if (hits.length) {
    const board = getEditorState().board, itemHits = hits.filter(h => containerOf(board, String(h.id)));
    return itemHits.length ? itemHits : hits;
  }
  const intersect = rectIntersection(args);
  return intersect.length ? intersect : closestCenter(args);
}

// Re-measure while dragging: the trash moves to a floating position once a drag starts.
const measuring = {droppable: {strategy: MeasuringStrategy.Always}};

function nameOf(id: UniqueIdentifier) {
  const board = getEditorState().board, row = board.rows.find(r => rowDragId(r.id) === id);
  return row ? `等级 ${row.label}` : allItems(board).find(i => i.id === id)?.name || '卡片';
}
const accessibility: DndContextProps['accessibility'] = {
  announcements: {
    onDragStart: ({active}) => `已拿起 ${nameOf(active.id)}`,
    onDragOver: ({over}) => over ? '已移到目标区域' : '请移动到一个等级或待定区',
    onDragMove: () => undefined,
    onDragEnd: () => '卡片已放置',
    onDragCancel: () => '已取消拖动',
  },
  screenReaderInstructions: {draggable: '按空格拿起卡片，使用方向键移动，再按空格放下，按 Escape 取消。'},
};

/** The exportable tier list plus the pool, sharing one drag context. `ref` points at the export canvas. */
export default function Board({ref, board, dragId, touch, onEditItem, onEditRow, onNewItem}: {ref: Ref<HTMLDivElement>; board: BoardState; dragId?: string; touch: boolean; onEditItem: (item: Item) => void; onEditRow: (row: Row) => void; onNewItem: (target: string) => void}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {activationConstraint: {distance: 5}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 180, tolerance: 7}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );
  const ranked = board.rows.reduce((n, r) => n + r.items.length, 0);
  const dragging = dragId && allItems(board).find(i => i.id === dragId);
  return <DndContext sensors={sensors} collisionDetection={collision} accessibility={accessibility} measuring={measuring}
    onDragStart={({active}) => { if (!isRow(active)) dispatch({type: 'dragStart', id: String(active.id)}); }}
    onDragOver={({active, over}) => { if (!isRow(active)) dispatch({type: 'dragOver', overId: over ? String(over.id) : undefined}); }}
    onDragEnd={({active, over}) => {
      if (!isRow(active)) endItemDrag(over ? String(over.id) : undefined, String(active.id));
      else {
        const id = rowIdOf(active), overId = rowIdOf(over);
        if (!id) return;
        if (over?.id === TRASH_ID) deleteRow(id);
        else if (overId) dispatch({type: 'moveRowTo', id, overId});
      }
    }}
    onDragCancel={() => dispatch({type: 'dragCancel'})}>
    <div className="export-canvas" ref={ref}>
      <div className="board-heading">
        <input className="board-title" aria-label="榜单标题" value={board.title} maxLength={160} placeholder="给榜单起个标题" onChange={e => dispatch({type: 'setTitle', title: e.target.value})}/>
        <span className="board-meta">{ranked} / {ranked + board.pool.length} 已排</span>
      </div>
      <div className="tier-board">
        <SortableContext items={board.rows.map(r => rowDragId(r.id))} strategy={verticalListSortingStrategy}>
          {board.rows.map((row, index) => <TierRow key={row.id} row={row} index={index} total={board.rows.length} onEditItem={onEditItem} onEditRow={() => onEditRow(row)} onAddItem={() => onNewItem(row.id)}/>)}
        </SortableContext>
      </div>
      <BrandMark withName className="canvas-foot"/>
    </div>
    <button type="button" className="add-row" onClick={() => dispatch({type: 'addRow'})} disabled={board.rows.length >= MAX_ROWS}><Plus size={15}/>添加等级</button>
    <Pool items={board.pool} rankedCount={ranked} touch={touch} onEditItem={onEditItem} onAddItem={() => onNewItem('pool')}/>
    <DragOverlay>{dragging ? <TileFace item={dragging}/> : null}</DragOverlay>
  </DndContext>;
}
