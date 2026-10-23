import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useShell } from '../../app/shell';
import { IconButton } from '../../design/components/Button';
import { DailyBars, DonutChart, type Slice } from '../../design/components/Charts';
import { EmptyState } from '../../design/components/Feedback';
import { PageLoader } from '../../design/components/PageLoader';
import { Paper } from '../../design/components/Paper';
import { Segmented } from '../../design/components/Segmented';
import { expenseByCategory, expenseByDay, totals } from '../../lib/aggregate';
import { formatWeekdayAbbr, isSameDay } from '../../lib/date';
import { daysIn, isCurrent, periodLabel, periodOf, periodProgress, shiftPeriod, type Period, type PeriodKind } from '../../lib/period';
import { KhaoTang } from '../../mascot/KhaoTang';
import { useBudgets } from '../../db/budgets';
import { budgetStates, worstBudget } from '../../lib/budget';
import { useCategoryOf } from '../categories/store';
import { Receipt } from '../transactions/Receipt';
import { useTransactions } from '../transactions/useTransactions';
import { CategoryBars } from './CategoryBars';
import { CategoryTxSheet } from './CategoryTxSheet';
import { Ledger } from './Ledger';

export function SummaryPage() {
  const [params] = useSearchParams();
  const { openManual, removeTx } = useShell();
  const categoryOf = useCategoryOf();
  const [period, setPeriod] = useState<Period>(() => periodOf(params.get('p') === 'month' ? 'month' : 'week', Date.now()));
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const txs = useTransactions(period);
  const list = txs ?? [];

  const sum = useMemo(() => totals(list), [list]);
  const days = useMemo(() => daysIn(period), [period]);
  const perDay = useMemo(() => expenseByDay(list, days), [list, days]);
  const byCat = useMemo(() => expenseByCategory(list), [list]);
  const budgets = useBudgets() ?? [];
  // budgets are monthly, so they only make sense on the month view
  const monthView = period.kind === 'month';
  const progress = periodProgress(period, Date.now());
  const budgetList = monthView ? budgetStates(byCat, budgets, progress) : [];
  const worst = worstBudget(budgetList);
  const slices = useMemo<Slice[]>(
    () =>
      byCat.map(({ categoryId: id, value }) => {
        const c = categoryOf(id);
        return { id, name: c.name, value, color: c.color };
      }),
    [byCat, categoryOf],
  );

  const now = Date.now();
  const elapsedDays = Math.max(1, Math.round(periodProgress(period, now) * days.length));
  const bars = days.map((d, i) => ({
    label: period.kind === 'week' ? formatWeekdayAbbr(d) : (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '',
    value: perDay[i],
    highlight: isSameDay(d, now),
  }));
  const future = period.from > now;

  const setKind = (kind: PeriodKind) => setPeriod(periodOf(kind, isCurrent(period) ? now : period.from));

  if (txs === undefined) return <PageLoader />;

  return (
    <>
      <h1 className="page-title">สรุป</h1>
      <Segmented<PeriodKind>
        value={period.kind}
        onChange={setKind}
        options={[
          { value: 'week', label: 'สัปดาห์' },
          { value: 'month', label: 'เดือน' },
        ]}
      />
      <div className="period">
        <IconButton icon={faChevronLeft} label="ก่อนหน้า" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} />
        <span className="period__label">{periodLabel(period)}</span>
        <IconButton icon={faChevronRight} label="ถัดไป" disabled={isCurrent(period) || future} onClick={() => setPeriod((p) => shiftPeriod(p, 1))} />
      </div>

      <Ledger totals={sum} />

      {txs && list.length === 0 ? (
        <EmptyState mood="sleeping" title="ช่วงนี้ไม่มีรายการ" />
      ) : (
        <>
          <div className="section-head">
            <h2>ใช้จ่ายรายวัน</h2>
            <span className="section-head__note num">เฉลี่ยวันละ ฿{Math.round(sum.expense / elapsedDays / 100).toLocaleString('en-US')}</span>
          </div>
          <DailyBars data={bars} />

          {budgetList.length > 0 ? (
            <div className="note">
              <KhaoTang mood={worst ? 'worried' : 'happy'} size={56} />
              <div>
                <div className="note__title">
                  {worst ? `${categoryOf(worst.categoryId).name}${worst.status === 'over' ? 'เกินงบแล้ว' : 'ใช้เร็วไปหน่อย'}` : 'ทุกหมวดอยู่ในงบ'}
                </div>
                {worst && (
                  <div className="note__body num">
                    งบ {Math.round(worst.ratio * 100)}% · เดือน {Math.round(progress * 100)}%
                  </div>
                )}
              </div>
            </div>
          ) : (
            // without income in the period there is nothing meaningful to compare against
            sum.income > 0 && (
              <div className="note">
                <KhaoTang mood={sum.balance < 0 ? 'worried' : 'happy'} size={56} />
                <div>
                  <div className="note__title">{sum.balance < 0 ? 'จ่ายเกินรายรับแล้ว' : 'ยังมีเหลือ'}</div>
                  <div className="note__body num">ใช้ไป {Math.round((sum.expense / sum.income) * 100)}% ของรายรับ</div>
                </div>
              </div>
            )
          )}

          {slices.length > 0 && (
            <>
              <div className="section-head">
                <h2>ตามหมวดหมู่</h2>
              </div>
              <Paper>
                <div className="by-cat">
                  <DonutChart data={slices} size={132} label="รายจ่าย" onSelect={(s) => setCategoryId(s.id)} />
                  <div className="stack__legend" style={{ flexDirection: 'column', gap: 0 }}>
                    {slices.slice(0, 4).map((d) => (
                      <button key={d.id} type="button" className="stack__item" onClick={() => setCategoryId(d.id)}>
                        <span className="stack__dot" style={{ background: `var(--cat-${d.color})` }} />
                        {d.name}
                        <span className="stack__pct num">{Math.round((d.value / (sum.expense || 1)) * 100)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
                <CategoryBars
                  rows={byCat.map((r) => ({ category: categoryOf(r.categoryId), value: r.value, budget: monthView ? budgets.find((b) => b.categoryId === r.categoryId)?.monthlyLimit : undefined }))}
                  periodProgress={monthView ? progress : undefined}
                  onSelect={(c) => setCategoryId(c.id)}
                />
              </Paper>
            </>
          )}

          <div className="section-head">
            <h2>รายการ</h2>
            <span className="section-head__note num">{list.length} รายการ</span>
          </div>
          <Receipt txs={list} categoryOf={categoryOf} onEdit={openManual} onDelete={removeTx} />
        </>
      )}

      <CategoryTxSheet categoryId={categoryId} txs={list} onClose={() => setCategoryId(null)} />
    </>
  );
}
