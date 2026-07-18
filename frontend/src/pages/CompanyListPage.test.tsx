import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import CompanyListPage from './CompanyListPage';

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/companies']}>
        <Routes>
          <Route path="/companies" element={<CompanyListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyListPage', () => {
  it('renders page heading and new company link', () => {
    renderWithProviders();

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('New Company')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders();

    expect(screen.getByText('Manage companies and their hierarchy')).toBeInTheDocument();
  });

  it('renders companies from API', async () => {
    renderWithProviders();

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: 'Acme Corp' });
      expect(links.length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Acme EU')).toBeInTheDocument();
    expect(screen.getByText('TechStart Inc')).toBeInTheDocument();
  });

  it('renders company names as links to detail pages', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'TechStart Inc' })).toBeInTheDocument();
    });

    const techStartLink = screen.getByRole('link', { name: 'TechStart Inc' });
    expect(techStartLink).toHaveAttribute('href', '/companies/3');
  });

  it('renders new company link pointing to create page', () => {
    renderWithProviders();

    const newLink = screen.getByText('New Company').closest('a');
    expect(newLink).toHaveAttribute('href', '/companies/new');
  });

  it('renders table headers', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders parent company names in table', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Acme EU')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
  });
});
