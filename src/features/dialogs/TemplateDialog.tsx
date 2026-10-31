import type {ComponentProps} from 'react';
import type {DialogProps} from './types';
import type {TemplateId} from '@/lib/ids';
import type {CommunityEntry} from '@/lib/community';
import {useState} from 'react';
import {ExternalLink, Loader2, PlayCircle} from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import Modal from '@/components/Modal';
import Logo from '@/components/Logo';
import {community, creditFor, loadCommunity} from '@/lib/community';
import {flagships} from '@/lib/catalog';
import {REPO_URL} from '@/lib/constants';
import {fromCatalog, replaceContestants} from '@/lib/board';
import {templateToBoard} from '@/lib/template';
import {toast} from '@/lib/toast';
import {openVideo} from '@/lib/toySdk';
import {dispatch, getEditorState} from '@/store/editor';

const BUILTIN = [
  {key: 'ai', title: 'AI 大模型', description: `当下 AA 榜单前列的 ${flagships.length} 个旗舰模型`, preview: flagships.slice(0, 5)},
  {key: 'blank', title: '空白', description: '从零开始，排什么都行', preview: [{name: '✦', emoji: '✦'}]},
];

type CardProps = Pick<CommunityEntry, 'title' | 'description' | 'author' | 'bilibili' | 'avatar' | 'video'> & {
  preview: ComponentProps<typeof Logo>['item'][]; count?: number; busy?: boolean; onClick: () => void;
};

function TemplateCard({title, description, count, author, bilibili, avatar, video, preview, busy, onClick}: CardProps) {
  return <div className="template-card">
    <button type="button" className="template-main" onClick={onClick} disabled={busy}>
      <span className="template-preview">{preview.slice(0, 5).map((item, i) => <Logo key={i} item={item} size={28}/>)}{busy && <Loader2 size={18} className="spin"/>}</span>
      <strong>{title}</strong>
      {description && <small>{description}</small>}
      {count && <span className="template-count">{count} 个选手</span>}
    </button>
    {author && <div className="template-author">
      {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer"/> : <span className="avatar-blank"/>}
      <span className="author-name">{author}</span>
      {video && <a className="video-link" href={`https://www.bilibili.com/video/${video}`} target="_blank" rel="noreferrer" title="看 UP 的视频" aria-label={`看 ${author} 的视频`} onClick={e => { if (openVideo(video)) e.preventDefault(); }}><PlayCircle size={16}/></a>}
      {bilibili && <FollowButton uid={bilibili}/>}
    </div>}
  </div>;
}

/** Template center: built-in starters plus community templates from templates/ in the repo. */
export default function TemplateDialog({onClose}: DialogProps) {
  const [loading, setLoading] = useState<TemplateId | null>(null);
  function useBuiltin(t: typeof BUILTIN[number]) {
    const board = getEditorState().board;
    const pool = t.key === 'ai' ? flagships.map(fromCatalog) : [];
    dispatch({type: 'loadTemplate', board: replaceContestants({board, title: t.key === 'ai' ? '2026 AI 大模型排位' : '我的 Tier List', pool})});
    onClose();
  }
  async function useCommunity(t: CommunityEntry) {
    setLoading(t.id);
    try {
      dispatch({type: 'loadTemplate', board: templateToBoard(await loadCommunity(t.id), creditFor(t))});
      toast(`已换成「${t.title}」，可以撤销`);
      onClose();
    } catch { toast('模板加载失败，请重试'); }
    finally { setLoading(null); }
  }
  return <Modal title="模板中心" onClose={onClose} className="template-modal">
    <p className="modal-description">换模板会替换当前的等级和选手，可以撤销。</p>
    <h3 className="section-title">内置</h3>
    <div className="template-grid">{BUILTIN.map(t => <TemplateCard key={t.key} title={t.title} description={t.description} preview={t.preview} onClick={() => useBuiltin(t)}/>)}</div>
    <h3 className="section-title">社区模板 <span className="count">{community.length}</span></h3>
    <div className="template-grid">{community.map(t => <TemplateCard key={t.id} {...t} busy={loading === t.id} onClick={() => useCommunity(t)}/>)}</div>
    <a className="contribute" href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer"><ExternalLink size={15}/>投稿你的模板：GitHub Nagi-Studio/tier-list</a>
  </Modal>;
}
