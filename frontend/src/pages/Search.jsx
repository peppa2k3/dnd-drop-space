import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useItemBrowserModals } from '../hooks/useItemBrowserModals';
import ItemGrid from '../components/items/ItemGrid';
import ItemBrowserModals from '../components/items/ItemBrowserModals';
import Pagination from '../components/items/Pagination';
import EmptyState from '../components/common/EmptyState';
import { FullPageSpinner } from '../components/common/Spinner';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSearch(q, { page, limit: 24 });
  const { actions, detailItem, setDetailItem, renamingItem, setRenamingItem, movingItem, setMovingItem, handleOpen } =
    useItemBrowserModals();

  const items = data?.data?.items || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Kết quả tìm kiếm</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {q ? (
            <>
              Cho từ khóa <span className="font-medium text-text-primary">“{q}”</span>
              {meta && ` — ${meta.total} kết quả`}
            </>
          ) : (
            'Nhập từ khóa ở thanh tìm kiếm phía trên.'
          )}
        </p>
      </div>

      {!q ? (
        <EmptyState icon={SearchIcon} title="Bắt đầu tìm kiếm" description="Tìm theo tiêu đề, thẻ, thư mục, nội dung ghi chú hoặc tên tệp." />
      ) : isLoading ? (
        <FullPageSpinner label="Đang tìm kiếm" />
      ) : items.length === 0 ? (
        <EmptyState icon={SearchIcon} title={`Không tìm thấy kết quả cho “${q}”`} description="Thử một từ khóa khác, hoặc kiểm tra lại chính tả." />
      ) : (
        <>
          <ItemGrid
            items={items}
            viewMode="grid"
            onOpen={handleOpen}
            onToggleFavorite={actions.toggleFavorite}
            onRename={setRenamingItem}
            onMove={setMovingItem}
            onDelete={actions.moveToTrash}
          />
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      <ItemBrowserModals
        detailItem={detailItem}
        setDetailItem={setDetailItem}
        renamingItem={renamingItem}
        setRenamingItem={setRenamingItem}
        movingItem={movingItem}
        setMovingItem={setMovingItem}
        actions={actions}
      />
    </div>
  );
}
