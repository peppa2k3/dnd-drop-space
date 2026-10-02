import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../api/tag.api';

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: tagApi.list });
}

function useInvalidateTags() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['tags'] });
    qc.invalidateQueries({ queryKey: ['items'] });
  };
}

export function useCreateTag() {
  const invalidate = useInvalidateTags();
  return useMutation({ mutationFn: tagApi.create, onSuccess: invalidate });
}

export function useUpdateTag() {
  const invalidate = useInvalidateTags();
  return useMutation({ mutationFn: ({ id, payload }) => tagApi.update(id, payload), onSuccess: invalidate });
}

export function useDeleteTag() {
  const invalidate = useInvalidateTags();
  return useMutation({ mutationFn: tagApi.remove, onSuccess: invalidate });
}
