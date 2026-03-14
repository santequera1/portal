import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Receipt } from '@/types';

interface ReceiptsResponse {
  receipts: Receipt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useReceipts(params?: { studentId?: number; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.studentId) qs.set('studentId', String(params.studentId));
  if (params?.page) qs.set('page', String(params.page));

  return useQuery({
    queryKey: ['receipts', params],
    queryFn: () => api.get<ReceiptsResponse>(`/receipts?${qs}`),
    enabled: !!params?.studentId,
  });
}

export function useReceipt(id: number | null) {
  return useQuery({
    queryKey: ['receipt', id],
    queryFn: () => api.get<Receipt>(`/receipts/${id}`),
    enabled: !!id,
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
