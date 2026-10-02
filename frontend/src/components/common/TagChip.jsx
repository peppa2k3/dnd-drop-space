import { X } from 'lucide-react';
import clsx from 'clsx';

export default function TagChip({ name, onRemove, className, size = 'sm' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 font-mono text-ink-soft',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
        className
      )}
    >
      #{name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 rounded-full hover:bg-gold/30" aria-label={`Xóa thẻ ${name}`}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}
