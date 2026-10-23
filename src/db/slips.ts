import { suggestCategory } from '../lib/categorize';
import { newId } from '../lib/id';
import { isOwnerName, payeeKey } from '../lib/names';
import { db } from './db';
import { saveTransaction } from './repo';
import { getOwnerNames } from './settings';
import { CONFIDENCE_MIN, type Slip, type SlipFields, type TxType } from './types';

export interface IncomingSlip {
  image: Blob;
  thumb: Blob;
  parsed: SlipFields;
  confidence?: Slip['confidence'];
  qrPayload?: string;
  ocrText?: string;
}

/** Same bank + reference = same transfer. The QR payload is the strongest key when present. */
export function dedupeKeyOf(parsed: SlipFields, qrPayload?: string): string | undefined {
  if (qrPayload) return `qr:${qrPayload}`;
  if (parsed.ref) return `${parsed.bank ?? 'other'}:${parsed.ref}`;
  return undefined;
}

/** The person on the other side of the transfer, from the owner's point of view. */
export const counterpartyOf = (slip: Pick<Slip, 'parsed' | 'suggestedType'>) =>
  slip.suggestedType === 'income' ? slip.parsed.sender : slip.parsed.receiver;

async function decide(parsed: SlipFields): Promise<{ type: TxType; categoryId: string }> {
  const owners = await getOwnerNames();
  const type: TxType = parsed.receiver && isOwnerName(parsed.receiver, owners) ? 'income' : 'expense';
  const [categories, rules, memory] = await Promise.all([db.categories.toArray(), db.rules.toArray(), db.payeeMemory.toArray()]);
  const who = type === 'income' ? parsed.sender : parsed.receiver;
  return { type, categoryId: suggestCategory(who, type, { categories, rules, memory }).categoryId };
}

/** Find an earlier slip or transaction for the same transfer. */
async function findDuplicate(key: string | undefined, ref: string | undefined, selfId?: string): Promise<string | undefined> {
  if (key) {
    const slip = await db.slips.where('dedupeKey').equals(key).filter((s) => s.id !== selfId).first();
    if (slip) return slip.id;
  }
  if (ref) {
    const tx = await db.transactions.where('ref').equals(ref).first();
    if (tx) return tx.id;
  }
  return undefined;
}

/** Put a read slip into the "รอจด" queue with a guessed type and category. */
export async function ingestSlip(input: IncomingSlip): Promise<Slip> {
  const { type, categoryId } = await decide(input.parsed);
  const dedupeKey = dedupeKeyOf(input.parsed, input.qrPayload);
  const id = newId();
  const slip: Slip = {
    id,
    status: 'pending',
    image: input.image,
    thumb: input.thumb,
    qrPayload: input.qrPayload,
    ocrText: input.ocrText,
    parsed: input.parsed,
    confidence: input.confidence ?? {},
    suggestedType: type,
    suggestedCategoryId: categoryId,
    dedupeKey,
    duplicateOf: await findDuplicate(dedupeKey, input.parsed.ref, id),
    createdAt: Date.now(),
  };
  await db.slips.add(slip);
  return slip;
}

/** Fields the user still has to check: low OCR confidence or missing required values. */
export function fieldsToCheck(slip: Slip): (keyof SlipFields)[] {
  const out = new Set<keyof SlipFields>();
  for (const [k, v] of Object.entries(slip.confidence) as [keyof SlipFields, number][]) if (v < CONFIDENCE_MIN) out.add(k);
  if (!slip.parsed.amount) out.add('amount');
  if (!slip.parsed.occurredAt) out.add('occurredAt');
  if (!counterpartyOf(slip)) out.add(slip.suggestedType === 'income' ? 'sender' : 'receiver');
  return [...out];
}

export const canConfirm = (slip: Slip) => !!slip.parsed.amount && !!slip.parsed.occurredAt;

/** User corrected fields: the corrected values are now certain; re-guess the category if who/type changed. */
export async function updateSlip(id: string, parsed: SlipFields, type: TxType): Promise<void> {
  const slip = await db.slips.get(id);
  if (!slip) return;
  const confidence = { ...slip.confidence };
  for (const k of Object.keys(parsed) as (keyof SlipFields)[]) if (parsed[k] !== slip.parsed[k]) confidence[k] = 1;
  const whoChanged = type !== slip.suggestedType || parsed.receiver !== slip.parsed.receiver || parsed.sender !== slip.parsed.sender;
  let suggestedCategoryId = slip.suggestedCategoryId;
  // a category the user picked by hand stays; only a guess is re-guessed
  if (whoChanged && !slip.categoryPicked) {
    const [categories, rules, memory] = await Promise.all([db.categories.toArray(), db.rules.toArray(), db.payeeMemory.toArray()]);
    suggestedCategoryId = suggestCategory(type === 'income' ? parsed.sender : parsed.receiver, type, { categories, rules, memory }).categoryId;
  }
  await db.slips.update(id, { parsed, confidence, suggestedType: type, suggestedCategoryId });
}

/** Choose a category for a slip without recording it yet. */
export const pickCategory = (id: string, categoryId: string) => db.slips.update(id, { suggestedCategoryId: categoryId, categoryPicked: true });

/** Remember which category the user chose for this payee, so next time it's picked automatically. */
async function learn(counterparty: string | undefined, categoryId: string) {
  if (!counterparty) return;
  const key = payeeKey(counterparty);
  if (!key) return;
  const prev = await db.payeeMemory.get(key);
  await db.payeeMemory.put({ key, categoryId, count: prev && prev.categoryId === categoryId ? prev.count + 1 : 1, updatedAt: Date.now() });
}

/** Turn a slip into a transaction in the chosen category. */
export async function confirmSlip(id: string, categoryId: string): Promise<boolean> {
  const slip = await db.slips.get(id);
  if (!slip || !canConfirm(slip)) return false;
  const who = counterpartyOf(slip);
  await db.transaction('rw', [db.slips, db.transactions, db.payeeMemory], async () => {
    const tx = await saveTransaction({
      type: slip.suggestedType,
      amount: slip.parsed.amount!,
      fee: slip.parsed.fee ?? 0,
      categoryId,
      occurredAt: slip.parsed.occurredAt!,
      counterparty: who,
      method: 'transfer',
      source: 'slip',
      bank: slip.parsed.bank,
      ref: slip.parsed.ref,
      slipId: slip.id,
    });
    await learn(who, categoryId);
    await db.slips.update(id, { status: 'confirmed', confirmedTxId: tx.id });
  });
  return true;
}

/** Confirm every slip that can be, each with its guessed category. Returns how many were confirmed. */
export async function confirmAll(): Promise<number> {
  const pending = await db.slips.where('status').equals('pending').toArray();
  let n = 0;
  for (const s of pending) if (s.suggestedCategoryId && (await confirmSlip(s.id, s.suggestedCategoryId))) n++;
  return n;
}

export const discardSlip = (id: string) => db.slips.delete(id);
export const restoreSlip = (slip: Slip) => db.slips.put(slip);

export const forgetPayee = (key: string) => db.payeeMemory.delete(key);
