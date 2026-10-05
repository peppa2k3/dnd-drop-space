import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * items: Array<{ label, icon?, onClick?, danger?, divider? }>
 */
export default function Menu({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        containerRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (trigger.props.disabled) return;
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={clsx(
            'absolute z-20 mt-1 w-48 rounded-card border border-border bg-surface py-1 shadow-popover animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`divider-${i}`} className="my-1 border-t border-border" />
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors',
                  item.danger ? 'text-danger hover:bg-danger/10' : 'text-text-primary hover:bg-background-secondary'
                )}
              >
                {item.icon && <item.icon size={15} />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
