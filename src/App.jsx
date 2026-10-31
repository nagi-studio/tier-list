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
import {useMediaQuery} from '@/hooks/useMediaQuery';
import {allItems, containerOf, fromCatalog, presetOf, uid} from '@/lib/board';
import {exportJson, exportPng, readBoardFile} from '@/lib/files';
import {toast} from '@/lib/toast';
import {templateToBoard} from '@/lib/template';
import {clearIncomingShare, useIncomingShare} from '@/lib/share';
import {dispatch, useEditor} from '@/store/editor';

export default function App() {
  const {board, past, future, drag, saveError} = useEditor();
  const [modal, setModal] = useState(null), [libraryOpen, setLibraryOpen] = useState(false), [exporting, setExporting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 900px)');
  const incoming = useIncomingShare();
  const canvasRef = useRef(null), importRef = useRef(null);
  const closeModal = () => setModal(null);

  const added = new Set(allItems(board).map(i => i.catalogId));
  const editItem = item => setModal({kind: 'item', item: {...item}, target: containerOf(board, item.id)});
  const newItem = (target = 'pool', name = '') => setModal({kind: 'item', item: {id: uid(), name, emoji: '✦'}, target, isNew: true});
  function addModels(models) {
    dispatch({type: 'addItems', items: models.map(fromCatalog)});
    toast(models.length === 1 ? `已加入待定区：${models[0].name}` : `已加入 ${models.length} 个旗舰模型`);
  }
  async function handleExport() {
    setExporting(true);
    try { await exportPng(canvasRef.current, board.title); toast('图片已导出'); }
    catch (e) { console.error(e); toast('导出失败，请重试或先保存 JSON'); }
    finally { setExporting(false); }
  }
  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const next = await readBoardFile(file);
    if (next) setModal({kind: 'import', board: next});
    else toast('文件格式不对，请选择本工具导出的 JSON');
  }

  const library = <LibraryPanel added={added} onAdd={m => addModels([m])} onAddMany={addModels} onCreate={name => newItem('pool', name)} onClose={isMobile ? () => setLibraryOpen(false) : null}/>;
  const rowIndex = modal?.kind === 'row' ? board.rows.findIndex(r => r.id === modal.row.id) : -1;

  return <div className="app-shell">
    <Header theme={board.theme} saveError={saveError}/>
    <main className="workspace">
      <section className="editor">
        <Toolbar preset={presetOf(board)} canUndo={past.length > 0} canRedo={future.length > 0} exporting={exporting}
          onExport={handleExport} onSaveJson={() => { exportJson(board); toast('JSON 已保存'); }} onImportJson={() => importRef.current.click()}
          onOpenLibrary={() => setLibraryOpen(true)} onOpenModal={setModal}/>
        <Board ref={canvasRef} board={board} dragId={drag?.id} touch={isMobile} onEditItem={editItem} onEditRow={row => setModal({kind: 'row', row: {...row}})} onNewItem={newItem}/>
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
    {incoming?.template && <ConfirmDialog title="打开别人分享的榜单？" description={`「${incoming.template.title}」· ${incoming.template.items.length} 个选手。会替换你当前的画布，可以撤销。`} confirmLabel="打开" onConfirm={() => { dispatch({type: 'loadTemplate', board: templateToBoard(incoming.template)}); toast('已打开分享的榜单'); }} onClose={clearIncomingShare}/>}
    {incoming?.error && <ConfirmDialog title="链接打不开" description={incoming.error} confirmLabel="知道了" onConfirm={() => {}} onClose={clearIncomingShare}/>}
    {modal?.kind === 'reset' && <ConfirmDialog title="全部移回待定区？" description="所有选手回到待定区，标题和等级保留。可以撤销。" confirmLabel="移回待定区" onConfirm={() => dispatch({type: 'resetPlacements'})} onClose={closeModal}/>}
    {modal?.kind === 'import' && <ConfirmDialog title="导入这份榜单？" description={`「${modal.board.title}」· ${allItems(modal.board).length} 个选手。会替换当前画布，可以撤销。`} confirmLabel="导入榜单" onConfirm={() => { dispatch({type: 'importBoard', board: modal.board}); toast('榜单已导入'); }} onClose={closeModal}/>}
    <Toast/>
  </div>;
}
