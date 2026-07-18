import { useEffect, useRef } from 'react';

interface ModelViewerProps {
  xml: string;
  fileType: 'bpmn' | 'cmmn' | 'dmn';
}

interface Canvas {
  zoom(mode: string): void;
}

interface ViewerInstance {
  importXML(xml: string): Promise<{ warnings: unknown[] }>;
  get(name: string): Canvas;
  destroy(): void;
  getActiveViewer?(): { get(name: string): Canvas } | undefined;
}

export function ModelViewer({ xml, fileType }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);

  useEffect(() => {
    async function loadViewer() {
      if (!containerRef.current || !xml) return;

      try {
        if (fileType === 'bpmn') {
          const BpmnViewer = (await import('bpmn-js')).default;
          const viewer = new BpmnViewer({ container: containerRef.current });
          viewerRef.current = viewer as unknown as ViewerInstance;
          await viewer.importXML(xml);
          const canvas = viewer.get('canvas');
          canvas.zoom('fit-viewport');
        } else if (fileType === 'cmmn') {
          const CmmnViewer = (await import('cmmn-js')).default;
          const viewer = new CmmnViewer({ container: containerRef.current });
          viewerRef.current = viewer as unknown as ViewerInstance;
          await viewer.importXML(xml);
          const canvas = viewer.get('canvas');
          canvas.zoom('fit-viewport');
        } else if (fileType === 'dmn') {
          const DmnViewer = (await import('dmn-js')).default;
          const viewer = new DmnViewer({ container: containerRef.current });
          viewerRef.current = viewer as unknown as ViewerInstance;
          await viewer.importXML(xml);
          const activeViewer = viewer.getActiveViewer?.();
          if (activeViewer) {
            const canvas = activeViewer.get('canvas');
            canvas.zoom('fit-viewport');
          }
        }
      } catch (err) {
        console.error('Failed to render model:', err);
      }
    }

    loadViewer();

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy?.();
        } catch {
          // ignore
        }
        viewerRef.current = null;
      }
    };
  }, [xml, fileType]);

  return <div ref={containerRef} className="w-full h-[80vh] bg-white border border-[#e5e7eb] rounded-lg overflow-hidden" />;
}
