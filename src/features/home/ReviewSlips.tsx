import { faArrowRight, faCircleExclamation, faReceipt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { useShell } from '../../app/shell';
import { Button, IconButton } from '../../design/components/Button';
import { CategoryIcon } from '../../design/components/CategoryIcon';
import { Money } from '../../design/components/Money';
import { Paper } from '../../design/components/Paper';
import { Icon } from '../../design/Icon';
import { confirmReady, counterpartyOf, isReady } from '../../db/slips';
import type { Slip } from '../../db/types';
import { formatTime, relativeDay } from '../../lib/date';
import { useCategoryOf } from '../categories/store';

const SHOWN = 3;

/**
 * Slips waiting in รอจด, on the home screen: the first few with their guessed category,
 * and one button that records every slip that was read with confidence.
 * Anything unsure is marked and left for the inbox.
 */
export function ReviewSlips({ slips }: { slips: Slip[] }) {
  const navigate = useNavigate();
  const categoryOf = useCategoryOf();
  const { toast } = useShell();
  const ready = slips.filter(isReady).length;
  const toInbox = () => navigate('/inbox');

  const confirm = async () => {
    const n = await confirmReady();
    toast(slips.length - n > 0 ? `จดแล้ว ${n} ใบ · อีก ${slips.length - n} ใบรอตรวจ` : `จดแล้ว ${n} ใบ`);
  };

  return (
    <>
      <div className="section-head">
        <h2>
          รอจด <span className="num">{slips.length}</span>
        </h2>
        <IconButton icon={faArrowRight} label="ไปหน้ารอจด" onClick={toInbox} />
      </div>
      <Paper className="review">
        {slips.slice(0, SHOWN).map((s) => {
          const c = s.suggestedCategoryId ? categoryOf(s.suggestedCategoryId) : undefined;
          const at = s.parsed.occurredAt;
          return (
            <button key={s.id} type="button" className="tx review__row" onClick={toInbox}>
              {c ? <CategoryIcon icon={c.icon} color={c.color} /> : <Icon icon={faReceipt} size={16} className="review__blank" />}
              <div className="tx__main">
                <div className="tx__title">{counterpartyOf(s) || 'ยังอ่านชื่อไม่ได้'}</div>
                <div className="tx__sub">
                  {isReady(s) ? (
                    <span>{c?.name}</span>
                  ) : (
                    <span className="review__check">
                      <Icon icon={faCircleExclamation} size={11} /> {s.duplicateOf ? 'อาจซ้ำ' : 'ต้องตรวจ'}
                    </span>
                  )}
                  {at && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="num">
                        {relativeDay(at)} {formatTime(at)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="tx__amt">
                {s.parsed.amount ? <Money value={s.parsed.amount} size="md" bare flow={s.suggestedType === 'income' ? 'in' : 'out'} /> : <span className="tx__sub">—</span>}
              </div>
            </button>
          );
        })}
        {slips.length > SHOWN && (
          <button type="button" className="review__more" onClick={toInbox}>
            อีก {slips.length - SHOWN} ใบ
          </button>
        )}
        {ready > 0 && (
          <div className="review__foot">
            <Button variant="ink" block onClick={() => void confirm()}>
              จดเลย {ready} ใบ
            </Button>
          </div>
        )}
      </Paper>
    </>
  );
}
