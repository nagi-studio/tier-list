import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {Plus} from 'lucide-react';
import DropZone from './DropZone';
import {cx} from '@/lib/utils';

export const rowDragId = id => `row:${id}`;

/** A tier. Dragging its label reorders tiers (mouse/touch); clicking the label edits it. */
export default function TierRow({row, onEditRow, onEditItem, onAddItem}) {
  const {listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: rowDragId(row.id), data: {type: 'row', rowId: row.id}});
  return <div ref={setNodeRef} className={cx('tier-row', isDragging && 'row-dragging')} style={{transform: CSS.Translate.toString(transform), transition}}>
    <button type="button" className={cx('tier-label', row.label.length >= 3 && 'long-label')} style={{backgroundColor: row.color}}
      title="点击编辑，按住拖动换位置" aria-label={`编辑等级 ${row.label}`} onClick={onEditRow}
      onMouseDown={listeners?.onMouseDown} onTouchStart={listeners?.onTouchStart}>{row.label}</button>
    <DropZone id={row.id} items={row.items} onEdit={onEditItem} className="tier-items"/>
    <button type="button" className="row-add no-export" aria-label={`添加到 ${row.label}`} title="在这一级新建选手" onClick={onAddItem}><Plus size={16}/></button>
  </div>;
}
