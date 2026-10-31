import {toPng} from 'html-to-image';
import {boardSchema} from './board.ts';
import type {Board} from './board.ts';

function download(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}

/** Render a DOM node to PNG, skipping elements marked .no-export. */
export async function exportPng(node: HTMLElement, title: string) {
  await document.fonts.ready;
  await Promise.all([...node.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
  const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  download(await toPng(node, {pixelRatio: 2, backgroundColor, filter: n => !n.classList?.contains('no-export')}), `${title || 'tier-list'}.png`);
}

export function exportJson(board: Board) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], {type: 'application/json'}));
  download(url, 'tier-studio.json');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse a board JSON file; returns null if it isn't a valid export. */
export async function readBoardFile(file: File) {
  try {
    if (file.size > 8 * 1024 * 1024) return null;
    const board: unknown = JSON.parse(await file.text());
    const result = boardSchema.safeParse(board);
    return result.success ? result.data : null;
  } catch { return null; }
}
