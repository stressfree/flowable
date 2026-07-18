import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidationErrorsPanel } from './ValidationErrorsPanel';
import type { ValidationError } from '@/types';

const errors: ValidationError[] = [
  {
    fileId: 10,
    filename: 'expense-approval.bpmn',
    fileType: 'BPMN',
    elementType: 'callActivity',
    elementName: 'Approve Invoice',
    elementId: 'callActivity_1',
    missingReference: 'subprocess-invoice',
    referenceAttribute: 'calledElement',
    suggestion: 'Upload a BPMN file containing process id="subprocess-invoice"',
  },
  {
    fileId: 11,
    filename: 'travel-check.dmn',
    fileType: 'DMN',
    elementType: 'decisionRef',
    elementName: 'Travel Check',
    elementId: 'travel-check',
    missingReference: 'missing-decision',
    referenceAttribute: 'decisionRef',
    suggestion: 'Upload a DMN file containing decision id="missing-decision"',
  },
];

describe('ValidationErrorsPanel', () => {
  it('shows success message when no errors', () => {
    render(<ValidationErrorsPanel errors={[]} />);

    expect(screen.getByText('All cross-references valid')).toBeInTheDocument();
  });

  it('shows error count when errors exist', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.getByText('2 unresolved references found')).toBeInTheDocument();
  });

  it('renders error cards with element names', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.getByText('Approve Invoice')).toBeInTheDocument();
    expect(screen.getByText('Travel Check')).toBeInTheDocument();
  });

  it('shows missing reference in monospace', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.getByText('subprocess-invoice')).toBeInTheDocument();
    expect(screen.getByText('missing-decision')).toBeInTheDocument();
  });

  it('shows suggestion text', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.getByText(/Upload a BPMN file containing process id/)).toBeInTheDocument();
    expect(screen.getByText(/Upload a DMN file containing decision id/)).toBeInTheDocument();
  });

  it('shows file type badges', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.getByText('BPMN')).toBeInTheDocument();
    expect(screen.getByText('DMN')).toBeInTheDocument();
  });

  it('calls onRevalidate when re-validate button clicked', async () => {
    const onRevalidate = vi.fn();
    const user = userEvent.setup();
    render(<ValidationErrorsPanel errors={errors} onRevalidate={onRevalidate} />);

    const button = screen.getByText('Re-validate');
    await user.click(button);

    expect(onRevalidate).toHaveBeenCalled();
  });

  it('shows singular reference when one error', () => {
    render(<ValidationErrorsPanel errors={[errors[0]]} />);

    expect(screen.getByText('1 unresolved reference found')).toBeInTheDocument();
  });

  it('shows re-validate button in success state when onRevalidate provided', () => {
    render(<ValidationErrorsPanel errors={[]} onRevalidate={vi.fn()} />);

    expect(screen.getByText('Re-validate')).toBeInTheDocument();
  });

  it('shows validating text when isValidating is true', () => {
    render(<ValidationErrorsPanel errors={[]} onRevalidate={vi.fn()} isValidating />);

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('shows validating text in error state when isValidating is true', () => {
    render(<ValidationErrorsPanel errors={errors} onRevalidate={vi.fn()} isValidating />);

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('does not show re-validate button when onRevalidate not provided', () => {
    render(<ValidationErrorsPanel errors={errors} />);

    expect(screen.queryByText('Re-validate')).not.toBeInTheDocument();
  });

  it('calls onRevalidate from success state', async () => {
    const onRevalidate = vi.fn();
    const user = userEvent.setup();
    render(<ValidationErrorsPanel errors={[]} onRevalidate={onRevalidate} />);

    await user.click(screen.getByText('Re-validate'));

    expect(onRevalidate).toHaveBeenCalled();
  });
});
