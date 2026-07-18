import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { HelpProvider } from './HelpContext';
import { HelpPanel } from '@/components/help/HelpPanel';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export function AppLayout() {
  return (
    <HelpProvider>
      <div className="flex min-h-screen bg-[#f9fafb]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <HelpPanel />
    </HelpProvider>
  );
}
