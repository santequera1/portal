import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ExamGroup, Exam, Mark, GradeScale } from '@/types';

export function useExamGroups(sessionId?: number) {
  const qs = sessionId ? `?sessionId=${sessionId}` : '';
  return useQuery({
    queryKey: ['exam-groups', sessionId],
    queryFn: () => api.get<ExamGroup[]>(`/exams/groups${qs}`),
  });
}

export function useCreateExamGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; sessionId: number }) => api.post<ExamGroup>('/exams/groups', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-groups'] }),
  });
}

export function useDeleteExamGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/exams/groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-groups'] }),
  });
}

export function useExams(params?: { examGroupId?: number; classId?: number }) {
  const qs = new URLSearchParams();
  if (params?.examGroupId) qs.set('examGroupId', String(params.examGroupId));
  if (params?.classId) qs.set('classId', String(params.classId));

  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => api.get<Exam[]>(`/exams?${qs}`),
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { examGroupId: number; subjectId: number; classId: number; date: string; startTime?: string; duration?: number; maxMarks?: number }) =>
      api.post<Exam>('/exams', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}

export function useMarks(params?: { examId?: number; studentId?: number }) {
  const qs = new URLSearchParams();
  if (params?.examId) qs.set('examId', String(params.examId));
  if (params?.studentId) qs.set('studentId', String(params.studentId));

  return useQuery({
    queryKey: ['marks', params],
    queryFn: () => api.get<Mark[]>(`/exams/marks?${qs}`),
    enabled: !!params?.examId || !!params?.studentId,
  });
}

export function useSubmitMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { examId: number; marks: Array<{ studentId: number; marksObtained: number; remarks?: string }> }) =>
      api.post('/exams/marks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marks'] }),
  });
}

export function useGradeScale() {
  return useQuery({
    queryKey: ['grade-scale'],
    queryFn: () => api.get<GradeScale[]>('/exams/grade-scale'),
  });
}

export function useUpdateGradeScale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scales: Omit<GradeScale, 'id'>[]) => api.put('/exams/grade-scale', { scales }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grade-scale'] }),
  });
}
