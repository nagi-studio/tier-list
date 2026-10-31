import {Plus} from 'lucide-react';
import DropZone from './DropZone';
import {cx} from '@/lib/utils';

export default function TierRow({row, onEditRow, onEditItem, onAddItem}) {
  return <div className="tier-row">
    <button type="button" className={cx('tier-label', row.label.length >= 3 && 'long-label')} style={{backgroundColor: row.color}} title="点击编辑等级" aria-label={`编辑等级 ${row.label}`} onClick={onEditRow}>{row.label}</button>
    <DropZone id={row.id} items={row.items} onEdit={onEditItem} className="tier-items"/>
    <button type="button" className="row-add no-export" aria-label={`添加到 ${row.label}`} title="在这一级新建选手" onClick={onAddItem}><Plus size={16}/></button>
  </div>;
}
