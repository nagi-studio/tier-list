import type {Board} from '@/lib/board';
import {Sun, Moon, LayoutGrid} from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import FollowButton from '@/components/FollowButton';
import Avatar from '@/components/Avatar';
import {TOY_AUTHOR} from '@/lib/constants';
import {cx} from '@/lib/utils';
import {dispatch} from '@/store/editor';

export default function Header({theme, saveError, onOpenTemplates}: Pick<Board, 'theme'> & {saveError: boolean; onOpenTemplates: () => void}) {
  return <header className="site-header">
    <BrandMark withName className="wordmark"/>
    <div className="header-right">
      <span className={cx('save-state', saveError && 'warn')}><span className="dot"/>{saveError ? '本地空间已满，请导出 JSON' : '已自动保存'}</span>
      <button type="button" className="btn subtle header-templates" aria-label="模板中心" onClick={onOpenTemplates}><LayoutGrid size={16}/><span className="btn-label">模板中心</span></button>
      <span className="toy-author" title={`作者 ${TOY_AUTHOR.name}`}>
        <Avatar uid={TOY_AUTHOR.bilibili}/><span className="toy-author-name">{TOY_AUTHOR.name}</span>
        <FollowButton uid={TOY_AUTHOR.bilibili}/>
      </span>
      <button type="button" className="icon-btn" title="切换明暗主题" aria-label="切换明暗主题" onClick={() => dispatch({type: 'toggleTheme'})}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
    </div>
  </header>;
}
