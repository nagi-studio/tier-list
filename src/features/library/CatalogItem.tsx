import type {Model} from '@/lib/catalog';
import {Check, Plus} from 'lucide-react';
import Logo from '@/components/Logo';
import {formatDate} from '@/lib/catalog';
import {cx} from '@/lib/utils';

export default function CatalogItem({model, rank, added, onAdd}: {model: Model; rank: number | null; added: boolean; onAdd: (model: Model) => void}) {
  return <button type="button" className={cx('catalog-item', added && 'added')} onClick={() => onAdd(model)} disabled={added} aria-label={`${added ? '已添加' : '添加'} ${model.name}`}>
    {rank && <span className="rank">{rank}</span>}
    <Logo item={model} size={32}/>
    <span className="catalog-copy">
      <strong>{model.name}</strong>
      <small>{model.provider}{model.date && ` · ${formatDate(model.date)}`}{model.open && <em>开源</em>}{model.deprecated && <em className="muted">已下线</em>}</small>
    </span>
    {model.score != null && <span className="score" title="Artificial Analysis 智能指数">{Math.round(model.score)}</span>}
    <span className="catalog-add">{added ? <><Check size={15}/><small>已添加</small></> : <Plus size={16}/>}</span>
  </button>;
}
