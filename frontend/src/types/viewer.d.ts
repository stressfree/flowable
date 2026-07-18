declare module 'bpmn-js' {
  export default class BpmnViewer {
    constructor(options?: { container?: HTMLElement });
    importXML(xml: string): Promise<{ warnings: unknown[] }>;
    get(name: string): Canvas;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}

declare module 'cmmn-js' {
  export default class CmmnViewer {
    constructor(options?: { container?: HTMLElement });
    importXML(xml: string): Promise<{ warnings: unknown[] }>;
    get(name: string): Canvas;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}

declare module 'dmn-js' {
  export default class DmnViewer {
    constructor(options?: { container?: HTMLElement });
    importXML(xml: string): Promise<{ warnings: unknown[] }>;
    getActiveViewer(): { get(name: string): Canvas } | undefined;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
  }
}

interface Canvas {
  zoom(mode: string): void;
}
