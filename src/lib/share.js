// Share links: the whole template rides in ?t=… so no backend is needed.
import {useSyncExternalStore} from 'react';
import {boardToTemplate, encodeShare, decodeShare} from './template.js';

const PARAM = 't';

/** Build a share link for the board. `path` is relative to the Toy root (what toy.share / getQrCode want). */
export async function createShareLink(board, {withPlacement}) {
  const {template, droppedImages} = boardToTemplate(board, {withPlacement});
  const code = await encodeShare(template);
  const path = `index.html?${PARAM}=${code}`;
  const url = new URL(path, new URL('.', location.href)).href;
  return {template, path, url, droppedImages};
}

/** Text a share would expose, for the platform content check. */
export const shareText = template => [template.title, ...template.tiers.map(t => t.label), ...template.items.map(i => i.name)].join('\n');

// Incoming link: decoded once at startup; App shows a confirm dialog while it's pending.
let incoming = null;
const listeners = new Set();
const emit = () => listeners.forEach(l => l());

export function readIncomingShare() {
  const code = new URLSearchParams(location.search).get(PARAM);
  if (!code) return;
  const url = new URL(location.href);
  url.searchParams.delete(PARAM);
  history.replaceState(null, '', url);
  decodeShare(code).then(template => { incoming = {template}; emit(); }, error => { incoming = {error: error.message}; emit(); });
}
export function clearIncomingShare() { incoming = null; emit(); }
export const useIncomingShare = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => incoming);
