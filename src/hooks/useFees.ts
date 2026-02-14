import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Fee, FeeType, Payment } from '@/types';

interface FeesResponse {
  fees: Fee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FinanceSummary {
  monthlyIncome: number;
  monthlyExpense: number;
  pendingFees: number;
  overdueFees: number;
  incomeGrowth: number;
}

export function useFees(params?: { studentId?: number; classId?: number; status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.studentId) qs.set('studentId', String(params.studentId));
  if (params?.classId) qs.set('classId', String(params.classId));
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));

  return useQuery({
    queryKey: ['fees', params],
    queryFn: () => api.get<FeesResponse>(`/fees?${qs}`),
  });
}

export function useCreateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: number; feeTypeId: number; amount: number; dueDate: string }) => api.post<Fee>('/fees', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fees'] }),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { feeId: number; studentId: number; amount: number; method?: string; reference?: string }) =>
      api.post<Payment>('/fees/payments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function usePayments(params?: { studentId?: number; feeId?: number }) {
  const qs = new URLSearchParams();
  if (params?.studentId) qs.set('studentId', String(params.studentId));
  if (params?.feeId) qs.set('feeId', String(params.feeId));

  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => api.get<Payment[]>(`/fees/payments?${qs}`),
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api.get<FinanceSummary>('/fees/summary'),
  });
}

export function useFeeTypes() {
  return useQuery({
    queryKey: ['fee-types'],
    queryFn: () => api.get<FeeType[]>('/fees/types'),
  });
}

export function useCreateFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post<FeeType>('/fees/types', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-types'] }),
  });
}

export function useDeleteFeeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/fees/types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-types'] }),
  });
}

export function useDeleteFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/fees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}
