import {
  useToggleFavorite,
  useMoveToTrash,
  useRestoreItem,
  usePermanentlyDeleteItem,
  useUpdateItem,
} from './useItems';
import { useToast } from '../context/ToastContext';

export function useItemActions() {
  const toggleFavoriteMutation = useToggleFavorite();
  const moveToTrashMutation = useMoveToTrash();
  const restoreMutation = useRestoreItem();
  const permanentlyDeleteMutation = usePermanentlyDeleteItem();
  const updateMutation = useUpdateItem();
  const { addToast } = useToast();

  return {
    toggleFavorite: (id) =>
      toggleFavoriteMutation.mutate(id, {
        onError: () => addToast('Không thể cập nhật mục yêu thích', 'error'),
      }),
    moveToTrash: (id, onDone) =>
      moveToTrashMutation.mutate(id, {
        onSuccess: () => {
          addToast('Đã chuyển vào Thùng rác');
          onDone?.();
        },
        onError: () => addToast('Xóa thất bại, vui lòng thử lại', 'error'),
      }),
    restore: (id) =>
      restoreMutation.mutate(id, {
        onSuccess: () => addToast('Đã khôi phục mục đã chọn'),
        onError: () => addToast('Khôi phục thất bại', 'error'),
      }),
    permanentlyDelete: (id, onDone) =>
      permanentlyDeleteMutation.mutate(id, {
        onSuccess: () => {
          addToast('Đã xóa vĩnh viễn');
          onDone?.();
        },
        onError: () => addToast('Xóa thất bại, vui lòng thử lại', 'error'),
      }),
    rename: (id, title, onDone) =>
      updateMutation.mutate(
        { id, payload: { title } },
        {
          onSuccess: () => {
            addToast('Đã đổi tên');
            onDone?.();
          },
          onError: () => addToast('Đổi tên thất bại', 'error'),
        }
      ),
    moveToFolder: (id, folder, onDone) =>
      updateMutation.mutate(
        { id, payload: { folder } },
        {
          onSuccess: () => {
            addToast('Đã di chuyển');
            onDone?.();
          },
          onError: () => addToast('Di chuyển thất bại', 'error'),
        }
      ),
    updateItem: (id, payload, onDone) =>
      updateMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            addToast('Đã lưu thay đổi');
            onDone?.();
          },
          onError: () => addToast('Lưu thất bại', 'error'),
        }
      ),
    isLoading:
      toggleFavoriteMutation.isPending ||
      moveToTrashMutation.isPending ||
      restoreMutation.isPending ||
      permanentlyDeleteMutation.isPending ||
      updateMutation.isPending,
  };
}
