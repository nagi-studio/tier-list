import {useState} from 'react';
import type {CollisionDetection, DndContextProps, UniqueIdentifier} from '@dnd-kit/core';
import type {Board as BoardState, Item, Row} from '@/lib/board';
import {createDragParser, rowDragId} from './drag';
import type {DragNode, DragSource} from './drag';
import {POOL} from '@/lib/ids';
import type {ItemId, ContainerId} from '@/lib/ids';
import {DndContext, DragOverlay, MeasuringStrategy, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, rectIntersection, closestCenter} from '@dnd-kit/core';
import {SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Plus} from 'lucide-react';
import TierRow from './TierRow';
import Pool from './Pool';
import Trash from './Trash';
import {TileFace} from './Tile';
import CreditBar from './CreditBar';
import {allItems, MAX_ROWS} from '@/lib/board';
import {deleteRow, endItemDrag} from '@/lib/actions';
import {dispatch} from '@/store/editor';

// The boundary parses each registered droppable once per collision pass. The collision policy
// then works on discriminated nodes, including the distinction between a row and its item container.
function collisionFor(parse: ReturnType<typeof createDragParser>): CollisionDetection {
  return args => {
    const nodes = args.droppableContainers.map(container => ({container, node: parse(container.id)}));
    const trash = pointerWithin({...args, droppableContainers: nodes.filter(({node}) => node?.kind === 'trash').map(({container}) => container)});
    if (trash.length) return trash;
    const rest = nodes.filter(({node}) => node && node.kind !== 'trash');
    if (parse(args.active.id)?.kind === 'row') return closestCenter({...args, droppableContainers: rest.filter(({node}) => node?.kind === 'row').map(({container}) => container)});
    args = {...args, droppableContainers: rest.filter(({node}) => node?.kind !== 'row').map(({container}) => container)};
    const hits = pointerWithin(args);
    if (hits.length) {
      const itemHits = hits.filter(hit => parse(hit.id)?.kind === 'item');
      return itemHits.length ? itemHits : hits;
    }
    const intersect = rectIntersection(args);
    return intersect.length ? intersect : closestCenter(args);
  };
}

// Re-measure while dragging: the trash moves to a floating position once a drag starts.
const measuring = {droppable: {strategy: MeasuringStrategy.Always}};

/** The exportable tier list plus the pool, sharing one drag context. `ref` points at the export canvas. */
export default function Board({board, dragId, touch, onEditItem, onEditRow, onNewItem}: {board: BoardState; dragId?: ItemId; touch: boolean; onEditItem: (item: Item) => void; onEditRow: (row: Row) => void; onNewItem: (target: ContainerId) => void}) {
  const [source, setSource] = useState<DragSource | null>(null);
  const parse = createDragParser(board);
  const collision = collisionFor(parse);
  const nameOf = (id: UniqueIdentifier) => {
    const node = parse(id);
    if (node?.kind === 'row') return `等级 ${board.rows.find(row => row.id === node.id)?.label ?? ''}`;
    return node?.kind === 'item' ? allItems(board).find(item => item.id === node.id)?.name ?? '卡片' : '卡片';
  };
  const accessibility: DndContextProps['accessibility'] = {
    announcements: {
      onDragStart: ({active}) => `已拿起 ${nameOf(active.id)}`,
      onDragOver: ({over}) => over ? '已移到目标区域' : '请移动到一个等级或待定区',
      onDragMove: () => undefined, onDragEnd: () => '卡片已放置', onDragCancel: () => '已取消拖动',
    },
    screenReaderInstructions: {draggable: '按空格拿起卡片，使用方向键移动，再按空格放下，按 Escape 取消。'},
  };
  // Sortable rows are drop targets only for row drags; item drags use their containers.
  const itemTarget = (node: DragNode | null) => node?.kind === 'row' ? null : node;
  const sensors = useSensors(
    useSensor(MouseSensor, {activationConstraint: {distance: 5}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 180, tolerance: 7}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );
  const ranked = board.rows.reduce((n, r) => n + r.items.length, 0);
  const dragging = dragId && allItems(board).find(i => i.id === dragId);
  return <DndContext sensors={sensors} collisionDetection={collision} accessibility={accessibility} measuring={measuring}
    onDragStart={({active}) => {
      const node = parse(active.id);
      if (node?.kind === 'item' || node?.kind === 'row') {
        setSource(node);
        if (node.kind === 'item') dispatch({type: 'dragStart', id: node.id});
      }
    }}
    onDragOver={({over}) => {
      if (source?.kind === 'item') dispatch({type: 'dragOver', target: itemTarget(over ? parse(over.id) : null)});
    }}
    onDragEnd={({over}) => {
      const target = over ? parse(over.id) : null;
      if (source?.kind === 'item') endItemDrag({target: itemTarget(target), itemId: source.id});
      else if (source?.kind === 'row') {
        if (target?.kind === 'trash') deleteRow(source.id);
        else if (target?.kind === 'row') dispatch({type: 'moveRowTo', id: source.id, overId: target.id});
      }
      setSource(null);
    }}
    onDragCancel={() => { dispatch({type: 'dragCancel'}); setSource(null); }}>
    <div className="export-canvas">
      <div className="board-heading">
        <input className="board-title" aria-label="榜单标题" value={board.title} maxLength={160} placeholder="给榜单起个标题" onChange={e => dispatch({type: 'setTitle', title: e.target.value})}/>
        <span className="board-meta">{ranked} / {ranked + board.pool.length} 已排</span>
      </div>
      {board.credit && <CreditBar credit={board.credit}/>}
      <div className="tier-board">
        <SortableContext items={board.rows.map(r => rowDragId(r.id))} strategy={verticalListSortingStrategy}>
          {board.rows.map((row, index) => <TierRow key={row.id} row={row} index={index} total={board.rows.length} onEditItem={onEditItem} onEditRow={() => onEditRow(row)} onAddItem={() => onNewItem(row.id)}/>)}
        </SortableContext>
      </div>
    </div>
    <button type="button" className="add-row" onClick={() => dispatch({type: 'addRow'})} disabled={board.rows.length >= MAX_ROWS}><Plus size={15}/>添加等级</button>
    <Trash dragKind={source?.kind}/>
    <Pool items={board.pool} rankedCount={ranked} touch={touch} onEditItem={onEditItem} onAddItem={() => onNewItem(POOL)}/>
    <DragOverlay>{dragging ? <TileFace item={dragging}/> : null}</DragOverlay>
  </DndContext>;
}
