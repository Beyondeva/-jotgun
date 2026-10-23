import { faCamera, faPen, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router';
import { PageLoader } from '../design/components/PageLoader';
import { Sheet } from '../design/components/Sheet';
import { TabBar, type TabKey } from '../design/components/TabBar';
import { useDecor } from '../design/decor';
import { Icon } from '../design/Icon';
import { useReader } from '../features/inbox/reader';
import { usePendingCount } from '../features/inbox/usePendingSlips';
import { useShell } from './shell';

const TAB_PATH: Record<TabKey, string> = { home: '/', inbox: '/inbox', summary: '/summary', settings: '/settings' };

const tabOf = (path: string): TabKey => (path.startsWith('/inbox') ? 'inbox' : path.startsWith('/summary') ? 'summary' : path.startsWith('/settings') ? 'settings' : 'home');

/** Tab bar + the add sheet around the routed page. */
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { openManual } = useShell();
  const [addOpen, setAddOpen] = useState(false);
  const pending = usePendingCount();
  const { readFiles } = useReader();
  const fileInput = useRef<HTMLInputElement>(null);
  const decor = useDecor();

  // tabs switch instantly like a native tab bar; just start each page at the top
  // braces matter: newer browsers return a Promise from scrollTo, which React would treat as a cleanup
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      {decor && decor !== 'loading' && (
        <div className="decor-pattern" aria-hidden>
          <decor.Pattern />
        </div>
      )}
      <main className="page">
        {/* lazy pages (summary, search) load here; the tab bar stays put */}
        <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
      </main>

      <TabBar active={tabOf(location.pathname)} onChange={(t) => navigate(TAB_PATH[t])} onAdd={() => setAddOpen(true)} inboxCount={pending} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="จดรายการใหม่">
        <div className="add-list">
          {/* the picker must open inside the tap itself, or iOS blocks it */}
          <button className="add-row" onClick={() => fileInput.current?.click()}>
            <span className="add-row__icon">
              <Icon icon={faCamera} size={16} />
            </span>
            <span className="add-row__title">อ่านสลิปจากรูป</span>
            <Icon icon={faAngleRight} size={14} className="list__chev" />
          </button>
          <button
            className="add-row"
            onClick={() => {
              setAddOpen(false);
              openManual();
            }}
          >
            <span className="add-row__icon">
              <Icon icon={faPen} size={16} />
            </span>
            <span className="add-row__title">จดเอง</span>
            <Icon icon={faAngleRight} size={14} className="list__chev" />
          </button>
        </div>
      </Sheet>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ''; // allow picking the same files again
          if (!files.length) return;
          setAddOpen(false);
          readFiles(files);
          navigate('/inbox');
        }}
      />
    </>
  );
}
