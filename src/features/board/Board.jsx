import {DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, rectIntersection, closestCenter} from '@dnd-kit/core';
import {sortableKeyboardCoordinates} from '@dnd-kit/sortable';
import {Plus} from 'lucide-react';
import TierRow from './TierRow';
import Pool from './Pool';
import {TileFace} from './Tile';
import BrandMark from '@/components/BrandMark';
import {allItems, containerOf, MAX_ROWS} from '@/lib/board';
import {dispatch, getEditorState} from '@/store/editor';

// Prefer item hits under the pointer so tiles reorder; fall back to containers, then nearest.
function collision(args) {
  const hits = pointerWithin(args);
  if (hits.length) {
    const board = getEditorState().board, itemHits = hits.filter(h => containerOf(board, h.id));
    return itemHits.length ? itemHits : hits;
  }
  const intersect = rectIntersection(args);
  return intersect.length ? intersect : closestCenter(args);
}

const nameOf = id => allItems(getEditorState().board).find(i => i.id === id)?.name || '卡片';
const accessibility = {
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
export default function Board({ref, board, dragId, touch, onEditItem, onEditRow, onNewItem}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {activationConstraint: {distance: 5}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 180, tolerance: 7}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );
  const ranked = board.rows.reduce((n, r) => n + r.items.length, 0);
  const dragging = dragId && allItems(board).find(i => i.id === dragId);
  return <DndContext sensors={sensors} collisionDetection={collision} accessibility={accessibility}
    onDragStart={({active}) => dispatch({type: 'dragStart', id: active.id})}
    onDragOver={({over}) => dispatch({type: 'dragOver', overId: over?.id})}
    onDragEnd={({over}) => dispatch({type: 'dragEnd', overId: over?.id})}
    onDragCancel={() => dispatch({type: 'dragCancel'})}>
    <div className="export-canvas" ref={ref}>
      <div className="board-heading">
        <input className="board-title" aria-label="榜单标题" value={board.title} maxLength={160} placeholder="给榜单起个标题" onChange={e => dispatch({type: 'setTitle', title: e.target.value})}/>
        <span className="board-meta">{ranked} / {ranked + board.pool.length} 已排</span>
      </div>
      <div className="tier-board">
        {board.rows.map((row, index) => <TierRow key={row.id} row={row} onEditItem={onEditItem} onEditRow={() => onEditRow(row, index)} onAddItem={() => onNewItem(row.id)}/>)}
      </div>
      <BrandMark withName className="canvas-foot"/>
    </div>
    <button type="button" className="add-row" onClick={() => dispatch({type: 'addRow'})} disabled={board.rows.length >= MAX_ROWS}><Plus size={15}/>添加等级</button>
    <Pool items={board.pool} rankedCount={ranked} touch={touch} onEditItem={onEditItem} onAddItem={() => onNewItem('pool')}/>
    <DragOverlay>{dragging ? <TileFace item={dragging}/> : null}</DragOverlay>
  </DndContext>;
}
