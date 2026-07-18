import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';

const CompanyListPage = lazy(() => import('./pages/CompanyListPage'));
const CompanyCreatePage = lazy(() => import('./pages/CompanyCreatePage'));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'));
const BundleListPage = lazy(() => import('./pages/BundleListPage'));
const BundleCreatePage = lazy(() => import('./pages/BundleCreatePage'));
const BundleDetailPage = lazy(() => import('./pages/BundleDetailPage'));
const BundleFileViewerPage = lazy(() => import('./pages/BundleFileViewerPage'));
const BundleSpawnPage = lazy(() => import('./pages/BundleSpawnPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-[#e5e7eb] border-t-[#4f46e5] rounded-full animate-spin"></div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/companies" replace />} />
        <Route
          path="/companies"
          element={
            <Suspense fallback={<PageSpinner />}>
              <CompanyListPage />
            </Suspense>
          }
        />
        <Route
          path="/companies/new"
          element={
            <Suspense fallback={<PageSpinner />}>
              <CompanyCreatePage />
            </Suspense>
          }
        />
        <Route
          path="/companies/:id"
          element={
            <Suspense fallback={<PageSpinner />}>
              <CompanyDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/bundles"
          element={
            <Suspense fallback={<PageSpinner />}>
              <BundleListPage />
            </Suspense>
          }
        />
        <Route
          path="/bundles/new"
          element={
            <Suspense fallback={<PageSpinner />}>
              <BundleCreatePage />
            </Suspense>
          }
        />
        <Route
          path="/bundles/:id"
          element={
            <Suspense fallback={<PageSpinner />}>
              <BundleDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/bundles/:id/files/:fileId"
          element={
            <Suspense fallback={<PageSpinner />}>
              <BundleFileViewerPage />
            </Suspense>
          }
        />
        <Route
          path="/bundles/:id/spawn"
          element={
            <Suspense fallback={<PageSpinner />}>
              <BundleSpawnPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageSpinner />}>
              <ErrorPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
