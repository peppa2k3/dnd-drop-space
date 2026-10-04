import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Star, MoreVertical, FolderInput, Pencil, Trash2, Download, RotateCcw, XCircle } from 'lucide-react';
import clsx from 'clsx';
import Menu from '../common/Menu';
import IconButton from '../common/IconButton';
import TagChip from '../common/TagChip';
import { getItemVisual } from '../../utils/itemVisual';
import { formatDuration } from '../../utils/format';
import { mediaUrl } from '../../utils/mediaUrl';

/**
 * One "card" in the library. Every item type (note, url, file) renders
 * through this same component - the type tab + thumbnail area + footer
 * pattern is what ties Notes, Bookmarks, Photos, Videos and Files together
 * visually into a single coherent "card catalog".
 */
export default function ItemCard({ item, onOpen, onToggleFavorite, onRename, onMove, onDelete, onRestore, onPermanentDelete, isTrashed = false }) {
  const { Icon, label } = getItemVisual(item);
  const thumbnailSrc = item.urls?.thumbnail ? mediaUrl(item.urls.thumbnail) : null;
  const duration = formatDuration(item.fileMeta?.durationSeconds);

  const menuItems = isTrashed
    ? [
        { label: 'Khôi phục', icon: RotateCcw, onClick: () => onRestore?.(item._id) },
        { divider: true },
        { label: 'Xóa vĩnh viễn', icon: XCircle, danger: true, onClick: () => onPermanentDelete?.(item._id) },
      ]
    : [
        { label: 'Đổi tên', icon: Pencil, onClick: () => onRename?.(item) },
        { label: 'Di chuyển đến...', icon: FolderInput, onClick: () => onMove?.(item) },
        ...(item.type === 'file' ? [{ label: 'Tải xuống', icon: Download, onClick: () => window.open(mediaUrl(item.urls.download), '_blank') }] : []),
        { divider: true },
        { label: 'Chuyển vào Thùng rác', icon: Trash2, danger: true, onClick: () => onDelete?.(item._id) },
      ];

  return (
    <div
      className="catalog-card group flex cursor-pointer flex-col overflow-hidden"
      onClick={() => onOpen?.(item)}
    >
      {/* type tab */}
      <div className="absolute left-3 top-0 z-10 flex items-center gap-1 rounded-b bg-sidebar px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sidebar-text">
        <Icon size={10} />
        {label}
      </div>

      {/* thumbnail */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-line bg-paper-dim">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon size={item.type === 'url' ? 28 : 36} className="text-slate-light" strokeWidth={1.5} />
          </div>
        )}

        {!isTrashed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(item._id);
            }}
            className={clsx(
              'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-overlay/70 backdrop-blur-sm transition-colors hover:bg-sidebar',
              item.favorite ? 'text-gold' : 'text-sidebar-text'
            )}
            aria-label="Đánh dấu yêu thích"
          >
            <Star size={14} fill={item.favorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-overlay/80 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-text">
            {duration}
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex grow flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink">{item.title}</h3>

        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag._id} name={tag.name} />
            ))}
            {item.tags.length > 3 && <span className="text-[11px] text-slate-light">+{item.tags.length - 3}</span>}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="font-mono text-[10px] text-slate-light">
            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: vi })}
          </span>
          <Menu
            trigger={
              <IconButton icon={MoreVertical} label="Tùy chọn khác" onClick={(e) => e.stopPropagation()} />
            }
            items={menuItems}
          />
        </div>
      </div>
    </div>
  );
}
