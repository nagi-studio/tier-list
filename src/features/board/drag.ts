import {z} from 'zod';
import type {Active} from '@dnd-kit/core';

const rowDragSchema = z.object({type: z.literal('row'), rowId: z.string()});
export function rowIdOf(node: Pick<Active, 'data'> | null | undefined): string | undefined {
  const data: unknown = node?.data.current;
  const parsed = rowDragSchema.safeParse(data);
  return parsed.success ? parsed.data.rowId : undefined;
}
