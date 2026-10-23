import { faBuildingColumns, faChevronLeft, faCreditCard, faMagnifyingGlass, faMoneyBill, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShell } from '../../app/shell';
import { IconButton } from '../../design/components/Button';
import { EmptyState } from '../../design/components/Feedback';
import { Money } from '../../design/components/Money';
import { PageLoader } from '../../design/components/PageLoader';
import { Tag } from '../../design/components/Tag';
import { Icon, type IconDefinition } from '../../design/Icon';
import { db } from '../../db/db';
import type { PayMethod, TxType } from '../../db/types';
import { totals } from '../../lib/aggregate';
import { useCachedLiveQuery } from '../../lib/useCachedLiveQuery';
import { periodOf, shiftPeriod } from '../../lib/period';
import { EMPTY_FILTER, filterTransactions, isFiltered, type TxFilter } from '../../lib/search';
import { useCategories, useCategoryOf } from '../categories/store';
import { Receipt } from '../transactions/Receipt';
import './search.css';

const SHOW_MAX = 200;

const RANGES: { key: string; label: string; from: () => number | undefined }[] = [
  { key: 'all', label: 'ทุกช่วง', from: () => undefined },
  { key: 'month', label: 'เดือนนี้', from: () => periodOf('month', Date.now()).from },
  { key: '3m', label: '3 เดือน', from: () => shiftPeriod(periodOf('month', Date.now()), -2).from },
  { key: 'year', label: 'ปีนี้', from: () => new Date(new Date().getFullYear(), 0, 1).getTime() },
];

const METHODS: { value: PayMethod; label: string; icon: IconDefinition }[] = [
  { value: 'cash', label: 'เงินสด', icon: faMoneyBill },
  { value: 'credit', label: 'บัตรเครดิต', icon: faCreditCard },
  { value: 'transfer', label: 'โอน', icon: faBuildingColumns },
];

export function SearchPage() {
  const navigate = useNavigate();
  const { openManual, removeTx } = useShell();
  const { categories } = useCategories();
  const categoryOf = useCategoryOf();
  const all = useCachedLiveQuery('tx:all', () => db.transactions.orderBy('occurredAt').reverse().toArray(), []);
  const [filter, setFilter] = useState<TxFilter>(EMPTY_FILTER);
  const [range, setRange] = useState('all');

  const set = (patch: Partial<TxFilter>) => setFilter((f) => ({ ...f, ...patch }));
  const results = useMemo(() => filterTransactions(all ?? [], filter, (id) => categoryOf(id).name), [all, filter, categoryOf]);
  const sum = totals(results);

  if (all === undefined) return <PageLoader />;

  return (
    <>
      <header className="topbar">
        <IconButton icon={faChevronLeft} label="กลับ" onClick={() => navigate(-1)} />
      </header>

      <label className="search-box">
        <Icon icon={faMagnifyingGlass} size={14} />
        <input
          type="search"
          value={filter.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="ชื่อร้าน โน้ต หมวด หรือยอดเงิน"
          autoFocus
          enterKeyHint="search"
        />
        {filter.query && <IconButton icon={faXmark} label="ล้างคำค้น" onClick={() => set({ query: '' })} />}
      </label>

      <div className="search-filters">
        <div className="tag-row">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <Tag key={t} label={t === 'all' ? 'ทั้งหมด' : t === 'expense' ? 'รายจ่าย' : 'รายรับ'} selected={filter.type === t} onClick={() => set({ type: t as TxType | 'all' })} />
          ))}
          <span className="search-filters__sep" />
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`tag tag--icon ${filter.method === m.value ? 'is-selected' : ''}`}
              aria-label={m.label}
              aria-pressed={filter.method === m.value}
              onClick={() => set({ method: filter.method === m.value ? 'all' : m.value })}
            >
              <Icon icon={m.icon} size={13} />
            </button>
          ))}
        </div>
        <div className="tag-row">
          {RANGES.map((r) => (
            <Tag
              key={r.key}
              label={r.label}
              selected={range === r.key}
              onClick={() => {
                setRange(r.key);
                set({ from: r.from() });
              }}
            />
          ))}
        </div>
        <div className="tag-row">
          {categories.map((c) => (
            <Tag
              key={c.id}
              label={c.name}
              icon={c.icon}
              color={c.color}
              selected={filter.categoryIds.includes(c.id)}
              onClick={() =>
                set({ categoryIds: filter.categoryIds.includes(c.id) ? filter.categoryIds.filter((x) => x !== c.id) : [...filter.categoryIds, c.id] })
              }
            />
          ))}
        </div>
      </div>

      {all && results.length === 0 ? (
        <EmptyState mood="sleeping" title={isFiltered(filter) ? 'ไม่เจอรายการที่ตรง' : 'ยังไม่มีรายการ'} />
      ) : (
        <>
          <div className="search-sum">
            <span className="num">{results.length} รายการ</span>
            <span className="search-sum__money">
              {sum.expense > 0 && <Money value={sum.expense} size="sm" flow="out" />}
              {sum.income > 0 && <Money value={sum.income} size="sm" flow="in" />}
            </span>
          </div>
          <Receipt txs={results.slice(0, SHOW_MAX)} categoryOf={categoryOf} onEdit={openManual} onDelete={removeTx} />
          {results.length > SHOW_MAX && <p className="search-more num">แสดง {SHOW_MAX} รายการล่าสุด · กรองเพิ่มเพื่อดูที่เหลือ</p>}
        </>
      )}
    </>
  );
}
