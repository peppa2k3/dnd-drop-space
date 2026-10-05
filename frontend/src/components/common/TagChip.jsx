import { X } from 'lucide-react';
import clsx from 'clsx';

export default function TagChip({ name, onRemove, className, size = 'sm' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-text-secondary',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        className
      )}
    >
      #{name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 rounded-full hover:bg-primary/30" aria-label={`Xóa thẻ ${name}`}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}
