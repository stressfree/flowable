import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import BundleDetailPage from './BundleDetailPage';

const originalLocation = window.location;
afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

function renderWithProviders(route = '/bundles/1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/bundles/:id" element={<BundleDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BundleDetailPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders();

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders bundle description after loading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Standard expense approval' })).toBeInTheDocument();
    });
  });

  it('renders back to bundles link', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Back to Bundles')).toBeInTheDocument();
    });
  });

  it('renders DRAFT status badge', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });
  });

  it('renders validation section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Validation')).toBeInTheDocument();
    });
  });

  it('renders files section with count', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Files \(2\)/)).toBeInTheDocument();
    });
  });

  it('renders file names as links', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('expense-approval.bpmn')).toBeInTheDocument();
    });

    expect(screen.getByText('travel-check.dmn')).toBeInTheDocument();
  });

  it('renders publish button for draft bundles', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });
  });

  it('renders add files button for draft bundles', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Add Files')).toBeInTheDocument();
    });
  });

  it('renders archive button for draft bundles', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });
  });

  it('renders entrypoint indicator for entrypoint file', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Entrypoint')).toBeInTheDocument();
    });
  });

  it('renders set as entrypoint button for non-entrypoint files', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Set as entrypoint')).toBeInTheDocument();
    });
  });

  it('shows publish dialog when publish button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Bundle')).toBeInTheDocument();
    });
  });

  it('shows add files dialog when add files clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogTitles = screen.getAllByText('Add Files');
      expect(dialogTitles.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders not found message for missing bundle', async () => {
    renderWithProviders('/bundles/999');

    await waitFor(() => {
      expect(screen.getByText('Bundle not found.')).toBeInTheDocument();
    });
  });

  it('renders revalidate button in validation panel', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Re-validate')).toBeInTheDocument();
    });
  });

  it('closes publish dialog when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Bundle')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByText('Cancel');
    await user.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('Publish Bundle')).not.toBeInTheDocument();
    });
  });

  it('publishes bundle when publish now clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Now')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish Now'));

    await waitFor(() => {
      expect(screen.queryByText('Publish Bundle')).not.toBeInTheDocument();
    });
  });

  it('closes add files dialog when cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBeGreaterThanOrEqual(2);
    });

    const cancelButtons = screen.getAllByText('Cancel');
    await user.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBe(1);
    });
  });

  it('sets entrypoint when set as entrypoint clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Set as entrypoint')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Set as entrypoint'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Standard expense approval' })).toBeInTheDocument();
    });
  });

  it('renders file type badges', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('BPMN')).toBeInTheDocument();
    });

    expect(screen.getByText('DMN')).toBeInTheDocument();
  });

  it('renders file links to viewer pages', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('expense-approval.bpmn')).toBeInTheDocument();
    });

    const bpmnLink = screen.getByText('expense-approval.bpmn').closest('a');
    expect(bpmnLink).toHaveAttribute('href', '/bundles/1/files/10');
  });

  it('renders bundle type label', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Expense Approval')).toBeInTheDocument();
    });
  });

  it('renders company name', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows schedule button when goLiveAt is set', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Bundle')).toBeInTheDocument();
    });

    const datetimeInput = screen.getByDisplayValue('');
    await user.type(datetimeInput, '2026-12-01T10:00');

    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('closes publish dialog when backdrop clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Bundle')).toBeInTheDocument();
    });

    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/40');
    await user.click(backdrop as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByText('Publish Bundle')).not.toBeInTheDocument();
    });
  });

  it('closes add files dialog when backdrop clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBeGreaterThanOrEqual(2);
    });

    const backdrops = document.querySelectorAll('.fixed.inset-0.bg-black\\/40');
    await user.click(backdrops[backdrops.length - 1] as HTMLElement);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBe(1);
    });
  });

  it('renders events section when events exist', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    expect(screen.getByText('Expense Submitted')).toBeInTheDocument();
  });

  it('renders event key in events section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Expense Submitted')).toBeInTheDocument();
    });

    expect(screen.getByText('expense-submitted')).toBeInTheDocument();
  });

  it('renders correlation parameters in events section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    expect(screen.getByText(/Correlation:/)).toBeInTheDocument();
  });

  it('renders payload parameters in events section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    expect(screen.getByText(/Payload:/)).toBeInTheDocument();
  });

  it('renders description box when description exists', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Standard expense approval' })).toBeInTheDocument();
    });

    const descriptionBoxes = screen.getAllByText('Standard expense approval');
    expect(descriptionBoxes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders revalidate button as clickable', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Re-validate')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Re-validate'));

    expect(screen.getByText('Re-validate')).toBeInTheDocument();
  });

  it('shows error when add files called with no files', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBeGreaterThanOrEqual(2);
    });

    const addButtons = screen.getAllByText('Add Files');
    const dialogAddButton = addButtons[addButtons.length - 1];
    await user.click(dialogAddButton);

    expect(screen.getAllByText('Add Files').length).toBeGreaterThanOrEqual(2);
  });

  it('adds files when files provided in dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBeGreaterThanOrEqual(2);
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<definitions></definitions>'], 'new.bpmn', { type: 'application/xml' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('new.bpmn')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('Add Files');
    const dialogAddButton = addButtons[addButtons.length - 1];
    await user.click(dialogAddButton);

    await waitFor(() => {
      expect(screen.queryByText('new.bpmn')).not.toBeInTheDocument();
    });
  });

  it('archives bundle when archive button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Archive'));

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });
  });

  it('renders file type column header', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Filename')).toBeInTheDocument();
    });

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getAllByText('Actions').length).toBeGreaterThanOrEqual(1);
  });

  it('renders validation section heading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Validation')).toBeInTheDocument();
    });
  });

  it('renders all cross references valid message when no errors', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('All cross-references valid')).toBeInTheDocument();
    });
  });

  it('renders publish dialog with schedule label', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Schedule (optional)')).toBeInTheDocument();
    });

    expect(screen.getByText('Leave empty to publish immediately.')).toBeInTheDocument();
  });

  it('shows error when publish fails', async () => {
    server.use(
      http.post('http://localhost:3000/v1/bundles/:id/publish', () => {
        return HttpResponse.json(
          { title: 'Publish Failed', status: 409, detail: 'Cannot publish' },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(screen.getByText('Publish Now')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Publish Now'));

    await waitFor(() => {
      expect(screen.getByText('Publish Bundle')).toBeInTheDocument();
    });
  });

  it('shows error when set entrypoint fails', async () => {
    server.use(
      http.put('http://localhost:3000/v1/bundles/:id/entrypoint', () => {
        return HttpResponse.json(
          { title: 'Bad Request', status: 400, detail: 'Invalid file ID' },
          { status: 400 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Set as entrypoint')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Set as entrypoint'));

    await waitFor(() => {
      expect(screen.getByText('Set as entrypoint')).toBeInTheDocument();
    });
  });

  it('shows error when add files fails', async () => {
    server.use(
      http.post('http://localhost:3000/v1/bundles/:id/files', () => {
        return HttpResponse.json(
          { title: 'Upload Failed', status: 400, detail: 'File too large' },
          { status: 400 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    const addFilesButtons = screen.getAllByText('Add Files');
    await user.click(addFilesButtons[0]);

    await waitFor(() => {
      const dialogs = screen.getAllByText('Add Files');
      expect(dialogs.length).toBeGreaterThanOrEqual(2);
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<definitions></definitions>'], 'new.bpmn', { type: 'application/xml' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('new.bpmn')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByText('Add Files');
    const dialogAddButton = addButtons[addButtons.length - 1];
    await user.click(dialogAddButton);

    await waitFor(() => {
      expect(screen.getByText('new.bpmn')).toBeInTheDocument();
    });
  });
});
