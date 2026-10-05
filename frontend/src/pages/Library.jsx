import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { LIBRARY_PRESETS } from '../config/libraryPresets';
import { useItemsList } from '../hooks/useItems';
import { useItemActions } from '../hooks/useItemActions';
import { useTags } from '../hooks/useTags';
import { useFolders } from '../hooks/useFolders';
import LibraryToolbar from '../components/items/LibraryToolbar';
import ItemGrid from '../components/items/ItemGrid';
import Pagination from '../components/items/Pagination';
import EmptyState from '../components/common/EmptyState';
import ItemDetailModal from '../components/items/ItemDetailModal';
import FolderPickerModal from '../components/folder/FolderPickerModal';
import PromptModal from '../components/common/PromptModal';
import { FullPageSpinner } from '../components/common/Spinner';

export default function Library({ preset = 'all' }) {
  const { folderId } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTag, setActiveTag] = useState(null);

  const [detailItem, setDetailItem] = useState(null);
  const [renamingItem, setRenamingItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);

  const { data: tags = [] } = useTags();
  const { data: folders = [] } = useFolders();
  const actions = useItemActions();

  const baseFilter = preset === 'folder' ? { folder: folderId } : LIBRARY_PRESETS[preset]?.filter || {};
  const params = { ...baseFilter, page, sort, order, limit: 24, ...(activeTag ? { tag: activeTag } : {}) };

  const { data, isLoading } = useItemsList(params);

  useEffect(() => {
    setPage(1);
  }, [preset, folderId, activeTag, sort, order]);

  const items = data?.data?.items || [];
  const meta = data?.meta;

  const currentFolder = preset === 'folder' ? folders.find((f) => f._id === folderId) : null;
  const pageTitle = preset === 'folder' ? currentFolder?.name || 'Thư mục' : LIBRARY_PRESETS[preset]?.title || 'Thư viện';

  const handleOpen = (item) => {
    if (item.type === 'note') navigate(`/app/notes/${item._id}`);
    else setDetailItem(item);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">{pageTitle}</h1>
        {meta && <p className="mt-1 text-sm text-text-secondary">{meta.total} mục</p>}
      </div>

      <LibraryToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        order={order}
        onSortChange={setSort}
        onOrderToggle={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        tags={tags}
        activeTag={activeTag}
        onTagChange={setActiveTag}
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Không có dữ liệu nào ở đây"
          description="Hãy thử bỏ bớt bộ lọc, hoặc thêm dữ liệu mới bằng nút “Mới” ở góc trên."
        />
      ) : (
        <>
          <ItemGrid
            items={items}
            viewMode={viewMode}
            onOpen={handleOpen}
            onToggleFavorite={actions.toggleFavorite}
            onRename={setRenamingItem}
            onMove={setMovingItem}
            onDelete={actions.moveToTrash}
          />
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

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
        onConfirm={(folderId2) => actions.moveToFolder(movingItem._id, folderId2, () => setMovingItem(null))}
        loading={actions.isLoading}
      />
    </div>
  );
}
