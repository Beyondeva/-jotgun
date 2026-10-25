import { faChartColumn, faChevronLeft, faChevronRight, faGear, faHouse, faInbox, faListUl, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation, useNavigate, useOutlet, useSearchParams } from 'react-router';
import { AddSheet } from '../app/AddSheet';
import { RouteErrorBoundary } from '../app/RouteErrorBoundary';
import { PageLoader } from '../design/components/PageLoader';
import { useDecor } from '../design/decor';
import { Icon, type IconDefinition } from '../design/Icon';
import { usePendingCount } from '../features/inbox/usePendingSlips';
import { periodLabel, type PeriodKind } from '../lib/period';
import { COARSE, useMediaQuery } from '../lib/useMediaQuery';
import { useWidePeriod, WidePeriodProvider } from './period';
import './wide.css';

const NAV: { path: string; label: string; icon: IconDefinition }[] = [
  { path: '/', label: 'ภาพรวม', icon: faHouse },
  { path: '/transactions', label: 'รายการ', icon: faListUl },
  { path: '/inbox', label: 'รอจด', icon: faInbox },
  { path: '/summary', label: 'สรุป', icon: faChartColumn },
];
/** pages built for the wide layout; the others keep their phone column, centred */
const FULL = ['/', '/transactions'];

/**
 * iPad landscape and computers (≥ 1024px): a sidebar, a top bar and a content area up to
 * 1280px. Phones use AppLayout; pages and data are shared.
 */
export default function WideLayout() {
  return (
    <WidePeriodProvider>
      <Shell />
    </WidePeriodProvider>
  );
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const pending = usePendingCount();
  const decor = useDecor();
  const coarse = useMediaQuery(COARSE);
  const [addOpen, setAddOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const path = location.pathname;
  const isOn = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));

  // "/" searches and "N" adds, unless you're typing somewhere or a sheet is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('.sheet-root')) return;
      if (e.key === '/') {
        e.preventDefault();
        search.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setAddOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  const full = FULL.includes(path);

  return (
    <div className="w-app">
      {decor && decor !== 'loading' && (
        <div className="decor-pattern" aria-hidden>
          <decor.Pattern />
        </div>
      )}

      <nav className="w-side" aria-label="เมนูหลัก">
        <div className="w-brand">จดกัน</div>
        {NAV.map((n) => (
          <button key={n.path} type="button" className={`w-nav ${isOn(n.path) ? 'is-on' : ''}`} aria-current={isOn(n.path) ? 'page' : undefined} onClick={() => navigate(n.path)}>
            <Icon icon={n.icon} size={17} />
            <span>{n.label}</span>
            {n.path === '/inbox' && pending > 0 && (
              <span className="w-count num" aria-label={`ค้าง ${pending} ใบ`}>
                {pending > 99 ? '99+' : pending}
              </span>
            )}
          </button>
        ))}
        <span className="w-side__gap" />
        <button type="button" className={`w-nav ${isOn('/settings') ? 'is-on' : ''}`} aria-current={isOn('/settings') ? 'page' : undefined} onClick={() => navigate('/settings')}>
          <Icon icon={faGear} size={17} />
          <span>ตั้งค่า</span>
        </button>
      </nav>

      <div className="w-main">
        <div className="w-content">
          <TopBar searchRef={search} showPeriod={full} onAdd={coarse ? undefined : () => setAddOpen(true)} />
          <div className={full ? 'w-page' : 'w-page w-page--narrow'}>
            <RouteErrorBoundary key={path}>
              <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
            </RouteErrorBoundary>
          </div>
        </div>
      </div>

      {/* a finger (iPad): "add" floats under the right thumb instead of sitting in the top bar */}
      {coarse && (
        <button type="button" className="w-fab" onClick={() => setAddOpen(true)} aria-label="จดรายการใหม่">
          <Icon icon={faPlus} size={24} />
        </button>
      )}
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

const KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: 'week', label: 'สัปดาห์' },
  { kind: 'month', label: 'เดือน' },
  { kind: 'year', label: 'ปี' },
];

function TopBar({ searchRef, showPeriod, onAdd }: { searchRef: RefObject<HTMLInputElement | null>; showPeriod: boolean; onAdd?: () => void }) {
  const { period, setKind, step, canStepForward } = useWidePeriod();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const onList = location.pathname === '/transactions';
  const [draft, setDraft] = useState('');
  // on รายการ the box filters the list as you type; elsewhere Enter takes you there
  const query = onList ? (params.get('q') ?? '') : draft;

  return (
    <header className="w-bar">
      {showPeriod && (
        <>
          <span className="w-bar__steps">
            <button type="button" className="w-icon-btn" onClick={() => step(-1)} aria-label="ช่วงก่อนหน้า">
              <Icon icon={faChevronLeft} size={14} />
            </button>
            <button type="button" className="w-icon-btn" onClick={() => step(1)} disabled={!canStepForward} aria-label="ช่วงถัดไป">
              <Icon icon={faChevronRight} size={14} />
            </button>
          </span>
          <h1 className="w-bar__title">{periodLabel(period)}</h1>
          <div className="w-seg" role="radiogroup" aria-label="ช่วงเวลา">
            {KINDS.map((k) => (
              <button key={k.kind} type="button" role="radio" aria-checked={period.kind === k.kind} className={period.kind === k.kind ? 'is-on' : ''} onClick={() => setKind(k.kind)}>
                {k.label}
              </button>
            ))}
          </div>
        </>
      )}
      <form
        className="w-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!onList) navigate(`/transactions?q=${encodeURIComponent(draft.trim())}`);
          searchRef.current?.blur();
        }}
      >
        <Icon icon={faMagnifyingGlass} size={14} />
        <input
          ref={searchRef}
          type="search"
          value={query}
          placeholder="ค้นหารายการ ร้าน หมวด"
          aria-label="ค้นหารายการ"
          aria-keyshortcuts="/"
          onChange={(e) => (onList ? setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }) : setDraft(e.target.value))}
        />
        <kbd aria-hidden>/</kbd>
      </form>
      {onAdd && (
        <button type="button" className="btn btn--primary btn--md w-bar__add" onClick={onAdd} aria-keyshortcuts="N">
          <Icon icon={faPlus} size={14} />
          จดรายการ
        </button>
      )}
    </header>
  );
}
