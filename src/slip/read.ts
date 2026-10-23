import type { Worker } from 'tesseract.js';
import type { IncomingSlip } from '../db/slips';
import { decode, inkOnly, pixels, scaled, toJpeg, yieldToUi } from './image';
import { parseSlip } from './parse';
import { parseSlipQr } from './qr';

/**
 * Slip reading pipeline: decode → resize → QR → OCR (tha+eng) → parse.
 * Tesseract runs in its own Web Worker; this module and the libraries are
 * loaded on demand so they don't weigh down app start-up.
 */

const STORE_SIDE = 1280; // kept in IndexedDB
const THUMB_SIDE = 240;
const OCR_SIDE = 2000; // phone screenshots are ~2500px tall; this keeps Thai text legible
const QR_SIDE = 1000;

let worker: Promise<Worker> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

/** Starts tesseract once; the language data is cached by tesseract in IndexedDB after the first download. */
export function getWorker(onStatus?: (status: string, progress: number) => void): Promise<Worker> {
  clearTimeout(idleTimer);
  if (!worker) {
    worker = import('tesseract.js').then(({ createWorker }) =>
      createWorker(['tha', 'eng'], 1, {
        logger: (m) => onStatus?.(m.status, m.progress),
      }),
    );
    worker.catch(() => (worker = null));
  }
  return worker;
}

/** Free the OCR worker's memory after a minute without slips. */
function scheduleIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const w = worker;
    worker = null;
    (await w)?.terminate();
  }, 60_000);
}

async function readQr(canvas: HTMLCanvasElement): Promise<string | undefined> {
  const { default: jsQR } = await import('jsqr');
  const img = pixels(canvas);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data;
}

export async function readSlip(file: Blob, onStatus?: (status: string, progress: number) => void): Promise<IncomingSlip> {
  const img = await decode(file);
  try {
    const image = await toJpeg(scaled(img, STORE_SIDE), 0.8);
    const thumb = await toJpeg(scaled(img, THUMB_SIDE), 0.7);
    await yieldToUi();

    const qrPayload = await readQr(scaled(img, QR_SIDE)).catch(() => undefined);
    const qr = qrPayload ? parseSlipQr(qrPayload) : undefined;
    await yieldToUi();

    const w = await getWorker(onStatus);

    // pass 1: text-only image (artwork removed)
    const first = await w.recognize(inkOnly(scaled(img, OCR_SIDE)));
    let { parsed, confidence } = parseSlip(first.data.text, qr);
    let ocrText = first.data.text;
    let ocrConfidence = first.data.confidence;

    // pass 2: plain image, only to fill what pass 1 missed (e.g. light text on a dark header)
    const missing = (['amount', 'occurredAt', 'receiver', 'sender', 'ref'] as const).filter((k) => parsed[k] === undefined);
    if (missing.length) {
      const second = await w.recognize(scaled(img, OCR_SIDE));
      const extra = parseSlip(second.data.text, qr);
      for (const k of missing) {
        if (extra.parsed[k] === undefined) continue;
        parsed = { ...parsed, [k]: extra.parsed[k] };
        confidence = { ...confidence, [k]: extra.confidence[k] };
      }
      ocrText += '\n---\n' + second.data.text;
      ocrConfidence = Math.max(ocrConfidence, second.data.confidence);
    }
    scheduleIdle();

    // a blurry photo: trust nothing fully
    if (ocrConfidence < 55) for (const k of Object.keys(confidence) as (keyof typeof confidence)[]) confidence[k] = Math.min(confidence[k]!, 0.6);

    return { image, thumb, parsed, confidence, qrPayload, ocrText };
  } finally {
    img.close();
  }
}
