import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTrashList, useEmptyTrash } from '../hooks/useTrash';
import { useItemActions } from '../hooks/useItemActions';
import ItemGrid from '../components/items/ItemGrid';
import Pagination from '../components/items/Pagination';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { FullPageSpinner } from '../components/common/Spinner';

export default function Trash() {
  const [page, setPage] = useState(1);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const { data, isLoading } = useTrashList({ page, limit: 24 });
  const actions = useItemActions();
  const emptyTrash = useEmptyTrash();

  const items = data?.data?.items || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Thùng rác</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Dữ liệu đã xóa được giữ tại đây 30 ngày trước khi bị xóa vĩnh viễn tự động.
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="danger" onClick={() => setConfirmEmpty(true)}>
            <Trash2 size={14} className="mr-1.5" /> Dọn sạch Thùng rác
          </Button>
        )}
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Trash2} title="Thùng rác trống" description="Các mục bạn xóa sẽ xuất hiện ở đây trước khi bị xóa vĩnh viễn." />
      ) : (
        <>
          <ItemGrid
            items={items}
            viewMode="grid"
            isTrashed
            onOpen={() => {}}
            onRestore={actions.restore}
            onPermanentDelete={actions.permanentlyDelete}
          />
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={() => emptyTrash.mutate(undefined, { onSuccess: () => setConfirmEmpty(false) })}
        title="Dọn sạch Thùng rác?"
        message="Toàn bộ dữ liệu trong Thùng rác sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmLabel="Xóa vĩnh viễn tất cả"
        loading={emptyTrash.isPending}
      />
    </div>
  );
}
