// Editor state: one pure reducer (board edits + undo/redo + drag) wrapped in a tiny external store.
// Components subscribe with useSyncExternalStore; persistence happens in dispatch, so no effects are needed.
import {useSyncExternalStore} from 'react';
import * as B from '../lib/board.ts';
import type {ItemId, RowId, ContainerId, DropTarget} from '../lib/ids';
import type {Board, Item, Row, Preset} from '../lib/board.ts';

const HISTORY = 40;

export type EditorAction =
  | {type: 'addItems'; items: Item[]; target?: ContainerId}
  | {type: 'updateItem'; item: Item; target?: ContainerId}
  | {type: 'removeItem'; id: ItemId}
  | {type: 'duplicateItem'; id: ItemId}
  | {type: 'clearRow'; id: RowId}
  | {type: 'deleteRow'; id: RowId}
  | {type: 'addRow'; index?: number}
  | {type: 'updateRow'; row: Pick<Row, 'id' | 'label' | 'color'>}
  | {type: 'moveRow'; id: RowId; delta: -1 | 1}
  | {type: 'moveRowTo'; id: RowId; overId: RowId}
  | {type: 'applyPreset'; preset: Preset}
  | {type: 'replaceContestants'; title: string; pool: Item[]}
  | {type: 'loadTemplate'; board: Pick<Board, 'title' | 'rows' | 'pool'>}
  | {type: 'importBoard'; board: Board}
  | {type: 'setTitle'; title: string}
  | {type: 'resetPlacements'}
  | {type: 'toggleTheme'}
  | {type: 'undo'}
  | {type: 'redo'}
  | {type: 'dragCancel'}
  | {type: 'dragStart'; id: ItemId}
  | {type: 'dragOver'; target: DropTarget | null}
  | {type: 'dragEnd'; target: DropTarget | null};

type EditorState = {
  board: Board; past: Board[]; future: Board[];
  drag: {id: ItemId; snapshot: Board} | null;
  saveError: boolean;
};
type StoreOptions = {
  storage: Pick<Storage, 'getItem' | 'setItem'>; key: string; fallback: () => Board;
  onBoardChange?: (board: Board) => void;
};

const pushPast = (past: Board[], board: Board) => [...past.slice(-(HISTORY - 1)), board];
const sameBoard = (a: Board, b: Board) => a === b || JSON.stringify(a) === JSON.stringify(b);

export const createInitialState = (board: Board): EditorState => ({board, past: [], future: [], drag: null, saveError: false});

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const commit = (board: Board): EditorState => board === state.board ? state : {...state, board, past: pushPast(state.past, state.board), future: []};
  switch (action.type) {
    case 'addItems': return commit(B.addItems({board: state.board, items: action.items, target: action.target}));
    case 'updateItem': return commit(B.updateItem({board: state.board, item: action.item, target: action.target}));
    case 'removeItem': return commit(B.removeItem(state.board, action.id));
    case 'duplicateItem': return commit(B.duplicateItem(state.board, action.id));
    case 'addRow': return commit(B.addRow(state.board, action.index));
    case 'clearRow': return commit(B.clearRow(state.board, action.id));
    case 'updateRow': return commit(B.updateRow(state.board, action.row));
    case 'moveRow': return commit(B.moveRow({board: state.board, rowId: action.id, delta: action.delta}));
    case 'moveRowTo': return commit(B.moveRowTo({board: state.board, rowId: action.id, overRowId: action.overId}));
    case 'deleteRow': return commit(B.deleteRow(state.board, action.id));
    case 'applyPreset': return commit(B.applyTierPreset(state.board, action.preset));
    case 'replaceContestants': return commit(B.replaceContestants({board: state.board, title: action.title, pool: action.pool}));
    case 'loadTemplate': return commit(B.loadTemplate(state.board, action.board));
    case 'resetPlacements': return commit(B.resetPlacements(state.board));
    case 'setTitle': return commit(B.setTitle(state.board, action.title));
    case 'toggleTheme': return commit(B.toggleTheme(state.board));
    case 'importBoard': return commit(action.board);
    case 'undo': {
      const board = state.past.at(-1);
      return board ? {...state, board, past: state.past.slice(0, -1), future: [state.board, ...state.future]} : state;
    }
    case 'redo': {
      const board = state.future[0];
      return board ? {...state, board, past: [...state.past, state.board], future: state.future.slice(1)} : state;
    }
    // Drag: the board updates live while dragging; history gets a single entry on drop.
    case 'dragStart':
      return {...state, drag: {id: action.id, snapshot: state.board}};
    case 'dragOver': {
      if (!state.drag || action.target === null) return state;
      const from = B.containerOf(state.board, state.drag.id), to = B.dropContainer(state.board, action.target);
      return from && to && from !== to ? {...state, board: B.moveItem({board: state.board, itemId: state.drag.id, target: to, overId: action.target.kind === 'item' ? action.target.id : undefined})} : state;
    }
    case 'dragEnd': {
      if (!state.drag) return state;
      const {id, snapshot} = state.drag;
      let board = state.board;
      if (action.target === null) board = snapshot;
      else if (action.target.kind === 'trash') board = B.removeItem(board, id);
      else {
        const to = B.dropContainer(board, action.target);
        if (to && (action.target.kind !== 'item' || id !== action.target.id)) board = B.moveItem({board, itemId: id, target: to, overId: action.target.kind === 'item' ? action.target.id : undefined});
      }
      return sameBoard(board, snapshot)
        ? {...state, board: snapshot, drag: null}
        : {...state, board, drag: null, past: pushPast(state.past, snapshot), future: []};
    }
    case 'dragCancel':
      return state.drag ? {...state, board: state.drag.snapshot, drag: null} : state;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function createEditorStore({storage, key, fallback, onBoardChange}: StoreOptions) {
  let saved: unknown = null;
  try { saved = JSON.parse(storage.getItem(key) ?? 'null'); } catch {}
  const persist = (board: Board) => {
    try { storage.setItem(key, JSON.stringify(board)); return false; } catch { return true; }
  };
  const restored = B.boardSchema.safeParse(saved);
  const board = restored.success ? restored.data : fallback();
  // First visit (or corrupt data): save the starter board so ids stay stable across reloads.
  let state = {...createInitialState(board), saveError: restored.success ? false : persist(board)};
  const listeners = new Set<() => void>();
  onBoardChange?.(state.board);
  return {
    getState: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(action: EditorAction) {
      const next = editorReducer(state, action);
      if (next === state) return;
      // Skip writes for the live preview during a drag; persist once when the drag ends.
      const dropped = state.drag && !next.drag;
      const shouldSave = !next.drag && (dropped || next.board !== state.board);
      state = shouldSave ? {...next, saveError: persist(next.board)} : next;
      if (shouldSave) onBoardChange?.(state.board);
      listeners.forEach(l => l());
    },
  };
}

export const STORAGE_KEY = 'tier-studio-v1';
let store: ReturnType<typeof createEditorStore> | undefined;
const requireStore = () => {
  if (!store) throw Error('Editor store has not been initialized');
  return store;
};
export function initEditorStore(options: StoreOptions) { store = createEditorStore(options); return store; }
export const dispatch = (action: EditorAction) => requireStore().dispatch(action);
export const getEditorState = () => requireStore().getState();
export const useEditor = () => useSyncExternalStore(requireStore().subscribe, requireStore().getState);
