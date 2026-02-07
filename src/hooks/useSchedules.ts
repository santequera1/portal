import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Schedule } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useSchedules(params?: { classId?: number; teacherId?: number; sectionId?: number }) {
  const { selectedOrgId } = useOrganization();
  const qs = new URLSearchParams();
  if (selectedOrgId) qs.set('organizationId', String(selectedOrgId));
  if (params?.classId) qs.set('classId', String(params.classId));
  if (params?.teacherId) qs.set('teacherId', String(params.teacherId));
  if (params?.sectionId) qs.set('sectionId', String(params.sectionId));

  return useQuery({
    queryKey: ['schedules', params, selectedOrgId],
    queryFn: () => api.get<Schedule[]>(`/schedules?${qs}`),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Schedule>) => api.post<Schedule>('/schedules', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Schedule> }) => api.put<Schedule>(`/schedules/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/schedules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
}
