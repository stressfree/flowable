import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import BundleListPage from './BundleListPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockClear();
});

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/bundles']}>
        <Routes>
          <Route path="/bundles" element={<BundleListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BundleListPage', () => {
  it('renders page heading and new bundle link', () => {
    renderWithProviders();

    expect(screen.getByText('Bundles')).toBeInTheDocument();
    expect(screen.getByText('New Bundle')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders();

    expect(screen.getByText('All decisioning bundles across companies')).toBeInTheDocument();
  });

  it('renders filter labels', () => {
    renderWithProviders();

    expect(screen.getAllByText('Type').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Company').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders bundles from API', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('renders table headers', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders bundle type labels', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Expense Approval').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Virtual Card Approval').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders status badges', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });
  });

  it('renders company name for bundles with company', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Global for bundles without company', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Global')).toBeInTheDocument();
    });
  });

  it('renders status filter options', () => {
    renderWithProviders();

    expect(screen.getByText('All statuses')).toBeInTheDocument();
    expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Archived').length).toBeGreaterThanOrEqual(1);
  });

  it('filters by status when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'All statuses'),
    )!;
    await user.selectOptions(statusSelect, 'DRAFT');

    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
      expect(screen.queryByText('PUBLISHED')).not.toBeInTheDocument();
    });
  });

  it('filters by bundle type when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    const typeSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'All types'),
    )!;
    await user.selectOptions(typeSelect, 'VIRTUAL_CARD_APPROVAL');

    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
      expect(screen.queryByText('PUBLISHED')).not.toBeInTheDocument();
    });
  });

  it('renders file count in table', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders created date in table', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    expect(screen.getAllByText('12/07/2026').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all types option in type filter', () => {
    renderWithProviders();

    expect(screen.getByText('All types')).toBeInTheDocument();
  });

  it('renders all companies option in company filter', () => {
    renderWithProviders();

    expect(screen.getByText('All companies')).toBeInTheDocument();
  });

  it('renders all statuses option in status filter', () => {
    renderWithProviders();

    expect(screen.getByText('All statuses')).toBeInTheDocument();
  });

  it('filters by company when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    const companySelect = screen.getAllByRole('combobox').find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'All companies'),
    )!;
    await user.selectOptions(companySelect, '1');

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });
  });

  it('navigates to bundle detail when row clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    const rows = document.querySelectorAll('tbody tr');
    await user.click(rows[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/bundles/1');
  });

  it('renders new bundle link pointing to create page', () => {
    renderWithProviders();

    const newLink = screen.getByText('New Bundle').closest('a');
    expect(newLink).toHaveAttribute('href', '/bundles/new');
  });

  it('renders type column header', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Type').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no bundles', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles', () => {
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No bundles found')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first bundle')).toBeInTheDocument();
  });

  it('renders loading skeleton initially', () => {
    renderWithProviders();

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
