import {LayoutGrid, Plus, X} from 'lucide-react';
import {Button} from '@/components/ui/button';

/** Boards that didn't come from a template have no library of their own. */
export default function EmptyLibrary({onCreate, onOpenTemplates, onClose}: {onCreate: () => void; onOpenTemplates: () => void; onClose: (() => void) | null}) {
  return <>
    <div className="library-head">
      <div className="library-title">
        <h2>选手库</h2>
        {onClose && <button type="button" className="icon-btn" aria-label="关闭选手库" onClick={onClose}><X size={18}/></button>}
      </div>
    </div>
    <div className="library-blank">
      <p>这张榜单没有自带选手。<br/>自己加几个，或者换一个模板。</p>
      <Button className="btn primary" onClick={onCreate}><Plus size={16}/>自定义选手</Button>
      <Button className="btn subtle" onClick={onOpenTemplates}><LayoutGrid size={16}/>模板中心</Button>
    </div>
  </>;
}
