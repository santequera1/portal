import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { DashboardStats } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useDashboardStats() {
  const { selectedOrgId } = useOrganization();
  const qs = selectedOrgId ? `?organizationId=${selectedOrgId}` : '';
  return useQuery({
    queryKey: ['dashboard-stats', selectedOrgId],
    queryFn: () => api.get<DashboardStats>(`/dashboard/stats${qs}`),
    refetchInterval: 5 * 60 * 1000,
  });
}
