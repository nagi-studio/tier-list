// Thin wrapper over the Bilibili Toy JS SDK (window.toy, loaded async from index.html).
// Outside Bilibili (local dev, plain browsers) every capability reports unsupported.
const sdk = () => globalThis.toy;

export async function supports(ability) {
  try { return !!sdk() && await sdk().isSupport(ability); } catch { return false; }
}

/**
 * Check text other players will see. Returns {ok, message}. When the SDK isn't available at all
 * (local dev) the check is skipped; when it is but the check can't run, sharing is blocked.
 */
export async function checkText(text, scene) {
  if (!await supports('checkInputSafety')) return {ok: true};
  try {
    const {passed, status} = await sdk().checkInputSafety({text, scene});
    if (passed) return {ok: true};
    return {ok: false, message: status === 'rejected' ? '标题或选手名里有不能公开的内容，改一下再分享' : '暂时没法检查内容，稍后再试'};
  } catch {
    return {ok: false, message: '需要登录 B 站才能分享'};
  }
}

export const shareInApp = path => sdk().share({path});
export const qrCode = path => sdk().getQrCode({path, size: 360});

/** Open a Bilibili user's space. Must run inside a click handler (navigate needs a user gesture). Returns false if the SDK can't. */
export function openSpace(uid) {
  if (typeof sdk()?.navigate !== 'function') return false;
  sdk().navigate({type: 'space', id: uid}).catch(() => window.open(`https://space.bilibili.com/${uid}`, '_blank', 'noopener'));
  return true;
}
