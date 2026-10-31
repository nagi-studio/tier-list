import {X} from 'lucide-react';
import {Dialog, DialogContent, DialogTitle} from '@/components/ui/dialog';
import {cx} from '@/lib/utils';

export default function Modal({title, onClose, className, children}) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={cx('modal', className)} showCloseButton={false} aria-describedby={undefined}>
      <div className="modal-heading">
        <DialogTitle>{title}</DialogTitle>
        <button type="button" className="icon-btn" aria-label="关闭" onClick={onClose}><X size={18}/></button>
      </div>
      {children}
    </DialogContent>
  </Dialog>;
}
