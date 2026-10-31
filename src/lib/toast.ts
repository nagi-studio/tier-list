// Global toast: call toast('…') or toast('…', {action: {label, onClick}}) from anywhere, render <Toast/> once.
import {useSyncExternalStore} from 'react';

type ToastOptions = {action?: {label: string; onClick: () => void}; ms?: number};
let current: {text: string; action?: ToastOptions['action']} | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
export function toast(text: string, {action, ms = action ? 5000 : 3000}: ToastOptions = {}) {
  current = {text, action};
  clearTimeout(timer);
  timer = setTimeout(dismissToast, ms);
  emit();
}
export function dismissToast() { current = null; clearTimeout(timer); emit(); }
export const useToast = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => current);
