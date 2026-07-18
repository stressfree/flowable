import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './Sidebar';
import { HelpProvider } from './HelpContext';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <HelpProvider>{ui}</HelpProvider>
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders brand logo and name', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('Decisioning')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Bundles')).toBeInTheDocument();
    expect(screen.getByText('New Bundle')).toBeInTheDocument();
  });

  it('renders workspace section label', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('renders Flowable connected status', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Flowable connected')).toBeInTheDocument();
  });

  it('renders help button', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Help & Docs')).toBeInTheDocument();
  });

  it('highlights active nav link when on matching route', () => {
    render(
      <MemoryRouter initialEntries={['/companies']}>
        <HelpProvider>
          <Sidebar />
        </HelpProvider>
      </MemoryRouter>,
    );

    const companiesLink = screen.getByText('Companies').closest('a');
    expect(companiesLink?.className).toContain('bg-indigo-50');
  });

  it('does not highlight inactive nav links', () => {
    render(
      <MemoryRouter initialEntries={['/bundles']}>
        <HelpProvider>
          <Sidebar />
        </HelpProvider>
      </MemoryRouter>,
    );

    const companiesLink = screen.getByText('Companies').closest('a');
    expect(companiesLink?.className).not.toContain('bg-indigo-50');
  });
});
