import type {DragSource} from './drag';
import {useDndContext, useDroppable} from '@dnd-kit/core';
import {Trash2} from 'lucide-react';
import {TRASH} from '@/lib/ids';
import {cx} from '@/lib/utils';

/** Drop target that deletes. Sits in the pool header; while dragging it floats at the bottom of the screen. */
export default function Trash({dragKind}: {dragKind?: DragSource['kind']}) {
  const {setNodeRef, isOver} = useDroppable({id: TRASH});
  const {active} = useDndContext();
  const kind = dragKind === 'row' ? '等级' : '卡片';
  return <>
    {active && <div className="trash-placeholder" aria-hidden="true"/>}
    <div ref={setNodeRef} className={cx('trash', active && 'floating', isOver && 'over')} title="把卡片或等级拖到这里删除" aria-label="垃圾桶">
      <Trash2 size={17}/>{active ? (isOver ? `松手删除${kind}` : `拖到这里删除${kind}`) : '垃圾桶'}
    </div>
  </>;
}
