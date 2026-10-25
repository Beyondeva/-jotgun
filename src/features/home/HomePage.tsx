import { faArrowRight, faCheck, faChevronDown, faCircleExclamation, faEye, faEyeSlash, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShell } from '../../app/shell';
import { Button, IconButton } from '../../design/components/Button';
import { StackedBar, type Slice } from '../../design/components/StackedBar';
import { EmptyState } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { PageLoader } from '../../design/components/PageLoader';
import { Sheet } from '../../design/components/Sheet';
import { useDecor } from '../../design/decor';
import { Icon } from '../../design/Icon';
import { useBudgets } from '../../db/budgets';
import { db } from '../../db/db';
import { clearDemo, loadDemo, useDemoActive } from '../../db/demo';
import { useCachedLiveQuery } from '../../lib/useCachedLiveQuery';
import { expenseByCategory, totals } from '../../lib/aggregate';
import { paceOf } from '../../lib/pace';
import { budgetStates, worstBudget } from '../../lib/budget';
import { greeting } from '../../lib/greeting';
import { setAmountsHidden, useAmountsHidden, useBahtText } from '../../lib/privacy';
import { daysLeft, isCurrent, periodLabel, periodOf, periodProgress, shiftPeriod, type Period } from '../../lib/period';
import { useCategoryOf } from '../categories/store';
import { CategoryTxSheet } from '../summary/CategoryTxSheet';
import { Ledger } from '../summary/Ledger';
import { Receipt } from '../transactions/Receipt';
import { useTransactions } from '../transactions/useTransactions';
import { usePendingSlips } from '../inbox/usePendingSlips';
import { HeroCatProvider } from '../../mascot/heroCat';
import { BudgetRings } from './BudgetRings';
import { HeroCat } from './HeroCat';
import { useCatTalk } from './useCatTalk';
import { useSwipe } from '../../lib/useSwipe';
import { useMediaQuery, WIDE } from '../../lib/useMediaQuery';
import { PaceChart } from './PaceChart';
import { ReviewSlips } from './ReviewSlips';

const RECENT = 8;

