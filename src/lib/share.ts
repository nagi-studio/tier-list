// Share links: the whole template rides in ?t=… so no backend is needed. ?tpl=<id> opens a community template.
import {useSyncExternalStore} from 'react';
import type {Board, Credit, TemplateBoard} from './board.ts';
import {templateToBoard} from './template.ts';
import {aiCredit, aiTemplate, AI_TITLE} from './builtins.ts';
import {flagships} from './catalog.ts';
import {AI_TEMPLATE_ID} from './constants.ts';
import type {Template} from './template.ts';
import {boardToTemplate, encodeShare, decodeShare} from './template.ts';
import {community, creditFor, loadCommunity} from './community.ts';
import {TOY_URL} from './constants.ts';

const SHARE_PARAM = 't', TEMPLATE_PARAM = 'tpl';

/** Build a share link for the board. `path` is relative to the Toy root (what toy.share / getQrCode want). */
export async function createShareLink(board: Board, {withPlacement}: {withPlacement: boolean}) {
  const {template, droppedImages} = boardToTemplate(board, {withPlacement});
  const code = await encodeShare(template, board.credit);
  const path = `index.html?${SHARE_PARAM}=${code}`;
  const url = new URL(path, new URL('.', location.href)).href;
  return {template, path, url, droppedImages};
}

/** Short public link to the Toy, or to the community template the board came from. Used for the QR code on exports. */
export const toyLink = (credit?: Credit) => credit ? `${TOY_URL}?${TEMPLATE_PARAM}=${credit.template}` : TOY_URL;

/** Text a share would expose, for the platform content check. */
export const shareText = (template: Template) => [template.title, ...template.tiers.map(t => t.label), ...template.items.map(i => i.name)].join('\n');

// Incoming link: decoded once at startup; App shows a confirm dialog while it's pending.
type IncomingShare =
  | {status: 'ready'; kind: 'share' | 'template'; title: string; count: number; credit?: Credit; board: (current: Board) => TemplateBoard}
  | {status: 'error'; error: string};
let incoming: IncomingShare | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const settle = (value: IncomingShare) => { incoming = value; emit(); };
const fromTemplate = (kind: 'share' | 'template', template: Template, credit?: Credit): IncomingShare => ({
  status: 'ready', kind, title: template.title, count: template.items.length, ...(credit && {credit}),
  board: () => templateToBoard(template, credit),
});
const fail = (error: unknown) => settle({status: 'error', error: error instanceof Error ? error.message : String(error)});

export function readIncomingShare() {
  const params = new URLSearchParams(location.search), code = params.get(SHARE_PARAM), tpl = params.get(TEMPLATE_PARAM);
  if (code == null && tpl == null) return;
  const url = new URL(location.href);
  url.searchParams.delete(SHARE_PARAM);
  url.searchParams.delete(TEMPLATE_PARAM);
  history.replaceState(null, '', url);
  if (code != null) {
    decodeShare(code).then(({template, credit}) => settle(fromTemplate('share', template, credit)), fail);
    return;
  }
  if (tpl === AI_TEMPLATE_ID) {
    settle({status: 'ready', kind: 'template', title: AI_TITLE, count: flagships.length, credit: aiCredit, board: aiTemplate});
    return;
  }
  const entry = community.find(t => t.id === tpl);
  if (!entry) { fail(Error('这个模板不存在或已下架')); return; }
  loadCommunity(entry.id).then(template => settle(fromTemplate('template', template, creditFor(entry))), fail);
}
export function clearIncomingShare() { incoming = null; emit(); }
export const useIncomingShare = () => useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => incoming);
