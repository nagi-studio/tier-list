import {z} from 'zod';
import {itemIdSchema, rowIdSchema, modelIdSchema, templateIdSchema, newItemId, newRowId, POOL} from './ids';
import type {ItemId, RowId, ModelId, ContainerId, DropTarget} from './ids';
import {mapNonEmpty, insertNonEmpty} from './nonEmpty';
import type {NonEmpty} from './nonEmpty';

// Pure board operations. Every function takes a board and returns a new one (or the same one if nothing changed).

export const COLORS = ['#ff7f7f', '#ffb26b', '#ffd96a', '#b5e27a', '#6fd6c3', '#7fb3ff', '#b69cff', '#ff92c8'];
export const TIER_PRESETS = {
  classic: ['S+', 'S', 'A', 'B', 'C', 'D'],
  cn: ['夯', '顶级', '人上人', 'NPC', '拉完了'],
  numeric: ['T0', 'T1', 'T2', 'T3', 'T4'],
} satisfies Record<string, NonEmpty<string>>;
export const MAX_ROWS = 30;
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const itemSchema = z.object({
  id: itemIdSchema,
  name: z.string().max(160),
  icon: z.string().regex(/^[a-z0-9-]+$/).or(z.literal('')).optional(),
  image: z.string().regex(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/).or(z.literal('')).optional(),
  asset: z.string().regex(/^community\/[a-z0-9-]+\/[a-f0-9]{12}\.webp$/).or(z.literal('')).optional(),
  emoji: z.string().optional(),
  color: hexColorSchema.optional().catch(undefined),
  provider: z.string().optional(),
  catalogId: modelIdSchema.optional(),
  score: z.number().optional(),
  date: z.string().optional(),
  open: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  flagship: z.boolean().optional(),
});
export const rowSchema = z.object({
  id: rowIdSchema, label: z.string().max(30), color: hexColorSchema, items: z.array(itemSchema),
});
export const bilibiliUidSchema = z.string().regex(/^\d{1,19}$/);
/** Which community template the board came from, so exports and share links can credit its author. */
export const creditSchema = z.object({
  template: templateIdSchema, author: z.string().max(40).optional(), bilibili: bilibiliUidSchema.optional(),
});
export type Credit = z.infer<typeof creditSchema>;
export const boardSchema = z.object({
  version: z.literal(1), title: z.string().max(160), subtitle: z.string().max(500),
  rows: z.tuple([rowSchema], rowSchema).refine(rows => rows.length <= MAX_ROWS), pool: z.array(itemSchema),
  theme: z.enum(['dark', 'light']).default('dark'),
  credit: creditSchema.optional().catch(undefined),
  exportQr: z.boolean().optional(),
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

export const makeRows = (preset: Preset = 'classic'): Board['rows'] => mapNonEmpty(TIER_PRESETS[preset], (label, i) => ({id: newRowId(), label, color: colorAt(i), items: []}));
export type CatalogEntry = Omit<Item, 'id' | 'catalogId'> & {id: ModelId};
export const fromCatalog = (model: CatalogEntry): Item => ({...model, id: newItemId(), catalogId: model.id});

/** Flagship models when the catalog marks them, otherwise every model given. */
export function initialState(models: CatalogEntry[] = []): Board {
  const picks = models.some(m => m.flagship) ? models.filter(m => m.flagship) : models;
  return {version: 1, title: '2026 AI 大模型排位', subtitle: '', rows: makeRows(), pool: picks.map(fromCatalog), theme: 'dark'};
}
export const allItems = (board: Board) => [...board.rows.flatMap(row => row.items), ...board.pool];
// A missing result means the item has since been removed (for example by undo), not an invalid ID.
export function containerOf(board: Board, id: ItemId): ContainerId | undefined {
  if (board.pool.some(item => item.id === id)) return POOL;
  return board.rows.find(row => row.items.some(item => item.id === id))?.id;
}
export function dropContainer(board: Board, target: DropTarget): ContainerId | undefined {
  switch (target.kind) {
    case 'item': return containerOf(board, target.id);
    case 'container': return target.id;
    case 'trash': return undefined;
    default: { const _exhaustive: never = target; return _exhaustive; }
  }
}
export const presetOf = (board: Board): Preset | '' => presetSchema.options.find(key => {
  const labels = TIER_PRESETS[key];
  return labels.length === board.rows.length && labels.every((label, i) => board.rows[i]?.label === label);
}) ?? '';

export function moveItem({board, itemId, target, overId}: {board: Board; itemId: ItemId; target: ContainerId; overId?: ItemId}): Board {
  const item = allItems(board).find(item => item.id === itemId);
  const source = containerOf(board, itemId);
  const destination = target === POOL ? board.pool : board.rows.find(row => row.id === target)?.items;
  // Stale selections are ordinary no-ops; brands prove identity kind, not live board membership.
  if (!item || !destination) return board;
  const targetIndex = overId ? destination.findIndex(item => item.id === overId) : -1;
  const to = destination.filter(item => item.id !== itemId);
  const pos = source === target ? targetIndex : overId ? to.findIndex(item => item.id === overId) : -1;
  to.splice(pos < 0 ? to.length : pos, 0, item);
  const move = (items: Item[], container: ContainerId) => container === target ? to : items.filter(item => item.id !== itemId);
  return {...board, pool: move(board.pool, POOL), rows: mapNonEmpty(board.rows, row => ({...row, items: move(row.items, row.id)}))};
}
export function addItems({board, items, target = POOL}: {board: Board; items: Item[]; target?: ContainerId}): Board {
  if (!items.length) return board;
  if (target === POOL) return {...board, pool: [...board.pool, ...items]};
  return {...board, rows: mapNonEmpty(board.rows, row => row.id === target ? {...row, items: [...row.items, ...items]} : row)};
}
export function updateItem({board, item, target}: {board: Board; item: Item; target?: ContainerId}): Board {
  const swap = (current: Item) => current.id === item.id ? item : current;
  const next = {...board, pool: board.pool.map(swap), rows: mapNonEmpty(board.rows, row => ({...row, items: row.items.map(swap)}))};
  return target && containerOf(next, item.id) !== target ? moveItem({board: next, itemId: item.id, target}) : next;
}
export const removeItem = (board: Board, id: ItemId): Board => ({...board, pool: board.pool.filter(item => item.id !== id), rows: mapNonEmpty(board.rows, row => ({...row, items: row.items.filter(item => item.id !== id)}))});
export function duplicateItem(board: Board, id: ItemId): Board {
  const item = allItems(board).find(item => item.id === id);
  return item ? addItems({board, items: [{...item, id: newItemId(), catalogId: undefined, name: `${item.name} 副本`}]}) : board;
}
export function addRow(board: Board, index = board.rows.length): Board {
  if (board.rows.length >= MAX_ROWS) return board;
  const row: Row = {id: newRowId(), label: '新等级', color: colorAt(board.rows.length), items: []};
  const at = Math.max(0, Math.min(index, board.rows.length));
  return {...board, rows: insertNonEmpty({items: board.rows, index: at, value: row})};
}
export function clearRow(board: Board, id: RowId): Board {
  const row = board.rows.find(row => row.id === id);
  if (!row?.items.length) return board;
  return {...board, rows: mapNonEmpty(board.rows, row => row.id === id ? {...row, items: []} : row), pool: [...board.pool, ...row.items]};
}
export const updateRow = (board: Board, row: Pick<Row, 'id' | 'label' | 'color'>): Board => ({...board, rows: mapNonEmpty(board.rows, current => current.id === row.id ? {...current, label: row.label, color: row.color} : current)});
export function moveRow({board, rowId, delta}: {board: Board; rowId: RowId; delta: -1 | 1}): Board {
  const index = board.rows.findIndex(row => row.id === rowId), over = board.rows[index + delta];
  return over ? moveRowTo({board, rowId, overRowId: over.id}) : board;
}
export function moveRowTo({board, rowId, overRowId}: {board: Board; rowId: RowId; overRowId: RowId}): Board {
  const moving = board.rows.find(row => row.id === rowId), to = board.rows.findIndex(row => row.id === overRowId);
  if (!moving || to < 0 || rowId === overRowId) return board;
  return {...board, rows: insertNonEmpty({items: board.rows.filter(row => row.id !== rowId), index: to, value: moving})};
}
/** The sole remaining tier cannot be removed: this is an editor operation rule. */
export function deleteRow(board: Board, id: RowId): Board {
  const [first, ...rest] = board.rows;
  if (first.id === id) {
    const [next, ...tail] = rest;
    return next ? {...board, rows: [next, ...tail], pool: [...board.pool, ...first.items]} : board;
  }
  const removed = rest.find(row => row.id === id);
  return removed ? {...board, rows: [first, ...rest.filter(row => row.id !== id)], pool: [...board.pool, ...removed.items]} : board;
}
export function applyTierPreset(board: Board, key: Preset): Board {
  const labels = TIER_PRESETS[key];
  const rows = mapNonEmpty(labels, (label, i): Row => ({id: board.rows[i]?.id ?? newRowId(), items: board.rows[i]?.items ?? [], label, color: colorAt(i)}));
  return {...board, rows, pool: [...board.pool, ...board.rows.slice(labels.length).flatMap(row => row.items)]};
}
export const resetPlacements = (board: Board): Board => ({...board, pool: allItems(board), rows: mapNonEmpty(board.rows, row => ({...row, items: []}))});
export const replaceContestants = ({board, title, pool}: {board: Board; title: string; pool: Item[]}): TemplateBoard => ({title, pool, rows: mapNonEmpty(board.rows, row => ({...row, items: []}))});
export type TemplateBoard = Pick<Board, 'title' | 'rows' | 'pool' | 'credit'>;
/** Replace title, tiers and contestants; `credit` is replaced too (absent = not a community template). */
export const loadTemplate = (board: Board, {title, rows, pool, credit}: TemplateBoard): Board => {
  const {credit: _previous, ...rest} = board;
  return {...rest, title, rows, pool, ...(credit && {credit})};
};
export const toggleExportQr = (board: Board): Board => ({...board, exportQr: board.exportQr === false});
export const setTitle = (board: Board, title: string): Board => ({...board, title});
export const toggleTheme = (board: Board): Board => ({...board, theme: board.theme === 'light' ? 'dark' : 'light'});
