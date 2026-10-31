import {DropdownMenu} from 'radix-ui';
import {Check, ChevronDown} from 'lucide-react';
import {colorAt, TIER_PRESETS} from '@/lib/board';
import {PRESET_OPTIONS} from '@/lib/constants';
import {dispatch} from '@/store/editor';

/** Tier preset picker: a button showing the current preset, a menu with a colour preview of each. */
export default function PresetMenu({preset}: {preset: string}) {
  const current = PRESET_OPTIONS.find(option => option.key === preset);
  return <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>
      <button type="button" className="btn subtle preset-trigger" aria-label="等级预设">
        <span className="preset-caption">等级</span>{current?.label ?? '自定义'}<ChevronDown size={15}/>
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="menu preset-menu" align="start" sideOffset={6}>
        <DropdownMenu.Label className="menu-label">换一套等级（选手会保留）</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={preset} onValueChange={value => {
          const option = PRESET_OPTIONS.find(o => o.key === value);
          if (option) dispatch({type: 'applyPreset', preset: option.key});
        }}>
          {PRESET_OPTIONS.map(option => <DropdownMenu.RadioItem key={option.key} value={option.key} className="menu-item preset-item" aria-label={option.name}>
            <span className="preset-swatches" aria-hidden="true">
              {TIER_PRESETS[option.key].map((label, i) => <i key={label} style={{background: colorAt(i)}}>{label}</i>)}
            </span>
            <DropdownMenu.ItemIndicator className="menu-chevron"><Check size={15}/></DropdownMenu.ItemIndicator>
          </DropdownMenu.RadioItem>)}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
