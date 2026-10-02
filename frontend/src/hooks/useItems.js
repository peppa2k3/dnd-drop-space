import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';

function useInvalidateAfterMutation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['items'] });
    qc.invalidateQueries({ queryKey: ['trash'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['tags'] });
    qc.invalidateQueries({ queryKey: ['folders'] });
  };
}

export function useItemsList(params) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => itemApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useItem(id) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => itemApi.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.createNote, onSuccess: invalidate });
}

export function useUpdateNoteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => itemApi.updateNoteContent(id, content),
    onSuccess: (item) => {
      qc.setQueryData(['item', item.id || item._id], item);
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useCreateUrl() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.createUrl, onSuccess: invalidate });
}

export function useUpdateItem() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: ({ id, payload }) => itemApi.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useToggleFavorite() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.toggleFavorite, onSuccess: invalidate });
}

export function useUploadFiles() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({
    mutationFn: ({ formData, onUploadProgress }) => itemApi.upload(formData, onUploadProgress),
    onSuccess: invalidate,
  });
}

export function useMoveToTrash() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.moveToTrash, onSuccess: invalidate });
}

export function useRestoreItem() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.restore, onSuccess: invalidate });
}

export function usePermanentlyDeleteItem() {
  const invalidate = useInvalidateAfterMutation();
  return useMutation({ mutationFn: itemApi.permanentlyDelete, onSuccess: invalidate });
}
