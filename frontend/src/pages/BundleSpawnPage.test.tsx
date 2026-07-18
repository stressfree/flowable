import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import BundleSpawnPage from './BundleSpawnPage';

function renderWithProviders(route = '/bundles/1/spawn') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/bundles/:id/spawn" element={<BundleSpawnPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BundleSpawnPage', () => {
  it('renders back to bundle link', () => {
    renderWithProviders();

    expect(screen.getByText('Back to Bundle')).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    renderWithProviders();

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders spawn process heading after loading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Spawn Process')).toBeInTheDocument();
    });
  });

  it('renders bundle description in subtitle', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Standard expense approval/)).toBeInTheDocument();
    });
  });

  it('renders spawn form component', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Process Variables')).toBeInTheDocument();
    });
  });

  it('renders start process instance button', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });
  });

  it('renders not found message for missing bundle', async () => {
    renderWithProviders('/bundles/999/spawn');

    await waitFor(() => {
      expect(screen.getByText('Bundle not found.')).toBeInTheDocument();
    });
  });

  it('renders send test event section when events exist', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Send Test Event')).toBeInTheDocument();
    });
  });
});
