import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SearchResult } from '@/types';

export function useSearch(query: string, type?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type) params.set('type', type);

  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => api.get<SearchResult[]>(`/search?${params.toString()}`),
    enabled: query.length >= 2,
  });
}
