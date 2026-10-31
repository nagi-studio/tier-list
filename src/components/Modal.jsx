import {useRef} from 'react';
import {X} from 'lucide-react';
import {Dialog, DialogContent, DialogTitle} from '@/components/ui/dialog';
import {cx} from '@/lib/utils';

// Focus the first text field if there is one; otherwise the dialog itself, so the close button doesn't
// show a focus ring the moment the dialog opens.
const focusOnOpen = ref => e => {
  if (ref.current?.querySelector('input:not([type=file]):not([readonly]):not([hidden])')) return;
  e.preventDefault();
  ref.current?.focus();
};

export default function Modal({title, onClose, className, children}) {
  const ref = useRef(null);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent ref={ref} className={cx('modal', className)} showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={focusOnOpen(ref)}>
      <div className="modal-heading">
        <DialogTitle>{title}</DialogTitle>
        <button type="button" className="icon-btn" aria-label="关闭" onClick={onClose}><X size={18}/></button>
      </div>
      {children}
    </DialogContent>
  </Dialog>;
}
