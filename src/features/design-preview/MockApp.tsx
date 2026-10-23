import {
  faAngleRight,
  faArrowRight,
  faCamera,
  faCheckDouble,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, IconButton } from '../../design/components/Button';
import { DailyBars, DonutChart } from '../../design/components/Charts';
import { StackedBar, type Slice } from '../../design/components/StackedBar';
import { EmptyState, ProgressBar, Skeleton } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { Paper } from '../../design/components/Paper';
import { Segmented } from '../../design/components/Segmented';
import { Sheet } from '../../design/components/Sheet';
import { DoneStamp } from '../../design/components/Stamp';
import { TabBar, type TabKey } from '../../design/components/TabBar';
import { Icon, type IconDefinition } from '../../design/Icon';
import type { Category } from '../../db/types';
import { formatMonth } from '../../lib/date';
import { greeting } from '../../lib/greeting';
import { useThemePref, type ThemePref } from '../../lib/theme';
import { KhaoTang } from '../../mascot/KhaoTang';
import { CategoryEditorSheet } from '../categories/CategoryEditor';
import { CategoryList } from '../categories/CategoryList';
import { forType, useCategories } from '../categories/store';
import { SlipCard, SlipThumbMock } from '../inbox/SlipCard';
import { CategoryBars } from '../summary/CategoryBars';
import { Receipt } from '../transactions/Receipt';
import { BANK_NAME, BANK_TINT, BUDGETS, MOCK_SLIPS, MOCK_TX, MONTH, WEEK_BARS, catById, type MockSlip } from './mockData';

const categoryOf = (id: string) => catById[id];

const pageMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** Interactive mock of the real app shell, for design approval only. */
export function MockApp() {
  const [tab, setTabState] = useState<TabKey>('home');
  const setTab = (t: TabKey) => {
    setTabState(t);
    window.scrollTo({ top: 0 });
  };
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [slips, setSlips] = useState(MOCK_SLIPS);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.main key={tab} className="page" {...pageMotion}>
          {tab === 'home' && <HomeMock slips={slips} onCategory={setCategory} onInbox={() => setTab('inbox')} />}
          {tab === 'inbox' && <InboxMock slips={slips} setSlips={setSlips} />}
          {tab === 'summary' && <SummaryMock onCategory={setCategory} />}
          {tab === 'settings' && <SettingsMock />}
        </motion.main>
      </AnimatePresence>

      <TabBar active={tab} onChange={setTab} onAdd={() => setAddOpen(true)} inboxCount={slips.length} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="จดรายการใหม่">
        <div className="add-list">
          <AddRow
            icon={faCamera}
            title="อ่านสลิปจากรูป"
            onClick={() => {
              setAddOpen(false);
              setSlips(MOCK_SLIPS);
              setTab('inbox');
            }}
          />
          <AddRow icon={faPen} title="จดเอง" onClick={() => setAddOpen(false)} />
        </div>
      </Sheet>

      <Sheet open={!!category} onClose={() => setCategory(null)} title={category?.name}>
        {category && <CategoryDetail category={category} />}
      </Sheet>
    </>
  );
}

function AddRow({ icon, title, onClick }: { icon: IconDefinition; title: string; onClick: () => void }) {
  return (
    <button className="add-row" onClick={onClick}>
      <span className="add-row__icon">
        <Icon icon={icon} size={16} />
      </span>
      <span className="add-row__title">{title}</span>
      <Icon icon={faAngleRight} size={14} className="list__chev" />
    </button>
  );
}

function CategoryDetail({ category }: { category: Category }) {
  const list = MOCK_TX.filter((t) => t.categoryId === category.id);
  if (list.length === 0) return <EmptyState mood="sleeping" title="ยังไม่มีรายการ" />;
  return <Receipt txs={list} categoryOf={categoryOf} />;
}

