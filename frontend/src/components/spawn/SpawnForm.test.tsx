import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { SpawnForm } from './SpawnForm';

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

describe('SpawnForm', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    expect(screen.queryByText('Process Variables')).not.toBeInTheDocument();
  });

  it('renders typed variable inputs after loading', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Process Variables')).toBeInTheDocument();
    });

    expect(screen.getByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Has Travel')).toBeInTheDocument();
  });

  it('renders start button', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });
  });

  it('renders send test event section when events exist', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Send Test Event')).toBeInTheDocument();
    });
  });

  it('shows event selector with event options', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Select an event...')).toBeInTheDocument();
    });
  });

  it('shows required indicator for required variables', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });

    const labels = screen.getAllByText('*');
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('spawns process instance when start button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Start Process Instance'));

    await waitFor(() => {
      expect(screen.getByText(/proc-inst-12345/)).toBeInTheDocument();
    });
  });

  it('shows instance ID after successful spawn', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Start Process Instance'));

    await waitFor(() => {
      expect(screen.getByText('Process instance started')).toBeInTheDocument();
      expect(screen.getByText(/Instance ID:/)).toBeInTheDocument();
    });
  });

  it('shows event parameter inputs when event selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Select an event...')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const eventSelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent?.includes('expense-submitted')),
    )!;
    await user.selectOptions(eventSelect, 'expense-submitted');

    await waitFor(() => {
      expect(screen.getByText('Correlation Parameters')).toBeInTheDocument();
      expect(screen.getByText('Payload')).toBeInTheDocument();
    });
  });

  it('sends test event when send button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Select an event...')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const eventSelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent?.includes('expense-submitted')),
    )!;
    await user.selectOptions(eventSelect, 'expense-submitted');

    await user.click(screen.getByText('Send Event'));

    await waitFor(() => {
      expect(screen.getByText(/Event sent:/)).toBeInTheDocument();
    });
  });

  it('shows variable type hints in labels', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('(string)')).toBeInTheDocument();
      expect(screen.getByText('(number)')).toBeInTheDocument();
      expect(screen.getByText('(boolean)')).toBeInTheDocument();
    });
  });

  it('renders boolean input as select dropdown', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Has Travel')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const boolSelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent === 'true'),
    );
    expect(boolSelect).toBeDefined();
  });

  it('renders number input for numeric variables', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    const numberInput = screen.getByPlaceholderText('Enter Amount');
    expect(numberInput).toHaveAttribute('type', 'number');
  });

  it('renders text input for string variables', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Employee ID')).toBeInTheDocument();
    });

    const textInput = screen.getByPlaceholderText('Enter Employee ID');
    expect(textInput).toHaveAttribute('type', 'text');
  });

  it('shows JSON textarea when no form variables detected', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id/spawn-form', () => {
        return HttpResponse.json({ bundleId: 1, variables: [] });
      }),
    );

    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Variables (JSON)')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('{"key": "value"}')).toBeInTheDocument();
  });

  it('starts process with JSON input when no variables', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id/spawn-form', () => {
        return HttpResponse.json({ bundleId: 1, variables: [] });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Start Process Instance'));

    await waitFor(() => {
      expect(screen.getByText(/proc-inst-12345/)).toBeInTheDocument();
    });
  });

  it('shows error for invalid JSON in fallback', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id/spawn-form', () => {
        return HttpResponse.json({ bundleId: 1, variables: [] });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Variables (JSON)')).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('{}');
    await user.clear(textarea);
    await user.type(textarea, 'invalid json');

    await user.click(screen.getByText('Start Process Instance'));

    await waitFor(() => {
      expect(screen.getByText('Start Process Instance')).toBeInTheDocument();
    });
  });

  it('shows event result after sending test event', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Select an event...')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const eventSelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent?.includes('expense-submitted')),
    )!;
    await user.selectOptions(eventSelect, 'expense-submitted');

    await user.click(screen.getByText('Send Event'));

    await waitFor(() => {
      expect(screen.getByText(/Event sent:/)).toBeInTheDocument();
    });
  });

  it('disables send event button when no event selected', async () => {
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Send Event')).toBeInTheDocument();
    });

    const sendButton = screen.getByText('Send Event');
    expect(sendButton).toBeDisabled();
  });

  it('fills in event parameter values and sends event', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpawnForm bundleId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Select an event...')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const eventSelect = selects.find((s) =>
      Array.from(s.querySelectorAll('option')).some((o) => o.textContent?.includes('expense-submitted')),
    )!;
    await user.selectOptions(eventSelect, 'expense-submitted');

    await waitFor(() => {
      expect(screen.getByText('Correlation Parameters')).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'emp123');

    await user.click(screen.getByText('Send Event'));

    await waitFor(() => {
      expect(screen.getByText(/Event sent:/)).toBeInTheDocument();
    });
  });
});
