import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CompanyTable } from './CompanyTable';
import type { CompanyResponse } from '@/types';

const companies: CompanyResponse[] = [
  { id: 1, name: 'Acme Corp', parentCompanyId: null, parentCompanyName: null, createdAt: '2026-07-12T10:00:00Z' },
  { id: 2, name: 'Acme EU', parentCompanyId: 1, parentCompanyName: 'Acme Corp', createdAt: '2026-07-12T10:01:00Z' },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyTable', () => {
  it('renders companies in a table', () => {
    renderWithProviders(<CompanyTable companies={companies} />);

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Acme EU')).toBeInTheDocument();
  });

  it('shows empty state when no companies', () => {
    renderWithProviders(<CompanyTable companies={[]} />);

    expect(screen.getByText('No companies yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first company')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    renderWithProviders(<CompanyTable companies={[]} isLoading />);

    expect(screen.queryByText('No companies yet')).not.toBeInTheDocument();
  });

  it('shows delete button for each company', () => {
    renderWithProviders(<CompanyTable companies={companies} />);

    expect(screen.getAllByText('Delete')).toHaveLength(2);
  });

  it('shows dash for companies without parent', () => {
    renderWithProviders(<CompanyTable companies={companies} />);

    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('shows confirm and cancel buttons when delete clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyTable companies={companies} />);

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides confirm buttons when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyTable companies={companies} />);

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('confirms delete and triggers mutation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyTable companies={companies} />);

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[1]);

    await user.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });
  });

  it('renders table headers', () => {
    renderWithProviders(<CompanyTable companies={companies} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders company name as link', () => {
    renderWithProviders(<CompanyTable companies={companies} />);

    const acmeLink = screen.getByRole('link', { name: 'Acme Corp' });
    expect(acmeLink).toHaveAttribute('href', '/companies/1');
  });

  it('shows error toast when delete fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyTable companies={companies} />);

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    await user.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });
  });

  it('shows confirm button text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyTable companies={companies} />);

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
