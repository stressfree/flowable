import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCompanies,
  useCompany,
  useCreateCompany,
  useDeleteCompany,
  companyKeys,
} from './companies';
import type { CompanyResponse } from '@/types';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function HookHarness({ hookFn }: { hookFn: () => { data?: unknown; isLoading?: boolean } }) {
  const result = hookFn() as { data?: unknown; isLoading?: boolean };
  const data = result.data as Record<string, unknown> | undefined;
  return (
    <div>
      {result.isLoading && <span>Loading</span>}
      {data && <span>Data: {JSON.stringify(data)}</span>}
    </div>
  );
}

describe('companyKeys', () => {
  it('generates correct key shapes', () => {
    expect(companyKeys.all).toEqual(['companies']);
    expect(companyKeys.lists()).toEqual(['companies', 'list']);
    expect(companyKeys.detail(5)).toEqual(['companies', 'detail', 5]);
  });
});

describe('useCompanies', () => {
  it('fetches company list', async () => {
    renderWithClient(<HookHarness hookFn={() => useCompanies()} />);

    await waitFor(() => {
      expect(screen.getByText(/Data:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });
});

describe('useCompany', () => {
  it('fetches company detail with children and bundles', async () => {
    renderWithClient(<HookHarness hookFn={() => useCompany(1)} />);

    await waitFor(() => {
      expect(screen.getByText(/Data:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Acme EU/)).toBeInTheDocument();
  });
});

describe('useCreateCompany', () => {
  it('creates a company via mutation', async () => {
    let created: CompanyResponse | undefined;

    function CreateHarness() {
      const mutation = useCreateCompany();
      return (
        <button
          onClick={() =>
            mutation.mutate(
              { name: 'Test Co' },
              {
                onSuccess: (data) => {
                  created = data;
                },
              },
            )
          }
        >
          Create
        </button>
      );
    }

    renderWithClient(<CreateHarness />);
    screen.getByText('Create').click();

    await waitFor(() => {
      expect(created).toBeDefined();
      expect(created!.name).toBe('Test Co');
      expect(created!.id).toBe(99);
    });
  });
});

describe('useDeleteCompany', () => {
  it('deletes a company via mutation', async () => {
    let deleted = false;

    function DeleteHarness() {
      const mutation = useDeleteCompany();
      return (
        <button
          onClick={() =>
            mutation.mutate(2, {
              onSuccess: () => {
                deleted = true;
              },
            })
          }
        >
          Delete
        </button>
      );
    }

    renderWithClient(<DeleteHarness />);
    screen.getByText('Delete').click();

    await waitFor(() => {
      expect(deleted).toBe(true);
    });
  });

  it('throws on delete when company has bundles', async () => {
    let error: { status?: number } | undefined;

    function DeleteHarness() {
      const mutation = useDeleteCompany();
      return (
        <button
          onClick={() =>
            mutation.mutate(1, {
              onError: (err) => {
                error = err as { status?: number };
              },
            })
          }
        >
          Delete
        </button>
      );
    }

    renderWithClient(<DeleteHarness />);
    screen.getByText('Delete').click();

    await waitFor(() => {
      expect(error).toBeDefined();
      expect(error!.status).toBe(409);
    });
  });
});
