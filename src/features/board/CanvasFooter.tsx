import BrandMark from '@/components/BrandMark';
import QrCode from '@/components/QrCode';
import type {Credit} from '@/lib/board';
import {toyLink} from '@/lib/share';
import {cx} from '@/lib/utils';

/**
 * Bottom of the exported image: who made the template, the app name, and (in exports only) a QR code that
 * opens the same template — so every shared image leads back to the Toy and credits the template author.
 */
export default function CanvasFooter({credit, showQr}: {credit?: Credit; showQr: boolean}) {
  return <div className={cx('canvas-foot', showQr && 'with-qr')}>
    {credit?.author && <span className="canvas-credit">模板 by @{credit.author}</span>}
    <span className="canvas-brand">
      <span className="canvas-brand-text"><BrandMark withName/><small>B 站 Toy</small></span>
      {showQr && <span className="export-only"><QrCode value={toyLink(credit)} size={96}/></span>}
    </span>
  </div>;
}
