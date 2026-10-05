import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
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
import { formatNumber } from '../utils/format';

export default function Search() {
  useTranslation();
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
        <h1 className="font-display text-2xl font-semibold text-text-primary">{i18n.t('common:searchResults')}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {q ? (
            <>
              {i18n.t('search:giveKeywords')} <span className="font-medium text-text-primary">“{q}”</span>
              {meta && i18n.t('search:resultCount', { count: meta.total, formattedCount: formatNumber(meta.total) })}
            </>
          ) : (
            i18n.t('search:enterKeywordsInTheSearchBarAbove')
          )}
        </p>
      </div>

      {!q ? (
        <EmptyState icon={SearchIcon} title={i18n.t('search:startSearching')} description={i18n.t('search:searchByTitleTagFolderNoteContentOrFileName')} />
      ) : isLoading ? (
        <FullPageSpinner label={i18n.t('search:searching')} />
      ) : items.length === 0 ? (
        <EmptyState icon={SearchIcon} title={i18n.t('search:noResultsFoundForQ', { q: q })} description={i18n.t('search:tryADifferentKeywordOrCheckTheSpellingAgain')} />
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
