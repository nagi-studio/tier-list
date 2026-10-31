// Follow state for the Toy author (the SDK can only report it for the Toy's own author, not template authors).
// Checked once at startup and again whenever the page becomes visible — e.g. after the visitor went to the
// author's space to follow and came back. No polling.
import {useSyncExternalStore} from 'react';
import {followsToyAuthor} from './toySdk.ts';

let following: boolean | null = null;
const listeners = new Set<() => void>();

async function refresh() {
  const next = await followsToyAuthor();
  if (next !== following) { following = next; listeners.forEach(l => l()); }
}

export function watchToyAuthorFollow() {
  void refresh();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void refresh(); });
}
export const useFollowsToyAuthor = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => following);
