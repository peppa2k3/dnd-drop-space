import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trashApi } from '../api/trash.api';

export function useTrashList(params) {
  return useQuery({ queryKey: ['trash', params], queryFn: () => trashApi.list(params) });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trashApi.empty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