function Ledger({ income, expense }: { income: number; expense: number }) {
  return (
    <div className="ledger">
      <div className="ledger__col">
        <span className="ledger__label">รายรับ</span>
        <Money value={income} size="sm" tone="income" countUp />
      </div>
      <div className="ledger__col">
        <span className="ledger__label">รายจ่าย</span>
        <Money value={expense} size="sm" countUp />
      </div>
      <div className="ledger__col">
        <span className="ledger__label">คงเหลือ</span>
        <Money value={income - expense} size="sm" countUp />
      </div>
    </div>
  );
}

function useSlices(): Slice[] {
  return useMemo(() => MONTH.byCategory.map((s) => ({ id: s.id, name: s.name, value: s.value, color: s.color })), []);
}

function daysLeftInMonth(now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return end - now.getDate() + 1;
}

function HomeMock({ slips, onCategory, onInbox }: { slips: MockSlip[]; onCategory: (c: Category) => void; onInbox: () => void }) {
  const slices = useSlices();
  const left = MONTH.income - MONTH.expense;
  const days = daysLeftInMonth();

  return (
    <>
      <header className="topbar">
        <button className="month-btn">
          {formatMonth(Date.now())} <Icon icon={faChevronDown} size={11} />
        </button>
        <IconButton icon={faMagnifyingGlass} label="ค้นหา" />
      </header>

      <section className="hero">
        <div className="hero__hello">{greeting()} คุณเจ้าของ</div>
        <div className="hero__label">ใช้ไปเดือนนี้</div>
        <Money value={MONTH.expense} size="hero" countUp />
        <p className="hero__pace">
          ใช้ได้อีกวันละ <b className="num">฿{Math.floor(left / 100 / days).toLocaleString('en-US')}</b> · {days} วัน
        </p>
      </section>

      <Ledger income={MONTH.income} expense={MONTH.expense} />

      <div className="section-head">
        <h2>ไปไหนบ้าง</h2>
      </div>
      <StackedBar data={slices} onSelect={(s) => onCategory(catById[s.id])} />

      {slips.length > 0 && (
        <Paper pressable className="inbox-strip" onClick={onInbox} role="button">
          <span className="inbox-strip__thumbs">
            {slips.slice(0, 3).map((s, i) => (
              <span key={s.id} style={{ left: i * 10, transform: `rotate(${(i - 1) * 5}deg)`, zIndex: 3 - i }}>
                <SlipThumbMock tint={BANK_TINT[s.bank]} />
              </span>
            ))}
          </span>
          <span className="inbox-strip__title">รอจด {slips.length} ใบ</span>
          <span className="inbox-strip__go">
            <Icon icon={faAngleRight} size={14} />
          </span>
        </Paper>
      )}

      <div className="section-head">
        <h2>รายการล่าสุด</h2>
        <IconButton icon={faArrowRight} label="ดูทั้งหมด" />
      </div>
      <Receipt txs={MOCK_TX.slice(0, 6)} categoryOf={categoryOf} onDelete={() => {}} onEdit={() => {}} />
    </>
  );
}

