import { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router';
import { PageLoader } from '../design/components/PageLoader';
import { TabBar, type TabKey } from '../design/components/TabBar';
import { useDecor } from '../design/decor';
import { usePendingCount } from '../features/inbox/usePendingSlips';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { AddSheet } from './AddSheet';

const TAB_PATH: Record<TabKey, string> = { home: '/', inbox: '/inbox', summary: '/summary', settings: '/settings' };

const tabOf = (path: string): TabKey => (path.startsWith('/inbox') ? 'inbox' : path.startsWith('/summary') ? 'summary' : path.startsWith('/settings') ? 'settings' : 'home');

/** Tab bar + the add sheet around the routed page. */
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const [addOpen, setAddOpen] = useState(false);
  const pending = usePendingCount();
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
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageLoader />}>{outlet}</Suspense>
        </RouteErrorBoundary>
      </main>

      <TabBar active={tabOf(location.pathname)} onChange={(t) => navigate(TAB_PATH[t])} onAdd={() => setAddOpen(true)} inboxCount={pending} />

      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
