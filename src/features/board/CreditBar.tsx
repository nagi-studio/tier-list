import Avatar from '@/components/Avatar';
import FollowButton from '@/components/FollowButton';
import type {Credit} from '@/lib/board';

/** "[头像] 模板来自 @author [去关注]" under the title, for boards that came from a template. */
export default function CreditBar({credit}: {credit: Credit}) {
  if (!credit.author) return null;
  return <div className="credit-bar">
    {credit.bilibili && <Avatar uid={credit.bilibili} size={22}/>}
    <span>模板来自 <strong>@{credit.author}</strong></span>
    {credit.bilibili && <FollowButton uid={credit.bilibili}/>}
  </div>;
}
