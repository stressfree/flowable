import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useBundleTypes,
  useBundles,
  useBundle,
  useCreateBundle,
  useAddFiles,
  useValidateBundle,
  useSetEntrypoint,
  usePublishBundle,
  useArchiveBundle,
  useFileContent,
  useSpawnForm,
  useSpawn,
  useBundleEvents,
  useSendEvent,
  bundleKeys,
} from './bundles';

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function HookHarness({ hookFn }: { hookFn: () => { data?: unknown; isLoading?: boolean } }) {
  const result = hookFn();
  const data = result.data as Record<string, unknown> | undefined;
  return (
    <div>
      {result.isLoading && <span>Loading</span>}
      {data && <span>Data: {JSON.stringify(data)}</span>}
    </div>
  );
}

describe('bundleKeys', () => {
  it('generates correct key shapes', () => {
    expect(bundleKeys.all).toEqual(['bundles']);
    expect(bundleKeys.lists()).toEqual(['bundles', 'list', undefined]);
    expect(bundleKeys.detail(1)).toEqual(['bundles', 'detail', 1]);
    expect(bundleKeys.fileContent(1, 2)).toEqual(['bundles', 'file', 1, 2]);
    expect(bundleKeys.spawnForm(1)).toEqual(['bundles', 'spawn-form', 1]);
    expect(bundleKeys.events(1)).toEqual(['bundles', 'events', 1]);
  });
});

describe('useBundleTypes', () => {
  it('fetches bundle types', async () => {
    renderWithClient(<HookHarness hookFn={() => useBundleTypes()} />);

    await waitFor(() => {
      expect(screen.getByText(/EXPENSE_APPROVAL/)).toBeInTheDocument();
    });
  });
});

describe('useBundles', () => {
  it('fetches all bundles without filters', async () => {
    renderWithClient(<HookHarness hookFn={() => useBundles()} />);

    await waitFor(() => {
      expect(screen.getByText(/Standard expense approval/)).toBeInTheDocument();
    });
  });

  it('fetches bundles with filters', async () => {
    renderWithClient(
      <HookHarness hookFn={() => useBundles({ bundleType: 'EXPENSE_APPROVAL', status: 'PUBLISHED', companyId: 1 })} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Standard expense approval/)).toBeInTheDocument();
    });
  });
});

describe('useBundle', () => {
  it('fetches bundle detail', async () => {
    renderWithClient(<HookHarness hookFn={() => useBundle(1)} />);

    await waitFor(() => {
      expect(screen.getByText(/expense-approval\.bpmn/)).toBeInTheDocument();
    });
  });
});

describe('useCreateBundle', () => {
  it('creates a bundle via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useCreateBundle();
      return (
        <button
          onClick={() =>
            mutation.mutate(
              {
                files: [new File(['<def/>'], 'test.bpmn', { type: 'application/xml' })],
                bundleType: 'EXPENSE_APPROVAL',
                description: 'Test bundle',
              },
              { onSuccess: (data) => (result = data) },
            )
          }
        >
          Create
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Create').click();

    await waitFor(() => {
      expect(result).toBeDefined();
    });
  });
});

describe('useAddFiles', () => {
  it('adds files via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useAddFiles(1);
      return (
        <button
          onClick={() =>
            mutation.mutate(
              [new File(['<def/>'], 'test.bpmn', { type: 'application/xml' })],
              { onSuccess: (data) => (result = data) },
            )
          }
        >
          Add
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Add').click();

    await waitFor(() => {
      expect(result).toBeDefined();
    });
  });
});

describe('useValidateBundle', () => {
  it('validates bundle via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useValidateBundle(1);
      return (
        <button onClick={() => mutation.mutate(undefined, { onSuccess: (d) => (result = d) })}>
          Validate
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Validate').click();

    await waitFor(() => {
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('subprocess-invoice');
    });
  });
});

describe('useSetEntrypoint', () => {
  it('sets entrypoint via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useSetEntrypoint(1);
      return (
        <button onClick={() => mutation.mutate(10, { onSuccess: (d) => (result = d) })}>
          Set
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Set').click();

    await waitFor(() => {
      expect(result).toBeDefined();
    });
  });
});

describe('usePublishBundle', () => {
  it('publishes bundle via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = usePublishBundle(1);
      return (
        <button onClick={() => mutation.mutate(undefined, { onSuccess: (d) => (result = d) })}>
          Publish
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Publish').click();

    await waitFor(() => {
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('PUBLISHED');
    });
  });
});

describe('useArchiveBundle', () => {
  it('archives bundle via mutation', async () => {
    let archived = false;

    function Harness() {
      const mutation = useArchiveBundle();
      return (
        <button onClick={() => mutation.mutate(1, { onSuccess: () => (archived = true) })}>
          Archive
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Archive').click();

    await waitFor(() => {
      expect(archived).toBe(true);
    });
  });
});

describe('useFileContent', () => {
  it('fetches file content as text', async () => {
    renderWithClient(<HookHarness hookFn={() => useFileContent(1, 10)} />);

    await waitFor(() => {
      expect(screen.getByText(/definitions/)).toBeInTheDocument();
    });
  });
});

describe('useSpawnForm', () => {
  it('fetches spawn form variables', async () => {
    renderWithClient(<HookHarness hookFn={() => useSpawnForm(1)} />);

    await waitFor(() => {
      expect(screen.getByText(/Employee ID/)).toBeInTheDocument();
    });
  });
});

describe('useSpawn', () => {
  it('spawns process via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useSpawn(1);
      return (
        <button
          onClick={() =>
            mutation.mutate(
              { employeeId: 'emp1', amount: 100, hasTravel: false },
              { onSuccess: (d) => (result = d) },
            )
          }
        >
          Spawn
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Spawn').click();

    await waitFor(() => {
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('proc-inst-12345');
    });
  });
});

describe('useBundleEvents', () => {
  it('fetches bundle events', async () => {
    renderWithClient(<HookHarness hookFn={() => useBundleEvents(1)} />);

    await waitFor(() => {
      expect(screen.getByText(/expense-submitted/)).toBeInTheDocument();
    });
  });
});

describe('useSendEvent', () => {
  it('sends event via mutation', async () => {
    let result: unknown;

    function Harness() {
      const mutation = useSendEvent(1);
      return (
        <button
          onClick={() =>
            mutation.mutate(
              { eventKey: 'expense-submitted', payload: { employeeId: 'emp1' } },
              { onSuccess: (d) => (result = d) },
            )
          }
        >
          Send
        </button>
      );
    }

    renderWithClient(<Harness />);
    screen.getByText('Send').click();

    await waitFor(() => {
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('received');
    });
  });
});
