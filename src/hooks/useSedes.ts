import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Sede } from '@/types';

export function useSedes(organizationId?: number) {
  const qs = organizationId ? `?organizationId=${organizationId}` : '';
  return useQuery({
    queryKey: ['sedes', organizationId],
    queryFn: () => api.get<Sede[]>(`/sedes${qs}`),
    enabled: !!organizationId, // Only fetch when organizationId is provided
  });
}
