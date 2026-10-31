import type {ItemId} from './ids';

/** Flash freshly added tiles (and optionally scroll to the first) once React has rendered them. */
export function highlightItems(ids: ItemId[], {scroll}: {scroll: boolean}) {
  requestAnimationFrame(() => {
    const tiles = ids.flatMap(id => [...document.querySelectorAll<HTMLElement>(`[data-item-id="${CSS.escape(id)}"]`)]);
    if (scroll) tiles[0]?.scrollIntoView({block: 'center', behavior: 'smooth'});
    for (const tile of tiles) {
      tile.classList.remove('just-added');
      void tile.offsetWidth; // restart the animation if it is already running
      tile.classList.add('just-added');
      tile.addEventListener('animationend', () => tile.classList.remove('just-added'), {once: true});
    }
  });
}
