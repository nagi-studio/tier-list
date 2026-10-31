import {useDndContext, useDroppable} from '@dnd-kit/core';
import {Trash2} from 'lucide-react';
import {TRASH_ID} from '@/lib/board';
import {cx} from '@/lib/utils';

/** Drop target that deletes. Sits in the pool header; while dragging it floats at the bottom of the screen. */
export default function Trash() {
  const {setNodeRef, isOver} = useDroppable({id: TRASH_ID, data: {type: 'trash'}});
  const {active} = useDndContext();
  const kind = active?.data.current?.type === 'row' ? '等级' : '卡片';
  return <>
    {active && <div className="trash-placeholder" aria-hidden="true"/>}
    <div ref={setNodeRef} className={cx('trash', active && 'floating', isOver && 'over')} title="把卡片或等级拖到这里删除" aria-label="垃圾桶">
      <Trash2 size={17}/>{active ? (isOver ? `松手删除${kind}` : `拖到这里删除${kind}`) : '垃圾桶'}
    </div>
  </>;
}
