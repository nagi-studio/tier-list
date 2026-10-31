import {useDroppable} from '@dnd-kit/core';
import {SortableContext, rectSortingStrategy} from '@dnd-kit/sortable';
import Tile from './Tile';
import {cx} from '@/lib/utils';

export default function DropZone({id, items, onEdit, className, empty}) {
  const {setNodeRef, isOver} = useDroppable({id});
  return <div ref={setNodeRef} data-container={id} className={cx(className, isOver && 'drop-active')}>
    <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
      {items.map(item => <Tile key={item.id} item={item} onEdit={onEdit}/>)}
    </SortableContext>
    {!items.length && empty}
  </div>;
}
