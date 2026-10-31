import type {Item} from '@/lib/board';
import {useRef, useState} from 'react';
import {Tabs} from 'radix-ui';
import {ImagePlus} from 'lucide-react';
import BrandAvatar, {brandKeys as allBrandKeys} from '@/components/BrandAvatar';
import {brandNames} from '@/lib/catalog';
import {QUICK_EMOJIS} from '@/lib/constants';
import {IMAGE_ACCEPT, imageToDataUrl} from '@/lib/image';
import {cx} from '@/lib/utils';

const brandKeys = allBrandKeys.filter(k => brandNames[k]);
const initialTab = (item: Item) => item.image ? 'image' : item.icon ? 'brand' : 'text';

/** Choose a contestant's icon: emoji/text, an uploaded image, or a brand logo. Calls onChange with icon fields. */
export default function IconPicker({item, onChange, onBusyChange}: {item: Item; onChange: (fields: Partial<Pick<Item, 'emoji' | 'icon' | 'image'>>) => void; onBusyChange?: (busy: boolean) => void}) {
  const [tab, setTab] = useState(() => initialTab(item));
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setIcon = (fields: Partial<Pick<Item, 'emoji' | 'icon' | 'image'>>) => onChange({emoji: undefined, icon: undefined, image: undefined, ...fields});
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); onBusyChange?.(true);
    try { setIcon({image: await imageToDataUrl(file), emoji: item.emoji}); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  const textOnly = !item.icon && !item.image;
  return <>
    <Tabs.Root value={tab} onValueChange={setTab}>
      <Tabs.List className="segmented full" aria-label="图标类型">
        <Tabs.Trigger value="text">文字 / Emoji</Tabs.Trigger>
        <Tabs.Trigger value="image">上传图片</Tabs.Trigger>
        <Tabs.Trigger value="brand">品牌 Logo</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="text" className="icon-panel">
        <div className="emoji-row">
          <input className="emoji-input" aria-label="Emoji 或首字" maxLength={8} placeholder="字" value={item.emoji || ''} onChange={e => setIcon({emoji: e.target.value})}/>
          {QUICK_EMOJIS.map(e => <button type="button" key={e} className={cx('emoji', textOnly && item.emoji === e && 'on')} onClick={() => setIcon({emoji: e})}>{e}</button>)}
        </div>
        <p className="field-hint">留空就用名称首字。</p>
      </Tabs.Content>
      <Tabs.Content value="image" className="icon-panel">
        <button type="button" className={cx('dropzone', over && 'over')} disabled={busy} onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}>
          {item.image ? <img src={item.image} alt=""/> : <ImagePlus size={22}/>}
          <span>{busy ? '读取中…' : item.image ? '换一张图片' : '选择图片'}<small>点击或拖入，PNG / JPG / WebP / GIF</small></span>
        </button>
        {item.image && <button type="button" className="link-btn danger" onClick={() => setIcon({emoji: item.emoji})}>移除图片</button>}
        <input type="file" hidden ref={fileRef} accept={IMAGE_ACCEPT} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }}/>
      </Tabs.Content>
      <Tabs.Content value="brand" className="icon-panel">
        <div className="brand-grid">
          {brandKeys.map(k => <button type="button" key={k} title={brandNames[k]} aria-label={brandNames[k]} className={cx('brand-choice', item.icon === k && !item.image && 'on')} onClick={() => setIcon({icon: k, emoji: item.emoji})}><BrandAvatar icon={k} size={32}/></button>)}
        </div>
      </Tabs.Content>
    </Tabs.Root>
    {error && <p className="error-text" role="alert">{error}</p>}
  </>;
}
