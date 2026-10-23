import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Button } from '../../design/components/Button';
import { Segmented } from '../../design/components/Segmented';
import { Sheet } from '../../design/components/Sheet';
import { fieldsToCheck, updateSlip } from '../../db/slips';
import type { Slip, SlipFields, TxType } from '../../db/types';
import { amountToSatang, satangToAmountText } from '../../lib/amountInput';
import { fromLocalInput, toLocalInput } from '../../lib/date';
import { useObjectUrl } from '../../lib/useObjectUrl';

/** Correct what OCR read. Fields it wasn't sure about are highlighted. */
export function SlipEditSheet({ slip, onClose }: { slip: Slip | null; onClose: () => void }) {
  return (
    <Sheet open={!!slip} onClose={onClose} title="แก้ข้อมูลสลิป">
      {slip && <SlipForm key={slip.id} slip={slip} onDone={onClose} />}
    </Sheet>
  );
}

function SlipForm({ slip, onDone }: { slip: Slip; onDone: () => void }) {
  const image = useObjectUrl(slip.image);
  const check = new Set(fieldsToCheck(slip));
  const [type, setType] = useState<TxType>(slip.suggestedType);
  const [amount, setAmount] = useState(satangToAmountText(slip.parsed.amount ?? 0));
  const [fee, setFee] = useState(satangToAmountText(slip.parsed.fee ?? 0));
  const [receiver, setReceiver] = useState(slip.parsed.receiver ?? '');
  const [sender, setSender] = useState(slip.parsed.sender ?? '');
  const [when, setWhen] = useState(slip.parsed.occurredAt ? toLocalInput(slip.parsed.occurredAt) : '');
  const [ref, setRef] = useState(slip.parsed.ref ?? '');

  const save = async () => {
    const at = fromLocalInput(when);
    const parsed: SlipFields = {
      ...slip.parsed,
      amount: amountToSatang(amount) || undefined,
      fee: amountToSatang(fee) || undefined,
      receiver: receiver.trim() || undefined,
      sender: sender.trim() || undefined,
      occurredAt: Number.isNaN(at) ? undefined : at,
      ref: ref.trim() || undefined,
    };
    await updateSlip(slip.id, parsed, type);
    onDone();
  };

  const cls = (f: keyof SlipFields) => `input ${check.has(f) ? 'input--mark' : ''}`;

  return (
    <div className="slip-form">
      {image && <img src={image} alt="รูปสลิป" className="slip-form__image" />}

      <Segmented<TxType>
        value={type}
        onChange={setType}
        options={[
          { value: 'expense', label: 'รายจ่าย' },
          { value: 'income', label: 'รายรับ' },
        ]}
      />

      <div className="slip-form__row">
        <label className="field">
          <span className="field__label">ยอดเงิน</span>
          <input className={cls('amount')} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" />
        </label>
        <label className="field">
          <span className="field__label">ค่าธรรมเนียม</span>
          <input className={cls('fee')} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
        </label>
      </div>

      <label className="field">
        <span className="field__label">ผู้รับ</span>
        <input className={cls('receiver')} value={receiver} onChange={(e) => setReceiver(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">ผู้โอน</span>
        <input className={cls('sender')} value={sender} onChange={(e) => setSender(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">วันและเวลา</span>
        <input className={cls('occurredAt')} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">เลขที่รายการ</span>
        <input className={`${cls('ref')} mono`} value={ref} onChange={(e) => setRef(e.target.value)} autoCapitalize="characters" />
      </label>

      <Button variant="ink" size="lg" block icon={faCheck} onClick={() => void save()}>
        บันทึก
      </Button>

      {slip.ocrText && (
        <details className="slip-form__ocr">
          <summary>ข้อความที่อ่านได้</summary>
          <pre className="mono">{slip.ocrText}</pre>
        </details>
      )}
    </div>
  );
}
