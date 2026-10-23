import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { CategoryProvider } from '../features/categories/store';
import { PageLoader } from '../design/components/PageLoader';
import { HomePage } from '../features/home/HomePage';
import { InboxPage } from '../features/inbox/InboxPage';
import { ReaderProvider } from '../features/inbox/reader';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AppLayout } from './AppLayout';
import { ShellProvider } from './shell';

// pages with heavy dependencies (charts) or rarely used ones load on first visit
const SummaryPage = lazy(() => import('../features/summary/SummaryPage').then((m) => ({ default: m.SummaryPage })));
const SearchPage = lazy(() => import('../features/search/SearchPage').then((m) => ({ default: m.SearchPage })));
const DesignPreview = lazy(() => import('../features/design-preview/DesignPreview').then((m) => ({ default: m.DesignPreview })));
const MockApp = lazy(() => import('../features/design-preview/MockApp').then((m) => ({ default: m.MockApp })));

export function App() {
  return (
    <CategoryProvider>
      <HashRouter>
        <ReaderProvider>
          <ShellProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
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
          </ShellProvider>
        </ReaderProvider>
      </HashRouter>
    </CategoryProvider>
  );
}
