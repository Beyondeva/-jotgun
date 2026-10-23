import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Paper } from '../../design/components/Paper';
import { Sheet, type SheetVariant } from '../../design/components/Sheet';
import { Icon } from '../../design/Icon';

/**
 * TEMPORARY: lets the user try each sheet variant on their iPhone and report which
 * ones flicker. Remove once the cause is found.
 */
const TESTS: { key: string; variant: SheetVariant; label: string }[] = [
  { key: 'A', variant: 'default', label: 'แบบปกติ' },
  { key: 'B', variant: 'no-dim', label: 'ไม่มีฉากมืด' },
  { key: 'C', variant: 'still-dim', label: 'ฉากมืดไม่จาง' },
  { key: 'D', variant: 'no-anim', label: 'ไม่มีอนิเมชันเลย' },
  { key: 'E', variant: 'no-lock', label: 'ไม่ล็อกหน้าด้านหลัง' },
];

export function FlickerTest() {
  const [open, setOpen] = useState<(typeof TESTS)[number] | null>(null);
  const [last, setLast] = useState(TESTS[0]);

  return (
    <>
      <div className="list-cap">ทดสอบแผ่น (ชั่วคราว)</div>
      <Paper className="list">
        {TESTS.map((t) => (
          <button
            key={t.key}
            className="list__row"
            onClick={() => {
              setLast(t);
              setOpen(t);
            }}
          >
            <span className="list__label">
              {t.key} · {t.label}
            </span>
            <span />
            <Icon icon={faAngleRight} size={13} className="list__chev" />
          </button>
        ))}
      </Paper>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={`ทดสอบ ${last.key} · ${last.label}`} variant={last.variant}>
        <div className="list">
          {Array.from({ length: 12 }, (_, i) => (
            <button key={i} className="list__row" onClick={() => setOpen(null)}>
              <span className="list__label">รายการทดสอบ {i + 1}</span>
              <span />
              <span />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
