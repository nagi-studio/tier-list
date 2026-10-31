import {Plus, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import DropZone from './DropZone';
import Trash from './Trash';

export default function Pool({items, rankedCount, touch, onEditItem, onAddItem}) {
  const empty = <div className="pool-empty"><Sparkles size={18}/>{rankedCount ? '全部排完了！导出图片发个动态吧' : '待定区是空的，从选手库里挑几个'}</div>;
  return <section className="pool">
    <div className="pool-heading">
      <h2>待定区 <span className="count">{items.length}</span></h2>
      <p className="hint">{touch ? '长按卡片拖动，点一下可直接选等级' : '拖卡片排位，点击编辑，右键更多操作'}</p>
      <Trash/>
      <Button className="btn subtle" onClick={onAddItem}><Plus size={15}/>自定义选手</Button>
    </div>
    <DropZone id="pool" items={items} onEdit={onEditItem} className="pool-items" empty={empty}/>
  </section>;
}
