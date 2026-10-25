import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useShell } from '../app/shell';
import { Button } from '../design/components/Button';
import { CategoryIcon } from '../design/components/CategoryIcon';
import { DailyBars } from '../design/components/Charts';
import { EmptyState } from '../design/components/Feedback';
import { Money } from '../design/components/Money';
import { PageLoader } from '../design/components/PageLoader';
import { useDecor } from '../design/decor';
import { Icon } from '../design/Icon';
import { catColor } from '../design/palette';
import { db } from '../db/db';
import type { Transaction } from '../db/types';
import { expenseByDay } from '../lib/aggregate';
import { formatWeekdayAbbr, isSameDay } from '../lib/date';
import { daysIn, isCurrent, type Period } from '../lib/period';
import { clearDemo, loadDemo, useDemoActive } from '../db/demo';
import { useCategoryOf } from '../features/categories/store';
import { PaceChart } from '../features/home/PaceChart';
import { useOverview } from '../features/home/useOverview';
import { CategoryTxSheet } from '../features/summary/CategoryTxSheet';
import { KhaoTang } from '../mascot/KhaoTang';
import { useBahtText } from '../lib/privacy';
import { useCachedLiveQuery } from '../lib/useCachedLiveQuery';
import { periodNoun, useWidePeriod } from './period';
import { TxTable } from './TxTable';

const RECENT = 12;
const TOP_CATEGORIES = 5;

/**
 * The wide-screen overview, in full-width rows: four figures; the pace chart beside where the
 * money went; then the latest transactions as a table. Same data as the phone home page.
 */
