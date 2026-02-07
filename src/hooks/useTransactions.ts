import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Transaction } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useTransactions(params?: { type?: string; from?: string; to?: string; page?: number; category?: string }) {
  const { selectedOrgId } = useOrganization();
  const qs = new URLSearchParams();
  if (selectedOrgId) qs.set('organizationId', String(selectedOrgId));
  if (params?.type) qs.set('type', params.type);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.category) qs.set('category', params.category);

  return useQuery({
    queryKey: ['transactions', params, selectedOrgId],
    queryFn: () => api.get<TransactionsResponse>(`/transactions?${qs}`),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; description: string; amount: number; date?: string; category: string; status?: string }) =>
      api.post<Transaction>('/transactions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}