function InboxMock({ slips, setSlips }: { slips: MockSlip[]; setSlips: (s: MockSlip[]) => void }) {
  const TOTAL = 12;
  const { categories } = useCategories();
  const [creatingFor, setCreatingFor] = useState<MockSlip | null>(null);
  const [read, setRead] = useState(3);
  const [done, setDone] = useState(false);
  const reading = read < TOTAL && slips.length > 0;

  useEffect(() => {
    if (!reading) return;
    const t = setTimeout(() => setRead((r) => r + 1), 450);
    return () => clearTimeout(t);
  }, [read, reading]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1900);
    return () => clearTimeout(t);
  }, [done]);

  const remove = (ids: string[]) => {
    const next = slips.filter((s) => !ids.includes(s.id));
    setSlips(next);
    if (next.length === 0) setDone(true);
  };

  return (
    <>
      <h1 className="page-title">
        รอจด {slips.length > 0 && <span className="page-title__count num">{slips.length}</span>}
      </h1>

      {reading && (
        <div className="reading">
          <KhaoTang mood="reading" size={60} />
          <div className="reading__text">
            <span className="reading__count num">
              อ่านแล้ว {read}/{TOTAL} ใบ
            </span>
            <ProgressBar value={read} max={TOTAL} />
          </div>
        </div>
      )}

      {slips.length === 0 ? (
        <EmptyState
          mood={done ? 'celebrate' : 'sleeping'}
          title={done ? 'จดครบแล้ว' : 'ไม่มีสลิปรอจด'}
          action={
            !done && (
              <Button variant="quiet" icon={faCamera} onClick={() => setSlips(MOCK_SLIPS)}>
                สลิปตัวอย่าง
              </Button>
            )
          }
        />
      ) : (
        <div className="slip-stack">
          <AnimatePresence initial={false} mode="popLayout">
            {slips.map((s) => (
              <SlipCard
                key={s.id}
                thumb={<SlipThumbMock tint={BANK_TINT[s.bank]} />}
                bankName={BANK_NAME[s.bank]}
                amount={s.amount}
                counterparty={s.receiver}
                occurredAt={s.occurredAt}
                refNo={s.refNo}
                categories={forType(categories, 'expense')}
                suggestedCategoryId={s.suggestedCategoryId}
                lowConfidence={s.lowConfidence}
                onPick={() => remove([s.id])}
                onCreate={() => setCreatingFor(s)}
              />
            ))}
          </AnimatePresence>
          {reading && (
            <Paper className="skeleton-slip">
              <Skeleton w={64} h={92} r={4} />
              <div className="skeleton-slip__lines">
                <Skeleton w="50%" h={22} />
                <Skeleton w="75%" />
                <Skeleton w="40%" h={10} />
              </div>
            </Paper>
          )}
          <div className="sticky-action">
            <Button variant="ink" size="lg" block icon={faCheckDouble} onClick={() => remove(slips.map((s) => s.id))}>
              ยืนยันทั้งหมด {slips.length}
            </Button>
          </div>
        </div>
      )}

      {done && <DoneStamp />}

      <CategoryEditorSheet
        open={!!creatingFor}
        onClose={() => setCreatingFor(null)}
        draft={creatingFor ? { kind: 'expense', keywords: [creatingFor.receiver] } : undefined}
        onSaved={() => creatingFor && remove([creatingFor.id])}
      />
    </>
  );
}

function SummaryMock({ onCategory }: { onCategory: (c: Category) => void }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const slices = useSlices();
  const now = new Date();
  const monthProgress = now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const foodUsed = MONTH.byCategory.find((c) => c.id === 'food')!.value / BUDGETS.food;
  const worried = foodUsed > monthProgress + 0.1;
  const weekExpense = 543700;

  return (
    <>
      <h1 className="page-title">สรุป</h1>
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: 'สัปดาห์' },
          { value: 'month', label: 'เดือน' },
        ]}
      />
      <div className="period">
        <IconButton icon={faChevronLeft} label="ก่อนหน้า" />
        <span className="period__label">{period === 'week' ? '17 – 23 ต.ค. 69' : formatMonth(Date.now())}</span>
        <IconButton icon={faChevronRight} label="ถัดไป" />
      </div>

      <Ledger income={period === 'week' ? 3300000 : MONTH.income} expense={period === 'week' ? weekExpense : MONTH.expense} />

      <div className="section-head">
        <h2>ใช้จ่ายรายวัน</h2>
        <span className="section-head__note num">เฉลี่ยวันละ ฿{Math.round(weekExpense / 7 / 100).toLocaleString('en-US')}</span>
      </div>
      <DailyBars data={WEEK_BARS} />

      <div className="note">
        <KhaoTang mood={worried ? 'worried' : 'happy'} size={56} />
        <div>
          <div className="note__title">{worried ? 'อาหารใช้เร็วไปหน่อย' : 'ทุกหมวดยังอยู่ในงบ'}</div>
          {worried && (
            <div className="note__body num">
              งบ {Math.round(foodUsed * 100)}% · เดือน {Math.round(monthProgress * 100)}%
            </div>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>ตามหมวดหมู่</h2>
      </div>
      <Paper>
        <div className="by-cat">
          <DonutChart data={slices} size={132} label="รายจ่าย" onSelect={(s) => onCategory(catById[s.id])} />
          <SliceLegend slices={slices} onSelect={(s) => onCategory(catById[s.id])} />
        </div>
        <CategoryBars
          rows={MONTH.byCategory.map((s) => ({ category: catById[s.id], value: s.value, budget: BUDGETS[s.id] }))}
          periodProgress={monthProgress}
          onSelect={onCategory}
        />
      </Paper>
    </>
  );
}

