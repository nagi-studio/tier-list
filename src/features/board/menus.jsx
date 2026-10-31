// Right-click menus for tiles and tiers.
import {ContextMenu} from 'radix-ui';
import {Pencil, ArrowRightLeft, Copy, Trash2, ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown, Eraser, ChevronRight, Check} from 'lucide-react';
import {MAX_ROWS, allItems, containerOf} from '@/lib/board';
import {deleteItem, deleteRow} from '@/lib/actions';
import {cx} from '@/lib/utils';
import {dispatch, useEditor} from '@/store/editor';
import {useMediaQuery} from '@/hooks/useMediaQuery';

function Item({icon: Icon, danger, children, ...props}) {
  return <ContextMenu.Item className={cx('menu-item', danger && 'danger')} {...props}><Icon size={16}/>{children}</ContextMenu.Item>;
}
const Separator = () => <ContextMenu.Separator className="menu-sep"/>;

// On touch screens a long-press already starts a drag, so the menu would fight it; tap-to-edit covers those actions.
function MenuShell({trigger, label, children}) {
  const touch = useMediaQuery('(pointer: coarse)');
  return <ContextMenu.Root modal={false}>
    <ContextMenu.Trigger asChild disabled={touch}>{trigger}</ContextMenu.Trigger>
    <ContextMenu.Portal>
      <ContextMenu.Content className="menu" collisionPadding={8}>
        <ContextMenu.Label className="menu-label">{label}</ContextMenu.Label>
        {children}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  </ContextMenu.Root>;
}

function MoveToMenu({itemId}) {
  const {board} = useEditor(), here = containerOf(board, itemId);
  const targets = [...board.rows.map(r => ({id: r.id, label: r.label, color: r.color})), {id: 'pool', label: '待定区'}];
  return <ContextMenu.Sub>
    <ContextMenu.SubTrigger className="menu-item"><ArrowRightLeft size={16}/>移到<ChevronRight size={15} className="menu-chevron"/></ContextMenu.SubTrigger>
    <ContextMenu.Portal>
      <ContextMenu.SubContent className="menu" sideOffset={4} collisionPadding={8}>
        {targets.map(t => <ContextMenu.Item key={t.id} className="menu-item" disabled={t.id === here}
          onSelect={() => dispatch({type: 'updateItem', item: allItems(board).find(i => i.id === itemId), target: t.id})}>
          <span className="menu-swatch" style={{background: t.color || 'var(--muted)'}}/>{t.label}{t.id === here && <Check size={15} className="menu-chevron"/>}
        </ContextMenu.Item>)}
      </ContextMenu.SubContent>
    </ContextMenu.Portal>
  </ContextMenu.Sub>;
}

export function TileMenu({item, onEdit, children}) {
  // Stop the event so the tier's own menu doesn't open underneath.
  const trigger = <div className="menu-trigger" onContextMenu={e => e.stopPropagation()}>{children}</div>;
  return <MenuShell trigger={trigger} label={item.name}>
    <Item icon={Pencil} onSelect={() => onEdit(item)}>编辑…</Item>
    <MoveToMenu itemId={item.id}/>
    <Item icon={Copy} onSelect={() => dispatch({type: 'duplicateItem', id: item.id})}>复制一份</Item>
    <Separator/>
    <Item icon={Trash2} danger onSelect={() => deleteItem(item.id)}>删除</Item>
  </MenuShell>;
}

export function RowMenu({row, index, total, onEdit, children}) {
  const full = total >= MAX_ROWS;
  return <MenuShell trigger={children} label={`等级 ${row.label}`}>
    <Item icon={Pencil} onSelect={onEdit}>编辑等级…</Item>
    <Item icon={ArrowUpToLine} disabled={full} onSelect={() => dispatch({type: 'addRow', index})}>在上方插入等级</Item>
    <Item icon={ArrowDownToLine} disabled={full} onSelect={() => dispatch({type: 'addRow', index: index + 1})}>在下方插入等级</Item>
    <Separator/>
    <Item icon={ChevronUp} disabled={index === 0} onSelect={() => dispatch({type: 'moveRow', id: row.id, delta: -1})}>上移</Item>
    <Item icon={ChevronDown} disabled={index === total - 1} onSelect={() => dispatch({type: 'moveRow', id: row.id, delta: 1})}>下移</Item>
    <Separator/>
    <Item icon={Eraser} disabled={!row.items.length} onSelect={() => dispatch({type: 'clearRow', id: row.id})}>清空（选手回待定区）</Item>
    <Item icon={Trash2} danger disabled={total === 1} onSelect={() => deleteRow(row.id)}>删除这一级</Item>
  </MenuShell>;
}
