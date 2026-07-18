import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ErrorPage from './ErrorPage';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useRouteError: vi.fn(),
  };
});

import { useRouteError } from 'react-router';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ErrorPage', () => {
  it('renders 404 page not found when status is 404', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: 'Not Found', data: '' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText('The page or resource you are looking for does not exist.')).toBeInTheDocument();
  });

  it('renders back to bundles link on 404', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, statusText: 'Not Found', data: '' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Back to Bundles')).toBeInTheDocument();
  });

  it('renders custom 404 data message when provided', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 404, data: 'Custom not found message' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Custom not found message')).toBeInTheDocument();
  });

  it('renders 500 error page for non-404 errors', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: 'Internal Server Error', data: '' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('renders error status code for non-404 errors', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: 'Server Error', data: '' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText(/Error 500/)).toBeInTheDocument();
  });

  it('renders try again button for non-404 errors', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: 'Server Error', data: '' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('reloads page when try again clicked', async () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: 'Server Error', data: '' });
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    const user = userEvent.setup();
    renderWithRouter(<ErrorPage />);

    await user.click(screen.getByText('Try Again'));

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('renders back to bundles link on 500 error', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, statusText: 'Server Error', data: '' });

    renderWithRouter(<ErrorPage />);

    const links = screen.getAllByText('Back to Bundles');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders 404 when no error is present', () => {
    vi.mocked(useRouteError).mockReturnValue(null);

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('uses message when statusText is absent', () => {
    vi.mocked(useRouteError).mockReturnValue({ status: 500, message: 'Something broke' });

    renderWithRouter(<ErrorPage />);

    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });
});
