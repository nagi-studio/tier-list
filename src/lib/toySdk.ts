// Bilibili Toy SDK is loaded asynchronously; browsers outside Bilibili may never expose it.
import {z} from 'zod';

type Ability = 'checkInputSafety' | 'share' | 'getQrCode' | 'getAuthorRelation';
export interface ToySdk {
  isSupport(ability: Ability): Promise<unknown>;
  checkInputSafety(input: {text: string; scene: string}): Promise<unknown>;
  share(input: {path: string}): Promise<unknown>;
  getQrCode(input: {path: string; size: number}): Promise<unknown>;
  navigate(input: {type: 'space' | 'video'; id: string}): Promise<unknown>;
  getAuthorRelation(): Promise<unknown>;
}
declare global { interface Window { toy?: ToySdk } }
const sdk = () => window.toy;

const SDK_WAIT_MS = 5000;
/**
 * Resolves once the async SDK script has loaded, failed, or is absent. The script tag marks itself done
 * (index.html), because its load/error event may have fired before anyone listens; the timeout covers a hung
 * request so callers like export never wait forever.
 */
export function sdkReady(): Promise<ToySdk | undefined> {
  const script = document.getElementById('toy-sdk');
  if (window.toy || !(script instanceof HTMLScriptElement) || script.dataset.done) return Promise.resolve(window.toy);
  return new Promise(resolve => {
    const done = () => { clearTimeout(timer); resolve(window.toy); };
    const timer = setTimeout(done, SDK_WAIT_MS);
    script.addEventListener('load', done, {once: true});
    script.addEventListener('error', done, {once: true});
  });
}

const relationSchema = z.object({status: z.literal('ok'), data: z.object({isFollowing: z.boolean()})});
/** Whether the visitor follows this Toy's author. null when unknown (no SDK, not logged in, outside the app…). */
export async function followsToyAuthor(): Promise<boolean | null> {
  const toy = await sdkReady();
  if (!toy || !await supports('getAuthorRelation')) return null;
  try {
    const result = relationSchema.safeParse(await toy.getAuthorRelation());
    return result.success ? result.data.data.isFollowing : null;
  } catch { return null; }
}
const supportResponseSchema = z.boolean();
const safetySchema = z.object({passed: z.boolean(), status: z.string()});
const qrSchema = z.object({base64: z.string()});

export async function supports(ability: Ability): Promise<boolean> {
  try {
    const toy = sdk();
    return toy ? supportResponseSchema.parse(await toy.isSupport(ability)) : false;
  } catch { return false; }
}
export type Screening = 'passed' | 'rejected' | 'unavailable';
/**
 * Bilibili's content-safety check on text other people will see. 'unavailable' covers no SDK (outside
 * Bilibili, local dev), not logged in, and the platform reporting it couldn't run — never treat it as passed.
 */
export async function screenText(text: string, scene: string): Promise<Screening> {
  const toy = await sdkReady(); // the script loads async; don't judge before it has had a chance
  if (!toy || !await supports('checkInputSafety')) return 'unavailable';
  try {
    const {passed, status} = safetySchema.parse(await toy.checkInputSafety({text, scene}));
    return passed ? 'passed' : status === 'rejected' ? 'rejected' : 'unavailable';
  } catch { return 'unavailable'; }
}

/** Share links: blocked when rejected or when the check exists but can't run; allowed where there's no SDK. */
export async function checkText(text: string, scene: string): Promise<{ok: true} | {ok: false; message: string}> {
  if (!await supports('checkInputSafety')) return {ok: true};
  const verdict = await screenText(text, scene);
  if (verdict === 'passed') return {ok: true};
  return {ok: false, message: verdict === 'rejected' ? '标题或选手名里有不能公开的内容，改一下再分享' : '暂时没法检查内容，登录 B 站后再试'};
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

/** Open a video page. Same gesture rule as openSpace. */
export function openVideo(bvid: string) {
  const toy = sdk();
  if (!toy?.navigate) return false;
  toy.navigate({type: 'video', id: bvid}).catch(() => window.open(`https://www.bilibili.com/video/${bvid}`, '_blank', 'noopener'));
  return true;
}
