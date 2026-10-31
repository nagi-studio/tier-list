import {z} from 'zod';

export const POOL = 'pool';
export const TRASH = 'trash';
const rawIdSchema = z.string().min(1).refine(id => id !== POOL && id !== TRASH);

// Brands describe their creation context, not a runtime property on the string.
// z.custom verifies the entire primitive schema before minting the team's __brand shape.
function brandedId<Name extends string>(name: Name, schema = rawIdSchema) {
  return z.custom<string & {readonly __brand: Name}>(input => schema.safeParse(input).success, {
    error: `Invalid ${name}`,
  });
}
export const itemIdSchema = brandedId('ItemId');
export const rowIdSchema = brandedId('RowId');
export const modelIdSchema = brandedId('ModelId');
export const templateIdSchema = brandedId('TemplateId', z.string().regex(/^[a-z0-9][a-z0-9-]{1,39}$/));
export type ItemId = z.infer<typeof itemIdSchema>;
export type RowId = z.infer<typeof rowIdSchema>;
export type ModelId = z.infer<typeof modelIdSchema>;
export type TemplateId = z.infer<typeof templateIdSchema>;
export type ContainerId = RowId | typeof POOL;
export type DropTarget =
  | {kind: 'item'; id: ItemId}
  | {kind: 'container'; id: ContainerId}
  | {kind: 'trash'};

const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const newItemId = (): ItemId => itemIdSchema.parse(uid());
export const newRowId = (): RowId => rowIdSchema.parse(uid());
