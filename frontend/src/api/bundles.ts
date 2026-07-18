import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPostFormData,
  apiGetText,
} from '@/lib/api-client';
import type {
  BundleResponse,
  BundleSummaryResponse,
  BundleTypeOption,
  SpawnFormResponse,
  SpawnResult,
  EventDefinition,
  SendEventResult,
} from '@/types';

export const bundleKeys = {
  all: ['bundles'] as const,
  lists: (filters?: Record<string, unknown>) =>
    [...bundleKeys.all, 'list', filters] as const,
  detail: (id: number) => [...bundleKeys.all, 'detail', id] as const,
  fileContent: (id: number, fileId: number) =>
    [...bundleKeys.all, 'file', id, fileId] as const,
  spawnForm: (id: number) => [...bundleKeys.all, 'spawn-form', id] as const,
  events: (id: number) => [...bundleKeys.all, 'events', id] as const,
};

export function useBundleTypes() {
  return useQuery({
    queryKey: ['bundle-types'],
    queryFn: () => apiGet<BundleTypeOption[]>('/bundle-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBundles(filters?: {
  companyId?: number;
  bundleType?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.companyId) params.set('companyId', String(filters.companyId));
  if (filters?.bundleType) params.set('bundleType', filters.bundleType);
  if (filters?.status) params.set('status', filters.status);

  const queryString = params.toString();
  return useQuery({
    queryKey: bundleKeys.lists(filters || {}),
    queryFn: () =>
      apiGet<BundleSummaryResponse[]>(
        `/bundles${queryString ? `?${queryString}` : ''}`,
      ),
  });
}

export function useBundle(id: number) {
  return useQuery({
    queryKey: bundleKeys.detail(id),
    queryFn: () => apiGet<BundleResponse>(`/bundles/${id}`),
    enabled: !!id,
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      files: File[];
      bundleType: string;
      companyId?: number | null;
      description: string;
    }) => {
      const formData = new FormData();
      data.files.forEach((file) => formData.append('files', file));
      formData.append('bundleType', data.bundleType);
      if (data.companyId) formData.append('companyId', String(data.companyId));
      formData.append('description', data.description);
      return apiPostFormData<BundleResponse>('/bundles', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
    },
  });
}

export function useAddFiles(bundleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return apiPostFormData<BundleResponse>(
        `/bundles/${bundleId}/files`,
        formData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}

export function useValidateBundle(bundleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<BundleResponse>(`/bundles/${bundleId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}

export function useSetEntrypoint(bundleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) =>
      apiPut<BundleResponse>(`/bundles/${bundleId}/entrypoint`, { fileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}

export function usePublishBundle(bundleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goLiveAt?: string) =>
      apiPost<BundleResponse>(
        `/bundles/${bundleId}/publish`,
        goLiveAt ? { goLiveAt } : {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(bundleId) });
    },
  });
}

export function useArchiveBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bundleId: number) => apiDelete(`/bundles/${bundleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
    },
  });
}

export function useFileContent(bundleId: number, fileId: number) {
  return useQuery({
    queryKey: bundleKeys.fileContent(bundleId, fileId),
    queryFn: () => apiGetText(`/bundles/${bundleId}/files/${fileId}`),
    enabled: !!bundleId && !!fileId,
  });
}

export function useSpawnForm(bundleId: number) {
  return useQuery({
    queryKey: bundleKeys.spawnForm(bundleId),
    queryFn: () => apiGet<SpawnFormResponse>(`/bundles/${bundleId}/spawn-form`),
    enabled: !!bundleId,
  });
}

export function useSpawn(bundleId: number) {
  return useMutation({
    mutationFn: (variables: Record<string, unknown>) =>
      apiPost<SpawnResult>(`/bundles/${bundleId}/spawn`, { variables }),
  });
}

export function useBundleEvents(bundleId: number) {
  return useQuery({
    queryKey: bundleKeys.events(bundleId),
    queryFn: () => apiGet<EventDefinition[]>(`/bundles/${bundleId}/events`),
    enabled: !!bundleId,
  });
}

export function useSendEvent(bundleId: number) {
  return useMutation({
    mutationFn: ({
      eventKey,
      payload,
    }: {
      eventKey: string;
      payload: Record<string, unknown>;
    }) =>
      apiPost<SendEventResult>(
        `/bundles/${bundleId}/events/${eventKey}/send`,
        payload,
      ),
  });
}
