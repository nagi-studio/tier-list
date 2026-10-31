import FollowButton from '@/components/FollowButton';
import type {Credit} from '@/lib/board';
import {community} from '@/lib/community';

/** "模板来自 @author [去关注]" for boards loaded from a community template. */
export default function CreditBar({credit}: {credit: Credit}) {
  if (!credit.author) return null;
  const avatar = community.find(t => t.id === credit.template)?.avatar;
  return <div className="credit-bar">
    {avatar && <img src={avatar} alt="" referrerPolicy="no-referrer"/>}
    <span>模板来自 <strong>@{credit.author}</strong></span>
    {credit.bilibili && <FollowButton uid={credit.bilibili}/>}
  </div>;
}
