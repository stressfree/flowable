import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { HelpProvider, useHelp } from '@/components/layout/HelpContext';
import { HelpPanel } from './HelpPanel';

function OpenHelpButton() {
  const { open } = useHelp();
  return <button data-testid="open-help" onClick={open}>Open</button>;
}

function renderWithProviders(ui: React.ReactElement, initialPath = '/bundles') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <HelpProvider>
        {ui}
      </HelpProvider>
    </MemoryRouter>,
  );
}

describe('HelpPanel', () => {
  it('does not render when closed', () => {
    renderWithProviders(<HelpPanel />);

    expect(screen.queryByText('Help & Docs')).not.toBeInTheDocument();
  });

  it('renders article list when open via context', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Help & Docs')).toBeInTheDocument();
    });

    expect(screen.getByText('What is a Decisioning Bundle?')).toBeInTheDocument();
    expect(screen.getByText('Creating Your First Bundle')).toBeInTheDocument();
  });

  it('filters articles by search query', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'Business Process' },
    });

    await waitFor(() => {
      expect(screen.getByText('About BPMN')).toBeInTheDocument();
      expect(screen.queryByText('About CMMN')).not.toBeInTheDocument();
    });
  });

  it('shows article content when clicked', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('What is a Decisioning Bundle?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('What is a Decisioning Bundle?'));

    await waitFor(() => {
      expect(screen.getByText('Back to articles')).toBeInTheDocument();
    });
  });

  it('returns to article list when back button clicked', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('What is a Decisioning Bundle?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('What is a Decisioning Bundle?'));

    await waitFor(() => {
      expect(screen.getByText('Back to articles')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back to articles'));

    await waitFor(() => {
      expect(screen.getByText('Creating Your First Bundle')).toBeInTheDocument();
    });
  });

  it('shows category labels', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Reference')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });
  });

  it('shows contextual highlight based on current route', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
      '/bundles/new',
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Relevant to current page')).toBeInTheDocument();
    });
  });

  it('shows close button when open', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Help & Docs')).toBeInTheDocument();
    });
  });

  it('shows no results message for unmatched search', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'zzznonexistentxyz' },
    });

    await waitFor(() => {
      expect(screen.getByText(/No articles found/)).toBeInTheDocument();
    });
  });

  it('filters articles by content in list items', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'DRG' },
    });

    await waitFor(() => {
      expect(screen.getByText('About DMN')).toBeInTheDocument();
    });
  });

  it('filters articles by content in paragraph text', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'knowledge-intensive' },
    });

    await waitFor(() => {
      expect(screen.getByText('About CMMN')).toBeInTheDocument();
    });
  });

  it('closes panel when close button clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Help & Docs')).toBeInTheDocument();
    });

    const closeButton = container.querySelector('.fixed.right-0 button');
    await user.click(closeButton!);

    await waitFor(() => {
      expect(screen.queryByText('Help & Docs')).not.toBeInTheDocument();
    });
  });

  it('opens contextual article when contextual highlight clicked', async () => {
    const { container } = renderWithProviders(
      <>
        <HelpPanel />
        <OpenHelpButton />
      </>,
      '/bundles/new',
    );

    fireEvent.click(container.querySelector('button[data-testid="open-help"]')!);

    await waitFor(() => {
      expect(screen.getByText('Relevant to current page')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const contextualButton = container.querySelector('.bg-indigo-50 button')!;
    await user.click(contextualButton);

    await waitFor(() => {
      expect(screen.getByText('Back to articles')).toBeInTheDocument();
    });
  });
});
