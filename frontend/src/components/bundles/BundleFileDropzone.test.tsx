import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BundleFileDropzone } from './BundleFileDropzone';

describe('BundleFileDropzone', () => {
  it('renders dropzone with accepted extensions text', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/Drag & drop files here/)).toBeInTheDocument();
    expect(screen.getByText(/\.bpmn/)).toBeInTheDocument();
  });

  it('calls onFilesChange when files are dropped', async () => {
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[]} onFilesChange={onFilesChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['<definitions></definitions>'], 'test.bpmn', { type: 'application/xml' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([file]);
    });
  });

  it('displays file list with filename and size', () => {
    const file = new File(['content'], 'test.bpmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[file]} onFilesChange={vi.fn()} />);

    expect(screen.getByText('test.bpmn')).toBeInTheDocument();
    expect(screen.getByText(/B/)).toBeInTheDocument();
  });

  it('shows remove button for files', () => {
    const file = new File(['content'], 'test.bpmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[file]} onFilesChange={vi.fn()} />);

    const removeButton = screen.getByRole('button', { name: '' });
    expect(removeButton).toBeInTheDocument();
  });

  it('calls onFilesChange to remove file when remove button clicked', async () => {
    const file = new File(['content'], 'test.bpmn', { type: 'application/xml' });
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[file]} onFilesChange={onFilesChange} />);

    const removeButton = screen.getByRole('button', { name: '' });
    await user.click(removeButton);

    expect(onFilesChange).toHaveBeenCalledWith([]);
  });

  it('formats file sizes correctly', () => {
    const smallFile = new File(['ab'], 'small.bpmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[smallFile]} onFilesChange={vi.fn()} />);

    expect(screen.getByText('2 B')).toBeInTheDocument();
  });

  it('formats KB file sizes correctly', () => {
    const content = 'x'.repeat(2048);
    const file = new File([content], 'medium.bpmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[file]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/KB/)).toBeInTheDocument();
  });

  it('shows drop hint text', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/Drag & drop files here, or click to browse/)).toBeInTheDocument();
  });

  it('shows all accepted extensions in help text', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/\.bpmn.*\.cmmn.*\.dmn.*\.event.*\.xml/)).toBeInTheDocument();
  });

  it('appends new files to existing files list', async () => {
    const existingFile = new File(['old'], 'existing.bpmn', { type: 'application/xml' });
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[existingFile]} onFilesChange={onFilesChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const newFile = new File(['<def/>'], 'new.dmn', { type: 'application/xml' });

    await user.upload(input, newFile);

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([existingFile, newFile]);
    });
  });

  it('formats MB file sizes correctly', () => {
    const content = 'x'.repeat(2 * 1024 * 1024);
    const file = new File([content], 'large.bpmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[file]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/MB/)).toBeInTheDocument();
  });

  it('shows multiple files in the list', () => {
    const file1 = new File(['content1'], 'first.bpmn', { type: 'application/xml' });
    const file2 = new File(['content2'], 'second.dmn', { type: 'application/xml' });
    render(<BundleFileDropzone files={[file1, file2]} onFilesChange={vi.fn()} />);

    expect(screen.getByText('first.bpmn')).toBeInTheDocument();
    expect(screen.getByText('second.dmn')).toBeInTheDocument();
  });

  it('removes the correct file when remove clicked with multiple files', async () => {
    const file1 = new File(['content1'], 'first.bpmn', { type: 'application/xml' });
    const file2 = new File(['content2'], 'second.dmn', { type: 'application/xml' });
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[file1, file2]} onFilesChange={onFilesChange} />);

    const removeButtons = screen.getAllByRole('button', { name: '' });
    await user.click(removeButtons[1]);

    expect(onFilesChange).toHaveBeenCalledWith([file1]);
  });

  it('shows accepted extensions including .bpmn20.xml', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/\.bpmn20\.xml/)).toBeInTheDocument();
  });

  it('shows accepted extensions including .cmmn', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/\.cmmn/)).toBeInTheDocument();
  });

  it('shows accepted extensions including .event', () => {
    render(<BundleFileDropzone files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByText(/\.event/)).toBeInTheDocument();
  });

  it('does not add files with unsupported extensions', async () => {
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[]} onFilesChange={onFilesChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.txt', { type: 'application/xml' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([]);
    });
  });

  it('rejects files exceeding 10MB limit', async () => {
    const onFilesChange = vi.fn();
    const user = userEvent.setup();
    render(<BundleFileDropzone files={[]} onFilesChange={onFilesChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
    const file = new File([largeContent], 'large.bpmn', { type: 'application/xml' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalledWith([]);
    });
  });
});
