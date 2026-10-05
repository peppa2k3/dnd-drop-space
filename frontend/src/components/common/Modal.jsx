import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useEffect, useId, useRef } from 'react';
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
  useTranslation();
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button, [href], input, select, textarea')?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { e.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-overlay/70 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : i18n.t('common:dialogBox')}
        tabIndex={-1}
        className={clsx(
          'relative w-full rounded-card border border-border bg-surface shadow-popover animate-slide-up max-h-[90vh] flex flex-col',
          SIZES[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
            <h2 id={titleId} className="font-display text-lg font-semibold text-text-primary">{title}</h2>
            <IconButton icon={X} label={i18n.t('common:close')} onClick={onClose} />
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 grow">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
