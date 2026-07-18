import type { ApiError } from '@/types';

const BASE_URL = '/v1';

async function parseApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown>;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  const apiError: ApiError = {
    status: response.status,
    title: (body.title as string) || response.statusText || 'Unknown Error',
    detail: (body.detail as string) || 'An unexpected error occurred',
  };

  if (body.errors) {
    apiError.errors = body.errors as ApiError['errors'];
  }

  if (body.parseError) {
    apiError.parseError = body.parseError as ApiError['parseError'];
  }

  if (body.lifecycleError) {
    apiError.lifecycleError = body.lifecycleError as ApiError['lifecycleError'];
  }

  if (body.suggestion) {
    apiError.suggestion = body.suggestion as string;
  }

  const traceId = response.headers.get('X-Trace-Id');
  if (traceId) {
    apiError.traceId = traceId;
  }

  return apiError;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function apiGetText(path: string): Promise<string> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/xml, text/xml, */*' },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.text();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}
