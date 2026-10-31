import {Plus} from 'lucide-react';
import {openSpace} from '@/lib/toySdk';

/**
 * The Toy SDK can't follow on the user's behalf, so this opens the author's space where they can follow.
 * Hence "去关注" rather than "关注".
 */
export default function FollowButton({uid}: {uid: string}) {
  return <a className="follow-btn" href={`https://space.bilibili.com/${uid}`} target="_blank" rel="noreferrer"
    onClick={e => { if (openSpace(uid)) e.preventDefault(); }}><Plus size={13}/>去关注</a>;
}
