import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import IconButton from './IconButton';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-overlay/70 backdrop-blur-[3px]" onClick={onClose} />
      <div
        className={clsx(
          'relative w-full rounded-card border border-line bg-paper-card shadow-popover animate-slide-up max-h-[90vh] flex flex-col',
          SIZES[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <IconButton icon={X} label="Đóng" onClick={onClose} />
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 grow">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
