import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AppLayout } from './AppLayout';

function ChildPage() {
  return <div>Child Page Content</div>;
}

function renderWithProviders(route = '/companies') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/companies" element={<ChildPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('renders sidebar with branding', () => {
    renderWithProviders();

    expect(screen.getByText('Decisioning')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    renderWithProviders();

    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Bundles')).toBeInTheDocument();
    expect(screen.getByText('New Bundle')).toBeInTheDocument();
  });

  it('renders outlet content', () => {
    renderWithProviders();

    expect(screen.getByText('Child Page Content')).toBeInTheDocument();
  });

  it('renders help button in sidebar', () => {
    renderWithProviders();

    expect(screen.getByText('Help & Docs')).toBeInTheDocument();
  });

  it('renders flowable connected status', () => {
    renderWithProviders();

    expect(screen.getByText('Flowable connected')).toBeInTheDocument();
  });
});
