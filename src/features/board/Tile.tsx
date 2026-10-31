import type {Item as BoardItem} from '@/lib/board';
import {itemDragId} from './drag';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical} from 'lucide-react';
import Logo from '@/components/Logo';
import {cx} from '@/lib/utils';
import {TileMenu} from './menus';

/** Static look of a tile; used for the drag overlay. */
export function TileFace({item}: {item: BoardItem}) {
  return <div className="tile overlay">
    <span className="tile-main"><Logo item={item}/><span className="tile-name">{item.name}</span></span>
    <span className="drag-handle"><GripVertical size={14}/></span>
  </div>;
}

/** Sortable tile: mouse drags from anywhere, touch long-presses anywhere, keyboard uses the grip. Click edits, right-click opens a menu. */
export default function Tile({item, onEdit}: {item: BoardItem; onEdit: (item: BoardItem) => void}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: itemDragId(item.id)});
  return <TileMenu item={item} onEdit={onEdit}><div ref={setNodeRef} className={cx('tile', isDragging && 'dragging')} data-item-id={item.id}
    style={{transform: CSS.Transform.toString(transform), transition}}
    onMouseDown={e => listeners?.onMouseDown?.(e)} onTouchStart={e => listeners?.onTouchStart?.(e)}>
    <button type="button" className="tile-main" aria-label={`编辑 ${item.name}`} title={item.provider ? `${item.provider} · ${item.name}` : item.name} onClick={() => onEdit(item)}>
      <Logo item={item}/><span className="tile-name">{item.name}</span>
    </button>
    <button type="button" className="drag-handle no-export" aria-label={`拖动 ${item.name}`} {...attributes} onKeyDown={e => listeners?.onKeyDown?.(e)}><GripVertical size={14}/></button>
  </div></TileMenu>;
}
