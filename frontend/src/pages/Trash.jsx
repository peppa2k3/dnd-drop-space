import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
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
  useTranslation();
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
          <h1 className="font-display text-2xl font-semibold text-text-primary">{i18n.t('files:trash')}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {i18n.t('files:deletedDataIsKeptHereFor30DaysBeforeBeingAutomaticallyPermanentlyDeleted')}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="danger" onClick={() => setConfirmEmpty(true)}>
            <Trash2 size={14} className="mr-1.5" /> {i18n.t('files:emptyTheTrash')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Trash2} title={i18n.t('files:emptyTrashCan')} description={i18n.t('files:itemsYouDeleteWillAppearHereBeforeBeingPermanentlyDeleted')} />
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
        title={i18n.t('files:confirmEmptyTrash')}
        message={i18n.t('files:allDataInTheRecycleBinWillBePermanentlyDeletedAndCannotBeRestored')}
        confirmLabel={i18n.t('files:permanentlyDeleteEverything')}
        loading={emptyTrash.isPending}
      />
    </div>
  );
}
