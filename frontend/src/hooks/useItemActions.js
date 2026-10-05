import {
  useToggleFavorite,
  useMoveToTrash,
  useRestoreItem,
  usePermanentlyDeleteItem,
  useUpdateItem,
} from './useItems';
import { useToast } from '../context/ToastContext';
import i18n from '../i18n/config';

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
        onError: () => addToast(i18n.t('notifications:favoriteUpdateFailed'), 'error'),
      }),
    moveToTrash: (id, onDone) =>
      moveToTrashMutation.mutate(id, {
        onSuccess: () => {
          addToast(i18n.t('notifications:movedToTrash'));
          onDone?.();
        },
        onError: () => addToast(i18n.t('notifications:deleteFailed'), 'error'),
      }),
    restore: (id) =>
      restoreMutation.mutate(id, {
        onSuccess: () => addToast(i18n.t('notifications:itemRestored')),
        onError: () => addToast(i18n.t('notifications:restoreFailed'), 'error'),
      }),
    permanentlyDelete: (id, onDone) =>
      permanentlyDeleteMutation.mutate(id, {
        onSuccess: () => {
          addToast(i18n.t('notifications:itemPermanentlyDeleted'));
          onDone?.();
        },
        onError: () => addToast(i18n.t('notifications:deleteFailed'), 'error'),
      }),
    rename: (id, title, onDone) =>
      updateMutation.mutate(
        { id, payload: { title } },
        {
          onSuccess: () => {
            addToast(i18n.t('notifications:itemRenamed'));
            onDone?.();
          },
          onError: () => addToast(i18n.t('notifications:renameFailed'), 'error'),
        }
      ),
    moveToFolder: (id, folder, onDone) =>
      updateMutation.mutate(
        { id, payload: { folder } },
        {
          onSuccess: () => {
            addToast(i18n.t('notifications:itemMoved'));
            onDone?.();
          },
          onError: () => addToast(i18n.t('notifications:moveFailed'), 'error'),
        }
      ),
    updateItem: (id, payload, onDone) =>
      updateMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            addToast(i18n.t('notifications:changesSaved'));
            onDone?.();
          },
          onError: () => addToast(i18n.t('notifications:saveFailed'), 'error'),
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
