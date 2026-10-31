import {useState} from 'react';
import {Check, ChevronsUpDown} from 'lucide-react';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import BrandAvatar from '@/components/BrandAvatar';
import {models, providerCounts, providerIcons, providers} from '@/lib/catalog';

/** Searchable provider picker (cmdk combobox). Closes as soon as a provider is picked. */
export default function ProviderFilter({value, onChange}: {value: string; onChange: (provider: string) => void}) {
  const [open, setOpen] = useState(false);
  const pick = (provider: string) => { onChange(provider); setOpen(false); };
  const option = (provider: string, label: string, count: number) => <CommandItem key={provider || 'all'} value={label} onSelect={() => pick(provider)} className="provider-option">
    {provider && providerIcons.get(provider) ? <BrandAvatar icon={providerIcons.get(provider) ?? ''} size={20}/> : <span className="provider-dot"/>}
    <span className="provider-name">{label}</span>
    <span className="provider-count">{count}</span>
    <Check size={15} className="provider-check" style={{opacity: value === provider ? 1 : 0}}/>
  </CommandItem>;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className="btn subtle provider-trigger" aria-label="筛选厂商" aria-expanded={open}>
        {value && providerIcons.get(value) && <BrandAvatar icon={providerIcons.get(value) ?? ''} size={18}/>}
        <span className="provider-name">{value || '全部厂商'}</span>
        <span className="provider-count">{value ? providerCounts.get(value) : models.length}</span>
        <ChevronsUpDown size={15}/>
      </button>
    </PopoverTrigger>
    <PopoverContent className="provider-popover" align="start">
      <Command>
        <CommandInput placeholder={`搜索 ${providers.length} 个厂商…`}/>
        <CommandList>
          <CommandEmpty>没有这个厂商</CommandEmpty>
          <CommandGroup>
            {option('', '全部厂商', models.length)}
            {providers.map(p => option(p, p, providerCounts.get(p) ?? 0))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
