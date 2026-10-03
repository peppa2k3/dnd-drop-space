import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user.api';
export const useUsers = (page, q, enabled) => useQuery({
  queryKey: ['admin-users', page, q], queryFn: () => userApi.list(page, q), enabled,
});
export const useUserFiles = (id, page) => useQuery({
  queryKey: ['admin-files', id, page], queryFn: () => userApi.files(id, page), enabled: Boolean(id),
});
export const useUserAudit = (id, page) => useQuery({
  queryKey: ['admin-audit', id, page], queryFn: () => userApi.audit(id, page), enabled: Boolean(id),
});
export function useAdminMutation(action) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      for (const key of ['admin-users', 'admin-files', 'admin-audit', 'dashboard', 'items', 'trash']) {
        cache.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
