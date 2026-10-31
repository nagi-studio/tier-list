// Toasts are sonner's; this keeps the app's call shape: toast('…') or toast('…', {action: {label, onClick}}).
import {toast as sonner} from 'sonner';

export function toast(text: string, {action}: {action?: {label: string; onClick: () => void}} = {}) {
  sonner(text, {duration: action ? 5000 : 3000, ...(action && {action})});
}
