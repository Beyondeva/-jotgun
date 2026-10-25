import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { CategoryProvider } from '../features/categories/store';
import { PageLoader } from '../design/components/PageLoader';
import { HomePage } from '../features/home/HomePage';
import { InboxPage } from '../features/inbox/InboxPage';
import { ReaderProvider } from '../features/inbox/reader';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AppLayout } from './AppLayout';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { ShellProvider } from './shell';
import { useMediaQuery, WIDE } from '../lib/useMediaQuery';

// pages with heavy dependencies (charts) or rarely used ones load on first visit
const SummaryPage = lazy(() => import('../features/summary/SummaryPage').then((m) => ({ default: m.SummaryPage })));
const SearchPage = lazy(() => import('../features/search/SearchPage').then((m) => ({ default: m.SearchPage })));
const DesignPreview = lazy(() => import('../features/design-preview/DesignPreview').then((m) => ({ default: m.DesignPreview })));
const MockApp = lazy(() => import('../features/design-preview/MockApp').then((m) => ({ default: m.MockApp })));
// the wide layout (≥ 1024px) only downloads on wide screens
const WideLayout = lazy(() => import('../wide/WideLayout'));
const WideOverview = lazy(() => import('../wide/WideOverview'));
const WideTransactions = lazy(() => import('../wide/WideTransactions'));

/** Phones (and iPad portrait) get the phone layout; iPad landscape and computers the wide one. */
function Layout() {
  return useMediaQuery(WIDE) ? <WideLayout /> : <AppLayout />;
}
function Overview() {
  return useMediaQuery(WIDE) ? <WideOverview /> : <HomePage />;
}
/** รายการ is a wide-screen page; on a phone the home page has the list */
function Transactions() {
  return useMediaQuery(WIDE) ? <WideTransactions /> : <Navigate to="/" replace />;
}

export function App() {
  return (
    <CategoryProvider>
      <HashRouter>
        <ReaderProvider>
          <ShellProvider>
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Overview />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="inbox" element={<InboxPage />} />
                    <Route path="summary" element={<SummaryPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  <Route path="/design-preview" element={<DesignPreview />} />
                  <Route path="/design-preview/app" element={<MockApp />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </ShellProvider>
        </ReaderProvider>
      </HashRouter>
    </CategoryProvider>
  );
}
