// Global toast: call toast('…') from anywhere, render <Toast/> once.
import {useSyncExternalStore} from 'react';

let message = '', timer;
const listeners = new Set();
const emit = () => listeners.forEach(l => l());
export function toast(text, ms = 3000) {
  message = text;
  clearTimeout(timer);
  timer = setTimeout(() => { message = ''; emit(); }, ms);
  emit();
}
export const useToastMessage = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => message);
