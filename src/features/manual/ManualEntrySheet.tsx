import { faBuildingColumns, faCalendarDays, faCheck, faCreditCard, faMoneyBill, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Button, IconButton } from '../../design/components/Button';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Segmented } from '../../design/components/Segmented';
import { Sheet } from '../../design/components/Sheet';
import { Icon, type IconDefinition } from '../../design/Icon';
import { saveTransaction } from '../../db/repo';
import type { PayMethod, Transaction, TxType } from '../../db/types';
import { amountToSatang, displayAmount, pressKey, satangToAmountText, type AmountKey } from '../../lib/amountInput';
import { formatTime, fromLocalInput, relativeDay, toLocalInput } from '../../lib/date';
import { CategoryEditorSheet } from '../categories/CategoryEditor';
import { CategoryGrid } from '../categories/CategoryGrid';
import { forType, useCategories } from '../categories/store';
import { Numpad } from './Numpad';
import './manual.css';

const METHODS: { value: PayMethod; label: string; icon: IconDefinition }[] = [
  { value: 'cash', label: 'เงินสด', icon: faMoneyBill },
  { value: 'credit', label: 'บัตรเครดิต', icon: faCreditCard },
  { value: 'transfer', label: 'โอน', icon: faBuildingColumns },
];

interface Props {
  open: boolean;
  /** edit this transaction; omit to create one */
  tx?: Transaction;
  onClose: () => void;
  onSaved?: (edited: boolean) => void;
  onDelete?: (tx: Transaction) => void;
}

export function ManualEntrySheet({ open, tx, onClose, onSaved, onDelete }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      {/* remount per open so the form starts from the right values */}
      {open && (
        <ManualForm
          key={tx?.id ?? 'new'}
          tx={tx}
          onDelete={onDelete}
          onDone={(edited) => {
            onSaved?.(edited);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

interface FormProps {
  tx?: Transaction;
  onDelete?: (tx: Transaction) => void;
  onDone: (edited: boolean) => void;
}

function ManualForm({ tx, onDelete, onDone }: FormProps) {
  const { categories, byId } = useCategories();
  const [type, setType] = useState<TxType>(tx?.type ?? 'expense');
  const [amount, setAmount] = useState(tx ? satangToAmountText(tx.amount) : '');
  const [categoryId, setCategoryId] = useState<string | undefined>(tx?.categoryId);
  const [method, setMethod] = useState<PayMethod>(tx?.method ?? 'cash');
  const [occurredAt, setOccurredAt] = useState(tx?.occurredAt ?? Date.now());
  const [note, setNote] = useState(tx?.note ?? '');
  const [creating, setCreating] = useState(false);

  const options = forType(categories, type);
  const category = categoryId ? byId(categoryId) : undefined;
  const satang = amountToSatang(amount);
  const canSave = satang > 0 && !!category;

  const save = async () => {
    if (!canSave || !categoryId) return;
    await saveTransaction({
      id: tx?.id,
      type,
      amount: satang,
      fee: tx?.fee ?? 0,
      categoryId,
      occurredAt,
      method,
      note: note.trim() || undefined,
      counterparty: tx?.counterparty,
      source: tx?.source ?? 'manual',
      bank: tx?.bank,
      ref: tx?.ref,
      slipId: tx?.slipId,
    });
    onDone(!!tx);
  };

  const switchType = (t: TxType) => {
    setType(t);
    if (category && category.kind !== t && category.kind !== 'both') setCategoryId(undefined);
  };

  return (
    <div className="manual">
      <Segmented<TxType>
        value={type}
        onChange={switchType}
        options={[
          { value: 'expense', label: 'รายจ่าย' },
          { value: 'income', label: 'รายรับ' },
        ]}
      />

      <div className="manual__amount">
        <span className="manual__cat">
          {category ? <CategoryIcon icon={category.icon} color={category.color} variant="tile" size={36} /> : <span className="manual__cat-empty" />}
          <span className="manual__cat-name">{category?.name ?? ''}</span>
        </span>
        <span className={`manual__figure num ${type === 'income' ? 'is-income' : ''} ${amount ? '' : 'is-empty'}`} aria-live="polite">
          <span className="manual__cur">฿</span>
          {displayAmount(amount)}
        </span>
      </div>

      <div className="manual__meta">
        <label className="manual__date">
          <Icon icon={faCalendarDays} size={14} />
          <span className="num">
            {relativeDay(occurredAt)} {formatTime(occurredAt)}
          </span>
          <input
            type="datetime-local"
            aria-label="วันและเวลา"
            value={toLocalInput(occurredAt)}
            onChange={(e) => {
              const v = fromLocalInput(e.target.value);
              if (!Number.isNaN(v)) setOccurredAt(v);
            }}
          />
        </label>
        <div className="manual__methods" role="radiogroup" aria-label="ช่องทาง">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={method === m.value}
              aria-label={m.label}
              className={`manual__method ${method === m.value ? 'is-active' : ''}`}
              onClick={() => setMethod(m.value)}
            >
              <Icon icon={m.icon} size={15} />
            </button>
          ))}
        </div>
      </div>

      <label className="manual__note">
        <Icon icon={faPen} size={12} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="โน้ต" maxLength={60} enterKeyHint="done" />
      </label>

      <CategoryGrid categories={options} selectedId={categoryId} onPick={setCategoryId} onCreate={() => setCreating(true)} />

      <div className="manual__dock">
        <Numpad onKey={(k: AmountKey) => setAmount((a) => pressKey(a, k))} />
        <div className="manual__actions">
          {tx && onDelete && <IconButton icon={faTrash} label="ลบรายการ" className="manual__delete" onClick={() => onDelete(tx)} />}
          <Button size="lg" block icon={faCheck} disabled={!canSave} onClick={() => void save()}>
            บันทึก
          </Button>
        </div>
      </div>

      <CategoryEditorSheet open={creating} onClose={() => setCreating(false)} draft={{ kind: type }} onSaved={(c) => setCategoryId(c.id)} />
    </div>
  );
}
