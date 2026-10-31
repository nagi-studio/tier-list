import {DropdownMenu, ToggleGroup} from 'radix-ui';
import {Undo2, Redo2, MoreHorizontal, LayoutGrid, RotateCcw, FileJson, Upload, Library, Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {PRESET_OPTIONS} from '@/lib/constants';
import {dispatch} from '@/store/editor';

function MenuItem({icon: Icon, children, ...props}) {
  return <DropdownMenu.Item className="menu-item" {...props}><Icon size={16}/>{children}</DropdownMenu.Item>;
}

export default function Toolbar({preset, canUndo, canRedo, exporting, onExport, onSaveJson, onImportJson, onOpenLibrary, onOpenModal}) {
  return <div className="toolbar">
    <ToggleGroup.Root type="single" className="segmented" aria-label="等级模板" value={preset} onValueChange={v => v && dispatch({type: 'applyPreset', preset: v})}>
      {PRESET_OPTIONS.map(p => <ToggleGroup.Item key={p.key} value={p.key} aria-label={p.name}>{p.label}</ToggleGroup.Item>)}
    </ToggleGroup.Root>
    <div className="toolbar-actions">
      <button type="button" className="icon-btn" aria-label="撤销" title="撤销 (Ctrl+Z)" disabled={!canUndo} onClick={() => dispatch({type: 'undo'})}><Undo2 size={17}/></button>
      <button type="button" className="icon-btn" aria-label="重做" title="重做 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={() => dispatch({type: 'redo'})}><Redo2 size={17}/></button>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild><button type="button" className="icon-btn" aria-label="更多操作" title="更多"><MoreHorizontal size={18}/></button></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="menu" align="end" sideOffset={6}>
            <MenuItem icon={LayoutGrid} onSelect={() => onOpenModal({kind: 'template'})}>换个题材…</MenuItem>
            <MenuItem icon={RotateCcw} onSelect={() => onOpenModal({kind: 'reset'})}>全部移回待定区…</MenuItem>
            <DropdownMenu.Separator className="menu-sep"/>
            <MenuItem icon={FileJson} onSelect={onSaveJson}>保存 JSON</MenuItem>
            <MenuItem icon={Upload} onSelect={onImportJson}>导入 JSON…</MenuItem>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <button type="button" className="btn subtle mobile-library" aria-label="打开选手库" onClick={onOpenLibrary}><Library size={16}/>选手库</button>
      <Button className="btn primary" onClick={onExport} disabled={exporting}><Download size={16}/>{exporting ? '导出中…' : '导出图片'}</Button>
    </div>
  </div>;
}
