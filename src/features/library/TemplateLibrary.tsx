import {useState} from 'react';
import {Check, Plus, Search, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import Logo from '@/components/Logo';
import type {CommunityEntry} from '@/lib/community';
import {useCommunityTemplate} from '@/lib/communityCache';
import type {TemplateItem} from '@/lib/template';
import {cx} from '@/lib/utils';

/** The library for a community template: its own contestants, so removed ones can be added back. */
export default function TemplateLibrary({entry, onBoard, onAdd, onCreate, onClose}: {
  entry: CommunityEntry; onBoard: ReadonlySet<string>; onAdd: (items: TemplateItem[]) => void; onCreate: (name: string) => void; onClose: (() => void) | null;
}) {
  const state = useCommunityTemplate(entry.id);
  const [query, setQuery] = useState('');
  const items = state.status === 'ready' ? state.template.items : [];
  const q = query.trim().toLowerCase();
  const list = q ? items.filter(item => item.name.toLowerCase().includes(q)) : items;
  const missing = items.filter(item => !onBoard.has(item.name));
  return <>
    <div className="library-head">
      <div className="library-title">
        <h2>选手库</h2><span className="count">{entry.count}</span>
        {onClose && <button type="button" className="icon-btn" aria-label="关闭选手库" onClick={onClose}><X size={18}/></button>}
      </div>
      <p className="library-source">「{entry.title}」模板自带的选手{entry.author && ` · 模板 by @${entry.author}`}</p>
      <label className="search-box">
        <Search size={16}/>
        <input placeholder="搜索选手" aria-label="搜索选手" value={query} onChange={e => setQuery(e.target.value)}/>
        {query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={14}/></button>}
      </label>
      {missing.length > 0 && !q && <button type="button" className="link-btn" onClick={() => onAdd(missing)}><Plus size={14}/>全部加回待定区（{missing.length}）</button>}
    </div>
    <div className="catalog-list">
      {state.status === 'loading' && <p className="library-empty">正在加载…</p>}
      {state.status === 'error' && <p className="library-empty">模板加载失败，请刷新重试</p>}
      {list.map(item => {
        const added = onBoard.has(item.name);
        return <button type="button" key={item.name} className={cx('catalog-item', added && 'added')} disabled={added} onClick={() => onAdd([item])} aria-label={`${added ? '已添加' : '添加'} ${item.name}`}>
          <Logo item={item} size={32}/>
          <span className="catalog-copy"><strong>{item.name}</strong></span>
          <span className="catalog-add">{added ? <><Check size={15}/><small>已添加</small></> : <Plus size={16}/>}</span>
        </button>;
      })}
      {state.status === 'ready' && q && !list.length && <div className="no-results"><p>没找到「{query}」</p><Button className="btn primary" onClick={() => onCreate(query.trim())}><Plus size={16}/>自己创建一个</Button></div>}
    </div>
  </>;
}
