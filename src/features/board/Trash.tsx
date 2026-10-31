import type {DragSource} from './drag';
import {useDndContext, useDroppable} from '@dnd-kit/core';
import {Trash2} from 'lucide-react';
import {TRASH} from '@/lib/ids';
import {cx} from '@/lib/utils';

/**
 * Drop target that deletes. Always at the bottom center of the screen and only visible while dragging,
 * so it never moves between where you saw it and where you drop. It stays mounted (just hidden) so
 * dnd-kit has measured it before a drag begins.
 */
export default function Trash({dragKind}: {dragKind?: DragSource['kind']}) {
  const {setNodeRef, isOver} = useDroppable({id: TRASH});
  const {active} = useDndContext();
  const kind = dragKind === 'row' ? '等级' : '卡片';
  return <div ref={setNodeRef} className={cx('trash', active && 'visible', isOver && 'over')} aria-hidden={!active} aria-label="垃圾桶">
    <Trash2 size={18}/>{isOver ? `松手删除${kind}` : `拖到这里删除${kind}`}
  </div>;
}
