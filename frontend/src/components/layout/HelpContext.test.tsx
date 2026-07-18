import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpProvider, useHelp } from './HelpContext';

function StateDisplay() {
  const { isOpen, open, close, toggle } = useHelp();
  return (
    <div>
      <span>{isOpen ? 'Open' : 'Closed'}</span>
      <button onClick={open}>OpenBtn</button>
      <button onClick={close}>CloseBtn</button>
      <button onClick={toggle}>ToggleBtn</button>
    </div>
  );
}

function UseHelpOutsideProvider() {
  useHelp();
  return null;
}

describe('HelpContext', () => {
  it('starts closed by default', () => {
    render(
      <HelpProvider>
        <StateDisplay />
      </HelpProvider>,
    );

    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('opens when open() called', async () => {
    const user = userEvent.setup();
    render(
      <HelpProvider>
        <StateDisplay />
      </HelpProvider>,
    );

    await user.click(screen.getByText('OpenBtn'));

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('closes when close() called', async () => {
    const user = userEvent.setup();
    render(
      <HelpProvider>
        <StateDisplay />
      </HelpProvider>,
    );

    await user.click(screen.getByText('OpenBtn'));
    expect(screen.getByText('Open')).toBeInTheDocument();

    await user.click(screen.getByText('CloseBtn'));
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('toggles state when toggle() called', async () => {
    const user = userEvent.setup();
    render(
      <HelpProvider>
        <StateDisplay />
      </HelpProvider>,
    );

    await user.click(screen.getByText('ToggleBtn'));
    expect(screen.getByText('Open')).toBeInTheDocument();

    await user.click(screen.getByText('ToggleBtn'));
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('throws error when useHelp used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<UseHelpOutsideProvider />)).toThrow(
      'useHelp must be used within HelpProvider',
    );

    spy.mockRestore();
  });
});
