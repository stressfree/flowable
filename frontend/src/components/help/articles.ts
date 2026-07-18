import type { HelpArticle } from './types';

export const helpArticles: HelpArticle[] = [
  {
    id: 'what-is-bundle',
    title: 'What is a Decisioning Bundle?',
    category: 'getting-started',
    summary: 'Learn how BPMN, CMMN, and DMN files work together to define approval workflows.',
    relatedPages: ['/bundles', '/bundles/new'],
    content: [
      {
        type: 'paragraph',
        text: 'A Decisioning Bundle is a collection of Flowable 8-compatible definition files that together represent an enterprise approval workflow. Each bundle contains one or more BPMN (process), CMMN (case), DMN (decision), or Event Registry files.',
      },
      { type: 'heading', text: 'File Types in a Bundle' },
      {
        type: 'list',
        items: [
          'BPMN — Business process definitions (approval flows, timers, service tasks)',
          'CMMN — Case management definitions (structured, stage-based workflows)',
          'DMN — Decision tables and requirements graphs (business rules)',
          'Event — Event Registry definitions (event-driven process triggers)',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'One file in each bundle is designated as the "entrypoint" — the main process or case that gets spawned when a user starts an instance.',
      },
      { type: 'heading', text: 'Cross-References' },
      {
        type: 'paragraph',
        text: 'Files within a bundle can reference each other. For example, a BPMN process might call a DMN decision table via a business rule task, or a CMMN case might reference a BPMN process via a process task. The validator checks that all references resolve to files within the same bundle.',
      },
    ],
  },
  {
    id: 'creating-first-bundle',
    title: 'Creating Your First Bundle',
    category: 'getting-started',
    summary: 'Step-by-step guide: select type, choose company, upload files, set entrypoint.',
    relatedPages: ['/bundles/new'],
    content: [
      { type: 'heading', text: 'Step 1: Choose a Bundle Type' },
      {
        type: 'paragraph',
        text: 'Select the type of approval workflow you are creating. The bundle type determines which category this workflow belongs to (Expense Approval, Virtual Card Approval, etc.).',
      },
      { type: 'heading', text: 'Step 2: Select a Company' },
      {
        type: 'paragraph',
        text: 'Assign the bundle to a specific company, or leave it as "Global" to apply to all companies. Company-specific bundles override Global bundles through hierarchical resolution.',
      },
      { type: 'heading', text: 'Step 3: Upload Files' },
      {
        type: 'paragraph',
        text: 'Drag and drop your BPMN, CMMN, DMN, and .event files into the upload zone. You can upload multiple files at once. Supported extensions: .bpmn, .bpmn20.xml, .cmmn, .dmn, .event, .xml.',
      },
      { type: 'heading', text: 'Step 4: Set the Entrypoint' },
      {
        type: 'paragraph',
        text: 'After creating the bundle, go to the bundle detail page and click "Set as entrypoint" next to the main process or case file. This is the file that gets spawned when a user starts a new instance.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'You can add more files later by clicking "Add Files" on the bundle detail page (only while in Draft status).',
      },
    ],
  },
  {
    id: 'company-hierarchy',
    title: 'Company Hierarchy & Resolution',
    category: 'getting-started',
    summary: 'How bundles inherit through parent companies, with fallback to Global.',
    relatedPages: ['/companies', '/companies/new'],
    content: [
      {
        type: 'paragraph',
        text: 'Companies can have parent-child relationships. When resolving which bundle to use for a given company and bundle type, the system walks up the hierarchy: it first checks the company itself, then its parent, then the grandparent, and finally falls back to Global.',
      },
      { type: 'heading', text: 'Resolution Order' },
      {
        type: 'list',
        items: [
          'Check the target company for a PUBLISHED bundle of the requested type',
          'If not found, walk up to the parent company',
          'Continue up the chain until a PUBLISHED bundle is found',
          'If none found in the chain, fall back to Global (company = null)',
          'If no Global bundle exists, return 404',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Only PUBLISHED bundles are considered during resolution. DRAFT and ARCHIVED bundles are never resolved.',
      },
      { type: 'heading', text: 'Example' },
      {
        type: 'paragraph',
        text: 'If Acme EU (child of Acme Corp) has no published Expense Approval bundle, but Acme Corp does, then Acme EU employees will use Acme Corp\'s bundle. If neither has one, the Global bundle is used.',
      },
    ],
  },
  {
    id: 'publishing-scheduling',
    title: 'Publishing & Scheduling',
    category: 'getting-started',
    summary: 'Draft -> Published -> Archived lifecycle, go-live scheduling, auto-promotion.',
    relatedPages: ['/bundles/:id'],
    content: [
      { type: 'heading', text: 'Bundle Lifecycle' },
      {
        type: 'list',
        items: [
          'DRAFT — Initial state after creation. Files can be added, entrypoint set, validation run.',
          'PUBLISHED — Live and resolvable. Only one published bundle per (company, type) at a time.',
          'ARCHIVED — No longer active. Previous published bundles are archived when a new one is published.',
        ],
      },
      { type: 'heading', text: 'Publish Now' },
      {
        type: 'paragraph',
        text: 'Click "Publish" on the bundle detail page to immediately promote a DRAFT bundle to PUBLISHED. The currently published bundle for the same (company, type) is automatically archived.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Bundles with unresolved validation errors cannot be published. Fix all cross-reference errors first.',
      },
      { type: 'heading', text: 'Schedule for Later' },
      {
        type: 'paragraph',
        text: 'In the publish dialog, choose a future date and time. The bundle remains in DRAFT status with a go-live timestamp. A scheduled job checks every 30 seconds and automatically promotes bundles whose go-live time has passed.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'The scheduler interval is configurable via the scheduler.go-live-interval-ms property in application.yml.',
      },
    ],
  },
  {
    id: 'validating-bundles',
    title: 'Validating Your Bundles',
    category: 'getting-started',
    summary: 'How cross-reference validation works, common errors, and how to fix them.',
    relatedPages: ['/bundles/:id'],
    content: [
      {
        type: 'paragraph',
        text: 'Cross-reference validation checks that all references between files in a bundle resolve correctly. This includes BPMN call activities, business rule tasks, CMMN process/decision tasks, and event references.',
      },
      { type: 'heading', text: 'What Gets Validated' },
      {
        type: 'list',
        items: [
          'BPMN callActivity.calledElement — must match a process id in another BPMN file',
          'BPMN businessRuleTask.decisionRef — must match a decision id in a DMN file',
          'BPMN event eventRef — must match an event key in an .event file',
          'CMMN caseTask.caseRef — must match a case id in another CMMN file',
          'CMMN processTask.processRef — must match a process id in a BPMN file',
          'CMMN decisionTask.decisionRef — must match a decision id in a DMN file',
          'DMN decision.decisionRef — must match a decision id in another DMN file',
        ],
      },
      { type: 'heading', text: 'Reading Validation Errors' },
      {
        type: 'paragraph',
        text: 'Each error card shows the file type, element name, the missing reference value (in red monospace), and a suggestion for how to fix it. The suggestion typically tells you to either upload the missing file or remove the referencing element.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'After uploading a missing file, click "Re-validate" to re-run the validation. The error panel will turn green when all references resolve.',
      },
    ],
  },
  {
    id: 'spawning-processes',
    title: 'Spawning Processes',
    category: 'getting-started',
    summary: 'How to start a Flowable process instance from a published bundle.',
    relatedPages: ['/bundles/:id/spawn'],
    content: [
      {
        type: 'paragraph',
        text: 'Once a bundle is published and has an entrypoint file, you can spawn process or case instances from it. The spawn form automatically extracts start form variables from the Flowable process definition.',
      },
      { type: 'heading', text: 'Prerequisites' },
      {
        type: 'list',
        items: [
          'Bundle must be in PUBLISHED status',
          'Bundle must have an entrypoint file set',
          'The entrypoint must be a BPMN process or CMMN case',
        ],
      },
      { type: 'heading', text: 'Filling Out the Form' },
      {
        type: 'paragraph',
        text: 'If the process defines start form variables, you will see typed inputs (text, number, boolean). Fill them in and click "Start Process Instance". If no variables are detected, a JSON textarea is provided as a fallback.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'The instance ID is displayed on success. You can use this ID to track the process in Flowable\'s runtime data.',
      },
      { type: 'heading', text: 'Sending Test Events' },
      {
        type: 'paragraph',
        text: 'If the bundle contains .event files, a "Send Test Event" section appears below the spawn form. Select an event, fill in the correlation parameters and payload, and click "Send Event" to trigger any waiting process instances.',
      },
    ],
  },
  {
    id: 'bundle-types-explained',
    title: 'Bundle Types Explained',
    category: 'reference',
    summary: 'Expense Approval (3 variants), Virtual Card, Physical Card + KYC, Card Controls.',
    relatedPages: ['/bundles/new'],
    content: [
      {
        type: 'paragraph',
        text: 'There are four bundle types, each representing a different category of approval workflow:',
      },
      { type: 'heading', text: 'Expense Approval' },
      {
        type: 'paragraph',
        text: 'Expense submission and approval workflows. The sample bundles include three variants: standard with time/travel escalation, government client review, and tiered amount with time escalation. These use BPMN processes with DMN decision tables for routing.',
      },
      { type: 'heading', text: 'Virtual Card Approval' },
      {
        type: 'paragraph',
        text: 'Virtual credit card request approval. Uses a BPMN process with DMN tables for eligibility checking and limit determination. Includes an HTTP service task that calls the mock API to issue the card.',
      },
      { type: 'heading', text: 'Physical Card Approval' },
      {
        type: 'paragraph',
        text: 'Physical credit card request with KYC (Know Your Customer) validation. Uses a BPMN process with DMN tables for KYC completeness checking and risk assessment. Includes identity verification via the mock API.',
      },
      { type: 'heading', text: 'Card Controls Change Approval' },
      {
        type: 'paragraph',
        text: 'Card control changes (limit increases/decreases, freezes). This is the most complex bundle type, using a CMMN case that orchestrates two BPMN processes and a DMN decision table. The case has conditional stages based on the change amount.',
      },
    ],
  },
  {
    id: 'file-types-bpmn-cmmn-dmn',
    title: 'File Types: BPMN, CMMN, DMN',
    category: 'reference',
    summary: 'What each file type represents, when to use each, and how they cross-reference.',
    relatedPages: ['/bundles/new'],
    content: [
      { type: 'heading', text: 'BPMN (Business Process Model and Notation)' },
      {
        type: 'paragraph',
        text: 'BPMN files define executable business processes. They contain flow elements (tasks, gateways, events) connected by sequence flows. BPMN is best for linear, sequential workflows with clear paths. Supported extensions: .bpmn, .bpmn20.xml.',
      },
      { type: 'heading', text: 'CMMN (Case Management Model and Notation)' },
      {
        type: 'paragraph',
        text: 'CMMN files define case management definitions. They contain stages, tasks, milestones, and sentries. CMMN is best for non-linear, knowledge-worker processes where the order of tasks depends on the situation. Supported extension: .cmmn.',
      },
      { type: 'heading', text: 'DMN (Decision Model and Notation)' },
      {
        type: 'paragraph',
        text: 'DMN files define decision tables and decision requirement graphs. They contain inputs, outputs, and rules. DMN is best for encoding business rules that determine an output based on input parameters. Supported extension: .dmn.',
      },
      { type: 'heading', text: 'Event Registry (.event)' },
      {
        type: 'paragraph',
        text: 'Event definition files define events that can trigger process start or be waited for at event-based gateways. They contain a key, correlation parameters, and payload fields. Supported extension: .event.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'All file types can coexist in the same bundle. The cross-reference validator checks that references between files resolve correctly.',
      },
    ],
  },
  {
    id: 'diagram-auto-generation',
    title: 'Diagram Auto-Generation',
    category: 'reference',
    summary: 'How ELK layouts work and what happens when files lack embedded diagrams.',
    relatedPages: ['/bundles/:id/files/:fileId'],
    content: [
      {
        type: 'paragraph',
        text: 'When you upload a BPMN, CMMN, or DMN file, the system checks whether it contains embedded diagram interchange (DI) information. If no DI is present, the ELK (Eclipse Layout Kernel) layout engine generates one automatically.',
      },
      { type: 'heading', text: 'How It Works' },
      {
        type: 'list',
        items: [
          'The file is parsed using Flowable\'s XML converters',
          'If no DI is found, a graph is built from the model elements',
          'ELK runs the LAYERED algorithm (direction=RIGHT, spacing=40px, layer-spacing=60px)',
          'The generated positions are written back into the model',
          'The file is re-serialized with DI included',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Because diagrams are generated server-side on upload, the bpmn-js/cmmn-js/dmn-js viewers always render clean diagrams without needing client-side layout.',
      },
      { type: 'heading', text: 'DMN Layout' },
      {
        type: 'paragraph',
        text: 'For DMN decision tables, a structured grid layout is generated. For decision requirement graphs (DRG), the ELK LAYERED algorithm is used to lay out the dependency graph.',
      },
    ],
  },
  {
    id: 'sample-bundles-overview',
    title: 'Sample Bundles Overview',
    category: 'reference',
    summary: 'Describes the 7 included sample bundles and what they demonstrate.',
    relatedPages: ['/bundles'],
    content: [
      {
        type: 'paragraph',
        text: 'The system includes 7 pre-built sample bundles that demonstrate real approval workflows. They can be loaded using the seed script (scripts/seed-samples.sh).',
      },
      { type: 'heading', text: 'Expense Approval Samples' },
      {
        type: 'list',
        items: [
          '1A: Standard with Time + Travel Escalation — event-based start, DMN travel check, boundary timer escalation',
          '1B: Government Client + Travel Escalation — DMN line-item classification, governmental spend review',
          '1C: Tiered Amount with Time Escalation — DMN amount thresholds, auto-approve/manager/dual approval paths',
        ],
      },
      { type: 'heading', text: 'Card Approval Samples' },
      {
        type: 'list',
        items: [
          '2: Virtual Card Request — DMN eligibility + limit check, HTTP service task for card issuance',
          '3: Physical Card with KYC — DMN KYC validation, identity verification, risk assessment',
          '4: Card Controls Change (CMMN) — case management with two BPMN processes and conditional stages',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Run scripts/seed-samples.sh after starting the backend to load all samples. The script creates sample companies (Acme Corp, Acme EU, TechStart Inc, GovContract LLC) and uploads the bundles.',
      },
    ],
  },
  {
    id: 'error-messages-reference',
    title: 'Error Messages Reference',
    category: 'reference',
    summary: 'Catalog of error types, what they mean, and how to resolve them.',
    relatedPages: ['/bundles/:id'],
    content: [
      { type: 'heading', text: 'Validation Errors (422)' },
      {
        type: 'paragraph',
        text: 'Cross-reference validation failures. The error panel shows each unresolved reference with the file type, element name, missing reference value, and a suggestion for how to fix it.',
      },
      { type: 'heading', text: 'XML Parse Errors (422)' },
      {
        type: 'paragraph',
        text: 'Malformed XML that cannot be parsed. The error includes the line number, column, and a message from the XML parser. Fix the XML structure and re-upload the file.',
      },
      { type: 'heading', text: 'Lifecycle Errors (409)' },
      {
        type: 'paragraph',
        text: 'Invalid state transitions, such as trying to publish a bundle with validation errors, or adding files to a published bundle. The error explains the current status, the attempted action, and why it failed.',
      },
      { type: 'heading', text: 'Not Found (404)' },
      {
        type: 'paragraph',
        text: 'A bundle, file, or company with the given ID does not exist. Check the URL or navigate from the list page.',
      },
      { type: 'heading', text: 'Flowable Deployment Errors (503)' },
      {
        type: 'paragraph',
        text: 'The Flowable engine could not deploy or spawn the process. This may happen if a process with the same key but different content is already deployed. Archive the existing published bundle and try again.',
      },
      { type: 'heading', text: 'File Too Large (413)' },
      {
        type: 'paragraph',
        text: 'A file exceeds the 10MB limit. Split or compress the file and try again.',
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'All errors include a suggestion field with actionable guidance. Toast notifications show the error detail, and inline panels provide more context.',
      },
    ],
  },
  {
    id: 'about-cmmn',
    title: 'About CMMN',
    category: 'learn-more',
    summary: 'What is Case Management Model and Notation, with links to OMG spec and Flowable docs.',
    relatedPages: ['/bundles/:id/files/:fileId'],
    content: [
      {
        type: 'paragraph',
        text: 'CMMN (Case Management Model and Notation) is an OMG standard for case management. Unlike BPMN, which models predictable, sequential processes, CMMN models unpredictable, knowledge-intensive work where the order of tasks depends on the evolving situation.',
      },
      { type: 'heading', text: 'Key Concepts' },
      {
        type: 'list',
        items: [
          'Case — A specific instance of handling a situation',
          'Stage — A group of related tasks that can be activated together',
          'Task — Human (humanTask), process (processTask), or decision (decisionTask) work',
          'Milestone — A significant point in the case lifecycle',
          'Sentry — A guard condition that controls when tasks/stages become available',
        ],
      },
      {
        type: 'paragraph',
        text: 'In this system, CMMN is used for the Card Controls Change Approval bundle, where the approval path depends on the change amount and may involve conditional stages.',
      },
      { type: 'heading', text: 'Learn More' },
      {
        type: 'link',
        text: 'OMG CMMN Specification',
        url: 'https://www.omg.org/spec/CMMN/',
      },
      {
        type: 'link',
        text: 'Flowable CMMN Documentation',
        url: 'https://documentation.flowable.com/latest/cmmn/cmmn-overview',
      },
    ],
  },
  {
    id: 'about-bpmn',
    title: 'About BPMN',
    category: 'learn-more',
    summary: 'What is Business Process Model and Notation, with links to OMG spec and Flowable docs.',
    relatedPages: ['/bundles/:id/files/:fileId'],
    content: [
      {
        type: 'paragraph',
        text: 'BPMN (Business Process Model and Notation) is an OMG standard for modeling business processes. It provides a graphical notation for specifying the sequence of activities, events, and decisions in a process.',
      },
      { type: 'heading', text: 'Key Concepts' },
      {
        type: 'list',
        items: [
          'Process — A defined sequence of activities and events',
          'Task — Manual, user, service, or business rule work',
          'Gateway — Decision points (exclusive, parallel, inclusive, event-based)',
          'Event — Start, intermediate, or end events (timers, signals, messages)',
          'Sequence Flow — The order in which elements are executed',
        ],
      },
      {
        type: 'paragraph',
        text: 'In this system, BPMN is used for expense approval, virtual card approval, and physical card approval workflows. These processes use DMN decision tables for routing and HTTP service tasks for external API calls.',
      },
      { type: 'heading', text: 'Learn More' },
      {
        type: 'link',
        text: 'OMG BPMN Specification',
        url: 'https://www.omg.org/spec/BPMN/',
      },
      {
        type: 'link',
        text: 'Flowable BPMN Documentation',
        url: 'https://documentation.flowable.com/latest/bpmn/bpmn-overview',
      },
    ],
  },
  {
    id: 'about-dmn',
    title: 'About DMN',
    category: 'learn-more',
    summary: 'What is Decision Model and Notation, with links to OMG spec and Flowable docs.',
    relatedPages: ['/bundles/:id/files/:fileId'],
    content: [
      {
        type: 'paragraph',
        text: 'DMN (Decision Model and Notation) is an OMG standard for modeling decisions. It provides decision tables and decision requirement graphs that encode business rules separately from process logic.',
      },
      { type: 'heading', text: 'Key Concepts' },
      {
        type: 'list',
        items: [
          'Decision Table — A table mapping inputs to outputs via rules',
          'Input — A parameter used in decision rules (e.g., amount, hasTravel)',
          'Output — The result of the decision (e.g., approvalLevel, riskLevel)',
          'Rule — A row in the table with input conditions and output values',
          'Decision Requirement Graph (DRG) — A dependency graph showing how decisions depend on each other',
        ],
      },
      {
        type: 'paragraph',
        text: 'In this system, DMN is used for routing decisions in all bundle types: travel checks, amount thresholds, card eligibility, KYC validation, risk assessment, and line-item classification.',
      },
      { type: 'heading', text: 'Learn More' },
      {
        type: 'link',
        text: 'OMG DMN Specification',
        url: 'https://www.omg.org/spec/DMN/',
      },
      {
        type: 'link',
        text: 'Flowable DMN Documentation',
        url: 'https://documentation.flowable.com/latest/dmn/dmn-overview',
      },
    ],
  },
];
