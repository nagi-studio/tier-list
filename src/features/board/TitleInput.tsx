import {useState} from 'react';
import {REJECTED_MESSAGE, screen} from '@/lib/screening';
import {toast} from '@/lib/toast';
import {dispatch} from '@/store/editor';

/**
 * The board title. Edits are drafted locally and committed on blur / Enter after the content check, so a
 * rejected title never reaches the board. Remount with `key={title}` to pick up outside changes (undo, templates).
 */
export default function TitleInput({title, onEditingChange}: {title: string; onEditingChange: (editing: boolean) => void}) {
  const [draft, setDraft] = useState(title);
  async function commit() {
    const next = draft.trim() ? draft : title;
    if (next === title) { setDraft(title); onEditingChange(false); return; }
    if (await screen(next) === 'rejected') { setDraft(title); toast(`标题${REJECTED_MESSAGE}`); onEditingChange(false); return; }
    dispatch({type: 'setTitle', title: next});
    onEditingChange(false);
  }
  return <input className="board-title" aria-label="榜单标题" value={draft} maxLength={160} placeholder="给榜单起个标题"
    onFocus={() => onEditingChange(true)}
    onChange={e => setDraft(e.target.value)}
    onBlur={() => void commit()}
    onKeyDown={e => {
      if (e.key === 'Enter') e.currentTarget.blur();
      if (e.key === 'Escape') { setDraft(title); e.currentTarget.blur(); }
    }}/>;
}
