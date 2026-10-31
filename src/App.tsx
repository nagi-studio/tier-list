import {flushSync} from 'react-dom';
import type {ChangeEvent} from 'react';
import type {Model} from '@/lib/catalog';
import type {Item} from '@/lib/board';
import type {EditorModal} from '@/features/dialogs/types';
import {useRef, useState} from 'react';
import {Sheet, SheetContent, SheetTitle} from '@/components/ui/sheet';
import Toast from '@/components/Toast';
import Header from '@/features/layout/Header';
import Toolbar from '@/features/board/Toolbar';
import Board from '@/features/board/Board';
import LibraryPanel from '@/features/library/LibraryPanel';
import ItemDialog from '@/features/dialogs/ItemDialog';
import RowDialog from '@/features/dialogs/RowDialog';
import TemplateDialog from '@/features/dialogs/TemplateDialog';
import ConfirmDialog from '@/features/dialogs/ConfirmDialog';
import ShareDialog from '@/features/dialogs/ShareDialog';
import ShareCard from '@/features/export/ShareCard';
import {useMediaQuery} from '@/hooks/useMediaQuery';
import {allItems, containerOf, fromCatalog, presetOf} from '@/lib/board';
import {exportJson, exportPng, readBoardFile} from '@/lib/files';
import {newItemId, POOL} from '@/lib/ids';
import type {ContainerId} from '@/lib/ids';
import {toast} from '@/lib/toast';
import {clearIncomingShare, useIncomingShare} from '@/lib/share';
import {dispatch, useEditor} from '@/store/editor';

export default function App() {
  const {board, past, future, drag, saveError} = useEditor();
  const [modal, setModal] = useState<EditorModal | null>(null), [libraryOpen, setLibraryOpen] = useState(false), [exporting, setExporting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const incoming = useIncomingShare();
  const shareRef = useRef<HTMLDivElement>(null), importRef = useRef<HTMLInputElement>(null);
  const closeModal = () => setModal(null);

  const added = new Set(allItems(board).map(i => i.catalogId));
  const editItem = (item: Item) => setModal({kind: 'item', item: {...item}, target: containerOf(board, item.id) ?? POOL, isNew: false});
  const newItem = (target: ContainerId = POOL, name = '') => setModal({kind: 'item', item: {id: newItemId(), name, emoji: '✦'}, target, isNew: true});
  function addModels(models: Model[]) {
    dispatch({type: 'addItems', items: models.map(fromCatalog)});
    toast(models.length === 1 ? `已加入待定区：${models[0]?.name}` : `已加入 ${models.length} 个旗舰模型`);
  }
  async function handleExport() {
    // Mount the off-screen share card synchronously, snapshot it, then unmount.
    flushSync(() => setExporting(true));
    try { if (!shareRef.current) return; await exportPng(shareRef.current, board.title); toast('图片已导出'); }
    catch (e) { console.error({event: 'export_png_failed', title: board.title, error: e}); toast('导出失败，请重试或先保存 JSON'); }
    finally { setExporting(false); }
  }
  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const next = await readBoardFile(file);
    if (next) setModal({kind: 'import', board: next});
    else toast('文件格式不对，请选择本工具导出的 JSON');
  }

  const library = <LibraryPanel added={added} onAdd={m => addModels([m])} onAddMany={addModels} onCreate={name => newItem(POOL, name)} onClose={isMobile ? () => setLibraryOpen(false) : null}/>;
  const rowIndex = modal?.kind === 'row' ? board.rows.findIndex(r => r.id === modal.row.id) : -1;

  return <div className="app-shell">
    <Header theme={board.theme} saveError={saveError} onOpenTemplates={() => setModal({kind: 'template'})}/>
    <main className="workspace">
      <section className="editor">
        <Toolbar exportQr={board.exportQr !== false} preset={presetOf(board)} canUndo={past.length > 0} canRedo={future.length > 0} exporting={exporting}
          onExport={handleExport} onSaveJson={() => { exportJson(board); toast('JSON 已保存'); }} onImportJson={() => importRef.current?.click()}
          onOpenLibrary={() => setLibraryOpen(true)} onOpenModal={setModal}/>
        <Board board={board} dragId={drag?.id} touch={isMobile} onEditItem={editItem} onEditRow={row => setModal({kind: 'row', row: {...row}})} onNewItem={newItem}/>
      </section>
      {isMobile
        ? <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}><SheetContent side="bottom" className="library sheet" showCloseButton={false} aria-describedby={undefined}><SheetTitle className="sr-only">选手库</SheetTitle>{library}</SheetContent></Sheet>
        : <aside className="library">{library}</aside>}
    </main>
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={handleImport}/>

    {modal?.kind === 'item' && <ItemDialog {...modal} rows={board.rows} onClose={closeModal}/>}
    {modal?.kind === 'row' && rowIndex >= 0 && <RowDialog row={modal.row} index={rowIndex} total={board.rows.length} onClose={closeModal}/>}
    {modal?.kind === 'template' && <TemplateDialog onClose={closeModal}/>}
    {modal?.kind === 'share' && <ShareDialog onClose={closeModal}/>}
    {incoming?.status === 'ready' && <ConfirmDialog title={incoming.kind === 'template' ? '用这个模板？' : '打开别人分享的榜单？'} description={`「${incoming.title}」· ${incoming.count} 个选手${incoming.credit?.author ? `，模板来自 @${incoming.credit.author}` : ''}。会替换你当前的画布，可以撤销。`} confirmLabel="打开" onConfirm={() => { dispatch({type: 'loadTemplate', board: incoming.board(board)}); toast(incoming.kind === 'template' ? `已换成「${incoming.title}」` : '已打开分享的榜单'); }} onClose={clearIncomingShare}/>}
    {incoming?.status === 'error' && <ConfirmDialog title="链接打不开" description={incoming.error} confirmLabel="知道了" onConfirm={() => {}} onClose={clearIncomingShare}/>}
    {modal?.kind === 'reset' && <ConfirmDialog title="全部移回待定区？" description="所有选手回到待定区，标题和等级保留。可以撤销。" confirmLabel="移回待定区" onConfirm={() => dispatch({type: 'resetPlacements'})} onClose={closeModal}/>}
    {modal?.kind === 'import' && <ConfirmDialog title="导入这份榜单？" description={`「${modal.board.title}」· ${allItems(modal.board).length} 个选手。会替换当前画布，可以撤销。`} confirmLabel="导入榜单" onConfirm={() => { dispatch({type: 'importBoard', board: modal.board}); toast('榜单已导入'); }} onClose={closeModal}/>}
    {exporting && <div className="share-stage" aria-hidden="true"><ShareCard ref={shareRef} board={board} showQr={board.exportQr !== false}/></div>}
    <Toast/>
  </div>;
}
