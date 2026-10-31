import {avatarPath} from '@/lib/avatar';

/** A Bilibili user's avatar shipped in the package; hides itself if this build couldn't fetch it. */
export default function Avatar({uid, size = 24}: {uid: string; size?: number}) {
  return <img className="avatar" src={`${import.meta.env.BASE_URL}${avatarPath(uid)}`} alt="" width={size} height={size}
    onError={e => { e.currentTarget.hidden = true; }}/>;
}
