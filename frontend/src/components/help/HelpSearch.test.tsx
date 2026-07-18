import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpSearch } from './HelpSearch';

describe('HelpSearch', () => {
  it('renders search input with placeholder', () => {
    render(<HelpSearch query="" onQueryChange={() => {}} articles={[]} />);

    expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
  });

  it('displays current query value', () => {
    render(<HelpSearch query="bpmn" onQueryChange={() => {}} articles={[]} />);

    expect(screen.getByDisplayValue('bpmn')).toBeInTheDocument();
  });

  it('calls onQueryChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HelpSearch query="" onQueryChange={onChange} articles={[]} />);

    await user.type(screen.getByPlaceholderText('Search articles...'), 'test');

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('t');
  });

  it('renders search icon', () => {
    const { container } = render(<HelpSearch query="" onQueryChange={() => {}} articles={[]} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('focuses input on mount', () => {
    render(<HelpSearch query="" onQueryChange={() => {}} articles={[]} />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toHaveFocus();
  });
});
