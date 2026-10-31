import {dismissToast, useToast} from '@/lib/toast';

export default function Toast() {
  const toast = useToast();
  if (!toast) return null;
  return <div className="toast" role="status">
    {toast.text}
    {toast.action && <button type="button" className="toast-action" onClick={() => { toast.action?.onClick(); dismissToast(); }}>{toast.action.label}</button>}
  </div>;
}
