import { describe, it, expect } from 'vitest';
import { apiGet, apiGetText, apiPost, apiPostFormData, apiPut, apiDelete } from './api-client';

describe('api-client', () => {
  describe('apiGet', () => {
    it('fetches JSON data successfully', async () => {
      const result = await apiGet<{ id: number; name: string }>('/companies/1');
      expect(result.id).toBe(1);
      expect(result.name).toBe('Acme Corp');
    });

    it('throws ApiError on non-ok response', async () => {
      await expect(apiGet('/companies/999')).rejects.toMatchObject({
        status: 404,
        title: 'Company not found',
      });
    });

    it('parses validation errors from response body', async () => {
      try {
        await apiGet('/test/validation-error');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as { status: number; errors?: unknown[]; suggestion?: string };
        expect(apiError.status).toBe(422);
        expect(apiError.errors).toBeDefined();
        expect(apiError.errors!.length).toBeGreaterThan(0);
        expect(apiError.suggestion).toBe('Upload the missing referenced files');
      }
    });

    it('parses parse error from response body', async () => {
      try {
        await apiGet('/test/parse-error');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as { status: number; parseError?: { line: number; message: string } };
        expect(apiError.status).toBe(422);
        expect(apiError.parseError).toBeDefined();
        expect(apiError.parseError!.line).toBe(5);
        expect(apiError.parseError!.message).toBe('Unexpected token');
      }
    });

    it('parses lifecycle error from response body', async () => {
      try {
        await apiGet('/test/lifecycle-error');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as { status: number; lifecycleError?: { action: string; reason: string } };
        expect(apiError.status).toBe(409);
        expect(apiError.lifecycleError).toBeDefined();
        expect(apiError.lifecycleError!.action).toBe('PUBLISH');
        expect(apiError.lifecycleError!.reason).toBe('Has validation errors');
      }
    });

    it('parses trace ID from response headers', async () => {
      try {
        await apiGet('/test/with-trace-id');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as { status: number; traceId?: string };
        expect(apiError.status).toBe(500);
        expect(apiError.traceId).toBe('trace-abc-123');
      }
    });

    it('handles non-JSON error body gracefully', async () => {
      try {
        await apiGet('/test/non-json-error');
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as { status: number; title: string; detail: string };
        expect(apiError.status).toBe(500);
        expect(apiError.title).toBe('Internal Server Error');
        expect(apiError.detail).toBe('An unexpected error occurred');
      }
    });
  });

  describe('apiGetText', () => {
    it('fetches text data successfully', async () => {
      const result = await apiGetText('/bundles/1/files/10');
      expect(result).toContain('<definitions');
    });

    it('throws ApiError on non-ok response', async () => {
      await expect(apiGetText('/test/text-error')).rejects.toMatchObject({
        status: 404,
        title: 'Not Found',
      });
    });
  });

  describe('apiPost', () => {
    it('posts JSON and returns response', async () => {
      const result = await apiPost<{ id: number; name: string }>('/companies', {
        name: 'New Co',
      });
      expect(result.id).toBe(99);
      expect(result.name).toBe('New Co');
    });

    it('posts without body and returns response', async () => {
      const result = await apiPost<{ status: string }>('/bundles/1/publish');
      expect(result.status).toBe('PUBLISHED');
    });

    it('returns undefined for 204 No Content', async () => {
      const result = await apiPost<void>('/test/no-content');
      expect(result).toBeUndefined();
    });

    it('throws ApiError on non-ok response', async () => {
      await expect(
        apiPost('/test/post-error'),
      ).rejects.toMatchObject({
        status: 422,
        title: 'Validation Failed',
      });
    });
  });

  describe('apiPostFormData', () => {
    it('posts form data and returns response', async () => {
      const formData = new FormData();
      formData.append('bundleType', 'EXPENSE_APPROVAL');
      const result = await apiPostFormData<{ id: number }>('/bundles/1/files', formData);
      expect(result.id).toBe(1);
    });

    it('throws ApiError on non-ok response', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      await expect(
        apiPostFormData('/test/form-error', formData),
      ).rejects.toMatchObject({
        status: 400,
        title: 'Upload Failed',
      });
    });
  });

  describe('apiPut', () => {
    it('puts JSON and returns response', async () => {
      const result = await apiPut<{ id: number }>('/bundles/1/entrypoint', {
        fileId: 10,
      });
      expect(result.id).toBe(1);
    });

    it('puts without body and returns response', async () => {
      const result = await apiPut<{ status: string }>('/bundles/1/entrypoint');
      expect(result).toBeDefined();
    });

    it('throws ApiError on non-ok response', async () => {
      await expect(
        apiPut('/test/put-error', { fileId: 999 }),
      ).rejects.toMatchObject({
        status: 400,
        title: 'Bad Request',
      });
    });
  });

  describe('apiDelete', () => {
    it('deletes successfully (204)', async () => {
      await expect(apiDelete('/companies/2')).resolves.toBeUndefined();
    });

    it('throws ApiError on conflict (409)', async () => {
      await expect(apiDelete('/companies/1')).rejects.toMatchObject({
        status: 409,
        title: 'Lifecycle error',
        detail: 'Company has bundles',
      });
    });
  });
});