function SliceLegend({ slices, onSelect }: { slices: Slice[]; onSelect: (s: Slice) => void }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="stack__legend" style={{ flexDirection: 'column', gap: 0 }}>
      {slices.slice(0, 4).map((d) => (
        <button key={d.id} type="button" className="stack__item" onClick={() => onSelect(d)}>
          <span className="stack__dot" style={{ background: `var(--cat-${d.color})` }} />
          {d.name}
          <span className="stack__pct num">{Math.round((d.value / total) * 100)}%</span>
        </button>
      ))}
    </div>
  );
}

function SettingsMock() {
  const [theme, setTheme] = useThemePref();
  const { categories, rules } = useCategories();
  const [listOpen, setListOpen] = useState(false);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const navigate = useNavigate();
  const rows: { label: string; value?: string; onClick?: () => void }[] = [
    { label: 'ชื่อเจ้าของบัญชี', value: '2 ชื่อ' },
    { label: 'หมวดหมู่', value: String(categories.length), onClick: () => setListOpen(true) },
    { label: 'คำจัดหมวดอัตโนมัติ', value: String(rules.length) },
    { label: 'งบรายหมวด', value: '3 หมวด' },
  ];

  return (
    <>
      <h1 className="page-title">ตั้งค่า</h1>

      <div className="list-cap">ธีม</div>
      <Segmented<ThemePref>
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'system', label: 'ตามเครื่อง' },
          { value: 'light', label: 'สว่าง' },
          { value: 'dark', label: 'มืด' },
        ]}
      />

      <div className="list-cap">บัญชีและหมวด</div>
      <Paper className="list">
        {rows.map((r) => (
          <button key={r.label} className="list__row" onClick={r.onClick}>
            <span className="list__label">{r.label}</span>
            {r.value ? <span className="list__value num">{r.value}</span> : <span />}
            <Icon icon={faAngleRight} size={13} className="list__chev" />
          </button>
        ))}
      </Paper>

      <div className="list-cap">ข้อมูล</div>
      <Paper className="list">
        <button className="list__row">
          <span className="list__label">สำรองข้อมูล (JSON)</span>
          <span />
          <Icon icon={faAngleRight} size={13} className="list__chev" />
        </button>
        <button className="list__row">
          <span className="list__label">ส่งออก CSV</span>
          <span />
          <Icon icon={faAngleRight} size={13} className="list__chev" />
        </button>
      </Paper>

      <div style={{ marginTop: 24 }}>
        <Button variant="ghost" onClick={() => navigate('/design-preview')}>
          ← กลับไปหน้า Design preview
        </Button>
      </div>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="หมวดหมู่">
        <CategoryList onEdit={setEditing} onCreate={() => setEditing('new')} />
      </Sheet>
      <CategoryEditorSheet open={editing !== null} onClose={() => setEditing(null)} category={editing && editing !== 'new' ? editing : undefined} />
    </>
  );
}
