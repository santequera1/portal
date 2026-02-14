import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { PaymentPlan, StudentPaymentPlan } from '@/types';

export function usePaymentPlans() {
  return useQuery({
    queryKey: ['payment-plans'],
    queryFn: () => api.get<PaymentPlan[]>('/payment-plans'),
  });
}

export function useCreatePaymentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PaymentPlan>) => api.post<PaymentPlan>('/payment-plans', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-plans'] }),
  });
}

export function useUpdatePaymentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaymentPlan> }) =>
      api.put<PaymentPlan>(`/payment-plans/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-plans'] }),
  });
}

export function useDeletePaymentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/payment-plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-plans'] }),
  });
}

export function useAssignPlanToStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studentId: number;
      paymentPlanId: number;
      customTuition?: number;
      customDiscount?: number;
      startDate?: string;
    }) => api.post('/payment-plans/assign', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['student-plan'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function useStudentPlan(studentId?: number) {
  return useQuery({
    queryKey: ['student-plan', studentId],
    queryFn: () => api.get<StudentPaymentPlan>(`/payment-plans/student/${studentId}`),
    enabled: !!studentId,
  });
}
