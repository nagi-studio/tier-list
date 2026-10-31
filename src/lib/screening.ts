// Content-safety verdicts, one platform call per distinct text, shared by every caller (gates, credit, export).
// The SDK's quota is shared by all visitors of the Toy, so text is screened when an edit is committed — never
// per keystroke — and a verdict is reused for as long as the text stays the same.
import {useSyncExternalStore} from 'react';
import {screenText} from './toySdk.ts';
import type {Screening} from './toySdk.ts';

const verdicts = new Map<string, Screening | 'pending'>();
const inflight = new Map<string, Promise<Screening>>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function screen(text: string): Promise<Screening> {
  const done = verdicts.get(text);
  if (done && done !== 'pending') return Promise.resolve(done);
  const running = inflight.get(text);
  if (running) return running;
  verdicts.set(text, 'pending');
  const request = screenText(text, 'board').then(verdict => {
    verdicts.set(text, verdict);
    inflight.delete(text);
    emit();
    return verdict;
  });
  inflight.set(text, request);
  return request;
}

/** 'unavailable' may change once the visitor logs in or the SDK finishes loading: retry when the page is shown again. */
export function retryUnavailable() {
  let changed = false;
  for (const [text, verdict] of verdicts) if (verdict === 'unavailable') { verdicts.delete(text); changed = true; }
  if (changed) emit();
}

/** Verdict for `text`, screening it on first use. */
export function useScreening(text: string): Screening | 'pending' {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => {
    const known = verdicts.get(text);
    if (known) return known;
    void screen(text);
    return verdicts.get(text) ?? 'pending';
  });
}

export const REJECTED_MESSAGE = '有不能公开的内容，换个说法吧';