export function HomePage() {
  const navigate = useNavigate();
  const { openManual, removeTx, moveTx } = useShell();
  const categoryOf = useCategoryOf();
  const [period, setPeriod] = useState<Period>(() => periodOf('month', Date.now()));
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const txs = useTransactions(period);
  const previous = useMemo(() => shiftPeriod(period, -1), [period]);
  const prevTxs = useTransactions(previous);
  const pending = usePendingSlips();
  const budgets = useBudgets() ?? [];
  const decor = useDecor();
  const baht = useBahtText();
  const hidden = useAmountsHidden();
  const demo = useDemoActive();
  const wide = useMediaQuery(WIDE);
  const txCount = useCachedLiveQuery('tx:count', () => db.transactions.count(), []);

  const sum = useMemo(() => totals(txs ?? []), [txs]);
  const byCat = useMemo(() => expenseByCategory(txs ?? []), [txs]);
  const slices = useMemo<Slice[]>(
    () =>
      byCat.map(({ categoryId: id, value }) => {
        const c = categoryOf(id);
        return { id, name: c.name, value, color: c.color };
      }),
    [byCat, categoryOf],
  );

  // budgets are per category: compare them only with spending in those categories
  const states = budgetStates(byCat, budgets, periodProgress(period));
  const budgetTotal = states.reduce((s, b) => s + b.limit, 0);
  const budgetLeft = budgetTotal - states.reduce((s, b) => s + b.spent, 0);
  const pace = useMemo(() => {
    if (!txs?.length) return null;
    if (!budgetTotal) return paceOf(txs, period, { previous: prevTxs });
    const budgeted = new Set(budgets.filter((b) => b.monthlyLimit > 0).map((b) => b.categoryId));
    return paceOf(
      txs.filter((t) => budgeted.has(t.categoryId)),
      period,
      { budget: budgetTotal },
    );
  }, [txs, prevTxs, period, budgets, budgetTotal]);

  const current = isCurrent(period);
  const days = daysLeft(period);
  const perDay = sum.balance > 0 && days > 0 ? Math.floor(sum.balance / days) : 0;
  const worst = current ? worstBudget(states) : undefined;

  const worstCat = worst && categoryOf(worst.categoryId);
  const cat = useCatTalk(
    {
      current,
      now: Date.now(),
      txs: txs ?? [],
      pace,
      worst: worst && worstCat ? { name: worstCat.name, status: worst.status === 'over' ? 'over' : 'ahead', ratio: worst.ratio, spent: worst.spent, limit: worst.limit } : undefined,
      top: byCat[0] && { name: categoryOf(byCat[0].categoryId).name, value: byCat[0].value },
      perDay: budgetTotal > 0 ? (budgetLeft > 0 && days > 0 ? Math.floor(budgetLeft / days) : 0) : perDay,
      pending: pending?.length ?? 0,
    },
    period.from,
    txs,
  );

  const swipe = useSwipe({
    // newer months only up to this one
    onLeft: () => setPeriod((p) => (p.from >= periodOf('month', Date.now()).from ? p : shiftPeriod(p, 1))),
    onRight: () => setPeriod((p) => shiftPeriod(p, -1)),
    ignore: '.pace__plot, button',
  });

  // first read from IndexedDB (or a month switch): show the cat instead of ฿0
  // (a decorated theme's art is still downloading: wait rather than jump from plain to scene)
  if (txs === undefined || decor === 'loading') return <PageLoader />;

  const topbar = (
    <header className="topbar">
      <button className="month-btn" onClick={() => setMonthsOpen(true)}>
        {periodLabel(period)} <Icon icon={faChevronDown} size={11} />
      </button>
      <span className="topbar__actions">
        <IconButton icon={hidden ? faEyeSlash : faEye} label={hidden ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'} onClick={() => setAmountsHidden(!hidden)} />
        <IconButton icon={faMagnifyingGlass} label="ค้นหา" onClick={() => navigate('/search')} />
      </span>
    </header>
  );
  const spentLabel = current ? 'ใช้ไปเดือนนี้' : 'ใช้ไปทั้งเดือน';

  return (
    <HeroCatProvider value={cat}>
      {/* one column on phones; from 1100px the overview sits left and the detail right (responsive.css) */}
      <div className="two-col">
        {/* wide screens: the top bar spans both columns instead of sitting in the header art */}
        {wide && <div className="two-col__top">{topbar}</div>}
        <div className="two-col__main">
          {/* flick the header sideways to step through months (the month sheet is the other way) */}
          <div className={`home-head ${decor ? 'home-head--decor' : ''}`} {...swipe}>
            {decor ? (
              // decorated: the same header, drawn over the theme's scene
              <div className="decor-hero">
                <decor.Scene />
                {!wide && topbar}
                <section className="hero">
                  {current && <div className="hero__hello">{greeting()}</div>}
                  <div className="hero__label">{spentLabel}</div>
                  <Money value={sum.expense} size="hero" countUp="home-hero" />
                </section>
              </div>
            ) : (
              !wide && topbar
            )}

            {demo && (
              <div className="demo-bar" role="status">
                <span>
                  <b>ข้อมูลตัวอย่าง</b> · จดจริงครั้งแรกจะล้างให้เอง
                </span>
                <Button variant="quiet" size="sm" onClick={() => void clearDemo()}>
                  ล้างออก
                </Button>
              </div>
            )}

            {/* under a scene, the pace and alert sit on the page below it, away from the art */}
            <section className={`hero ${decor ? 'hero--decor' : ''}`}>
              {!decor && (
                <>
                  <HeroCat />
                  {current && <div className="hero__hello">{greeting()}</div>}
                  <div className="hero__label">{spentLabel}</div>
                  <Money value={sum.expense} size="hero" countUp="home-hero" />
                </>
              )}
              {current && budgetTotal > 0 ? (
                <p className="hero__pace">
                  {budgetLeft >= 0 ? (
                    <>
                      งบเหลือ <b className="num">{baht(budgetLeft)}</b> จาก {baht(budgetTotal)} · วันละ <b className="num">{baht(Math.floor(budgetLeft / days / 100) * 100)}</b>
                    </>
                  ) : (
                    <>
                      <b className="num is-over">เกินงบ {baht(-budgetLeft)}</b> จาก {baht(budgetTotal)}
                    </>
                  )}
                </p>
              ) : (
                current &&
                perDay > 0 && (
                  <p className="hero__pace">
                    ใช้ได้อีกวันละ <b className="num">{baht(Math.floor(perDay / 100) * 100)}</b> · {days} วัน
                  </p>
                )
              )}
              {pace && <PaceChart pace={pace} />}
              {worst && (
                <button className={`hero__alert ${worst.status === 'over' ? 'is-over' : ''}`} onClick={() => navigate('/summary?p=month')}>
                  <Icon icon={faCircleExclamation} size={12} />
                  {categoryOf(worst.categoryId).name} {worst.status === 'over' ? 'เกินงบแล้ว' : `ใช้ไป ${Math.round(worst.ratio * 100)}% ของงบ`}
                </button>
              )}
            </section>
          </div>

          <Ledger totals={sum} />

          {!!pending?.length && <ReviewSlips slips={pending} />}

          {!!txs?.length && states.length > 0 && (
            <BudgetRings states={states} categoryOf={categoryOf} onSelect={setCategoryId} onMore={() => navigate('/summary?p=month')} />
          )}
        </div>

        <div className="two-col__side">
          {txs && txs.length === 0 ? (
            <EmptyState
              mood="sleeping"
              mascot={false}
              title={current ? 'เดือนนี้ยังไม่ได้จด' : 'เดือนนี้ไม่มีรายการ'}
              action={
                current && (
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
          ) : (
            <>
              {slices.length > 0 && (
                <>
                  <div className="section-head">
                    <h2>ไปไหนบ้าง</h2>
                  </div>
                  <StackedBar data={slices} onSelect={(s) => setCategoryId(s.id)} onMore={() => navigate('/summary?p=month')} />
                </>
              )}

              <div className="section-head">
                <h2>รายการล่าสุด</h2>
                <IconButton icon={faArrowRight} label="ดูทั้งหมด" onClick={() => navigate('/summary?p=month')} />
              </div>
              {txs && <Receipt txs={txs.slice(0, RECENT)} categoryOf={categoryOf} onEdit={openManual} onDelete={removeTx} onMove={moveTx} />}
            </>
          )}
        </div>
      </div>

      <MonthSheet open={monthsOpen} value={period} onClose={() => setMonthsOpen(false)} onPick={setPeriod} />
      <CategoryTxSheet categoryId={categoryId} txs={txs ?? []} onClose={() => setCategoryId(null)} />
    </HeroCatProvider>
  );
}

function MonthSheet({ open, value, onClose, onPick }: { open: boolean; value: Period; onClose: () => void; onPick: (p: Period) => void }) {
  const months = useMemo(() => {
    const now = periodOf('month', Date.now());
    return Array.from({ length: 12 }, (_, i) => shiftPeriod(now, -i));
  }, []);
  return (
    <Sheet open={open} onClose={onClose} title="เลือกเดือน">
      <div className="list">
        {months.map((m) => (
          <button
            key={m.from}
            className="list__row"
            onClick={() => {
              onPick(m);
              onClose();
            }}
          >
            <span className="list__label">{periodLabel(m)}</span>
            <span />
            {m.from === value.from ? <Icon icon={faCheck} size={13} /> : <span />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
