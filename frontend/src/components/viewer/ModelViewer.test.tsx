import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockImportXML = vi.fn().mockResolvedValue({ warnings: [] });
const mockZoom = vi.fn();
const mockDestroy = vi.fn();
const mockGet = vi.fn().mockReturnValue({ zoom: mockZoom });

vi.mock('bpmn-js', () => ({
  default: function MockBpmnViewer() {
    return {
      importXML: mockImportXML,
      get: mockGet,
      destroy: mockDestroy,
    };
  },
}));

vi.mock('cmmn-js', () => ({
  default: function MockCmmnViewer() {
    return {
      importXML: mockImportXML,
      get: mockGet,
      destroy: mockDestroy,
    };
  },
}));

vi.mock('dmn-js', () => ({
  default: function MockDmnViewer() {
    return {
      importXML: mockImportXML,
      get: mockGet,
      destroy: mockDestroy,
      getActiveViewer: () => ({ get: mockGet }),
    };
  },
}));

import { ModelViewer } from './ModelViewer';

describe('ModelViewer', () => {
  it('renders container div', () => {
    render(<ModelViewer xml="" fileType="bpmn" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    const { container } = render(<ModelViewer xml="" fileType="bpmn" />);

    expect(container.firstChild).toHaveClass('bg-white');
  });

  it('does not load viewer when xml is empty', () => {
    render(<ModelViewer xml="" fileType="bpmn" />);

    expect(mockImportXML).not.toHaveBeenCalled();
  });

  it('loads bpmn viewer when xml provided', async () => {
    render(<ModelViewer xml="<definitions/>" fileType="bpmn" />);

    await vi.waitFor(() => {
      expect(mockImportXML).toHaveBeenCalledWith('<definitions/>');
    });

    expect(mockZoom).toHaveBeenCalledWith('fit-viewport');
  });

  it('loads cmmn viewer for cmmn files', async () => {
    render(<ModelViewer xml="<definitions/>" fileType="cmmn" />);

    await vi.waitFor(() => {
      expect(mockImportXML).toHaveBeenCalledWith('<definitions/>');
    });
  });

  it('loads dmn viewer for dmn files', async () => {
    render(<ModelViewer xml="<definitions/>" fileType="dmn" />);

    await vi.waitFor(() => {
      expect(mockImportXML).toHaveBeenCalledWith('<definitions/>');
    });
  });
});
