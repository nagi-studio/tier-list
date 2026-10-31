import type {ModelId} from '@/lib/ids';
import type {Model} from '@/lib/catalog';
import {useState} from 'react';
import {Tabs} from 'radix-ui';
import {Search, X, Crown, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import CatalogItem from './CatalogItem';
import ProviderFilter from './ProviderFilter';
import {models, flagships, searchModels, source} from '@/lib/catalog';

const PAGE = 60;

/** Browse the model catalog: flagships by default, every model via tab or search. */
export default function LibraryPanel({added, onAdd, onAddMany, onCreate, onClose}: {added: ReadonlySet<ModelId | undefined>; onAdd: (model: Model) => void; onAddMany: (models: Model[]) => void; onCreate: (name: string) => void; onClose: (() => void) | null}) {
  const [view, setView] = useState({tab: 'flagship', query: '', provider: ''});
  const [limit, setLimit] = useState(PAGE);
  const update = (patch: Partial<typeof view>) => { setView(v => ({...v, ...patch})); setLimit(PAGE); };
  const {tab, query, provider} = view;
  const searching = query.trim() !== '';
  const list = searching ? searchModels(query) : tab === 'flagship' ? flagships : provider ? models.filter(m => m.provider === provider) : models;
  const missing = flagships.filter(m => !added.has(m.id));
  return <>
    <div className="library-head">
      <div className="library-title">
        <h2>选手库</h2><span className="count">{models.length}</span>
        {onClose && <button type="button" className="icon-btn" aria-label="关闭选手库" onClick={onClose}><X size={18}/></button>}
      </div>
      <label className="search-box">
        <Search size={16}/>
        <input placeholder={`搜索 ${models.length} 个模型或厂商`} aria-label="搜索模型或厂商" value={query} onChange={e => update({query: e.target.value})}/>
        {query && <button type="button" aria-label="清空搜索" onClick={() => update({query: ''})}><X size={14}/></button>}
      </label>
      {searching ? <div className="result-meta">找到 {list.length} 个</div> : <>
        <Tabs.Root value={tab} onValueChange={t => update({tab: t})}>
          <Tabs.List className="segmented" aria-label="选手范围">
            <Tabs.Trigger value="flagship"><Crown size={14}/>当下旗舰<span>{flagships.length}</span></Tabs.Trigger>
            <Tabs.Trigger value="all">全部模型<span>{models.length}</span></Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        {tab === 'all' ? <ProviderFilter value={provider} onChange={p => update({provider: p})}/> : <div className="flagship-note">
          <p>按 Artificial Analysis 智能指数排序：各家最强的那一个，加上分数 ≥ 49 的前沿模型。</p>
          {missing.length > 0 && <button type="button" className="link-btn" onClick={() => onAddMany(missing)}><Plus size={14}/>全部加入待定区（{missing.length}）</button>}
        </div>}
      </>}
    </div>
    <div className="catalog-list">
      {list.slice(0, limit).map((m, i) => <CatalogItem key={m.id} model={m} rank={!searching && tab === 'flagship' ? i + 1 : null} added={added.has(m.id)} onAdd={onAdd}/>)}
      {list.length > limit && <button type="button" className="show-more" onClick={() => setLimit(l => l + PAGE * 2)}>再显示 {Math.min(PAGE * 2, list.length - limit)} 个</button>}
      {!list.length && <div className="no-results"><p>没找到「{query}」</p><Button className="btn primary" onClick={() => onCreate(query.trim())}><Plus size={16}/>自己创建一个</Button></div>}
    </div>
    <div className="library-foot">数据：<a href="https://artificialanalysis.ai/leaderboards/models" target="_blank" rel="noreferrer">Artificial Analysis</a><span>·</span><time>{source.collectedAt}</time></div>
  </>;
}
