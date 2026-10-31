// Global toast: call toast('…') or toast('…', {action: {label, onClick}}) from anywhere, render <Toast/> once.
import {useSyncExternalStore} from 'react';

let current = null, timer;
const listeners = new Set();
const emit = () => listeners.forEach(l => l());
export function toast(text, {action, ms = action ? 5000 : 3000} = {}) {
  current = {text, action};
  clearTimeout(timer);
  timer = setTimeout(dismissToast, ms);
  emit();
}
export function dismissToast() { current = null; clearTimeout(timer); emit(); }
export const useToast = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => current);
