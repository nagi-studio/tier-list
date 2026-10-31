// Editor state: one pure reducer (board edits + undo/redo + drag) wrapped in a tiny external store.
// Components subscribe with useSyncExternalStore; persistence happens in dispatch, so no effects are needed.
import {useSyncExternalStore} from 'react';
import * as B from '../lib/board.js';

const HISTORY = 40;

// Undoable edits: action type → pure board transform.
const edits = {
  addItems: (s, a) => B.addItems(s, a.items, a.target),
  updateItem: (s, a) => B.updateItem(s, a.item, a.target),
  removeItem: (s, a) => B.removeItem(s, a.id),
  duplicateItem: (s, a) => B.duplicateItem(s, a.id),
  addRow: s => B.addRow(s),
  updateRow: (s, a) => B.updateRow(s, a.row),
  moveRow: (s, a) => B.moveRow(s, a.id, a.delta),
  deleteRow: (s, a) => B.deleteRow(s, a.id),
  applyPreset: (s, a) => B.applyTierPreset(s, a.preset),
  replaceContestants: (s, a) => B.replaceContestants(s, a.title, a.pool),
  resetPlacements: s => B.resetPlacements(s),
  setTitle: (s, a) => B.setTitle(s, a.title),
  toggleTheme: s => B.toggleTheme(s),
  importBoard: (_, a) => a.board,
};

const pushPast = (past, board) => [...past.slice(-(HISTORY - 1)), board];
const sameBoard = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

export const createInitialState = board => ({board, past: [], future: [], drag: null});

export function editorReducer(state, action) {
  const edit = edits[action.type];
  if (edit) {
    const board = edit(state.board, action);
    return board === state.board ? state : {...state, board, past: pushPast(state.past, state.board), future: []};
  }
  switch (action.type) {
    case 'undo':
      return state.past.length ? {...state, board: state.past.at(-1), past: state.past.slice(0, -1), future: [state.board, ...state.future]} : state;
    case 'redo':
      return state.future.length ? {...state, board: state.future[0], past: [...state.past, state.board], future: state.future.slice(1)} : state;
    // Drag: the board updates live while dragging; history gets a single entry on drop.
    case 'dragStart':
      return {...state, drag: {id: action.id, snapshot: state.board}};
    case 'dragOver': {
      if (!state.drag || action.overId == null) return state;
      const from = B.containerOf(state.board, state.drag.id), to = B.targetOf(state.board, action.overId);
      return from && to && from !== to ? {...state, board: B.moveItem(state.board, state.drag.id, to, action.overId)} : state;
    }
    case 'dragEnd': {
      if (!state.drag) return state;
      const {id, snapshot} = state.drag;
      let board = state.board;
      if (action.overId == null) board = snapshot;
      else {
        const to = B.targetOf(board, action.overId);
        if (to && id !== action.overId) board = B.moveItem(board, id, to, action.overId);
      }
      return sameBoard(board, snapshot)
        ? {...state, board: snapshot, drag: null}
        : {...state, board, drag: null, past: pushPast(state.past, snapshot), future: []};
    }
    case 'dragCancel':
      return state.drag ? {...state, board: state.drag.snapshot, drag: null} : state;
    default:
      return state;
  }
}

export function createEditorStore({storage, key, fallback, onBoardChange}) {
  let saved = null;
  try { saved = JSON.parse(storage.getItem(key)); } catch {}
  const persist = board => {
    try { storage.setItem(key, JSON.stringify(board)); return false; } catch { return true; }
  };
  const restored = B.validateBoard(saved);
  const board = restored ? saved : fallback();
  // First visit (or corrupt data): save the starter board so ids stay stable across reloads.
  let state = {...createInitialState(board), saveError: restored ? false : persist(board)};
  const listeners = new Set();
  onBoardChange?.(state.board);
  return {
    getState: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(action) {
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
let store;
export function initEditorStore(options) { store = createEditorStore(options); return store; }
export const dispatch = action => store.dispatch(action);
export const getEditorState = () => store.getState();
export const useEditor = () => useSyncExternalStore(store.subscribe, store.getState);
