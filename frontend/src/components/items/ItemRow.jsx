import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Star, MoreVertical, FolderInput, Pencil, Trash2, Download, RotateCcw, XCircle } from 'lucide-react';
import clsx from 'clsx';
import Menu from '../common/Menu';
import IconButton from '../common/IconButton';
import TagChip from '../common/TagChip';
import { getItemVisual } from '../../utils/itemVisual';
import { formatBytes } from '../../utils/format';
import { mediaUrl } from '../../utils/mediaUrl';

export default function ItemRow({ item, onOpen, onToggleFavorite, onRename, onMove, onDelete, onRestore, onPermanentDelete, isTrashed = false }) {
  const { Icon, label } = getItemVisual(item);
  const thumbnailSrc = item.urls?.thumbnail ? mediaUrl(item.urls.thumbnail) : null;

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
      className="group flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 transition-colors hover:bg-paper-dim"
      onClick={() => onOpen?.(item)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-card border border-line bg-paper-dim">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Icon size={17} className="text-slate-light" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 grow">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-light">
          <span>{label}</span>
          {item.folder?.name && <span>· {item.folder.name}</span>}
          {item.fileMeta?.size ? <span>· {formatBytes(item.fileMeta.size)}</span> : null}
          <span>· {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: vi })}</span>
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
          className={clsx('shrink-0', item.favorite ? 'text-gold' : 'text-slate-light hover:text-ink')}
          aria-label="Đánh dấu yêu thích"
        >
          <Star size={16} fill={item.favorite ? 'currentColor' : 'none'} />
        </button>
      )}

      <Menu trigger={<IconButton icon={MoreVertical} label="Tùy chọn khác" onClick={(e) => e.stopPropagation()} />} items={menuItems} />
    </div>
  );
}
