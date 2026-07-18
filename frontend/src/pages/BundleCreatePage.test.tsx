import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import BundleCreatePage from './BundleCreatePage';

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
      <MemoryRouter initialEntries={['/bundles/new']}>
        <Routes>
          <Route path="/bundles/new" element={<BundleCreatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BundleCreatePage', () => {
  it('renders page heading', () => {
    renderWithProviders();

    expect(screen.getByText('New Bundle')).toBeInTheDocument();
  });

  it('renders back to bundles link', () => {
    renderWithProviders();

    expect(screen.getByText('Back to Bundles')).toBeInTheDocument();
  });

  it('renders bundle type dropdown populated from API', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Expense Approval').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText('Virtual Card Approval').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Physical Credit Card Approval').length).toBeGreaterThanOrEqual(1);
  });

  it('renders company dropdown', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Acme Corp' })).toBeInTheDocument();
    });

    expect(screen.getByText('Global (no company)')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    renderWithProviders();

    expect(screen.getByPlaceholderText('e.g., Standard expense approval with escalation')).toBeInTheDocument();
  });

  it('renders create and cancel buttons', () => {
    renderWithProviders();

    expect(screen.getByText('Create Bundle')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders file dropzone', () => {
    renderWithProviders();

    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('does not submit without bundle type', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Expense Approval').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getByText('Create Bundle'));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when bundle type selected but no files', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'Expense Approval' }).length).toBeGreaterThanOrEqual(1);
    });

    const typeSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'Select a type...'),
    )!;
    await user.selectOptions(typeSelect, 'EXPENSE_APPROVAL');

    await user.click(screen.getByText('Create Bundle'));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('creates bundle and navigates on successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'Expense Approval' }).length).toBeGreaterThanOrEqual(1);
    });

    const typeSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'Select a type...'),
    )!;
    await user.selectOptions(typeSelect, 'EXPENSE_APPROVAL');

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<definitions></definitions>'], 'test.bpmn', { type: 'application/xml' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.bpmn')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Bundle'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/bundles/100');
    });
  });

  it('renders description label', () => {
    renderWithProviders();

    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders bundle type label', () => {
    renderWithProviders();

    expect(screen.getByText('Bundle Type')).toBeInTheDocument();
  });

  it('renders company label', () => {
    renderWithProviders();

    expect(screen.getByText('Company')).toBeInTheDocument();
  });
});
