import type {ContainerId} from '@/lib/ids';
import type {Board, Item, Row} from '@/lib/board';

export type EditorModal =
  | {kind: 'item'; item: Item; target: ContainerId; isNew: boolean}
  | {kind: 'row'; row: Row}
  | {kind: 'template'}
  | {kind: 'share'}
  | {kind: 'reset'}
  | {kind: 'import'; board: Board};
export type DialogProps = {onClose: () => void};
