import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import CompanyCreatePage from './CompanyCreatePage';

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
      <MemoryRouter initialEntries={['/companies/new']}>
        <Routes>
          <Route path="/companies/new" element={<CompanyCreatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyCreatePage', () => {
  it('renders page heading', () => {
    renderWithProviders();

    expect(screen.getByText('New Company')).toBeInTheDocument();
  });

  it('renders back to companies link', () => {
    renderWithProviders();

    expect(screen.getByText('Back to Companies')).toBeInTheDocument();
  });

  it('renders name input field', () => {
    renderWithProviders();

    expect(screen.getByPlaceholderText('e.g., Acme Corp')).toBeInTheDocument();
  });

  it('renders parent company dropdown populated from API', async () => {
    renderWithProviders();

    await waitFor(() => {
      const techStartOption = screen.queryByRole('option', { name: 'TechStart Inc' });
      expect(techStartOption).toBeInTheDocument();
    });

    expect(screen.getByRole('option', { name: 'Acme Corp' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'None (top-level company)' })).toBeInTheDocument();
  });

  it('renders create and cancel buttons', () => {
    renderWithProviders();

    expect(screen.getByText('Create Company')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await user.click(screen.getByText('Create Company'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('navigates to new company detail on successful create', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByDisplayValue('None (top-level company)')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('e.g., Acme Corp'), 'Test Co');
    await user.click(screen.getByText('Create Company'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/companies/99');
    });
  });

  it('disables create button while submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'TechStart Inc' })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('e.g., Acme Corp'), 'Test Co');
    await user.click(screen.getByText('Create Company'));

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('renders name label', () => {
    renderWithProviders();

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders parent company label', () => {
    renderWithProviders();

    expect(screen.getByText('Parent Company (optional)')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders();

    expect(screen.getByText('Create a company in the hierarchy')).toBeInTheDocument();
  });

  it('renders cancel link pointing to companies page', () => {
    renderWithProviders();

    const cancelLink = screen.getByText('Cancel').closest('a');
    expect(cancelLink).toHaveAttribute('href', '/companies');
  });

  it('shows name max length validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'TechStart Inc' })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g., Acme Corp');
    await user.type(input, 'a'.repeat(101));

    await user.click(screen.getByText('Create Company'));

    await waitFor(() => {
      expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument();
    });
  });

  it('shows error when creation fails', async () => {
    server.use(
      http.post('http://localhost:3000/v1/companies', () => {
        return HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'Company name already exists' },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'TechStart Inc' })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('e.g., Acme Corp'), 'Test Co');
    await user.click(screen.getByText('Create Company'));

    await new Promise((r) => setTimeout(r, 500));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
