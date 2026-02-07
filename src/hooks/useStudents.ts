import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Student } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useStudents(params?: { page?: number; classId?: number; sectionId?: number; search?: string; status?: string }) {
  const { selectedOrgId } = useOrganization();
  const queryString = new URLSearchParams();
  if (selectedOrgId) queryString.set('organizationId', String(selectedOrgId));
  if (params?.page) queryString.set('page', String(params.page));
  if (params?.classId) queryString.set('classId', String(params.classId));
  if (params?.sectionId) queryString.set('sectionId', String(params.sectionId));
  if (params?.search) queryString.set('search', params.search);
  if (params?.status) queryString.set('status', params.status);

  return useQuery({
    queryKey: ['students', params, selectedOrgId],
    queryFn: () => api.get<StudentsResponse>(`/students?${queryString}`),
  });
}

export function useStudent(id: number | null) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get<Student>(`/students/${id}`),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Student>) => api.post<Student>('/students', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) => api.put<Student>(`/students/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}
