import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats, refetchOnWindowFocus: true, refetchInterval: 30000 });
}
