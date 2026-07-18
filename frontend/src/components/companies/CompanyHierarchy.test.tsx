import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CompanyHierarchy } from './CompanyHierarchy';
import type { CompanyDetailResponse } from '@/types';

const companyWithParent: CompanyDetailResponse = {
  id: 2,
  name: 'Acme EU',
  parentCompanyId: 1,
  parentCompanyName: 'Acme Corp',
  children: [],
  bundles: [],
  createdAt: '2026-07-12T10:00:00Z',
};

const companyWithChildren: CompanyDetailResponse = {
  id: 1,
  name: 'Acme Corp',
  parentCompanyId: null,
  parentCompanyName: null,
  children: [
    { id: 2, name: 'Acme EU', parentCompanyId: 1, parentCompanyName: 'Acme Corp', createdAt: '2026-07-12T10:01:00Z' },
    { id: 3, name: 'Acme UK', parentCompanyId: 1, parentCompanyName: 'Acme Corp', createdAt: '2026-07-12T10:02:00Z' },
  ],
  bundles: [],
  createdAt: '2026-07-12T10:00:00Z',
};

const standaloneCompany: CompanyDetailResponse = {
  id: 3,
  name: 'TechStart Inc',
  parentCompanyId: null,
  parentCompanyName: null,
  children: [],
  bundles: [],
  createdAt: '2026-07-12T10:00:00Z',
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CompanyHierarchy', () => {
  it('shows parent company link when parent exists', () => {
    renderWithRouter(<CompanyHierarchy company={companyWithParent} />);

    expect(screen.getByText('Parent Company')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows child company links when children exist', () => {
    renderWithRouter(<CompanyHierarchy company={companyWithChildren} />);

    expect(screen.getByText('Child Companies')).toBeInTheDocument();
    expect(screen.getByText('Acme EU')).toBeInTheDocument();
    expect(screen.getByText('Acme UK')).toBeInTheDocument();
  });

  it('shows standalone message when no parent or children', () => {
    renderWithRouter(<CompanyHierarchy company={standaloneCompany} />);

    expect(screen.getByText('No parent or child companies.')).toBeInTheDocument();
  });

  it('renders hierarchy heading', () => {
    renderWithRouter(<CompanyHierarchy company={standaloneCompany} />);

    expect(screen.getByText('Hierarchy')).toBeInTheDocument();
  });
});
