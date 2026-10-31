import {Button} from '@/components/ui/button';
import Modal from '@/components/Modal';

export default function ConfirmDialog({title, description, confirmLabel, onConfirm, onClose}) {
  return <Modal title={title} onClose={onClose}>
    <p className="modal-description">{description}</p>
    <div className="modal-actions">
      <span className="spacer"/>
      <Button className="btn subtle" onClick={onClose}>取消</Button>
      <Button className="btn primary" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
    </div>
  </Modal>;
}
