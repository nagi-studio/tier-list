import type {Preset} from './board';
export const APP_NAME = '万物皆可排';
/** Public address of the published Toy (slug is permanent once published). */
export const TOY_URL = 'https://www.bilibili.com/toy/tier-list/';
/** The Toy's author. Credited on the built-in AI template and followable from the header. */
export const TOY_AUTHOR = {
  name: '卡普迪姆', bilibili: '312249633',
  avatar: 'https://i0.hdslb.com/bfs/face/48c4387c396ad72a22f76dde8d007e22ffbf6369.jpg@96w_96h.webp',
};
/** Template id of the built-in AI flagship template; reserved, so no community template may use it. */
export const AI_TEMPLATE_ID = 'ai-models';
export const REPO_URL = 'https://github.com/Nagi-Studio/tier-list';
export const PRESET_OPTIONS = [
  {key: 'classic', label: 'S – D', name: 'S 到 D'},
  {key: 'cn', label: '夯 → 拉', name: '从夯到拉'},
  {key: 'numeric', label: 'T0 – T4', name: 'T0 到 T4'},
] satisfies {key: Preset; label: string; name: string}[];
export const QUICK_EMOJIS = ['🔥', '👑', '🐐', '💀', '🤡', '💩', '⭐', '🚀', '🎮', '🍜', '🐱'];
