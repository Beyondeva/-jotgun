import { faCheckDouble, faFlask } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useShell } from '../../app/shell';
import { Button } from '../../design/components/Button';
import { EmptyState, ProgressBar, Skeleton } from '../../design/components/Feedback';
import { PageLoader } from '../../design/components/PageLoader';
import { Paper } from '../../design/components/Paper';
import { KhaoTang } from '../../mascot/KhaoTang';
import { DoneStamp } from '../../design/components/Stamp';
import { canConfirm, confirmAll, confirmSlip, counterpartyOf, discardSlip, fieldsToCheck, restoreSlip } from '../../db/slips';
import type { Slip } from '../../db/types';
import { BANK_NAME } from '../../lib/banks';
import { useObjectUrl } from '../../lib/useObjectUrl';
import { CategoryEditorSheet } from '../categories/CategoryEditor';
import { forType, useCategories } from '../categories/store';
import { useReader } from './reader';
import { addSampleSlips } from './sampleSlips';
import { SlipCard } from './SlipCard';
import { SlipEditSheet } from './SlipEditSheet';
import { usePendingSlips } from './usePendingSlips';

export function InboxPage() {
  const slips = usePendingSlips();
  const { categories } = useCategories();
  const { toast } = useShell();
  const reader = useReader();
  const [editing, setEditing] = useState<Slip | null>(null);
  const [creatingFor, setCreatingFor] = useState<Slip | null>(null);
  const [done, setDone] = useState(false);
  const [cleared, setCleared] = useState(false);

  // stamp only when the user empties the queue, not when the page opens empty
  useEffect(() => {
    if (cleared && slips?.length === 0) {
      setDone(true);
      setCleared(false);
    }
  }, [cleared, slips]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1900);
    return () => clearTimeout(t);
  }, [done]);

  const pick = async (slip: Slip, categoryId: string) => {
    if (!canConfirm(slip)) return setEditing(slip);
    await confirmSlip(slip.id, categoryId);
    setCleared(true);
  };

  const discard = async (slip: Slip) => {
    await discardSlip(slip.id);
    toast('ทิ้งสลิปแล้ว', { label: 'เลิกทำ', run: () => void restoreSlip(slip) });
  };

  const confirmEverything = async () => {
    const n = await confirmAll();
    setCleared(true);
    const left = (slips?.length ?? 0) - n;
    if (left > 0) toast(`ยังเหลือ ${left} ใบที่ต้องใส่ข้อมูลก่อน`);
  };

  if (slips === undefined && !reader.running) return <PageLoader />;

  return (
    <>
      <h1 className="page-title">
        รอจด {!!slips?.length && <span className="page-title__count num">{slips.length}</span>}
      </h1>

      {reader.lastError && !reader.running && <p className="read-error">อ่านบางใบไม่สำเร็จ ({reader.lastError}) · แตะสลิปเพื่อกรอกเอง</p>}

      {reader.total > 0 && (
        <div className="reading">
          <KhaoTang mood="reading" size={60} />
          <div className="reading__text">
            <span className="reading__count num">
              {reader.preparing ? 'เตรียมตัวอ่าน (ครั้งแรกโหลดราว 10 MB)' : `อ่านแล้ว ${reader.done}/${reader.total} ใบ`}
              {reader.failed > 0 && ` · อ่านไม่ได้ ${reader.failed}`}
            </span>
            <ProgressBar value={reader.done} max={reader.total} />
          </div>
        </div>
      )}

      {slips && slips.length === 0 && !reader.running ? (
        <EmptyState
          mood={done ? 'celebrate' : 'sleeping'}
          title={done ? 'จดครบแล้ว' : 'ไม่มีสลิปรอจด'}
          action={
            !done &&
            import.meta.env.DEV && (
              <Button variant="quiet" icon={faFlask} onClick={() => void addSampleSlips()}>
                สลิปตัวอย่าง
              </Button>
            )
          }
        />
      ) : (
        <div className="slip-stack">
          <AnimatePresence initial={false} mode="popLayout">
            {slips?.map((s) => (
              <SlipCard
                key={s.id}
                thumb={<SlipThumb slip={s} />}
                bankName={BANK_NAME[s.parsed.bank ?? 'other']}
                amount={s.parsed.amount}
                type={s.suggestedType}
                counterparty={counterpartyOf(s)}
                occurredAt={s.parsed.occurredAt}
                refNo={s.parsed.ref}
                categories={forType(categories, s.suggestedType)}
                suggestedCategoryId={s.suggestedCategoryId}
                lowConfidence={fieldsToCheck(s)}
                duplicate={!!s.duplicateOf}
                canPick={canConfirm(s)}
                onPick={(id) => void pick(s, id)}
                onCreate={() => setCreatingFor(s)}
                onEdit={() => setEditing(s)}
                onDiscard={() => void discard(s)}
              />
            ))}
          </AnimatePresence>
          {reader.running &&
            Array.from({ length: Math.min(2, reader.total - reader.done) }, (_, i) => (
              <Paper key={i} className="skeleton-slip">
                <Skeleton w={64} h={92} r={4} />
                <div className="skeleton-slip__lines">
                  <Skeleton w="50%" h={22} />
                  <Skeleton w="75%" />
                  <Skeleton w="40%" h={10} />
                </div>
              </Paper>
            ))}
          {slips && slips.length > 1 && !reader.running && (
            <div className="sticky-action">
              <Button variant="ink" size="lg" block icon={faCheckDouble} onClick={() => void confirmEverything()}>
                ยืนยันทั้งหมด {slips.length}
              </Button>
            </div>
          )}
        </div>
      )}

      {done && <DoneStamp />}

      <SlipEditSheet slip={editing} onClose={() => setEditing(null)} />
      <CategoryEditorSheet
        open={!!creatingFor}
        onClose={() => setCreatingFor(null)}
        draft={creatingFor ? { kind: creatingFor.suggestedType, keywords: counterpartyOf(creatingFor) ? [counterpartyOf(creatingFor)!] : [] } : undefined}
        onSaved={(c) => creatingFor && void pick(creatingFor, c.id)}
      />
    </>
  );
}

function SlipThumb({ slip }: { slip: Slip }) {
  const url = useObjectUrl(slip.thumb);
  return url ? <img src={url} alt="" /> : null;
}
