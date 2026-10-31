import {Sun, Moon} from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import {cx} from '@/lib/utils';
import {dispatch} from '@/store/editor';

export default function Header({theme, saveError}) {
  return <header className="site-header">
    <BrandMark withName className="wordmark"/>
    <div className="header-right">
      <span className={cx('save-state', saveError && 'warn')}><span className="dot"/>{saveError ? '本地空间已满，请导出 JSON' : '已自动保存'}</span>
      <button type="button" className="icon-btn" title="切换明暗主题" aria-label="切换明暗主题" onClick={() => dispatch({type: 'toggleTheme'})}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
    </div>
  </header>;
}
