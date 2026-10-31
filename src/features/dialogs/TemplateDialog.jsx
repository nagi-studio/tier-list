import Modal from '@/components/Modal';
import {TEMPLATES, DRINKS} from '@/lib/constants';
import {flagships} from '@/lib/catalog';
import {fromCatalog, uid} from '@/lib/board';
import {dispatch} from '@/store/editor';

const contestantsFor = key => key === 'ai' ? flagships.map(fromCatalog) : key === 'drink' ? DRINKS.map(([name, emoji]) => ({id: uid(), name, emoji})) : [];

export default function TemplateDialog({onClose}) {
  return <Modal title="换个题材" onClose={onClose}>
    <p className="modal-description">会清空当前选手，等级设置保留。可以撤销。</p>
    <div className="template-grid">
      {TEMPLATES.map(t => <button type="button" className="template-choice" key={t.key} onClick={() => { dispatch({type: 'replaceContestants', title: t.title, pool: contestantsFor(t.key)}); onClose(); }}>
        <span className="template-emoji">{t.preview}</span>
        <span><strong>{t.name}</strong><small>{t.desc}</small></span>
      </button>)}
    </div>
  </Modal>;
}
