import {createRoot} from 'react-dom/client';
import App from './App';
import {creditLegacyBoard, starterBoard} from './lib/builtins';
import {initEditorStore, dispatch, STORAGE_KEY} from './store/editor';
import {readIncomingShare} from './lib/share';
import {watchToyAuthorFollow} from './lib/following';
import './styles/index.css';

initEditorStore({
  storage: localStorage,
  key: STORAGE_KEY,
  fallback: starterBoard,
  upgrade: creditLegacyBoard,
  onBoardChange: board => { document.documentElement.dataset.theme = board.theme === 'light' ? 'light' : 'dark'; },
});

// Global undo/redo, ignored while typing or when a dialog is open.
window.addEventListener('keydown', e => {
  const t = e.target;
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
  if ((t instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) || document.querySelector('[role=dialog]')) return;
  e.preventDefault();
  dispatch({type: e.shiftKey ? 'redo' : 'undo'});
});

readIncomingShare();
watchToyAuthorFollow();
const root = document.getElementById('root');
if (!root) throw Error('Missing root element');
createRoot(root).render(<App/>);
