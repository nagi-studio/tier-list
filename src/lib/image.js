const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const IMAGE_ACCEPT = TYPES.join(',');
const MAX_BYTES = 8 * 1024 * 1024, MAX_SIDE = 256;

/** Downscale an uploaded image to a small PNG data URL so it fits in localStorage. Throws a user-facing message. */
export async function imageToDataUrl(file) {
  if (!TYPES.includes(file.type) || file.size > MAX_BYTES) throw Error('请选择 8MB 以内的 PNG、JPEG、WebP 或 GIF 图片');
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw Error('无法读取这张图片，换一张试试'); }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/png');
}
