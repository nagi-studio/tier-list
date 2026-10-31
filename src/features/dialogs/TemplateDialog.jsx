import {useState} from 'react';
import {ExternalLink, Loader2} from 'lucide-react';
import Modal from '@/components/Modal';
import Logo from '@/components/Logo';
import community from '@/data/community.json';
import {flagships} from '@/lib/catalog';
import {REPO_URL} from '@/lib/constants';
import {fromCatalog, replaceContestants} from '@/lib/board';
import {normalizeTemplate, templateToBoard} from '@/lib/template';
import {toast} from '@/lib/toast';
import {dispatch, getEditorState} from '@/store/editor';

const BUILTIN = [
  {key: 'ai', title: 'AI 大模型', description: `当下 AA 榜单前列的 ${flagships.length} 个旗舰模型`, preview: flagships.slice(0, 5), keepTiers: true},
  {key: 'blank', title: '空白', description: '从零开始，排什么都行', preview: [{name: '✦', emoji: '✦'}], keepTiers: true},
];

async function loadCommunity(id) {
  const res = await fetch(`${import.meta.env.BASE_URL}community/${id}.json`);
  if (!res.ok) throw Error();
  const {template} = normalizeTemplate(await res.json());
  if (!template) throw Error();
  return template;
}

function TemplateCard({title, description, meta, preview, busy, onClick}) {
  return <button type="button" className="template-card" onClick={onClick} disabled={busy}>
    <span className="template-preview">{preview.slice(0, 5).map((item, i) => <Logo key={i} item={item} size={28}/>)}{busy && <Loader2 size={18} className="spin"/>}</span>
    <strong>{title}</strong>
    {description && <small>{description}</small>}
    {meta && <span className="template-meta">{meta}</span>}
  </button>;
}

/** Template center: built-in starters plus community templates from templates/ in the repo. */
export default function TemplateDialog({onClose}) {
  const [loading, setLoading] = useState(null);
  function useBuiltin(t) {
    const board = getEditorState().board;
    const pool = t.key === 'ai' ? flagships.map(fromCatalog) : [];
    dispatch({type: 'loadTemplate', board: replaceContestants(board, t.key === 'ai' ? '2026 AI 大模型排位' : '我的 Tier List', pool)});
    onClose();
  }
  async function useCommunity(t) {
    setLoading(t.id);
    try {
      dispatch({type: 'loadTemplate', board: templateToBoard(await loadCommunity(t.id))});
      toast(`已换成「${t.title}」，可以撤销`);
      onClose();
    } catch { toast('模板加载失败，请重试'); }
    finally { setLoading(null); }
  }
  return <Modal title="模板中心" onClose={onClose} className="template-modal">
    <p className="modal-description">换模板会替换当前的等级和选手，可以撤销。</p>
    <h3 className="section-title">内置</h3>
    <div className="template-grid">{BUILTIN.map(t => <TemplateCard key={t.key} {...t} onClick={() => useBuiltin(t)}/>)}</div>
    <h3 className="section-title">社区模板 <span className="count">{community.length}</span></h3>
    <div className="template-grid">{community.map(t => <TemplateCard key={t.id} {...t} meta={`${t.count} 个选手${t.author ? ` · @${t.author}` : ''}`} busy={loading === t.id} onClick={() => useCommunity(t)}/>)}</div>
    <a className="contribute" href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer"><ExternalLink size={15}/>投稿你的模板：GitHub Nagi-Studio/tier-list</a>
  </Modal>;
}
