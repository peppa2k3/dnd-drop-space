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
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
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
            'absolute z-20 mt-1 w-48 rounded-card border border-line bg-paper-card py-1 shadow-popover animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`divider-${i}`} className="my-1 border-t border-line" />
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
                  item.danger ? 'text-brick hover:bg-brick-soft' : 'text-ink hover:bg-paper-dim'
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