export default function WideOverview() {
  const navigate = useNavigate();
  const { openManual } = useShell();
  const categoryOf = useCategoryOf();
  const baht = useBahtText();
  const { period } = useWidePeriod();
  const o = useOverview(period);
  const demo = useDemoActive();
  const decor = useDecor();
  const txCount = useCachedLiveQuery('tx:count', () => db.transactions.count(), []);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  if (o.txs === undefined) return <PageLoader />;

  const noun = periodNoun(period.kind);
  const spentLabel = o.current ? `ใช้ไป${noun}นี้` : `ใช้ไปทั้ง${noun}`;
  const count = (type: 'income' | 'expense') => o.txs!.filter((t) => t.type === type).length;
  const change = o.prevSum.expense > 0 ? Math.round(((o.sum.expense - o.prevSum.expense) / o.prevSum.expense) * 100) : null;
  const under = o.pace ? o.pace.diff <= 0 : true;
  const paceText = o.pace
    ? o.pace.planKind === 'budget'
      ? `${under ? 'ต่ำกว่าแผน' : 'เร็วกว่าแผน'} ${baht(Math.abs(o.pace.diff))}`
      : `${under ? 'น้อยกว่า' : 'มากกว่า'}${noun}ก่อน ${baht(Math.abs(o.pace.diff))}`
    : null;
  // over the budget, or ahead of the plan's pace: worried; otherwise (no plan too) happy
  const worried = (o.current && o.budgetTotal > 0 && o.budgetLeft < 0) || !under;
  const used = o.budgetTotal > 0 ? Math.round(((o.budgetTotal - o.budgetLeft) / o.budgetTotal) * 100) : null;
  const top = o.slices.slice(0, TOP_CATEGORIES);
  const bars = spendingBars(o.txs, period);
  const topMax = top[0]?.value || 1;

  return (
    <>
      {demo && (
        <div className="demo-bar w-row" role="status">
          <span>
            <b>ข้อมูลตัวอย่าง</b> · จดจริงครั้งแรกจะล้างให้เอง
          </span>
          <Button variant="quiet" size="sm" onClick={() => void clearDemo()}>
            ล้างออก
          </Button>
        </div>
      )}

      {/* row 1: the four figures */}
      <section className="w-kpis w-row" aria-label="ตัวเลขหลัก">
        <div className="w-card w-kpi w-kpi--hero">
          <div className="w-kpi__body">
            <p className="w-kpi__label">{spentLabel}</p>
            <Money value={o.sum.expense} size="hero" countUp="wide-hero" className="w-kpi__hero" />
            {o.current && o.budgetTotal > 0 ? (
              <p className="w-kpi__sub">
                {o.budgetLeft >= 0 ? (
                  <>
                    <span className="w-nowrap">
                      งบเหลือ <b className="num">{baht(o.budgetLeft)}</b>
                    </span>{' '}
                    <span className="w-nowrap">จาก {baht(o.budgetTotal)}</span>{' '}
                    · <span className="w-nowrap">
                      วันละ <b className="num">{baht(Math.floor(o.budgetLeft / Math.max(1, o.days) / 100) * 100)}</b>
                    </span>
                  </>
                ) : (
                  <b className="num is-over">เกินงบ {baht(-o.budgetLeft)} จาก {baht(o.budgetTotal)}</b>
                )}
              </p>
            ) : (
              o.current &&
              o.perDay > 0 && (
                <p className="w-kpi__sub">
                  ใช้ได้อีกวันละ <b className="num">{baht(Math.floor(o.perDay / 100) * 100)}</b> · {o.days} วัน
                </p>
              )
            )}
          </div>
          {/* plain themes: ข้าวตัง beside the figure, in place of the ring (the line above says the same);
              a decorated theme has its cat in the scene */}
          {decor ? used !== null && <BudgetDial percent={used} /> : <KhaoTang mood={worried ? 'worried' : 'happy'} size={88} loading="lazy" className="w-kpi__cat" />}
        </div>
        <div className="w-card w-kpi">
          <p className="w-kpi__label">รายรับ</p>
          <Money value={o.sum.income} size="lg" flow="in" />
          <p className="w-kpi__sub">{count('income')} รายการ</p>
        </div>
        <div className="w-card w-kpi">
          <p className="w-kpi__label">รายจ่าย</p>
          <Money value={o.sum.expense} size="lg" flow="out" />
          <p className="w-kpi__sub">
            {count('expense')} รายการ
            {change !== null && change !== 0 && ` · ${change > 0 ? 'มากกว่า' : 'น้อยกว่า'}${noun}ก่อน ${Math.abs(change)}%`}
          </p>
        </div>
        <div className="w-card w-kpi">
          <p className="w-kpi__label">คงเหลือ</p>
          <Money value={o.sum.balance} size="lg" tone={o.sum.balance < 0 ? 'over' : 'default'} />
          {paceText && <p className={`w-kpi__sub ${under ? 'is-under' : 'is-over'}`}>{paceText}</p>}
        </div>
      </section>

      {o.txs.length === 0 ? (
        <section className="w-card w-row">
          <EmptyState
            mood="sleeping"
            title={o.current ? `${noun}นี้ยังไม่ได้จด` : `${noun}นี้ไม่มีรายการ`}
            action={
              o.current && (
                <div className="empty__actions">
                  <Button variant="ink" onClick={() => openManual()}>
                    จดรายการแรก
                  </Button>
                  {txCount === 0 && (
                    <Button variant="quiet" onClick={() => void loadDemo()}>
                      ดูตัวอย่าง
                    </Button>
                  )}
                </div>
              )
            }
          />
        </section>
      ) : (
        <>
          {/* row 2: the pace chart (two parts) with where the money went (one part) */}
          <section className="w-split w-row">
            <div className="w-card">
              <div className="w-card__head">
                <h2>{o.pace ? 'การใช้จ่ายเทียบแผน' : `การใช้จ่ายราย${period.kind === 'year' ? 'เดือน' : 'วัน'}`}</h2>
              </div>
              {/* nothing to compare with yet (no budget, no earlier period): plain bars instead */}
              {o.pace ? <PaceChart pace={o.pace} /> : <DailyBars data={bars} height={170} />}
            </div>
            <div className="w-card">
              <div className="w-card__head">
                <h2>ไปไหนบ้าง</h2>
                <button type="button" className="w-link" onClick={() => navigate('/summary?p=month')}>
                  ดูทั้งหมด <Icon icon={faArrowRight} size={11} />
                </button>
              </div>
              {top.length ? (
                <ul className="w-cats">
                  {top.map((s) => {
                    const c = categoryOf(s.id);
                    return (
                      <li key={s.id}>
                        <button type="button" className="w-cats__row" onClick={() => setCategoryId(s.id)}>
                          <span className="w-cats__icon" style={{ background: catColor(c.color).wash }}>
                            <CategoryIcon icon={c.icon} color={c.color} size={18} />
                          </span>
                          <span className="w-cats__name">{c.name}</span>
                          <span className="w-cats__track">
                            <span style={{ width: `${(s.value / topMax) * 100}%`, background: catColor(c.color).ink }} />
                          </span>
                          <Money value={s.value} size="sm" className="w-cats__amt" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="w-muted">ยังไม่มีรายจ่าย</p>
              )}
            </div>
          </section>

          {/* row 3: the latest transactions */}
          <section className="w-card w-row">
            <div className="w-card__head">
              <h2>รายการล่าสุด</h2>
              <button type="button" className="w-link" onClick={() => navigate('/transactions')}>
                ดูทั้งหมด <Icon icon={faArrowRight} size={11} />
              </button>
            </div>
            <TxTable txs={o.txs.slice(0, RECENT)} categoryOf={categoryOf} onOpen={openManual} />
          </section>
        </>
      )}

      <CategoryTxSheet categoryId={categoryId} txs={o.txs} onClose={() => setCategoryId(null)} />
    </>
  );
}

const MONTH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** Spending per day (week, month) or per month (year), for when there is no plan to draw against. */
function spendingBars(txs: Transaction[], period: Period) {
  const now = Date.now();
  if (period.kind === 'year') {
    const months = MONTH_ABBR.map(() => 0);
    for (const t of txs) if (t.type === 'expense') months[new Date(t.occurredAt).getMonth()] += t.amount + t.fee;
    const thisMonth = isCurrent(period, now) ? new Date(now).getMonth() : -1;
    return months.map((value, i) => ({ label: MONTH_ABBR[i], value, highlight: i === thisMonth }));
  }
  const days = daysIn(period);
  const perDay = expenseByDay(txs, days);
  return days.map((d, i) => ({
    label: period.kind === 'week' ? formatWeekdayAbbr(d) : (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '',
    value: perDay[i],
    highlight: isSameDay(d, now),
  }));
}

/** Share of the budget used, as a ring beside the big figure. */
function BudgetDial({ percent }: { percent: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const over = percent > 100;
  return (
    <svg className="w-dial" viewBox="0 0 70 70" width={70} height={70} role="img" aria-label={`ใช้งบไป ${percent}%`}>
      <circle cx="35" cy="35" r={r} className="w-dial__track" />
      <circle cx="35" cy="35" r={r} className={`w-dial__fill ${over ? 'is-over' : ''}`} strokeDasharray={`${(Math.min(100, percent) / 100) * c} ${c}`} transform="rotate(-90 35 35)" />
      <text x="35" y="40" textAnchor="middle" className="w-dial__text">
        {percent}%
      </text>
    </svg>
  );
}
