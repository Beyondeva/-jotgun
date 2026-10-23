import { faCheck, faCircleExclamation, faClone, faHashtag, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Button, IconButton } from '../../design/components/Button';
import { Money } from '../../design/components/Money';
import { Icon } from '../../design/Icon';
import type { Category, SlipFields, TxType } from '../../db/types';
import { formatTime, relativeDay } from '../../lib/date';
import { CategoryGrid } from '../categories/CategoryGrid';

interface Props {
  thumb: React.ReactNode;
  bankName: string;
  amount?: number;
  type?: TxType;
  /** receiver for expenses, sender for income */
  counterparty?: string;
  occurredAt?: number;
  refNo?: string;
  categories: Category[];
  suggestedCategoryId?: string;
  /** a category the user has tapped; shown selected, recorded only on confirm */
  pickedCategoryId?: string;
  lowConfidence?: (keyof SlipFields)[];
  duplicate?: boolean;
  /** false while required fields are missing; the grid is then disabled */
  canPick?: boolean;
  /** tap on a category (with onConfirm: selects it; without: records right away) */
  onPick: (categoryId: string) => void;
  /** record the slip in the picked (or guessed) category */
  onConfirm?: () => void;
  onCreate?: () => void;
  onEdit?: () => void;
  onDiscard?: () => void;
}

/** A slip waiting for a category, drawn as a torn receipt. */
export function SlipCard({
  thumb,
  bankName,
  amount,
  type = 'expense',
  counterparty,
  occurredAt,
  refNo,
  categories,
  suggestedCategoryId,
  pickedCategoryId,
  lowConfidence = [],
  duplicate,
  canPick = true,
  onPick,
  onConfirm,
  onCreate,
  onEdit,
  onDiscard,
}: Props) {
  const who: keyof SlipFields = type === 'income' ? 'sender' : 'receiver';
  const chosen = categories.find((c) => c.id === (pickedCategoryId ?? suggestedCategoryId));
  const mark = (f: keyof SlipFields, node: React.ReactNode) => (lowConfidence.includes(f) ? <span className="mark">{node}</span> : node);

  return (
    <motion.article
      layout
      className="slip paper paper--torn"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
    >
      {onDiscard && <IconButton icon={faXmark} label="ทิ้งสลิปนี้" className="slip__discard" onClick={onDiscard} />}
      <div className="slip__top">
        <div className="slip__thumb">{thumb}</div>
        <button type="button" className="slip__info" onClick={onEdit} disabled={!onEdit} aria-label={onEdit ? 'แก้ข้อมูลสลิป' : undefined}>
          <div className="slip__amount">
            {mark('amount', amount ? <Money value={amount} size="lg" flow={type === 'income' ? 'in' : 'out'} /> : <span className="slip__missing">฿ —</span>)}
          </div>
          <div className="slip__receiver">{mark(who, counterparty || '—')}</div>
          <div className="slip__meta mono">
            {mark('occurredAt', occurredAt ? `${relativeDay(occurredAt)} ${formatTime(occurredAt)}` : '—')} · {bankName}
            {refNo && (
              <div className="slip__ref">
                <Icon icon={faHashtag} size={10} /> {refNo}
              </div>
            )}
          </div>
          {onEdit && <Icon icon={faPen} size={11} className="slip__edit" />}
        </button>
      </div>

      {(lowConfidence.length > 0 || duplicate) && (
        <div className="slip__notes">
          {lowConfidence.length > 0 && (
            <span className="slip__badge slip__badge--check">
              <Icon icon={faCircleExclamation} size={11} /> ตรวจช่องที่ขีด
            </span>
          )}
          {duplicate && (
            <span className="slip__badge slip__badge--dup">
              <Icon icon={faClone} size={11} /> อาจซ้ำ
            </span>
          )}
        </div>
      )}

      <div className="slip__divider" />
      <fieldset className="slip__pick" disabled={!canPick}>
        <CategoryGrid
          categories={categories}
          suggestedId={pickedCategoryId ? undefined : suggestedCategoryId}
          selectedId={pickedCategoryId}
          onPick={onPick}
          onCreate={onCreate}
        />
      </fieldset>

      {onConfirm && (
        <Button variant="ink" size="lg" block icon={faCheck} disabled={!canPick || !chosen} onClick={onConfirm}>
          {!canPick ? 'ใส่ยอดและวันที่ก่อน' : chosen ? `จดเข้า ${chosen.name}` : 'เลือกหมวดก่อน'}
        </Button>
      )}
    </motion.article>
  );
}

/** Placeholder slip drawing used until a real thumbnail exists. */
export function SlipThumbMock({ tint }: { tint: string }) {
  return (
    <div className="slip-thumb-mock" style={{ ['--tint' as string]: tint }}>
      <span className="slip-thumb-mock__bar" />
      <span className="slip-thumb-mock__line" style={{ width: '70%' }} />
      <span className="slip-thumb-mock__line" style={{ width: '50%' }} />
      <span className="slip-thumb-mock__amt" />
      <span className="slip-thumb-mock__line" style={{ width: '60%' }} />
      <span className="slip-thumb-mock__qr" />
    </div>
  );
}
