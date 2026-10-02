import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { folderApi } from '../api/folder.api';

export function useFolders() {
  return useQuery({ queryKey: ['folders'], queryFn: folderApi.list });
}

function useInvalidateFolders() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['folders'] });
    qc.invalidateQueries({ queryKey: ['items'] });
  };
}

export function useCreateFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({ mutationFn: folderApi.create, onSuccess: invalidate });
}

export function useUpdateFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({
    mutationFn: ({ id, payload }) => folderApi.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteFolder() {
  const invalidate = useInvalidateFolders();
  return useMutation({ mutationFn: folderApi.remove, onSuccess: invalidate });
}
