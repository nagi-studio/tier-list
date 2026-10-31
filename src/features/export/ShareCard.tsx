import type {Ref} from 'react';
import type {Board} from '@/lib/board';
import Avatar from '@/components/Avatar';
import Logo from '@/components/Logo';
import QrCode from '@/components/QrCode';
import {toyLink} from '@/lib/share';
import {cx} from '@/lib/utils';

/**
 * The exported image: a static, fixed-width picture of the board (540 CSS px → 1080 px at 2×), independent
 * of the editor's screen width. The QR code (with the app mark in it) sits beside the title, so the image
 * ends right after the last tier — no footer. It opens the same community template (or the Toy) — see toyLink.
 */
/** `signed`: show the template author (only for content that passed the content check — see App.handleExport). */
export default function ShareCard({ref, board, signed, showQr}: {ref?: Ref<HTMLDivElement>; board: Board; signed: boolean; showQr: boolean}) {
  return <div ref={ref} className="share-card">
    <div className="sc-head">
      <div className="sc-title">
        <h1>{board.title}</h1>
        {signed && board.credit?.author && <span className="sc-credit">{board.credit.bilibili && <Avatar uid={board.credit.bilibili} size={22}/>}模板 by @{board.credit.author}</span>}
      </div>
      {showQr && <span className="sc-qr"><QrCode value={toyLink(board.credit)} size={96}/><small>同款模板</small></span>}
    </div>
    <div className="sc-rows">
      {board.rows.map(row => <div className="sc-row" key={row.id}>
        <span className={cx('sc-label', row.label.length >= 3 && 'long')} style={{background: row.color}}>{row.label}</span>
        <span className="sc-items">{row.items.map(item => <span className="sc-tile" key={item.id}><Logo item={item} size={26}/><span>{item.name}</span></span>)}</span>
      </div>)}
    </div>
  </div>;
}
