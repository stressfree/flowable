import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3000/v1';

export const mockCompanies = [
  { id: 1, name: 'Acme Corp', parentCompanyId: null, parentCompanyName: null, createdAt: '2026-07-12T10:00:00Z' },
  { id: 2, name: 'Acme EU', parentCompanyId: 1, parentCompanyName: 'Acme Corp', createdAt: '2026-07-12T10:01:00Z' },
  { id: 3, name: 'TechStart Inc', parentCompanyId: null, parentCompanyName: null, createdAt: '2026-07-12T10:02:00Z' },
];

export const mockBundleTypes = [
  { type: 'EXPENSE_APPROVAL', label: 'Expense Approval' },
  { type: 'VIRTUAL_CARD_APPROVAL', label: 'Virtual Card Approval' },
  { type: 'PHYSICAL_CREDIT_CARD_APPROVAL', label: 'Physical Credit Card Approval' },
  { type: 'CARD_CONTROLS_CHANGE_APPROVAL', label: 'Card Controls Change Approval' },
];

export const mockBundles = [
  {
    id: 1,
    bundleType: 'EXPENSE_APPROVAL',
    description: 'Standard expense approval',
    status: 'PUBLISHED',
    companyId: 1,
    companyName: 'Acme Corp',
    fileCount: 3,
    createdAt: '2026-07-12T10:00:00Z',
  },
  {
    id: 2,
    bundleType: 'VIRTUAL_CARD_APPROVAL',
    description: 'Virtual card request',
    status: 'DRAFT',
    companyId: null,
    companyName: null,
    fileCount: 2,
    createdAt: '2026-07-12T11:00:00Z',
  },
];

export const mockBundle = {
  id: 1,
  bundleType: 'EXPENSE_APPROVAL',
  description: 'Standard expense approval',
  status: 'DRAFT',
  companyId: 1,
  companyName: 'Acme Corp',
  goLiveAt: null,
  entrypointFileId: 10,
  files: [
    { id: 10, filename: 'expense-approval.bpmn', mimeType: 'application/xml', isEntrypoint: true, createdAt: '2026-07-12T10:00:00Z' },
    { id: 11, filename: 'travel-check.dmn', mimeType: 'application/xml', isEntrypoint: false, createdAt: '2026-07-12T10:00:00Z' },
  ],
  validationErrors: [],
  hasEvents: false,
  createdAt: '2026-07-12T10:00:00Z',
};

export const mockValidationErrors = [
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
];

export const mockSpawnForm = {
  bundleId: 1,
  variables: [
    { name: 'employeeId', type: 'string', required: true, label: 'Employee ID' },
    { name: 'amount', type: 'number', required: true, label: 'Amount' },
    { name: 'hasTravel', type: 'boolean', required: false, label: 'Has Travel' },
  ],
};

export const mockEvents = [
  {
    eventKey: 'expense-submitted',
    eventName: 'Expense Submitted',
    correlationParameters: [
      { name: 'employeeId', type: 'string' },
      { name: 'expenseId', type: 'string' },
    ],
    payload: [
      { name: 'amount', type: 'double' },
      { name: 'description', type: 'string' },
    ],
  },
];

