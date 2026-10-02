import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';

export function useSearch(query, params) {
  return useQuery({
    queryKey: ['search', query, params],
    queryFn: () => searchApi.search(query, params),
    enabled: Boolean(query && query.trim()),
  });
}
