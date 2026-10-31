import {z} from 'zod';

// Pure board operations. Every function takes a board and returns a new one (or the same one if nothing changed).

export const COLORS = ['#ff7f7f', '#ffb26b', '#ffd96a', '#b5e27a', '#6fd6c3', '#7fb3ff', '#b69cff', '#ff92c8'];
export const TIER_PRESETS = {
  classic: ['S+', 'S', 'A', 'B', 'C', 'D'],
  cn: ['夯', '顶级', '人上人', 'NPC', '拉完了'],
  numeric: ['T0', 'T1', 'T2', 'T3', 'T4'],
};
export const MAX_ROWS = 30;
/** Drop target id for deleting by drag. Reserved like 'pool'. */
export const TRASH_ID = 'trash';

const idSchema = z.string().min(1).refine(id => id !== 'pool' && id !== TRASH_ID);
export const itemSchema = z.looseObject({
  id: idSchema,
  name: z.string().max(160),
  icon: z.string().regex(/^[a-z0-9-]+$/).or(z.literal('')).optional(),
  image: z.string().regex(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/).or(z.literal('')).optional(),
  asset: z.string().regex(/^community\/[a-z0-9-]+\/[a-f0-9]{12}\.webp$/).or(z.literal('')).optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  provider: z.string().optional(),
  catalogId: z.string().optional(),
  score: z.number().optional(),
  date: z.string().optional(),
  open: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  flagship: z.boolean().optional(),
});
export const rowSchema = z.looseObject({
  id: idSchema, label: z.string().max(30), color: z.string().regex(/^#[\da-f]{6}$/i), items: z.array(itemSchema),
});
export const boardSchema = z.looseObject({
  version: z.literal(1), title: z.string().max(160), subtitle: z.string().max(500),
  rows: z.array(rowSchema).min(1).max(MAX_ROWS), pool: z.array(itemSchema),
  theme: z.enum(['dark', 'light']).default('dark'),
}).superRefine((board, ctx) => {
  const ids = new Set<string>();
  const unique = (id: string, path: (string | number)[]) => {
    if (ids.has(id)) ctx.addIssue({code: 'custom', path, message: 'ID 重复'});
    ids.add(id);
  };
  let count = board.pool.length;
  board.rows.forEach((row, r) => {
    unique(row.id, ['rows', r, 'id']);
    count += row.items.length;
    row.items.forEach((item, i) => unique(item.id, ['rows', r, 'items', i, 'id']));
  });
  board.pool.forEach((item, i) => unique(item.id, ['pool', i, 'id']));
  if (count > 1000) ctx.addIssue({code: 'custom', message: '选手不能超过 1000 个'});
});
export type Board = z.infer<typeof boardSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Row = Board['rows'][number];
export type Preset = keyof typeof TIER_PRESETS;
export const presetSchema = z.enum(['classic', 'cn', 'numeric']);
export const colorAt = (index: number): string => COLORS[index % COLORS.length] ?? '#ff7f7f';

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const makeRows = (preset: Preset = 'classic'): Row[] => TIER_PRESETS[preset].map((label, i) => ({id: uid(), label, color: colorAt(i), items: []}));
export const fromCatalog = (model: Item): Item => ({...model, id: uid(), catalogId: model.id});

/** Flagship models when the catalog marks any, otherwise every model given. */
export function initialState(models: Item[] = []): Board {
  const picks = models.some(m => m.flagship) ? models.filter(m => m.flagship) : models;
  return {version: 1, title: '2026 AI 大模型排位', subtitle: '', rows: makeRows(), pool: picks.map(fromCatalog), theme: 'dark'};
}

export const allItems = (s: Board) => [...s.rows.flatMap(r => r.items), ...s.pool];
export function containerOf(s: Board, id: string) {
  if (s.pool.some(i => i.id === id)) return 'pool';
  return s.rows.find(r => r.items.some(i => i.id === id))?.id;
}
/** Resolve a drop target id (an item, a row, or the pool) to the container it belongs to. */
export const targetOf = (s: Board, id: string) => containerOf(s, id) || (id === 'pool' || s.rows.some(r => r.id === id) ? id : null);
export const presetOf = (s: Board) => Object.entries(TIER_PRESETS).find(([, labels]) => labels.length === s.rows.length && labels.every((l, i) => s.rows[i]?.label === l))?.[0] ?? '';

export function moveItem(s: Board, id: string, targetId: string, overId?: string): Board {
  const source = containerOf(s, id);
  if (!source || (targetId !== 'pool' && !s.rows.some(r => r.id === targetId))) return s;
  const next = structuredClone(s), list = (c: string) => c === 'pool' ? next.pool : next.rows.find(r => r.id === c)?.items;
  const from = list(source), to = list(targetId);
  if (!from || !to) return s;
  const index = from.findIndex(x => x.id === id);
  const targetIndex = overId ? to.findIndex(x => x.id === overId) : -1;
  const [item] = from.splice(index, 1);
  if (!item) return s;
  const pos = source === targetId ? targetIndex : (overId ? to.findIndex(x => x.id === overId) : -1);
  to.splice(pos < 0 ? to.length : pos, 0, item);
  return next;
}

export function addItems(s: Board, items: Item[], target = 'pool'): Board {
  if (!items.length) return s;
  if (target === 'pool') return {...s, pool: [...s.pool, ...items]};
  return {...s, rows: s.rows.map(r => r.id === target ? {...r, items: [...r.items, ...items]} : r)};
}

/** Replace an item's fields and move it to `target` if it lives elsewhere. */
export function updateItem(s: Board, item: Item, target?: string): Board {
  const swap = (i: Item) => i.id === item.id ? item : i;
  const next = {...s, pool: s.pool.map(swap), rows: s.rows.map(r => ({...r, items: r.items.map(swap)}))};
  return target && containerOf(next, item.id) !== target ? moveItem(next, item.id, target) : next;
}

export const removeItem = (s: Board, id: string) => ({...s, pool: s.pool.filter(i => i.id !== id), rows: s.rows.map(r => ({...r, items: r.items.filter(i => i.id !== id)}))});

export function duplicateItem(s: Board, id: string) {
  const item = allItems(s).find(i => i.id === id);
  return item ? addItems(s, [{...item, id: uid(), catalogId: undefined, name: `${item.name} 副本`}]) : s;
}

/** Insert a blank tier at `index` (defaults to the end). */
export function addRow(s: Board, index = s.rows.length): Board {
  if (s.rows.length >= MAX_ROWS) return s;
  const rows = [...s.rows];
  rows.splice(Math.max(0, Math.min(index, rows.length)), 0, {id: uid(), label: '新等级', color: colorAt(s.rows.length), items: []});
  return {...s, rows};
}
/** Send a tier's items back to the pool. */
export function clearRow(s: Board, id: string) {
  const row = s.rows.find(r => r.id === id);
  if (!row?.items.length) return s;
  return {...s, rows: s.rows.map(r => r.id === id ? {...r, items: []} : r), pool: [...s.pool, ...row.items]};
}
export const updateRow = (s: Board, row: Pick<Row, 'id' | 'label' | 'color'>) => ({...s, rows: s.rows.map(r => r.id === row.id ? {...r, label: row.label, color: row.color} : r)});
export function moveRow(s: Board, id: string, delta: number) {
  const i = s.rows.findIndex(r => r.id === id), j = i + delta;
  if (i < 0 || j < 0 || j >= s.rows.length) return s;
  const rows = [...s.rows];
  const a = rows[i], b = rows[j];
  if (!a || !b) return s;
  [rows[i], rows[j]] = [b, a];
  return {...s, rows};
}
/** Move tier `id` to where tier `overId` sits (drag-and-drop reordering). */
export function moveRowTo(s: Board, id: string, overId: string) {
  const from = s.rows.findIndex(r => r.id === id), to = s.rows.findIndex(r => r.id === overId);
  if (from < 0 || to < 0 || from === to) return s;
  const rows = [...s.rows], [row] = rows.splice(from, 1);
  if (!row) return s;
  rows.splice(to, 0, row);
  return {...s, rows};
}
/** Delete a tier; its items return to the pool. The last tier can't be deleted. */
export function deleteRow(s: Board, id: string) {
  const row = s.rows.find(r => r.id === id);
  if (!row || s.rows.length === 1) return s;
  return {...s, rows: s.rows.filter(r => r.id !== id), pool: [...s.pool, ...row.items]};
}

export function applyTierPreset(s: Board, key: Preset): Board {
  const labels = TIER_PRESETS[key];
  if (!labels) return s;
  const rows: Row[] = labels.map((label, i) => s.rows[i] ? {...s.rows[i], label, color: colorAt(i)} : {id: uid(), label, color: colorAt(i), items: []});
  return {...s, rows, pool: [...s.pool, ...s.rows.slice(labels.length).flatMap(r => r.items)]};
}

export const resetPlacements = (s: Board) => ({...s, pool: allItems(s), rows: s.rows.map(r => ({...r, items: []}))});
export const replaceContestants = (s: Board, title: string, pool: Item[]) => ({...s, title, pool, rows: s.rows.map(r => ({...r, items: []}))});
/** Replace title, tiers and contestants with a template's (see lib/template.ts templateToBoard). */
export const loadTemplate = (s: Board, {title, rows, pool}: Pick<Board, 'title' | 'rows' | 'pool'>) => ({...s, title, rows, pool});
export const setTitle = (s: Board, title: string) => ({...s, title});
export const toggleTheme = (s: Board): Board => ({...s, theme: s.theme === 'light' ? 'dark' : 'light'});
