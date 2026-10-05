import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import ItemDetailModal from './ItemDetailModal';
import FolderPickerModal from '../folder/FolderPickerModal';
import PromptModal from '../common/PromptModal';

export default function ItemBrowserModals({ detailItem, setDetailItem, renamingItem, setRenamingItem, movingItem, setMovingItem, actions }) {
  useTranslation();
  return (
    <>
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdate={(id, payload) => actions.updateItem(id, payload, () => setDetailItem(null))}
        onToggleFavorite={actions.toggleFavorite}
        onDelete={(id) => {
          actions.moveToTrash(id);
          setDetailItem(null);
        }}
        saving={actions.isLoading}
      />

      <PromptModal
        open={Boolean(renamingItem)}
        onClose={() => setRenamingItem(null)}
        onSubmit={(title) => actions.rename(renamingItem._id, title, () => setRenamingItem(null))}
        title={i18n.t('common:rename')}
        label={i18n.t('common:name')}
        initialValue={renamingItem?.title}
      />

      <FolderPickerModal
        open={Boolean(movingItem)}
        onClose={() => setMovingItem(null)}
        currentFolderId={movingItem?.folder?._id}
        onConfirm={(folderId) => actions.moveToFolder(movingItem._id, folderId, () => setMovingItem(null))}
        loading={actions.isLoading}
      />
    </>
  );
}
