import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ClassInfo, SectionInfo, SubjectInfo, AcademicSession, TeacherAssignment } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useClasses(sessionId?: number) {
  const { selectedOrgId } = useOrganization();
  const qs = new URLSearchParams();
  if (sessionId) qs.set('sessionId', String(sessionId));
  if (selectedOrgId) qs.set('organizationId', String(selectedOrgId));
  const qsStr = qs.toString() ? `?${qs}` : '';
  return useQuery({
    queryKey: ['classes', sessionId, selectedOrgId],
    queryFn: () => api.get<ClassInfo[]>(`/classes${qsStr}`),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; order: number; sessionId: number; category?: string; organizationId?: number }) => api.post<ClassInfo>('/classes', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });
}

export function useSections(classId?: number) {
  const qs = classId ? `?classId=${classId}` : '';
  return useQuery({
    queryKey: ['sections', classId],
    queryFn: () => api.get<SectionInfo[]>(`/classes/sections${qs}`),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; classId: number }) => api.post<SectionInfo>('/classes/sections', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); qc.invalidateQueries({ queryKey: ['classes'] }); },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/classes/sections/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sections'] }); qc.invalidateQueries({ queryKey: ['classes'] }); },
  });
}

export function useSubjects(classId?: number) {
  const { selectedOrgId } = useOrganization();
  const qs = new URLSearchParams();
  if (classId) qs.set('classId', String(classId));
  if (!classId && selectedOrgId) qs.set('organizationId', String(selectedOrgId));
  const qsStr = qs.toString() ? `?${qs}` : '';
  return useQuery({
    queryKey: ['subjects', classId, selectedOrgId],
    queryFn: () => api.get<SubjectInfo[]>(`/classes/subjects${qsStr}`),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; code: string; classIds?: number[]; organizationId?: number }) => api.post<SubjectInfo>('/classes/subjects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); qc.invalidateQueries({ queryKey: ['classes'] }); },
  });
}

export function useAddSubjectToClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { classId: number; subjectId: number }) => api.post('/classes/subjects/assign', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); qc.invalidateQueries({ queryKey: ['classes'] }); },
  });
}

export function useRemoveSubjectFromClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, subjectId }: { classId: number; subjectId: number }) => api.delete(`/classes/subjects/assign/${classId}/${subjectId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); qc.invalidateQueries({ queryKey: ['classes'] }); },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/classes/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<AcademicSession[]>('/classes/sessions'),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string; isActive?: boolean }) => api.post<AcademicSession>('/classes/sessions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AcademicSession> }) => api.put<AcademicSession>(`/classes/sessions/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useTeacherAssignments(classId?: number) {
  const qs = classId ? `?classId=${classId}` : '';
  return useQuery({
    queryKey: ['teacher-assignments', classId],
    queryFn: () => api.get<TeacherAssignment[]>(`/classes/teacher-assignments${qs}`),
  });
}

export function useCreateTeacherAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { teacherId: number; subjectId: number; classId: number; sectionId: number }) => api.post<TeacherAssignment>('/classes/teacher-assignments', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });
}

export function useDeleteTeacherAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/classes/teacher-assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });
}
