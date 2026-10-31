import {useState} from 'react';
import {Check, Plus, Trash2, ChevronUp, ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import Modal from '@/components/Modal';
import {COLORS} from '@/lib/board';
import {cx} from '@/lib/utils';
import {dispatch} from '@/store/editor';
import {deleteRow} from '@/lib/actions';

/** Rename, recolor, reorder or delete a tier. Reordering applies immediately; name/color on save. */
export default function RowDialog({row: initial, index, total, onClose}) {
  const [row, setRow] = useState(initial);
  const label = row.label.trim();
  function save(e) {
    e.preventDefault();
    if (!label) return;
    dispatch({type: 'updateRow', row: {...row, label}});
    onClose();
  }
  function remove() {
    deleteRow(row.id);
    onClose();
  }
  return <Modal title="编辑等级" onClose={onClose}>
    <form onSubmit={save}>
      <div className="row-hero">
        <span className="tier-chip" style={{background: row.color}}>{row.label || '?'}</span>
        <label className="hero-name"><input autoFocus required maxLength={30} aria-label="等级名称" value={row.label} onChange={e => setRow({...row, label: e.target.value})}/></label>
        <div className="row-move">
          <button type="button" className="icon-btn" aria-label="上移等级" disabled={index === 0} onClick={() => dispatch({type: 'moveRow', id: row.id, delta: -1})}><ChevronUp size={18}/></button>
          <button type="button" className="icon-btn" aria-label="下移等级" disabled={index === total - 1} onClick={() => dispatch({type: 'moveRow', id: row.id, delta: 1})}><ChevronDown size={18}/></button>
        </div>
      </div>
      <div className="field"><span className="field-label">颜色</span>
        <div className="swatches">
          {COLORS.map(color => <button type="button" key={color} style={{background: color}} aria-label={`颜色 ${color}`} className={cx('swatch', row.color === color && 'on')} onClick={() => setRow({...row, color})}>{row.color === color && <Check size={16}/>}</button>)}
          <label className={cx('swatch custom', !COLORS.includes(row.color) && 'on')} title="自定义颜色" style={COLORS.includes(row.color) ? undefined : {background: row.color}}>
            <Plus size={16}/><input type="color" aria-label="自定义颜色" value={row.color} onChange={e => setRow({...row, color: e.target.value})}/>
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <Button type="button" className="btn ghost danger" disabled={total === 1} onClick={remove} title="里面的选手会回到待定区"><Trash2 size={15}/>删除等级</Button>
        <span className="spacer"/>
        <Button type="button" className="btn subtle" onClick={onClose}>取消</Button>
        <Button type="submit" className="btn primary" disabled={!label}>保存修改</Button>
      </div>
    </form>
  </Modal>;
}
