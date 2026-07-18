import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import type { CompanyResponse, CompanyDetailResponse, CompanyCreateRequest } from '@/types';

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  detail: (id: number) => [...companyKeys.all, 'detail', id] as const,
};

export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: () => apiGet<CompanyResponse[]>('/companies'),
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => apiGet<CompanyDetailResponse>(`/companies/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CompanyCreateRequest) =>
      apiPost<CompanyResponse>('/companies', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}
