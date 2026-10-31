import type {Preset} from './board';
export const APP_NAME = '万物皆可排';
/** Public address of the published Toy (slug is permanent once published). */
export const TOY_URL = 'https://www.bilibili.com/toy/tier-list/';
export const REPO_URL = 'https://github.com/Nagi-Studio/tier-list';
export const PRESET_OPTIONS = [
  {key: 'classic', label: 'S – D', name: 'S 到 D'},
  {key: 'cn', label: '夯 → 拉', name: '从夯到拉'},
  {key: 'numeric', label: 'T0 – T4', name: 'T0 到 T4'},
] satisfies {key: Preset; label: string; name: string}[];
export const QUICK_EMOJIS = ['🔥', '👑', '🐐', '💀', '🤡', '💩', '⭐', '🚀', '🎮', '🍜', '🐱'];
