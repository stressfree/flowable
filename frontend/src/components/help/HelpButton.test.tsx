import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpButton } from './HelpButton';
import { HelpProvider, useHelp } from '@/components/layout/HelpContext';

function HelpStateIndicator() {
  const { isOpen } = useHelp();
  return <div>{isOpen ? 'Open' : 'Closed'}</div>;
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <HelpProvider>
      {ui}
      <HelpStateIndicator />
    </HelpProvider>,
  );
}

describe('HelpButton', () => {
  it('renders button with Help & Docs label', () => {
    renderWithProvider(<HelpButton />);

    expect(screen.getByText('Help & Docs')).toBeInTheDocument();
  });

  it('toggles help panel when clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<HelpButton />);

    expect(screen.getByText('Closed')).toBeInTheDocument();

    await user.click(screen.getByText('Help & Docs'));

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('toggles back to closed on second click', async () => {
    const user = userEvent.setup();
    renderWithProvider(<HelpButton />);

    const button = screen.getByText('Help & Docs');
    await user.click(button);
    expect(screen.getByText('Open')).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});
