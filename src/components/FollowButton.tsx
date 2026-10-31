import {Check, Plus} from 'lucide-react';
import {TOY_AUTHOR} from '@/lib/constants';
import {useFollowsToyAuthor} from '@/lib/following';
import {openSpace} from '@/lib/toySdk';

/**
 * The Toy SDK can't follow on the user's behalf, so this opens the author's space where they can follow —
 * hence "去关注". For the Toy's own author the SDK reports the follow state, so it can show "已关注".
 */
export default function FollowButton({uid}: {uid: string}) {
  const followsToyAuthor = useFollowsToyAuthor();
  if (uid === TOY_AUTHOR.bilibili && followsToyAuthor) return <span className="follow-btn followed"><Check size={13}/>已关注</span>;
  return <a className="follow-btn" href={`https://space.bilibili.com/${uid}`} target="_blank" rel="noreferrer"
    onClick={e => { if (openSpace(uid)) e.preventDefault(); }}><Plus size={13}/>去关注</a>;
}
