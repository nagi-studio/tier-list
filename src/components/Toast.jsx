import {useToastMessage} from '@/lib/toast';

export default function Toast() {
  const message = useToastMessage();
  return message ? <div className="toast" role="status">{message}</div> : null;
}
