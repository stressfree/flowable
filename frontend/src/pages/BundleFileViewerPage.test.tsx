import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockBundle } from '@/test/mocks/handlers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import BundleFileViewerPage from './BundleFileViewerPage';

vi.mock('@/components/viewer/ModelViewer', () => ({
  ModelViewer: ({ xml, fileType }: { xml: string; fileType: string }) => (
    <div data-testid="model-viewer" data-file-type={fileType}>
      {xml.slice(0, 20)}
    </div>
  ),
}));

function renderWithProviders(route = '/bundles/1/files/10') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/bundles/:id/files/:fileId" element={<BundleFileViewerPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BundleFileViewerPage', () => {
  it('renders back to bundle link', () => {
    renderWithProviders();

    expect(screen.getByText('Back to Bundle')).toBeInTheDocument();
  });

  it('renders loading spinner initially', () => {
    renderWithProviders();

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders file name in header after loading', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('expense-approval.bpmn')).toBeInTheDocument();
    });
  });

  it('renders model viewer for bpmn files', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId('model-viewer')).toBeInTheDocument();
    });

    const viewer = screen.getByTestId('model-viewer');
    expect(viewer).toHaveAttribute('data-file-type', 'bpmn');
  });

  it('renders error message when file content fails to load', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id/files/:fileId', () => {
        return HttpResponse.json(
          { title: 'Not Found', status: 404, detail: 'File not found' },
          { status: 404 },
        );
      }),
    );

    renderWithProviders('/bundles/1/files/999');

    await waitFor(() => {
      expect(screen.getByText('Failed to load file content')).toBeInTheDocument();
    });
  });

  it('renders file id in header when file not found in bundle', async () => {
    renderWithProviders('/bundles/1/files/888');

    await waitFor(() => {
      expect(screen.getByText(/File #888/)).toBeInTheDocument();
    });
  });

  it('renders model viewer for dmn files', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id', () => {
        return HttpResponse.json({
          ...mockBundle,
          files: [
            { id: 20, filename: 'decision.dmn', mimeType: 'application/xml', isEntrypoint: false, createdAt: '2026-07-12T10:00:00Z' },
          ],
        });
      }),
    );

    renderWithProviders('/bundles/1/files/20');

    await waitFor(() => {
      expect(screen.getByTestId('model-viewer')).toBeInTheDocument();
    });

    const viewer = screen.getByTestId('model-viewer');
    expect(viewer).toHaveAttribute('data-file-type', 'dmn');
  });

  it('renders model viewer for cmmn files', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id', () => {
        return HttpResponse.json({
          ...mockBundle,
          files: [
            { id: 21, filename: 'case.cmmn', mimeType: 'application/xml', isEntrypoint: false, createdAt: '2026-07-12T10:00:00Z' },
          ],
        });
      }),
    );

    renderWithProviders('/bundles/1/files/21');

    await waitFor(() => {
      expect(screen.getByTestId('model-viewer')).toBeInTheDocument();
    });

    const viewer = screen.getByTestId('model-viewer');
    expect(viewer).toHaveAttribute('data-file-type', 'cmmn');
  });

  it('renders plain text for non-model files', async () => {
    server.use(
      http.get('http://localhost:3000/v1/bundles/:id', () => {
        return HttpResponse.json({
          ...mockBundle,
          files: [
            { id: 22, filename: 'readme.txt', mimeType: 'text/plain', isEntrypoint: false, createdAt: '2026-07-12T10:00:00Z' },
          ],
        });
      }),
    );

    renderWithProviders('/bundles/1/files/22');

    await waitFor(() => {
      expect(document.querySelector('pre')).toBeInTheDocument();
    });
  });
});
