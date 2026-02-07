import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { StaffMember } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useStaff(params?: { department?: string; designation?: string; search?: string }) {
  const { selectedOrgId } = useOrganization();
  const qs = new URLSearchParams();
  if (selectedOrgId) qs.set('organizationId', String(selectedOrgId));
  if (params?.department) qs.set('department', params.department);
  if (params?.designation) qs.set('designation', params.designation);
  if (params?.search) qs.set('search', params.search);

  return useQuery({
    queryKey: ['staff', params, selectedOrgId],
    queryFn: () => api.get<StaffMember[]>(`/staff?${qs}`),
  });
}

export function useStaffMember(id: number | null) {
  return useQuery({
    queryKey: ['staff', id],
    queryFn: () => api.get<StaffMember>(`/staff/${id}`),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StaffMember>) => api.post<StaffMember>('/staff', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StaffMember> }) => api.put<StaffMember>(`/staff/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}
