import { faAngleRight, faArrowRight, faCheck, faChevronDown, faCircleExclamation, faEye, faEyeSlash, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShell } from '../../app/shell';
import { Button, IconButton } from '../../design/components/Button';
import { StackedBar, type Slice } from '../../design/components/StackedBar';
import { EmptyState } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { PageLoader } from '../../design/components/PageLoader';
import { Paper } from '../../design/components/Paper';
import { Sheet } from '../../design/components/Sheet';
import { useDecor } from '../../design/decor';
import { Icon } from '../../design/Icon';
import { useBudgets } from '../../db/budgets';
import { expenseByCategory, totals } from '../../lib/aggregate';
import { budgetStates, worstBudget } from '../../lib/budget';
import { greeting } from '../../lib/greeting';
import { setAmountsHidden, useAmountsHidden, useBahtText } from '../../lib/privacy';
import { daysLeft, isCurrent, periodLabel, periodOf, periodProgress, shiftPeriod, type Period } from '../../lib/period';
import { useCategoryOf } from '../categories/store';
import { CategoryTxSheet } from '../summary/CategoryTxSheet';
import { Ledger } from '../summary/Ledger';
import { Receipt } from '../transactions/Receipt';
import { useTransactions } from '../transactions/useTransactions';
import { InboxThumbs } from '../inbox/InboxThumbs';
import { usePendingSlips } from '../inbox/usePendingSlips';

const RECENT = 8;

export function HomePage() {
  const navigate = useNavigate();
  const { openManual, removeTx } = useShell();
  const categoryOf = useCategoryOf();
  const [period, setPeriod] = useState<Period>(() => periodOf('month', Date.now()));
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const txs = useTransactions(period);
  const pending = usePendingSlips();
  const budgets = useBudgets() ?? [];
  const decor = useDecor();
  const baht = useBahtText();
  const hidden = useAmountsHidden();

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

  const current = isCurrent(period);
  const days = daysLeft(period);
  const perDay = sum.balance > 0 && days > 0 ? Math.floor(sum.balance / days) : 0;
  const worst = current ? worstBudget(budgetStates(byCat, budgets, periodProgress(period))) : undefined;

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
    <>
      {decor ? (
        // decorated: the same header, drawn over the theme's scene
        <div className="decor-hero">
          <decor.Scene />
          {topbar}
          <section className="hero">
            {current && <div className="hero__hello">{greeting()}</div>}
            <div className="hero__label">{spentLabel}</div>
            <Money value={sum.expense} size="hero" countUp="home-hero" />
          </section>
        </div>
      ) : (
        topbar
      )}

      {/* under a scene, the pace and alert sit on the page below it, away from the art */}
      <section className={`hero ${decor ? 'hero--decor' : ''}`}>
        {!decor && (
          <>
            {current && <div className="hero__hello">{greeting()}</div>}
            <div className="hero__label">{spentLabel}</div>
            <Money value={sum.expense} size="hero" countUp="home-hero" />
          </>
        )}
        {current && perDay > 0 && (
          <p className="hero__pace">
            ใช้ได้อีกวันละ <b className="num">{baht(Math.floor(perDay / 100) * 100)}</b> · {days} วัน
          </p>
        )}
        {worst && (
          <button className={`hero__alert ${worst.status === 'over' ? 'is-over' : ''}`} onClick={() => navigate('/summary?p=month')}>
            <Icon icon={faCircleExclamation} size={12} />
            {categoryOf(worst.categoryId).name} {worst.status === 'over' ? 'เกินงบแล้ว' : `ใช้ไป ${Math.round(worst.ratio * 100)}% ของงบ`}
          </button>
        )}
      </section>

      <Ledger totals={sum} />

      {!!pending?.length && (
        <Paper pressable className="inbox-strip" onClick={() => navigate('/inbox')} role="button">
          <InboxThumbs slips={pending} />
          <span className="inbox-strip__title">รอจด {pending.length} ใบ</span>
          <span className="inbox-strip__go">
            <Icon icon={faAngleRight} size={14} />
          </span>
        </Paper>
      )}

      {txs && txs.length === 0 ? (
        <EmptyState
          mood="sleeping"
          title={current ? 'เดือนนี้ยังไม่ได้จด' : 'เดือนนี้ไม่มีรายการ'}
          action={
            current && (
              <Button variant="ink" onClick={() => openManual()}>
                จดรายการแรก
              </Button>
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
          {txs && <Receipt txs={txs.slice(0, RECENT)} categoryOf={categoryOf} onEdit={openManual} onDelete={removeTx} />}
        </>
      )}

      <MonthSheet open={monthsOpen} value={period} onClose={() => setMonthsOpen(false)} onPick={setPeriod} />
      <CategoryTxSheet categoryId={categoryId} txs={txs ?? []} onClose={() => setCategoryId(null)} />
    </>
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
