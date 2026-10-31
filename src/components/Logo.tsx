import type {Item} from '@/lib/board';
import BrandAvatar, {isBrand} from './BrandAvatar';

const HEX = /^#[\da-f]{6}$/i;

/** Contestant avatar: uploaded image → community template image → brand logo → emoji → first letter on the provider color. */
export default function Logo({item, size = 28}: {item: Pick<Item, 'name' | 'image' | 'asset' | 'icon' | 'emoji' | 'color'>; size?: number}) {
  const box = {width: size, height: size};
  if (item.image) return <span className="logo" style={box}><img draggable="false" src={item.image} alt=""/></span>;
  if (item.asset) return <span className="logo" style={box}><img draggable="false" src={`${import.meta.env.BASE_URL}${item.asset}`} alt=""/></span>;
  if (isBrand(item.icon)) return <span className="logo brand" style={box}><BrandAvatar icon={item.icon} size={size}/></span>;
  if (item.emoji) return <span className="logo" style={{...box, fontSize: size * .55}}>{item.emoji}</span>;
  const tint = HEX.test(item.color || '') ? {background: item.color, color: '#fff'} : {};
  return <span className="logo mono" style={{...box, fontSize: size * .5, ...tint}}>{item.name?.trim().slice(0, 1).toUpperCase() || '✦'}</span>;
}
