// Pure board operations. Every function takes a board and returns a new one (or the same one if nothing changed).

export const COLORS = ['#ff7f7f', '#ffb26b', '#ffd96a', '#b5e27a', '#6fd6c3', '#7fb3ff', '#b69cff', '#ff92c8'];
export const TIER_PRESETS = {
  classic: ['S+', 'S', 'A', 'B', 'C', 'D'],
  cn: ['夯', '顶级', '人上人', 'NPC', '拉完了'],
  numeric: ['T0', 'T1', 'T2', 'T3', 'T4'],
};
export const MAX_ROWS = 30;

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const makeRows = (preset = 'classic') => TIER_PRESETS[preset].map((label, i) => ({id: uid(), label, color: COLORS[i], items: []}));
export const fromCatalog = model => ({...model, id: uid(), catalogId: model.id});

/** Flagship models when the catalog marks any, otherwise every model given. */
export function initialState(models = []) {
  const picks = models.some(m => m.flagship) ? models.filter(m => m.flagship) : models;
  return {version: 1, title: '2026 AI 大模型排位', subtitle: '', rows: makeRows(), pool: picks.map(fromCatalog), theme: 'dark'};
}

export const allItems = s => [...s.rows.flatMap(r => r.items), ...s.pool];
export function containerOf(s, id) {
  if (s.pool.some(i => i.id === id)) return 'pool';
  return s.rows.find(r => r.items.some(i => i.id === id))?.id;
}
/** Resolve a drop target id (an item, a row, or the pool) to the container it belongs to. */
export const targetOf = (s, id) => containerOf(s, id) || (id === 'pool' || s.rows.some(r => r.id === id) ? id : null);
export const presetOf = s => Object.entries(TIER_PRESETS).find(([, labels]) => labels.length === s.rows.length && labels.every((l, i) => s.rows[i].label === l))?.[0] ?? '';

export function moveItem(s, id, targetId, overId) {
  const source = containerOf(s, id);
  if (!source || (targetId !== 'pool' && !s.rows.some(r => r.id === targetId))) return s;
  const next = structuredClone(s), list = c => c === 'pool' ? next.pool : next.rows.find(r => r.id === c).items;
  const from = list(source), index = from.findIndex(x => x.id === id);
  const targetIndex = overId ? list(targetId).findIndex(x => x.id === overId) : -1;
  const [item] = from.splice(index, 1), to = list(targetId);
  const pos = source === targetId ? targetIndex : (overId ? to.findIndex(x => x.id === overId) : -1);
  to.splice(pos < 0 ? to.length : pos, 0, item);
  return next;
}

export function addItems(s, items, target = 'pool') {
  if (!items.length) return s;
  if (target === 'pool') return {...s, pool: [...s.pool, ...items]};
  return {...s, rows: s.rows.map(r => r.id === target ? {...r, items: [...r.items, ...items]} : r)};
}

/** Replace an item's fields and move it to `target` if it lives elsewhere. */
export function updateItem(s, item, target) {
  const swap = i => i.id === item.id ? item : i;
  const next = {...s, pool: s.pool.map(swap), rows: s.rows.map(r => ({...r, items: r.items.map(swap)}))};
  return target && containerOf(next, item.id) !== target ? moveItem(next, item.id, target) : next;
}

export const removeItem = (s, id) => ({...s, pool: s.pool.filter(i => i.id !== id), rows: s.rows.map(r => ({...r, items: r.items.filter(i => i.id !== id)}))});

export function duplicateItem(s, id) {
  const item = allItems(s).find(i => i.id === id);
  return item ? addItems(s, [{...item, id: uid(), catalogId: undefined, name: `${item.name} 副本`}]) : s;
}

export function addRow(s) {
  if (s.rows.length >= MAX_ROWS) return s;
  return {...s, rows: [...s.rows, {id: uid(), label: '新等级', color: COLORS[s.rows.length % COLORS.length], items: []}]};
}
export const updateRow = (s, row) => ({...s, rows: s.rows.map(r => r.id === row.id ? {...r, label: row.label, color: row.color} : r)});
export function moveRow(s, id, delta) {
  const i = s.rows.findIndex(r => r.id === id), j = i + delta;
  if (i < 0 || j < 0 || j >= s.rows.length) return s;
  const rows = [...s.rows];
  [rows[i], rows[j]] = [rows[j], rows[i]];
  return {...s, rows};
}
/** Move tier `id` to where tier `overId` sits (drag-and-drop reordering). */
export function moveRowTo(s, id, overId) {
  const from = s.rows.findIndex(r => r.id === id), to = s.rows.findIndex(r => r.id === overId);
  if (from < 0 || to < 0 || from === to) return s;
  const rows = [...s.rows], [row] = rows.splice(from, 1);
  rows.splice(to, 0, row);
  return {...s, rows};
}
/** Delete a tier; its items return to the pool. The last tier can't be deleted. */
export function deleteRow(s, id) {
  const row = s.rows.find(r => r.id === id);
  if (!row || s.rows.length === 1) return s;
  return {...s, rows: s.rows.filter(r => r.id !== id), pool: [...s.pool, ...row.items]};
}

export function applyTierPreset(s, key) {
  const labels = TIER_PRESETS[key];
  if (!labels) return s;
  const rows = labels.map((label, i) => s.rows[i] ? {...s.rows[i], label, color: COLORS[i]} : {id: uid(), label, color: COLORS[i], items: []});
  return {...s, rows, pool: [...s.pool, ...s.rows.slice(labels.length).flatMap(r => r.items)]};
}

export const resetPlacements = s => ({...s, pool: allItems(s), rows: s.rows.map(r => ({...r, items: []}))});
export const replaceContestants = (s, title, pool) => ({...s, title, pool, rows: s.rows.map(r => ({...r, items: []}))});
export const setTitle = (s, title) => ({...s, title});
export const toggleTheme = s => ({...s, theme: s.theme === 'light' ? 'dark' : 'light'});

export function validateBoard(v) {
  if (!v || v.version !== 1 || typeof v.title !== 'string' || v.title.length > 160 || typeof v.subtitle !== 'string' || v.subtitle.length > 500 || !Array.isArray(v.rows) || v.rows.length < 1 || v.rows.length > MAX_ROWS || !Array.isArray(v.pool)) return false;
  const ids = new Set(), unique = id => typeof id === 'string' && id.length > 0 && id !== 'pool' && !ids.has(id) && !!ids.add(id);
  const item = x => x && unique(x.id) && typeof x.name === 'string' && x.name.length <= 160 && (!x.icon || /^[a-z0-9-]+$/.test(x.icon)) && (!x.image || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(x.image));
  return v.rows.every(r => r && unique(r.id) && typeof r.label === 'string' && r.label.length <= 30 && /^#[\da-f]{6}$/i.test(r.color) && Array.isArray(r.items) && r.items.every(item)) && v.pool.every(item) && allItems(v).length <= 1000;
}
