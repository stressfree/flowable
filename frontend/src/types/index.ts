export interface CompanyResponse {
  id: number;
  name: string;
  parentCompanyId: number | null;
  parentCompanyName: string | null;
  createdAt: string;
}

export interface BundleSummaryResponse {
  id: number;
  bundleType: string;
  description: string;
  status: string;
  companyId: number | null;
  companyName: string | null;
  fileCount: number;
  createdAt: string;
}

export interface CompanyDetailResponse {
  id: number;
  name: string;
  parentCompanyId: number | null;
  parentCompanyName: string | null;
  children: CompanyResponse[];
  bundles: BundleSummaryResponse[];
  createdAt: string;
}

export interface BundleFileResponse {
  id: number;
  filename: string;
  mimeType: string;
  isEntrypoint: boolean;
  createdAt: string;
}

export interface ValidationError {
  fileId: number;
  filename: string;
  fileType: string;
  elementType: string;
  elementName: string;
  elementId: string;
  missingReference: string;
  referenceAttribute: string;
  suggestion: string;
}

export interface ParseError {
  line: number;
  column: number;
  message: string;
  suggestion: string;
}

export interface LifecycleError {
  bundleId: number;
  currentStatus: string;
  action: string;
  reason: string;
  suggestion: string;
}

export interface BundleResponse {
  id: number;
  bundleType: string;
  description: string;
  status: string;
  companyId: number | null;
  companyName: string | null;
  goLiveAt: string | null;
  entrypointFileId: number | null;
  files: BundleFileResponse[];
  validationErrors: ValidationError[];
  hasEvents: boolean;
  createdAt: string;
}

export interface BundleTypeOption {
  type: string;
  label: string;
}

export interface SpawnVariable {
  name: string;
  type: string;
  required: boolean;
  label: string;
}

export interface SpawnFormResponse {
  bundleId: number;
  variables: SpawnVariable[];
}

export interface SpawnResult {
  instanceId: string;
  processDefinitionId: string;
}

export interface EventDefinition {
  eventKey: string;
  eventName: string;
  correlationParameters: EventParameter[];
  payload: EventParameter[];
}

export interface EventParameter {
  name: string;
  type: string;
}

export interface SendEventResult {
  eventKey: string;
  receivedAt: string;
  status: string;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: ValidationError[];
  parseError?: ParseError;
  lifecycleError?: LifecycleError;
  suggestion?: string;
  traceId?: string;
}

export interface CompanyCreateRequest {
  name: string;
  parentCompanyId?: number | null;
}

export interface BundleCreateRequest {
  bundleType: string;
  companyId?: number | null;
  description: string;
}
