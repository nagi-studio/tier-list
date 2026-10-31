import {Plus, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import DropZone from './DropZone';

export default function Pool({items, rankedCount, touch, onEditItem, onAddItem}) {
  const empty = <div className="pool-empty"><Sparkles size={18}/>{rankedCount ? '全部排完了！导出图片发个动态吧' : '待定区是空的，从选手库里挑几个'}</div>;
  return <section className="pool">
    <div className="pool-heading">
      <h2>待定区 <span className="count">{items.length}</span></h2>
      <p className="hint">{touch ? '长按卡片拖动，点一下可直接选等级' : '把卡片拖到上面的等级里，点卡片可编辑'}</p>
      <Button className="btn subtle" onClick={onAddItem}><Plus size={15}/>自定义选手</Button>
    </div>
    <DropZone id="pool" items={items} onEdit={onEditItem} className="pool-items" empty={empty}/>
  </section>;
}
