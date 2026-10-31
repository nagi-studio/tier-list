import {createRoot} from 'react-dom/client';
import App from './App';
import {initialState} from './lib/board';
import {models} from './lib/catalog';
import {initEditorStore, dispatch, STORAGE_KEY} from './store/editor';
import './styles/index.css';

initEditorStore({
  storage: localStorage,
  key: STORAGE_KEY,
  fallback: () => initialState(models),
  onBoardChange: board => { document.documentElement.dataset.theme = board.theme === 'light' ? 'light' : 'dark'; },
});

// Global undo/redo, ignored while typing or when a dialog is open.
addEventListener('keydown', e => {
  const t = e.target;
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable || document.querySelector('[role=dialog]')) return;
  e.preventDefault();
  dispatch({type: e.shiftKey ? 'redo' : 'undo'});
});

createRoot(document.getElementById('root')).render(<App/>);