export const handlers = [
  http.get(`${API_BASE}/companies`, () => {
    return HttpResponse.json(mockCompanies);
  }),

  http.get(`${API_BASE}/companies/:id`, ({ params }) => {
    const id = Number(params.id);
    const company = mockCompanies.find((c) => c.id === id);
    if (!company) {
      return HttpResponse.json(
        { title: 'Company not found', status: 404, detail: `Company ${id} not found` },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      ...company,
      children: id === 1 ? [mockCompanies[1]] : [],
      bundles: id === 1 ? mockBundles.filter((b) => b.companyId === 1) : [],
    });
  }),

  http.post(`${API_BASE}/companies`, async ({ request }) => {
    const body = await request.json() as { name: string; parentCompanyId?: number };
    return HttpResponse.json(
      { id: 99, name: body.name, parentCompanyId: body.parentCompanyId || null, parentCompanyName: null, createdAt: '2026-07-12T12:00:00Z' },
      { status: 201 },
    );
  }),

  http.delete(`${API_BASE}/companies/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1) {
      return HttpResponse.json(
        { title: 'Lifecycle error', status: 409, detail: 'Company has bundles' },
        { status: 409 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/bundle-types`, () => {
    return HttpResponse.json(mockBundleTypes);
  }),

  http.get(`${API_BASE}/bundles`, ({ request }) => {
    const url = new URL(request.url);
    const bundleType = url.searchParams.get('bundleType');
    const status = url.searchParams.get('status');
    const companyId = url.searchParams.get('companyId');

    let filtered = mockBundles;
    if (bundleType) filtered = filtered.filter((b) => b.bundleType === bundleType);
    if (status) filtered = filtered.filter((b) => b.status === status);
    if (companyId) filtered = filtered.filter((b) => String(b.companyId) === companyId);

    return HttpResponse.json(filtered);
  }),

  http.get(`${API_BASE}/bundles/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1) return HttpResponse.json(mockBundle);
    return HttpResponse.json(
      { title: 'Bundle not found', status: 404, detail: `Bundle ${id} not found` },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/bundles`, () => {
    return HttpResponse.json({ ...mockBundle, id: 100 }, { status: 201 });
  }),

  http.post(`${API_BASE}/bundles/:id/files`, () => {
    return HttpResponse.json(mockBundle);
  }),

  http.post(`${API_BASE}/bundles/:id/validate`, ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      ...mockBundle,
      id,
      validationErrors: id === 1 ? mockValidationErrors : [],
    });
  }),

  http.put(`${API_BASE}/bundles/:id/entrypoint`, () => {
    return HttpResponse.json(mockBundle);
  }),

  http.post(`${API_BASE}/bundles/:id/publish`, () => {
    return HttpResponse.json({ ...mockBundle, status: 'PUBLISHED' });
  }),

  http.delete(`${API_BASE}/bundles/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/bundles/:id/files/:fileId`, () => {
    return new HttpResponse('<?xml version="1.0"?><definitions></definitions>', {
      headers: { 'Content-Type': 'application/xml' },
    });
  }),

  http.get(`${API_BASE}/bundles/:id/spawn-form`, () => {
    return HttpResponse.json(mockSpawnForm);
  }),

  http.post(`${API_BASE}/bundles/:id/spawn`, () => {
    return HttpResponse.json(
      { instanceId: 'proc-inst-12345', processDefinitionId: 'expense-approval:1:100' },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE}/bundles/:id/events`, () => {
    return HttpResponse.json(mockEvents);
  }),

  http.post(`${API_BASE}/bundles/:id/events/:eventKey/send`, () => {
    return HttpResponse.json({
      eventKey: 'expense-submitted',
      receivedAt: '2026-07-12T14:00:00Z',
      status: 'received',
    });
  }),

  // Error response handlers for testing api-client error parsing
  http.get(`${API_BASE}/test/validation-error`, () => {
    return HttpResponse.json(
      {
        title: 'Validation Failed',
        status: 422,
        detail: 'Cross-reference validation failed',
        errors: mockValidationErrors,
        suggestion: 'Upload the missing referenced files',
      },
      { status: 422 },
    );
  }),

  http.get(`${API_BASE}/test/parse-error`, () => {
    return HttpResponse.json(
      {
        title: 'XML Parse Error',
        status: 422,
        detail: 'Malformed XML',
        parseError: { line: 5, column: 10, message: 'Unexpected token', suggestion: 'Fix the XML structure' },
      },
      { status: 422 },
    );
  }),

  http.get(`${API_BASE}/test/lifecycle-error`, () => {
    return HttpResponse.json(
      {
        title: 'Lifecycle Error',
        status: 409,
        detail: 'Cannot publish bundle with validation errors',
        lifecycleError: { bundleId: 1, currentStatus: 'DRAFT', action: 'PUBLISH', reason: 'Has validation errors', suggestion: 'Fix validation errors first' },
      },
      { status: 409 },
    );
  }),

  http.get(`${API_BASE}/test/with-trace-id`, () => {
    return new HttpResponse(
      JSON.stringify({ title: 'Server Error', status: 500, detail: 'Internal error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': 'trace-abc-123',
        },
      },
    );
  }),

  http.get(`${API_BASE}/test/non-json-error`, () => {
    return new HttpResponse('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }),

  http.post(`${API_BASE}/test/no-content`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_BASE}/test/post-error`, () => {
    return HttpResponse.json(
      { title: 'Validation Failed', status: 422, detail: 'Invalid data' },
      { status: 422 },
    );
  }),

  http.get(`${API_BASE}/test/text-error`, () => {
    return HttpResponse.json(
      { title: 'Not Found', status: 404, detail: 'File not found' },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/test/form-error`, () => {
    return HttpResponse.json(
      { title: 'Upload Failed', status: 400, detail: 'File too large' },
      { status: 400 },
    );
  }),

  http.put(`${API_BASE}/test/put-error`, () => {
    return HttpResponse.json(
      { title: 'Bad Request', status: 400, detail: 'Invalid file ID' },
      { status: 400 },
    );
  }),
];
