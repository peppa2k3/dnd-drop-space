import ItemDetailModal from './ItemDetailModal';
import FolderPickerModal from '../folder/FolderPickerModal';
import PromptModal from '../common/PromptModal';

export default function ItemBrowserModals({ detailItem, setDetailItem, renamingItem, setRenamingItem, movingItem, setMovingItem, actions }) {
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
        title="Đổi tên"
        label="Tên"
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
