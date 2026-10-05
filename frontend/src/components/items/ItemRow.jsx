import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { Star, MoreVertical, FolderInput, Pencil, Trash2, Download, RotateCcw, XCircle } from 'lucide-react';
import clsx from 'clsx';
import Menu from '../common/Menu';
import IconButton from '../common/IconButton';
import TagChip from '../common/TagChip';
import { getItemVisual } from '../../utils/itemVisual';
import { formatBytes, formatRelativeTime } from '../../utils/format';
import { mediaUrl } from '../../utils/mediaUrl';

export default function ItemRow({ item, onOpen, onToggleFavorite, onRename, onMove, onDelete, onRestore, onPermanentDelete, isTrashed = false }) {
  useTranslation();
  const { Icon, label } = getItemVisual(item);
  const thumbnailSrc = item.urls?.thumbnail ? mediaUrl(item.urls.thumbnail) : null;

  const menuItems = isTrashed
    ? [
        { label: i18n.t('common:restore'), icon: RotateCcw, onClick: () => onRestore?.(item._id) },
        { divider: true },
        { label: i18n.t('common:deletePermanently'), icon: XCircle, danger: true, onClick: () => onPermanentDelete?.(item._id) },
      ]
    : [
        { label: i18n.t('common:rename'), icon: Pencil, onClick: () => onRename?.(item) },
        { label: i18n.t('files:moveToPlaceholder'), icon: FolderInput, onClick: () => onMove?.(item) },
        ...(item.type === 'file' ? [{ label: i18n.t('common:download'), icon: Download, onClick: () => window.open(mediaUrl(item.urls.download), '_blank') }] : []),
        { divider: true },
        { label: i18n.t('files:moveToTrash'), icon: Trash2, danger: true, onClick: () => onDelete?.(item._id) },
      ];

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 transition-all duration-200 hover:-translate-y-px hover:bg-background-secondary"
      onClick={() => onOpen?.(item)}
      role="button"
      tabIndex={0}
      aria-label={i18n.t('files:openTitle', { title: item.title })}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen?.(item);
        }
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-background-secondary">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Icon size={17} className="text-text-muted" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 grow">
        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-text-muted">
          <span>{label}</span>
          {item.folder?.name && <span>· {item.folder.name}</span>}
          {item.fileMeta?.size ? <span>· {formatBytes(item.fileMeta.size)}</span> : null}
          <span>· {formatRelativeTime(item.updatedAt)}</span>
        </div>
      </div>

      {item.tags?.length > 0 && (
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          {item.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag._id} name={tag.name} />
          ))}
        </div>
      )}

      {!isTrashed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(item._id);
          }}
          className={clsx('shrink-0', item.favorite ? 'text-primary-hover' : 'text-text-muted hover:text-text-primary')}
          aria-label={i18n.t('files:markFavorites')}
        >
          <Star size={16} fill={item.favorite ? 'currentColor' : 'none'} />
        </button>
      )}

      <Menu trigger={<IconButton icon={MoreVertical} label={i18n.t('files:otherOptions')} onClick={(e) => e.stopPropagation()} />} items={menuItems} />
    </div>
  );
}
