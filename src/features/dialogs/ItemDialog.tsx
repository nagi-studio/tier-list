import type {FormEvent} from 'react';
import type {Row} from '@/lib/board';
import type {EditorAction} from '@/store/editor';
import type {EditorModal, DialogProps} from './types';
import {useState} from 'react';
import {Trash2, Copy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import Modal from '@/components/Modal';
import Logo from '@/components/Logo';
import IconPicker from './IconPicker';
import TargetPicker from './TargetPicker';
import {POOL} from '@/lib/ids';
import {dispatch} from '@/store/editor';
import {deleteItem} from '@/lib/actions';

/** Create or edit a contestant. `isNew` items are added on save; existing ones are updated (and moved if needed). */
export default function ItemDialog({item: initial, target: initialTarget = POOL, isNew, rows, onClose}: Extract<EditorModal, {kind: 'item'}> & DialogProps & {rows: Row[]}) {
  const [item, setItem] = useState(initial), [target, setTarget] = useState(initialTarget), [busy, setBusy] = useState(false);
  const name = item.name.trim();
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name) return;
    const saved = {...item, name};
    dispatch(isNew ? {type: 'addItems', items: [saved], target} : {type: 'updateItem', item: saved, target});
    onClose();
  }
  const act = (action: EditorAction) => { dispatch(action); onClose(); };
  return <Modal title={isNew ? '添加自定义选手' : '编辑选手'} onClose={onClose}>
    <form onSubmit={save}>
      <div className="item-hero">
        <Logo item={item} size={56}/>
        <label className="hero-name">
          <input autoFocus required maxLength={160} aria-label="名称" placeholder="输入选手名称" value={item.name} onChange={e => setItem({...item, name: e.target.value})}/>
          {item.provider && <small>{item.provider}</small>}
        </label>
      </div>
      <div className="field"><span className="field-label">图标</span><IconPicker item={item} onChange={fields => setItem({...item, ...fields})} onBusyChange={setBusy}/></div>
      <div className="field"><span className="field-label">放到哪里</span><TargetPicker rows={rows} value={target} onChange={setTarget}/></div>
      <div className="modal-actions">
        {!isNew && <>
          <button type="button" className="icon-btn danger" aria-label="删除选手" title="删除" onClick={() => { deleteItem(item.id); onClose(); }}><Trash2 size={17}/></button>
          <button type="button" className="icon-btn" aria-label="复制选手" title="复制一份到待定区" onClick={() => act({type: 'duplicateItem', id: item.id})}><Copy size={17}/></button>
        </>}
        <span className="spacer"/>
        <Button type="button" className="btn subtle" onClick={onClose}>取消</Button>
        <Button type="submit" className="btn primary" disabled={!name || busy}>{isNew ? '添加选手' : '保存'}</Button>
      </div>
    </form>
  </Modal>;
}
