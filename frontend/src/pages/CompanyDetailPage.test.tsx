import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import CompanyDetailPage from './CompanyDetailPage';

function renderWithProviders(route = '/companies/1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyDetailPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders();

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders company name after loading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    });
  });

  it('renders back to companies link', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Back to Companies')).toBeInTheDocument();
    });
  });

  it('renders bundles section heading with count', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Bundles \(1\)/)).toBeInTheDocument();
    });
  });

  it('renders bundle type grouping with expandable section', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Expense Approval')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Expense Approval'));

    await waitFor(() => {
      expect(screen.getByText('Standard expense approval')).toBeInTheDocument();
    });
  });

  it('renders not found message for missing company', async () => {
    renderWithProviders('/companies/999');

    await waitFor(() => {
      expect(screen.getByText('Company not found.')).toBeInTheDocument();
    });
  });

  it('renders back to companies link on error', async () => {
    renderWithProviders('/companies/999');

    await waitFor(() => {
      expect(screen.getByText('Back to Companies')).toBeInTheDocument();
    });
  });
});
