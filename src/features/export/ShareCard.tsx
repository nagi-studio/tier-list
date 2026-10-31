import type {Ref} from 'react';
import type {Board} from '@/lib/board';
import BrandMark from '@/components/BrandMark';
import Logo from '@/components/Logo';
import QrCode from '@/components/QrCode';
import {toyLink} from '@/lib/share';
import {cx} from '@/lib/utils';

/**
 * The exported image: a static, fixed-width picture of the board (540 CSS px → 1080 px at 2×), independent
 * of the editor's screen width. The QR code sits beside the title so the image ends right after the last
 * tier, with no empty footer. It opens the same community template (or the Toy) — see toyLink.
 */
export default function ShareCard({ref, board, showQr}: {ref?: Ref<HTMLDivElement>; board: Board; showQr: boolean}) {
  return <div ref={ref} className="share-card">
    <div className="sc-head">
      <div className="sc-title">
        <h1>{board.title}</h1>
        {board.credit?.author && <span className="sc-credit">模板 by @{board.credit.author}</span>}
      </div>
      {showQr && <span className="sc-qr"><QrCode value={toyLink(board.credit)} size={96}/><small>同款模板</small></span>}
    </div>
    <div className="sc-rows">
      {board.rows.map(row => <div className="sc-row" key={row.id}>
        <span className={cx('sc-label', row.label.length >= 3 && 'long')} style={{background: row.color}}>{row.label}</span>
        <span className="sc-items">{row.items.map(item => <span className="sc-tile" key={item.id}><Logo item={item} size={26}/><span>{item.name}</span></span>)}</span>
      </div>)}
    </div>
    <div className="sc-foot"><BrandMark withName/><small>B 站 Toy</small></div>
  </div>;
}
