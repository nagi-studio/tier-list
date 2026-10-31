import type {CSSProperties} from 'react';
import type {Row} from '@/lib/board';
import {RadioGroup} from 'radix-ui';

const tierStyle = (color: string): CSSProperties & {'--tier': string} => ({'--tier': color});

/** Pick which tier (or the pool) a contestant goes into. */
export default function TargetPicker({rows, value, onChange}: {rows: Row[]; value: string; onChange: (value: string) => void}) {
  return <RadioGroup.Root className="target-picker" aria-label="放到哪里" value={value} onValueChange={v => v && onChange(v)}>
    {rows.map(r => <RadioGroup.Item key={r.id} value={r.id} className="target" style={tierStyle(r.color)} aria-label={r.label}>{r.label}</RadioGroup.Item>)}
    <RadioGroup.Item value="pool" className="target pool-target" aria-label="待定区">待定区</RadioGroup.Item>
  </RadioGroup.Root>;
}
