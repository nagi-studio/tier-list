import {APP_NAME} from '@/lib/constants';

/** Three descending bars — the app's logo. */
export default function BrandMark({withName = false, className}: {withName?: boolean; className?: string}) {
  return <span className={className}><span className="mark" aria-hidden="true"><i/><i/><i/></span>{withName && <span className="brand-name">{APP_NAME}</span>}</span>;
}
