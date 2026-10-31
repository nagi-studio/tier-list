import type {ReactNode} from 'react';
import type {Item as BoardItem} from '@/lib/board';
import {containerDragId, itemDragId} from './drag';
import type {ContainerId} from '@/lib/ids';
import {useDroppable} from '@dnd-kit/core';
import {SortableContext, rectSortingStrategy} from '@dnd-kit/sortable';
import Tile from './Tile';
import {cx} from '@/lib/utils';

export default function DropZone({id, items, onEdit, className, empty}: {id: ContainerId; items: BoardItem[]; onEdit: (item: BoardItem) => void; className?: string; empty?: ReactNode}) {
  const {setNodeRef, isOver} = useDroppable({id: containerDragId(id)});
  return <div ref={setNodeRef} data-container={id} className={cx(className, isOver && 'drop-active')}>
    <SortableContext items={items.map(i => itemDragId(i.id))} strategy={rectSortingStrategy}>
      {items.map(item => <Tile key={item.id} item={item} onEdit={onEdit}/>)}
    </SortableContext>
    {!items.length && empty}
  </div>;
}
