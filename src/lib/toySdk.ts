// Bilibili Toy SDK is loaded asynchronously; browsers outside Bilibili may never expose it.
import {z} from 'zod';

type Ability = 'checkInputSafety' | 'share' | 'getQrCode';
export interface ToySdk {
  isSupport(ability: Ability): Promise<boolean>;
  checkInputSafety(input: {text: string; scene: string}): Promise<unknown>;
  share(input: {path: string}): Promise<unknown>;
  getQrCode(input: {path: string; size: number}): Promise<unknown>;
  navigate(input: {type: 'space'; id: string}): Promise<unknown>;
}
declare global { interface Window { toy?: ToySdk } }
const sdk = () => window.toy;
const safetySchema = z.object({passed: z.boolean(), status: z.string()});
const qrSchema = z.object({base64: z.string()});

export async function supports(ability: Ability): Promise<boolean> {
  try { return !!await sdk()?.isSupport(ability); } catch { return false; }
}
export async function checkText(text: string, scene: string): Promise<{ok: true} | {ok: false; message: string}> {
  if (!await supports('checkInputSafety')) return {ok: true};
  try {
    const toy = sdk();
    if (!toy) throw Error('Toy SDK unavailable');
    const {passed, status} = safetySchema.parse(await toy.checkInputSafety({text, scene}));
    if (passed) return {ok: true};
    return {ok: false, message: status === 'rejected' ? '标题或选手名里有不能公开的内容，改一下再分享' : '暂时没法检查内容，稍后再试'};
  } catch { return {ok: false, message: '需要登录 B 站才能分享'}; }
}
export async function shareInApp(path: string) {
  const toy = sdk();
  if (!toy) throw Error('Toy SDK unavailable');
  return toy.share({path});
}
export async function qrCode(path: string) {
  const toy = sdk();
  if (!toy) throw Error('Toy SDK unavailable');
  return qrSchema.parse(await toy.getQrCode({path, size: 360}));
}
export function openSpace(uid: string) {
  const toy = sdk();
  if (!toy?.navigate) return false;
  toy.navigate({type: 'space', id: uid}).catch(() => window.open(`https://space.bilibili.com/${uid}`, '_blank', 'noopener'));
  return true;
}
