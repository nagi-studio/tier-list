// Compile-time tests run under bun run typecheck; no runtime fixtures can bypass these contracts.
import type {Board, Item} from '../src/lib/board';
import type {moveItem, moveRowTo} from '../src/lib/board';
import type {ContainerId, DropTarget, ItemId, ModelId, RowId, TemplateId, TRASH} from '../src/lib/ids';
import type {EditorAction} from '../src/store/editor';

type Check<T extends true> = T;
type Rejects<Source, Target> = [Source] extends [Target] ? false : true;
export type Contracts = [
  Check<Rejects<string, ItemId>>,
  Check<Rejects<string, keyof Board>>,
  Check<Rejects<string, keyof Item>>,
  Check<Rejects<RowId, ItemId>>,
  Check<Rejects<ModelId, ItemId>>,
  Check<Rejects<TemplateId, ItemId>>,
  Check<Rejects<ItemId, RowId>>,
  Check<Rejects<ModelId, RowId>>,
  Check<Rejects<TemplateId, RowId>>,
  Check<Rejects<RowId, ModelId>>,
  Check<Rejects<TemplateId, ModelId>>,
  Check<Rejects<ModelId, TemplateId>>,
  Check<Rejects<typeof TRASH, ContainerId>>,
  Check<Rejects<string, ContainerId>>,
  Check<Rejects<ItemId, ContainerId>>,
  Check<Rejects<string, DropTarget>>,
  Check<Rejects<[], Board['rows']>>,
  Check<Rejects<Board['rows'][number]['id'], Parameters<typeof moveItem>[0]['itemId']>>,
  Check<Rejects<ItemId, Parameters<typeof moveRowTo>[0]['overRowId']>>,
  Check<Rejects<RowId, Extract<EditorAction, {type: 'removeItem'}>['id']>>,
  Check<Rejects<ItemId, Extract<EditorAction, {type: 'deleteRow'}>['id']>>,
  Check<Rejects<{type: 'nope'}, EditorAction>>,
  Check<Rejects<{type: 'dragOver'; overId: string}, EditorAction>>,
];
