import {useState} from 'react';
import {Link2, QrCode, Share2, Check, Loader2} from 'lucide-react';
import {Tabs} from 'radix-ui';
import {Button} from '@/components/ui/button';
import Modal from '@/components/Modal';
import {createShareLink, shareText} from '@/lib/share';
import {checkText, supports, shareInApp, qrCode} from '@/lib/toySdk';
import {toast} from '@/lib/toast';
import {getEditorState} from '@/store/editor';

/** Share the board as a link: with the current ranking, or as a blank template for others to fill in. */
export default function ShareDialog({onClose}) {
  const [mode, setMode] = useState('ranking');
  const [state, setState] = useState({status: 'idle'}); // idle | working | ready | error
  const [qr, setQr] = useState(null), [copied, setCopied] = useState(false);
  const ranked = getEditorState().board.rows.some(r => r.items.length);

  async function prepare(nextMode = mode) {
    setState({status: 'working'}); setQr(null); setCopied(false);
    try {
      const link = await createShareLink(getEditorState().board, {withPlacement: nextMode === 'ranking'});
      const check = await checkText(shareText(link.template), 'share');
      if (!check.ok) { setState({status: 'error', message: check.message}); return; }
      const [canShare, canQr] = await Promise.all([supports('share'), supports('getQrCode')]);
      setState({status: 'ready', link, canShare, canQr});
    } catch (e) { console.error(e); setState({status: 'error', message: '生成链接失败，请重试'}); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(state.link.url); setCopied(true); toast('链接已复制'); }
    catch { toast('复制失败，请手动长按链接复制'); }
  }
  const {link} = state;
  return <Modal title="分享" onClose={onClose}>
    <Tabs.Root value={mode} onValueChange={m => { setMode(m); if (state.status !== 'idle') prepare(m); }}>
      <Tabs.List className="segmented full" aria-label="分享内容">
        <Tabs.Trigger value="ranking">我的排位</Tabs.Trigger>
        <Tabs.Trigger value="template">空白模板</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
    <p className="modal-description share-hint">{mode === 'ranking'
      ? (ranked ? '对方打开就能看到你排好的结果，也可以接着改。' : '你还没排任何选手，对方看到的会是空榜。')
      : '只分享等级和选手，对方从头开始排。适合发动态让大家各排各的。'}</p>
    {state.status === 'idle' && <Button className="btn primary wide" onClick={() => prepare()}><Link2 size={16}/>生成分享链接</Button>}
    {state.status === 'working' && <div className="share-status"><Loader2 size={18} className="spin"/>正在生成…</div>}
    {state.status === 'error' && <div className="share-status error-text">{state.message}<button type="button" className="link-btn" onClick={() => prepare()}>重试</button></div>}
    {state.status === 'ready' && <div className="share-ready">
      <input className="share-url" readOnly value={link.url} aria-label="分享链接" onFocus={e => e.target.select()}/>
      <div className="share-actions">
        <Button className="btn primary" onClick={copy}>{copied ? <Check size={16}/> : <Link2 size={16}/>}{copied ? '已复制' : '复制链接'}</Button>
        {state.canShare && <Button className="btn subtle" onClick={() => shareInApp(link.path).catch(() => toast('没能打开分享面板'))}><Share2 size={16}/>分享到 B 站</Button>}
        {state.canQr && !qr && <Button className="btn subtle" onClick={() => qrCode(link.path).then(r => setQr(r.base64), () => toast('二维码生成失败'))}><QrCode size={16}/>二维码</Button>}
      </div>
      {qr && <img className="share-qr" src={qr} alt="分享二维码"/>}
      {link.droppedImages > 0 && <p className="field-hint">有 {link.droppedImages} 个选手用的是你上传的图片，链接里放不下，对方会看到首字或 Emoji。</p>}
    </div>}
  </Modal>;
}
