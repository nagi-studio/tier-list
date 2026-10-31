import type {Board, Item, Row} from '@/lib/board';

export type EditorModal =
  | {kind: 'item'; item: Item; target: string; isNew: boolean}
  | {kind: 'row'; row: Row}
  | {kind: 'template' | 'share' | 'reset'}
  | {kind: 'import'; board: Board};
export type DialogProps = {onClose: () => void};
