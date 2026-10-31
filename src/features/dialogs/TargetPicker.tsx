import type {CSSProperties} from 'react';
import type {Row} from '@/lib/board';
import {POOL} from '@/lib/ids';
import type {ContainerId} from '@/lib/ids';
import {RadioGroup} from 'radix-ui';

const tierStyle = (color: string): CSSProperties & {'--tier': string} => ({'--tier': color});

/** Pick which tier (or the pool) a contestant goes into. */
export default function TargetPicker({rows, value, onChange}: {rows: Row[]; value: ContainerId; onChange: (value: ContainerId) => void}) {
  const choices: ContainerId[] = [POOL, ...rows.map(row => row.id)];
  return <RadioGroup.Root className="target-picker" aria-label="放到哪里" value={value} onValueChange={v => { const choice = choices.find(choice => choice === v); if (choice) onChange(choice); }}>
    {rows.map(r => <RadioGroup.Item key={r.id} value={r.id} className="target" style={tierStyle(r.color)} aria-label={r.label}>{r.label}</RadioGroup.Item>)}
    <RadioGroup.Item value={POOL} className="target pool-target" aria-label="待定区">待定区</RadioGroup.Item>
  </RadioGroup.Root>;
}
