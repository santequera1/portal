import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { AppEvent } from '@/types';

export function useEvents(upcoming?: boolean) {
  const qs = upcoming ? '?upcoming=true' : '';
  return useQuery({
    queryKey: ['events', upcoming],
    queryFn: () => api.get<AppEvent[]>(`/events${qs}`),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppEvent>) => api.post<AppEvent>('/events', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
