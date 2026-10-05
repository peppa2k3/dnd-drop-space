import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import clsx from 'clsx';
import IconButton from '../common/IconButton';

const SORT_OPTIONS = [
  { value: 'createdAt', labelKey: 'files:sortCreatedAt' },
  { value: 'updatedAt', labelKey: 'files:sortUpdatedAt' },
  { value: 'title', labelKey: 'files:sortTitle' },
  { value: 'size', labelKey: 'files:sortSize' },
];

export default function LibraryToolbar({ viewMode, onViewModeChange, sort, order, onSortChange, onOrderToggle, tags = [], activeTag, onTagChange }) {
  useTranslation();
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => onTagChange(null)}
          className={clsx(
            'shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200',
            !activeTag ? 'border-primary bg-primary/10 text-primary-hover' : 'border-border text-text-secondary hover:border-primary/60'
          )}
        >
          {i18n.t('files:allTags')}
        </button>
        {tags.map((tag) => (
          <button
            key={tag._id}
            type="button"
            onClick={() => onTagChange(tag._id)}
            className={clsx(
              'shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200',
              activeTag === tag._id ? 'border-primary bg-primary/10 text-primary-hover' : 'border-border text-text-secondary hover:border-primary/60'
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {i18n.t(opt.labelKey)}
            </option>
          ))}
        </select>
        <IconButton icon={order === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow} label={i18n.t('files:changeSortOrder')} onClick={onOrderToggle} />

        <div className="flex items-center rounded-card border border-border p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={clsx('rounded-[8px] p-1.5 transition-colors duration-200', viewMode === 'grid' ? 'bg-primary/10 text-primary-hover' : 'text-text-muted hover:text-text-primary')}
            aria-label={i18n.t('files:gridView')}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={clsx('rounded-[8px] p-1.5 transition-colors duration-200', viewMode === 'list' ? 'bg-primary/10 text-primary-hover' : 'text-text-muted hover:text-text-primary')}
            aria-label={i18n.t('files:viewAsList')}
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
