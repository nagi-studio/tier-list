import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical} from 'lucide-react';
import Logo from '@/components/Logo';
import {cx} from '@/lib/utils';

/** Static look of a tile; used for the drag overlay. */
export function TileFace({item}) {
  return <div className="tile overlay">
    <span className="tile-main"><Logo item={item}/><span className="tile-name">{item.name}</span></span>
    <span className="drag-handle"><GripVertical size={14}/></span>
  </div>;
}

/** Sortable tile: mouse drags from anywhere, touch long-presses anywhere, keyboard uses the grip. Click edits. */
export default function Tile({item, onEdit}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: item.id});
  return <div ref={setNodeRef} className={cx('tile', isDragging && 'dragging')} data-item-id={item.id}
    style={{transform: CSS.Transform.toString(transform), transition}}
    onMouseDown={listeners?.onMouseDown} onTouchStart={listeners?.onTouchStart}>
    <button type="button" className="tile-main" aria-label={`编辑 ${item.name}`} title={item.provider ? `${item.provider} · ${item.name}` : item.name} onClick={() => onEdit(item)}>
      <Logo item={item}/><span className="tile-name">{item.name}</span>
    </button>
    <button type="button" className="drag-handle no-export" aria-label={`拖动 ${item.name}`} {...attributes} onKeyDown={listeners?.onKeyDown}><GripVertical size={14}/></button>
  </div>;
}
