import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useShell } from '../../app/shell';
import { Button } from '../../design/components/Button';
import { Money } from '../../design/components/Money';
import { Sheet } from '../../design/components/Sheet';
import { setBudget } from '../../db/budgets';
import type { Category } from '../../db/types';
import type { BudgetState } from '../../lib/budget';
import { useBahtText } from '../../lib/privacy';

const STEPS = [-50000, -10000, 10000, 50000];
const MIN = 10000;

/** Long-press a budget ring: nudge that category's monthly budget in ฿100 / ฿500 steps. */
export function BudgetQuickSheet({ state, category, onClose }: { state: BudgetState | null; category?: Category; onClose: () => void }) {
  return (
    <Sheet open={!!state} onClose={onClose} title={category ? `งบ${category.name}` : undefined}>
      {/* remount per ring so the draft starts from that ring's budget */}
      {state && category && <Editor key={state.categoryId} state={state} category={category} onClose={onClose} />}
    </Sheet>
  );
}

function Editor({ state, category, onClose }: { state: BudgetState; category: Category; onClose: () => void }) {
  const { toast } = useShell();
  const baht = useBahtText();
  const [draft, setDraft] = useState(state.limit);
  const left = draft - state.spent;

  const save = async (limit: number) => {
    await setBudget(state.categoryId, limit);
    onClose();
    toast(limit ? `ตั้งงบ${category.name} ${baht(limit)} ต่อเดือน` : `เอางบ${category.name}ออกแล้ว`, {
      label: 'เลิกทำ',
      run: () => void setBudget(state.categoryId, state.limit),
    });
  };

  return (
    <div className="budget-quick">
      <Money value={draft} size="lg" reveal />
      <p className="budget-quick__note num">
        ใช้ไป {baht(state.spent)} · {left >= 0 ? `เหลือ ${baht(left)}` : `เกิน ${baht(-left)}`}
      </p>
      <div className="budget-quick__steps">
        {STEPS.map((s) => (
          <Button key={s} variant="quiet" icon={s < 0 ? faMinus : faPlus} disabled={draft + s < MIN} onClick={() => setDraft((d) => Math.max(MIN, d + s))}>
            {Math.abs(s) / 100}
          </Button>
        ))}
      </div>
      <Button variant="primary" block disabled={draft === state.limit} onClick={() => void save(draft)}>
        บันทึกงบ
      </Button>
      <Button variant="ghost" block onClick={() => void save(0)}>
        เอางบหมวดนี้ออก
      </Button>
    </div>
  );
}
