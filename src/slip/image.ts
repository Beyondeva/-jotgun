/** Decode, resize and encode slip images in the browser. */

export interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

/** Decode a picked file, honouring EXIF orientation. */
export async function decode(file: Blob): Promise<Decoded> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* some formats only decode through <img>; fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draw onto a canvas whose longer side is at most `maxSide` px (never upscaled). */
export function scaled(img: Decoded, maxSide: number): HTMLCanvasElement {
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality));
}

export const pixels = (canvas: HTMLCanvasElement) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);

/**
 * Keep only dark, colourless pixels (slip text) and turn everything else white.
 * Slip apps print text in near-black grey over themed artwork; colourful art and
 * light backgrounds drop out, which helps OCR far more than a plain threshold.
 * Tuned on a K PLUS slip with a cartoon background: max luminance 110, max saturation 80.
 */
export function inkOnly(canvas: HTMLCanvasElement, maxLum = 110, maxSat = 80): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const v = lum < maxLum && sat < maxSat ? 0 : 255;
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Let the browser paint between heavy steps so the progress UI stays live. */
export const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));
