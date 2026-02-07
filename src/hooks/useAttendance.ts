import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Attendance } from '@/types';

interface AttendanceResponse {
  attendances: Attendance[];
  students: Array<{ id: number; name: string; admissionNo: string }>;
}

export function useAttendance(params: { sectionId?: number; classId?: number; date?: string }) {
  const qs = new URLSearchParams();
  if (params.sectionId) qs.set('sectionId', String(params.sectionId));
  if (params.classId) qs.set('classId', String(params.classId));
  if (params.date) qs.set('date', params.date);

  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => api.get<AttendanceResponse>(`/attendance?${qs}`),
    enabled: !!params.sectionId && !!params.date,
  });
}

export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionId: number; date: string; records: Array<{ studentId: number; status: string; remarks?: string }> }) =>
      api.post('/attendance', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useAttendanceReport(params: { studentId?: number; from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params.studentId) qs.set('studentId', String(params.studentId));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  return useQuery({
    queryKey: ['attendance-report', params],
    queryFn: () => api.get<{ records: Attendance[]; summary: any }>(`/attendance/report?${qs}`),
    enabled: !!params.studentId,
  });
}

export function useAttendanceSummary(params: { sectionId?: number; month?: string }) {
  const qs = new URLSearchParams();
  if (params.sectionId) qs.set('sectionId', String(params.sectionId));
  if (params.month) qs.set('month', params.month);

  return useQuery({
    queryKey: ['attendance-summary', params],
    queryFn: () => api.get<any[]>(`/attendance/summary?${qs}`),
    enabled: !!params.sectionId && !!params.month,
  });
}
