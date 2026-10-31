// Higher-level user actions that combine a dispatch with feedback.
import {allItems} from './board.ts';
import type {ItemId, RowId, DropTarget} from './ids';
import {toast} from './toast.ts';
import {dispatch, getEditorState} from '../store/editor.ts';

const undo = {label: '撤销', onClick: () => dispatch({type: 'undo'})};

export function deleteItem(id: ItemId) {
  const item = allItems(getEditorState().board).find(i => i.id === id);
  dispatch({type: 'removeItem', id});
  if (item) toast(`已删除「${item.name}」`, {action: undo});
}

export function deleteRow(id: RowId) {
  const {rows} = getEditorState().board, row = rows.find(r => r.id === id);
  if (!row) return;
  if (rows.length === 1) { toast('至少要保留一个等级'); return; }
  dispatch({type: 'deleteRow', id});
  toast(`已删除等级「${row.label}」${row.items.length ? '，选手回到了待定区' : ''}`, {action: undo});
}

/** Finish an item drag; a drop on the trash deletes it with an undo toast. */
export function endItemDrag({target, itemId}: {target: DropTarget | null; itemId: ItemId}) {
  const item = allItems(getEditorState().board).find(i => i.id === itemId);
  dispatch({type: 'dragEnd', target});
  if (target?.kind === 'trash' && item) toast(`已删除「${item.name}」`, {action: undo});
}
