// Compiled community templates, fetched once per id and shared by every component that asks.
import {useSyncExternalStore} from 'react';
import type {TemplateId} from './ids';
import type {Template} from './template';
import {loadCommunity} from './community';

type Entry = {status: 'loading'} | {status: 'ready'; template: Template} | {status: 'error'};
const cache = new Map<TemplateId, Entry>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function request(id: TemplateId): Entry {
  const hit = cache.get(id);
  if (hit) return hit;
  const loading: Entry = {status: 'loading'};
  cache.set(id, loading);
  loadCommunity(id).then(
    template => { cache.set(id, {status: 'ready', template}); emit(); },
    () => { cache.set(id, {status: 'error'}); emit(); },
  );
  return loading;
}

export const useCommunityTemplate = (id: TemplateId) =>
  useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => request(id));
