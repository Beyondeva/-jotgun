import { faTags, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useShell } from '../app/shell';
import { Button } from '../design/components/Button';
import { EmptyState } from '../design/components/Feedback';
import { Money } from '../design/components/Money';
import { PageLoader } from '../design/components/PageLoader';
import { Sheet } from '../design/components/Sheet';
import { moveTransactions, restoreCategories, transactionsBetween } from '../db/repo';
import { CategoryGrid } from '../features/categories/CategoryGrid';
import { forType, useCategories, useCategoryOf } from '../features/categories/store';
import { totals } from '../lib/aggregate';
import { fromLocalInput, startOfDay } from '../lib/date';
import { filterTransactions } from '../lib/search';
import { useCachedLiveQuery } from '../lib/useCachedLiveQuery';
import { useWidePeriod } from './period';
import { TxTable } from './TxTable';

const PAGE = 200;
const DAY = 86_400_000;

/** yyyy-mm-dd for a date input */
const dayInput = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * รายการ, wide screens only: every transaction in a range as a table, filtered by category,
 * dates and the top bar's search. Tick rows to move them to one category at once (with undo).
 */
export default function WideTransactions() {
  const { period } = useWidePeriod();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const { categories } = useCategories();
  const categoryOf = useCategoryOf();
  const { openManual, toast } = useShell();

  // the date range follows the top bar's period until you set your own (for that period)
  const [own, setOwn] = useState<{ key: number; from: number; to: number } | null>(null);
  const range = own && own.key === period.from + period.to ? own : { from: period.from, to: period.to };
  const setRange = (from: number, to: number) => setOwn({ key: period.from + period.to, from, to });

  const [categoryId, setCategoryId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(PAGE);
  const [moving, setMoving] = useState(false);

  const txs = useCachedLiveQuery(`tx:range:${range.from}-${range.to}`, () => transactionsBetween(range.from, range.to), [range.from, range.to]);
  const list = useMemo(
    () =>
      filterTransactions(txs ?? [], { query, type: 'all', categoryIds: categoryId ? [categoryId] : [], method: 'all' }, (id) => categoryOf(id).name).sort(
        (a, b) => b.occurredAt - a.occurredAt,
      ),
    [txs, query, categoryId, categoryOf],
  );
  const sum = totals(list);
  const picked = list.filter((t) => selected.has(t.id));
  const pickedTypes = new Set(picked.map((t) => t.type));

  const select = (ids: string[], on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      for (const id of ids) on ? next.add(id) : next.delete(id);
      return next;
    });

  const move = async (to: string) => {
    setMoving(false);
    // only rows still in view: a filter change may have hidden some that were ticked
    const before = await moveTransactions(picked.map((t) => t.id), to);
    setSelected(new Set());
    toast(`ย้าย ${before.length} รายการไป${categoryOf(to).name}แล้ว`, { label: 'เลิกทำ', run: () => void restoreCategories(before) });
  };

  if (txs === undefined) return <PageLoader />;

  return (
    <>
      <div className="w-filters w-row">
        <label className="w-field">
          <span>หมวด</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="w-field">
          <span>ตั้งแต่</span>
          <input type="date" value={dayInput(range.from)} max={dayInput(range.to - DAY)} onChange={(e) => e.target.value && setRange(startOfDay(fromLocalInput(e.target.value)), range.to)} />
        </label>
        <label className="w-field">
          <span>ถึง</span>
          <input type="date" value={dayInput(range.to - DAY)} min={dayInput(range.from)} onChange={(e) => e.target.value && setRange(range.from, startOfDay(fromLocalInput(e.target.value)) + DAY)} />
        </label>
        <p className="w-filters__total">
          <span className="num">{list.length}</span> รายการ · จ่าย <Money value={sum.expense} size="sm" /> · รับ <Money value={sum.income} size="sm" />
        </p>
      </div>

      {picked.length > 0 && (
        <div className="w-bulk w-row" role="region" aria-label="รายการที่เลือก">
          <span>
            เลือก <b className="num">{picked.length}</b> รายการ
          </span>
          <Button variant="ink" size="sm" icon={faTags} onClick={() => setMoving(true)}>
            เปลี่ยนหมวด
          </Button>
          <Button variant="ghost" size="sm" icon={faXmark} onClick={() => setSelected(new Set())}>
            ยกเลิก
          </Button>
        </div>
      )}

      <section className="w-card w-row">
        {list.length === 0 ? (
          <EmptyState mood="sleeping" title={query || categoryId ? 'ไม่เจอรายการที่ตรง' : 'ช่วงนี้ไม่มีรายการ'} />
        ) : (
          <>
            <TxTable txs={list.slice(0, shown)} categoryOf={categoryOf} onOpen={openManual} selected={selected} onSelect={select} />
            {list.length > shown && (
              <div className="w-more">
                <Button variant="quiet" onClick={() => setShown((n) => n + PAGE)}>
                  แสดงเพิ่ม ({list.length - shown})
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Sheet open={moving} onClose={() => setMoving(false)} title={`ย้าย ${picked.length} รายการไปหมวด`}>
        {/* one kind picked: its categories; a mix of income and spending: the ones that fit both */}
        <CategoryGrid
          categories={pickedTypes.size === 1 ? forType(categories, [...pickedTypes][0]) : categories.filter((c) => c.kind === 'both')}
          onPick={(id) => void move(id)}
        />
      </Sheet>
    </>
  );
}
