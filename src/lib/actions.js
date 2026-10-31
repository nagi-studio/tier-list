// Higher-level user actions that combine a dispatch with feedback.
import {allItems, TRASH_ID} from './board.js';
import {toast} from './toast.js';
import {dispatch, getEditorState} from '../store/editor.js';

const undo = {label: '撤销', onClick: () => dispatch({type: 'undo'})};

export function deleteItem(id) {
  const item = allItems(getEditorState().board).find(i => i.id === id);
  dispatch({type: 'removeItem', id});
  if (item) toast(`已删除「${item.name}」`, {action: undo});
}

export function deleteRow(id) {
  const {rows} = getEditorState().board, row = rows.find(r => r.id === id);
  if (!row) return;
  if (rows.length === 1) { toast('至少要保留一个等级'); return; }
  dispatch({type: 'deleteRow', id});
  toast(`已删除等级「${row.label}」${row.items.length ? '，选手回到了待定区' : ''}`, {action: undo});
}

/** Finish an item drag; a drop on the trash deletes it with an undo toast. */
export function endItemDrag(overId, itemId) {
  const item = allItems(getEditorState().board).find(i => i.id === itemId);
  dispatch({type: 'dragEnd', overId});
  if (overId === TRASH_ID && item) toast(`已删除「${item.name}」`, {action: undo});
}
