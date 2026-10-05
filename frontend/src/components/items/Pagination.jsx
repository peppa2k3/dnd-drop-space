import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '../common/IconButton';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-text-secondary">
      <span>
        Trang {meta.page}/{meta.totalPages} · {meta.total} mục
      </span>
      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronLeft}
          label="Trang trước"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        />
        <IconButton
          icon={ChevronRight}
          label="Trang sau"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        />
      </div>
    </div>
  );
}
